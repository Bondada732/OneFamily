import { LocationSnapshot } from './types.js';

const STORAGE_KEY = 'kinora_location_snapshots';
const MAX_SNAPSHOTS = 100;
const DEFAULT_RETENTION_HOURS = 72;

export class LocationSnapshotStore {
  private static instance: LocationSnapshotStore;

  private constructor() {
    this.pruneExpiredSnapshots(DEFAULT_RETENTION_HOURS);
  }

  public static getInstance(): LocationSnapshotStore {
    if (!LocationSnapshotStore.instance) {
      LocationSnapshotStore.instance = new LocationSnapshotStore();
    }
    return LocationSnapshotStore.instance;
  }

  /**
   * Retrieve all currently valid location snapshots
   */
  public getSnapshots(): LocationSnapshot[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list: LocationSnapshot[] = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return list;
    } catch {
      return [];
    }
  }

  /**
   * Save a new location snapshot into the store
   */
  public addSnapshot(snapshot: LocationSnapshot, retentionHours: number = DEFAULT_RETENTION_HOURS): void {
    if (!snapshot || typeof snapshot.latitude !== 'number' || typeof snapshot.longitude !== 'number') {
      return;
    }

    try {
      const existing = this.getSnapshots();
      const newEntry: LocationSnapshot = {
        id: snapshot.id || `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        accuracyMeters: snapshot.accuracyMeters || 100,
        capturedAt: snapshot.capturedAt || new Date().toISOString(),
        source: snapshot.source || 'LOCATION_SNAPSHOT',
        status: snapshot.status || 'AVAILABLE',
        locationLabel: snapshot.locationLabel || '',
      };

      // Avoid adding duplicate snapshots captured within 60 seconds with identical coordinates
      const last = existing[existing.length - 1];
      if (last) {
        const lastTime = new Date(last.capturedAt).getTime();
        const newTime = new Date(newEntry.capturedAt).getTime();
        if (
          Math.abs(newTime - lastTime) < 60 * 1000 &&
          Math.abs(last.latitude - newEntry.latitude) < 0.0001 &&
          Math.abs(last.longitude - newEntry.longitude) < 0.0001
        ) {
          // Update label if the new one is better
          if (newEntry.locationLabel && !last.locationLabel) {
            last.locationLabel = newEntry.locationLabel;
            this.saveSnapshots(existing);
          }
          return;
        }
      }

      existing.push(newEntry);

      // Sort by capturedAt ascending
      existing.sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());

      // Prune expired and keep within max capacity
      const cutoffTime = Date.now() - retentionHours * 60 * 60 * 1000;
      const filtered = existing
        .filter((s) => new Date(s.capturedAt).getTime() >= cutoffTime)
        .slice(-MAX_SNAPSHOTS);

      this.saveSnapshots(filtered);
    } catch (err) {
      console.warn('Failed to add location snapshot:', err);
    }
  }

  /**
   * Get the most recent location snapshot
   */
  public getLatestSnapshot(): LocationSnapshot | null {
    const list = this.getSnapshots();
    return list.length > 0 ? list[list.length - 1] : null;
  }

  /**
   * Prune expired snapshots based on configured retention period
   */
  public pruneExpiredSnapshots(retentionHours: number = DEFAULT_RETENTION_HOURS): number {
    try {
      const list = this.getSnapshots();
      const cutoffTime = Date.now() - retentionHours * 60 * 60 * 1000;
      const valid = list.filter((s) => new Date(s.capturedAt).getTime() >= cutoffTime);
      const removedCount = list.length - valid.length;
      if (removedCount > 0) {
        this.saveSnapshots(valid);
      }
      return removedCount;
    } catch {
      return 0;
    }
  }

  /**
   * Delete all stored location snapshots immediately (Privacy Control)
   */
  public clearAllSnapshots(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear location snapshots:', err);
    }
  }

  /**
   * Get total count of stored snapshots
   */
  public getCount(): number {
    return this.getSnapshots().length;
  }

  private saveSnapshots(snapshots: LocationSnapshot[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    } catch (err) {
      console.warn('Failed to persist location snapshots to localStorage:', err);
    }
  }
}

export const locationSnapshotStore = LocationSnapshotStore.getInstance();

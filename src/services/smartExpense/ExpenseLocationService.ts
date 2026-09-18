import {
  LocationPermissionDetail,
  LocationSnapshot,
  TransactionLocationContext,
  LocationSource,
  LocationStatus,
  LocationConfidence,
} from './types.js';
import { locationSnapshotStore } from './LocationSnapshotStore.js';
import { LocationTransactionMatcher } from './LocationTransactionMatcher.js';

class ExpenseLocationServiceManager {
  private isCapturingSnapshot = false;

  /**
   * Check granular location permissions (Fine, Coarse, GPS status)
   */
  public async checkLocationPermissions(): Promise<LocationPermissionDetail> {
    try {
      const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
      const plugin = (window as any).Capacitor?.Plugins?.LocationContextPlugin;

      if (isNative && plugin) {
        const res = await plugin.checkLocationPermissions();
        return {
          fineLocationGranted: !!res.fineLocationGranted,
          coarseLocationGranted: !!res.coarseLocationGranted,
          locationServicesEnabled: !!res.locationServicesEnabled,
          permissionState: res.permissionState || (res.fineLocationGranted || res.coarseLocationGranted ? 'GRANTED' : 'DENIED'),
          precision: res.precision || (res.fineLocationGranted ? 'PRECISE' : res.coarseLocationGranted ? 'APPROXIMATE' : 'NONE'),
        };
      }

      // Web Browser Fallback
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        try {
          const status = await (navigator as any).permissions.query({ name: 'geolocation' });
          const granted = status.state === 'granted';
          return {
            fineLocationGranted: granted,
            coarseLocationGranted: granted,
            locationServicesEnabled: true,
            permissionState: granted ? 'GRANTED' : status.state === 'denied' ? 'DENIED' : 'NOT_REQUESTED',
            precision: granted ? 'APPROXIMATE' : 'NONE',
          };
        } catch {
          return {
            fineLocationGranted: false,
            coarseLocationGranted: false,
            locationServicesEnabled: true,
            permissionState: 'NOT_REQUESTED',
            precision: 'NONE',
          };
        }
      }

      return {
        fineLocationGranted: false,
        coarseLocationGranted: false,
        locationServicesEnabled: false,
        permissionState: 'NOT_REQUESTED',
        precision: 'NONE',
      };
    } catch (err) {
      console.warn('Failed to check location permissions:', err);
      return {
        fineLocationGranted: false,
        coarseLocationGranted: false,
        locationServicesEnabled: false,
        permissionState: 'NOT_REQUESTED',
        precision: 'NONE',
      };
    }
  }

  /**
   * Request location permissions from Android OS / Browser
   */
  public async requestLocationPermissions(): Promise<LocationPermissionDetail> {
    try {
      const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
      const plugin = (window as any).Capacitor?.Plugins?.LocationContextPlugin;

      if (isNative && plugin) {
        const res = await plugin.requestLocationPermissions();
        return {
          fineLocationGranted: !!res.fineLocationGranted,
          coarseLocationGranted: !!res.coarseLocationGranted,
          locationServicesEnabled: !!res.locationServicesEnabled,
          permissionState: res.permissionState || (res.fineLocationGranted || res.coarseLocationGranted ? 'GRANTED' : 'DENIED'),
          precision: res.precision || (res.fineLocationGranted ? 'PRECISE' : res.coarseLocationGranted ? 'APPROXIMATE' : 'NONE'),
        };
      }

      // Web Browser Geolocation prompt fallback
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              resolve({
                fineLocationGranted: true,
                coarseLocationGranted: true,
                locationServicesEnabled: true,
                permissionState: 'GRANTED',
                precision: 'APPROXIMATE',
              });
            },
            () => {
              resolve({
                fineLocationGranted: false,
                coarseLocationGranted: false,
                locationServicesEnabled: true,
                permissionState: 'DENIED',
                precision: 'NONE',
              });
            },
            { timeout: 5000 }
          );
        });
      }

      return {
        fineLocationGranted: false,
        coarseLocationGranted: false,
        locationServicesEnabled: false,
        permissionState: 'DENIED',
        precision: 'NONE',
      };
    } catch (err) {
      console.warn('Failed to request location permissions:', err);
      return {
        fineLocationGranted: false,
        coarseLocationGranted: false,
        locationServicesEnabled: false,
        permissionState: 'DENIED',
        precision: 'NONE',
      };
    }
  }

  /**
   * Capture a single location snapshot and store in local snapshot cache
   */
  public async captureCurrentLocationSnapshot(
    source: LocationSource = 'LIVE_LOCATION',
    retentionHours: number = 72
  ): Promise<LocationSnapshot | null> {
    if (this.isCapturingSnapshot) return null;
    this.isCapturingSnapshot = true;

    try {
      const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
      const plugin = (window as any).Capacitor?.Plugins?.LocationContextPlugin;

      if (isNative && plugin) {
        const res = await plugin.getCurrentLocationSnapshot();
        if (res && res.latitude && res.longitude) {
          const snapshot: LocationSnapshot = {
            id: `loc_${Date.now()}`,
            latitude: Number(res.latitude),
            longitude: Number(res.longitude),
            accuracyMeters: Number(res.accuracyMeters) || 100,
            capturedAt: res.capturedAt || new Date().toISOString(),
            source: (res.source as LocationSource) || source,
            status: (res.status as LocationStatus) || 'AVAILABLE',
            locationLabel: res.locationLabel || '',
          };

          locationSnapshotStore.addSnapshot(snapshot, retentionHours);
          return snapshot;
        }
      } else if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        // Browser Geolocation snapshot fallback
        const snapshot = await new Promise<LocationSnapshot | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const snap: LocationSnapshot = {
                id: `loc_${Date.now()}`,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracyMeters: pos.coords.accuracy || 150,
                capturedAt: new Date(pos.timestamp).toISOString(),
                source: 'LIVE_LOCATION',
                status: pos.coords.accuracy > 250 ? 'APPROXIMATE' : 'AVAILABLE',
                locationLabel: '', // Geocoder not available on pure browser web
              };
              locationSnapshotStore.addSnapshot(snap, retentionHours);
              resolve(snap);
            },
            () => resolve(null),
            { timeout: 5000, enableHighAccuracy: true }
          );
        });
        return snapshot;
      }
    } catch (err) {
      console.warn('Failed to capture location snapshot:', err);
    } finally {
      this.isCapturingSnapshot = false;
    }

    return null;
  }

  /**
   * Find the best location context for a given transaction timestamp
   */
  public async findBestLocationForTransaction(
    transactionDateTime?: string,
    smsReceivedDateTime?: string,
    locationEnabled: boolean = true,
    retentionHours: number = 72
  ): Promise<TransactionLocationContext> {
    if (!locationEnabled) {
      return {
        latitude: null,
        longitude: null,
        accuracyMeters: null,
        capturedAt: null,
        source: 'NONE',
        confidence: 'NONE',
        status: 'NOT_CAPTURED',
        locationLabel: '',
        matchTimestampType: 'NONE',
        timeDifferenceSeconds: null,
      };
    }

    try {
      // 1. Check permissions first
      const perms = await this.checkLocationPermissions();
      if (perms.permissionState !== 'GRANTED') {
        return {
          latitude: null,
          longitude: null,
          accuracyMeters: null,
          capturedAt: null,
          source: 'NONE',
          confidence: 'NONE',
          status: 'PERMISSION_DENIED',
          locationLabel: '',
          matchTimestampType: 'NONE',
          timeDifferenceSeconds: null,
        };
      }

      // 2. Obtain fresh snapshots from store
      locationSnapshotStore.pruneExpiredSnapshots(retentionHours);
      let snapshots = locationSnapshotStore.getSnapshots();

      // If no snapshots exist or latest snapshot is older than 10 mins, take a fresh snapshot in background
      const latest = locationSnapshotStore.getLatestSnapshot();
      const isFresh = latest && Date.now() - new Date(latest.capturedAt).getTime() < 10 * 60 * 1000;
      if (!isFresh) {
        const freshSnap = await this.captureCurrentLocationSnapshot('LOCATION_SNAPSHOT', retentionHours);
        if (freshSnap) {
          snapshots = locationSnapshotStore.getSnapshots();
        }
      }

      // 3. Match transaction timestamp against snapshots
      return LocationTransactionMatcher.match(
        transactionDateTime,
        smsReceivedDateTime,
        snapshots
      );
    } catch (err) {
      console.warn('Error matching location for transaction:', err);
      return {
        latitude: null,
        longitude: null,
        accuracyMeters: null,
        capturedAt: null,
        source: 'NONE',
        confidence: 'NONE',
        status: 'UNAVAILABLE',
        locationLabel: '',
        matchTimestampType: 'NONE',
        timeDifferenceSeconds: null,
      };
    }
  }

  /**
   * Clear all stored location snapshots (Privacy Control)
   */
  public clearStoredLocationData(): void {
    locationSnapshotStore.clearAllSnapshots();
  }

  /**
   * Get location diagnostics for the developer/diagnostics modal
   */
  public async getLocationDiagnostics() {
    const perms = await this.checkLocationPermissions();
    const latest = locationSnapshotStore.getLatestSnapshot();
    const count = locationSnapshotStore.getCount();

    return {
      locationPermissionGranted: perms.permissionState === 'GRANTED',
      locationServicesEnabled: perms.locationServicesEnabled,
      locationPrecision: perms.precision,
      lastLocationSnapshot: latest,
      snapshotStoreCount: count,
    };
  }
}

export const ExpenseLocationService = new ExpenseLocationServiceManager();

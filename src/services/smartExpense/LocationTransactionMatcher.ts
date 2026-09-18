import {
  LocationSnapshot,
  TransactionLocationContext,
  LocationConfidence,
  LocationStatus,
  LocationMatchTimestampType,
} from './types.js';

export interface LocationMatchConfig {
  highMaxMinutes: number;
  highMaxAccuracyMeters: number;
  mediumMaxMinutes: number;
  mediumMaxAccuracyMeters: number;
  lowMaxMinutes: number;
}

export const DEFAULT_LOCATION_MATCH_CONFIG: LocationMatchConfig = {
  highMaxMinutes: 10,
  highMaxAccuracyMeters: 100,
  mediumMaxMinutes: 30,
  mediumMaxAccuracyMeters: 250,
  lowMaxMinutes: 60,
};

export class LocationTransactionMatcher {
  /**
   * Format human-readable location label based on accuracy level
   */
  public static formatAccuracyLabel(rawLabel: string, accuracyMeters: number): string {
    const cleanLabel = (rawLabel || '').trim();
    if (!cleanLabel) {
      if (accuracyMeters <= 100) return 'Nearby Area';
      if (accuracyMeters <= 500) return 'Approximate Location';
      return 'General Area';
    }

    if (accuracyMeters <= 100) {
      return cleanLabel;
    } else if (accuracyMeters <= 500) {
      return `Near ${cleanLabel}`;
    } else {
      return `Around ${cleanLabel}`;
    }
  }

  /**
   * Match a transaction timestamp to the most relevant location snapshot
   */
  public static match(
    transactionDateTime?: string,
    smsReceivedDateTime?: string,
    snapshots: LocationSnapshot[] = [],
    config: LocationMatchConfig = DEFAULT_LOCATION_MATCH_CONFIG
  ): TransactionLocationContext {
    // 1. Determine which timestamp to use
    let targetTimeMs: number | null = null;
    let matchType: LocationMatchTimestampType = 'NONE';

    if (transactionDateTime) {
      const parsed = new Date(transactionDateTime).getTime();
      if (!isNaN(parsed) && parsed > 0) {
        targetTimeMs = parsed;
        matchType = 'TRANSACTION_TIME';
      }
    }

    if (targetTimeMs === null && smsReceivedDateTime) {
      const parsed = new Date(smsReceivedDateTime).getTime();
      if (!isNaN(parsed) && parsed > 0) {
        targetTimeMs = parsed;
        matchType = 'SMS_RECEIVED_TIME';
      }
    }

    // Default fallback if no valid timestamps or no snapshots exist
    if (targetTimeMs === null || snapshots.length === 0) {
      return {
        latitude: null,
        longitude: null,
        accuracyMeters: null,
        capturedAt: null,
        source: 'NONE',
        confidence: 'NONE',
        status: 'UNAVAILABLE',
        locationLabel: '',
        matchTimestampType: matchType,
        timeDifferenceSeconds: null,
      };
    }

    // 2. Find closest snapshot in time
    let closestSnapshot: LocationSnapshot | null = null;
    let minTimeDiffMs = Infinity;

    for (const s of snapshots) {
      const snapTime = new Date(s.capturedAt).getTime();
      if (isNaN(snapTime)) continue;

      const diff = Math.abs(snapTime - targetTimeMs);
      if (diff < minTimeDiffMs) {
        minTimeDiffMs = diff;
        closestSnapshot = s;
      }
    }

    if (!closestSnapshot || minTimeDiffMs === Infinity) {
      return {
        latitude: null,
        longitude: null,
        accuracyMeters: null,
        capturedAt: null,
        source: 'NONE',
        confidence: 'NONE',
        status: 'UNAVAILABLE',
        locationLabel: '',
        matchTimestampType: matchType,
        timeDifferenceSeconds: null,
      };
    }

    const timeDiffSeconds = Math.round(minTimeDiffMs / 1000);
    const timeDiffMinutes = timeDiffSeconds / 60;
    const accuracy = closestSnapshot.accuracyMeters || 150;

    // 3. Evaluate Confidence based on time delta & accuracy
    let confidence: LocationConfidence = 'NONE';
    let status: LocationStatus = 'UNAVAILABLE';

    if (timeDiffMinutes <= config.highMaxMinutes && accuracy <= config.highMaxAccuracyMeters) {
      confidence = 'HIGH';
      status = 'AVAILABLE';
    } else if (timeDiffMinutes <= config.mediumMaxMinutes && accuracy <= config.mediumMaxAccuracyMeters) {
      confidence = 'MEDIUM';
      status = 'AVAILABLE';
    } else if (timeDiffMinutes <= config.lowMaxMinutes) {
      confidence = 'LOW';
      status = accuracy > 300 ? 'APPROXIMATE' : 'AVAILABLE';
    } else {
      confidence = 'NONE';
      status = 'STALE';
    }

    // If beyond max threshold (e.g. > 60 mins), do not associate misleading location
    if (confidence === 'NONE') {
      return {
        latitude: null,
        longitude: null,
        accuracyMeters: null,
        capturedAt: null,
        source: 'NONE',
        confidence: 'NONE',
        status: 'UNAVAILABLE',
        locationLabel: '',
        matchTimestampType: matchType,
        timeDifferenceSeconds: timeDiffSeconds,
      };
    }

    const formattedLabel = LocationTransactionMatcher.formatAccuracyLabel(
      closestSnapshot.locationLabel || '',
      accuracy
    );

    return {
      latitude: closestSnapshot.latitude,
      longitude: closestSnapshot.longitude,
      accuracyMeters: accuracy,
      capturedAt: closestSnapshot.capturedAt,
      source: closestSnapshot.source || 'LOCATION_SNAPSHOT',
      confidence,
      status,
      locationLabel: formattedLabel,
      matchTimestampType: matchType,
      timeDifferenceSeconds: timeDiffSeconds,
    };
  }
}

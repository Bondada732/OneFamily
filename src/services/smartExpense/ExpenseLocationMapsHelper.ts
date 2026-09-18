import { DetectedTransaction, LocationConfidence } from './types.js';

export interface LocationDisplayInfo {
  displayLabel: string;
  subLabel: string;
  hasCoordinates: boolean;
  hasLocation: boolean;
  confidence: LocationConfidence;
  mapsUrl: string | null;
  isExact: boolean;
}

export class ExpenseLocationMapsHelper {
  /**
   * Validate geographical coordinate bounds
   * Latitude: [-90, 90]
   * Longitude: [-180, 180]
   * Rejects NaN, null, undefined, strings, and zero/placeholder coordinates (0, 0)
   */
  public static isValidCoordinate(latitude: any, longitude: any): boolean {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return false;
    }
    const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude);
    const lng = typeof longitude === 'number' ? longitude : parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return false;
    }

    if (lat < -90 || lat > 90) {
      return false;
    }

    if (lng < -180 || lng > 180) {
      return false;
    }

    // Reject (0, 0) placeholder coordinate ("Null Island")
    if (lat === 0 && lng === 0) {
      return false;
    }

    return true;
  }

  /**
   * Safely extract valid coordinates from transaction or location context
   */
  public static getCoordinates(
    tx: DetectedTransaction | null | undefined
  ): { latitude: number; longitude: number } | null {
    if (!tx) return null;

    const lat = tx.location?.latitude ?? (tx as any).latitude;
    const lng = tx.location?.longitude ?? (tx as any).longitude;

    if (this.isValidCoordinate(lat, lng)) {
      return {
        latitude: typeof lat === 'number' ? lat : parseFloat(lat),
        longitude: typeof lng === 'number' ? lng : parseFloat(lng),
      };
    }

    return null;
  }

  /**
   * Extract location label from transaction or location context
   */
  public static getLocationLabel(tx: DetectedTransaction | null | undefined): string | null {
    if (!tx) return null;
    const label = tx.location?.locationLabel || (tx as any).locationLabel || (tx as any).location;
    if (typeof label === 'string' && label.trim().length > 0) {
      return label.trim();
    }
    return null;
  }

  /**
   * Format display label and confidence subtitle
   * Respects exact vs approximate/near context
   */
  public static getLocationDisplayInfo(tx: DetectedTransaction | null | undefined): LocationDisplayInfo {
    const coords = this.getCoordinates(tx);
    const rawLabel = this.getLocationLabel(tx);
    const confidence: LocationConfidence = tx?.location?.confidence || 'NONE';
    const accuracy = tx?.location?.accuracyMeters;

    if (!coords && !rawLabel) {
      return {
        displayLabel: '',
        subLabel: '',
        hasCoordinates: false,
        hasLocation: false,
        confidence: 'NONE',
        mapsUrl: null,
        isExact: false,
      };
    }

    const cleanLabel = rawLabel || (coords ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'Location');
    const mapsUrl = this.buildGoogleMapsUrl(tx);

    // Case 1: Coordinates available with HIGH confidence
    if (coords && confidence === 'HIGH') {
      return {
        displayLabel: cleanLabel,
        subLabel: 'High-confidence location',
        hasCoordinates: true,
        hasLocation: true,
        confidence: 'HIGH',
        mapsUrl,
        isExact: true,
      };
    }

    // Case 2: Coordinates available with MEDIUM confidence
    if (coords && confidence === 'MEDIUM') {
      const prefix = cleanLabel.toLowerCase().startsWith('around') ? '' : 'Around ';
      return {
        displayLabel: `${prefix}${cleanLabel}`,
        subLabel: accuracy ? `Approximate location (±${Math.round(accuracy)}m)` : 'Approximate location',
        hasCoordinates: true,
        hasLocation: true,
        confidence: 'MEDIUM',
        mapsUrl,
        isExact: false,
      };
    }

    // Case 3: Coordinates available with LOW confidence
    if (coords && (confidence === 'LOW' || confidence === 'NONE')) {
      const prefix = cleanLabel.toLowerCase().startsWith('near') ? '' : 'Near ';
      return {
        displayLabel: `${prefix}${cleanLabel}`,
        subLabel: accuracy ? `Nearby area (±${Math.round(accuracy)}m)` : 'Nearby area',
        hasCoordinates: true,
        hasLocation: true,
        confidence: 'LOW',
        mapsUrl,
        isExact: false,
      };
    }

    // Case 4: Label only (no valid coordinates)
    return {
      displayLabel: cleanLabel,
      subLabel: 'Area search (approximate)',
      hasCoordinates: false,
      hasLocation: true,
      confidence: 'NONE',
      mapsUrl,
      isExact: false,
    };
  }

  /**
   * Construct standard Google Maps Search URL
   * - If coordinates valid: https://www.google.com/maps/search/?api=1&query=LAT,LNG
   * - If label only: https://www.google.com/maps/search/?api=1&query=LABEL
   * - If neither: null
   */
  public static buildGoogleMapsUrl(tx: DetectedTransaction | null | undefined): string | null {
    if (!tx) return null;

    const coords = this.getCoordinates(tx);
    if (coords) {
      // Use exact coordinates
      return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
    }

    const label = this.getLocationLabel(tx);
    if (label) {
      // Fallback search using location label
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
    }

    return null;
  }

  /**
   * Open the expense location in Google Maps (or browser fallback)
   * User-initiated only
   */
  public static openInMaps(tx: DetectedTransaction | null | undefined): boolean {
    const url = this.buildGoogleMapsUrl(tx);
    if (!url) return false;

    try {
      if (typeof window !== 'undefined') {
        // Open in external app / system browser on Android & Web
        const opened = window.open(url, '_system') || window.open(url, '_blank');
        return !!opened;
      }
    } catch (err) {
      console.warn('Failed to open Google Maps URL:', err);
    }
    return false;
  }
}

export const openExpenseLocationInMaps = (tx: DetectedTransaction | null | undefined): boolean => {
  return ExpenseLocationMapsHelper.openInMaps(tx);
};

export const getExpenseMapsUrl = (tx: DetectedTransaction | null | undefined): string | null => {
  return ExpenseLocationMapsHelper.buildGoogleMapsUrl(tx);
};

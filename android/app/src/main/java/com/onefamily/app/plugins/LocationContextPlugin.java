package com.onefamily.app.plugins;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

@CapacitorPlugin(
    name = "LocationContextPlugin",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        )
    }
)
public class LocationContextPlugin extends Plugin {

    private static final String TAG = "LocationContextPlugin";
    private static final long LOCATION_TIMEOUT_MS = 6000;

    @PluginMethod
    public void checkLocationPermissions(PluginCall call) {
        Context context = getContext();
        boolean fineGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;

        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        boolean gpsEnabled = false;
        boolean networkEnabled = false;
        if (locationManager != null) {
            try {
                gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
                networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            } catch (Exception ignored) {}
        }

        String permissionState = "NOT_REQUESTED";
        if (fineGranted || coarseGranted) {
            permissionState = "GRANTED";
        }

        JSObject res = new JSObject();
        res.put("fineLocationGranted", fineGranted);
        res.put("coarseLocationGranted", coarseGranted);
        res.put("locationServicesEnabled", gpsEnabled || networkEnabled);
        res.put("gpsEnabled", gpsEnabled);
        res.put("networkEnabled", networkEnabled);
        res.put("permissionState", permissionState);
        res.put("precision", fineGranted ? "PRECISE" : (coarseGranted ? "APPROXIMATE" : "NONE"));
        call.resolve(res);
    }

    @PluginMethod
    public void requestLocationPermissions(PluginCall call) {
        requestPermissionForAlias("location", call, "locationPermCallback");
    }

    @PermissionCallback
    private void locationPermCallback(PluginCall call) {
        checkLocationPermissions(call);
    }

    @PluginMethod
    public void getCurrentLocationSnapshot(PluginCall call) {
        Context context = getContext();
        boolean fineGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;

        if (!fineGranted && !coarseGranted) {
            JSObject errRes = new JSObject();
            errRes.put("status", "PERMISSION_DENIED");
            errRes.put("source", "NONE");
            errRes.put("confidence", "NONE");
            errRes.put("locationLabel", "");
            errRes.put("error", "Location permission not granted");
            call.resolve(errRes);
            return;
        }

        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        if (locationManager == null) {
            JSObject errRes = new JSObject();
            errRes.put("status", "UNAVAILABLE");
            errRes.put("source", "NONE");
            errRes.put("confidence", "NONE");
            errRes.put("locationLabel", "");
            errRes.put("error", "LocationManager unavailable");
            call.resolve(errRes);
            return;
        }

        // 1. Try to get best last known location immediately
        Location bestLastKnown = null;
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) && fineGranted) {
                Location gpsLoc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (isBetterLocation(gpsLoc, bestLastKnown)) {
                    bestLastKnown = gpsLoc;
                }
            }
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                Location netLoc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                if (isBetterLocation(netLoc, bestLastKnown)) {
                    bestLastKnown = netLoc;
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && locationManager.isProviderEnabled(LocationManager.FUSED_PROVIDER)) {
                Location fusedLoc = locationManager.getLastKnownLocation(LocationManager.FUSED_PROVIDER);
                if (isBetterLocation(fusedLoc, bestLastKnown)) {
                    bestLastKnown = fusedLoc;
                }
            }
        } catch (SecurityException se) {
            Log.w(TAG, "SecurityException getting last known location: " + se.getMessage());
        } catch (Exception ignored) {}

        // If last known location is fresh (< 2 minutes old and has decent accuracy), resolve immediately
        if (bestLastKnown != null) {
            long ageMs = System.currentTimeMillis() - bestLastKnown.getTime();
            if (ageMs < 2 * 60 * 1000 && bestLastKnown.getAccuracy() <= 150) {
                JSObject snapshot = buildLocationSnapshot(bestLastKnown, "CACHED_LOCATION");
                call.resolve(snapshot);
                return;
            }
        }

        // 2. Request a single fresh location update with timeout
        final Location fallbackLastKnown = bestLastKnown;
        final Handler handler = new Handler(Looper.getMainLooper());
        final boolean[] resolved = {false};

        final LocationListener singleUpdateListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                if (resolved[0]) return;
                resolved[0] = true;
                handler.removeCallbacksAndMessages(null);
                try {
                    locationManager.removeUpdates(this);
                } catch (Exception ignored) {}

                JSObject snapshot = buildLocationSnapshot(location, "LIVE_LOCATION");
                call.resolve(snapshot);
            }

            @Override
            public void onStatusChanged(String provider, int status, Bundle extras) {}
            @Override
            public void onProviderEnabled(String provider) {}
            @Override
            public void onProviderDisabled(String provider) {}
        };

        // Timeout runnable
        Runnable timeoutRunnable = () -> {
            if (resolved[0]) return;
            resolved[0] = true;
            try {
                locationManager.removeUpdates(singleUpdateListener);
            } catch (Exception ignored) {}

            if (fallbackLastKnown != null) {
                JSObject snapshot = buildLocationSnapshot(fallbackLastKnown, "CACHED_LOCATION");
                call.resolve(snapshot);
            } else {
                JSObject unavailable = new JSObject();
                unavailable.put("status", "UNAVAILABLE");
                unavailable.put("source", "NONE");
                unavailable.put("confidence", "NONE");
                unavailable.put("locationLabel", "");
                unavailable.put("error", "Location request timed out and no cached location available");
                call.resolve(unavailable);
            }
        };

        handler.postDelayed(timeoutRunnable, LOCATION_TIMEOUT_MS);

        try {
            boolean requested = false;
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, singleUpdateListener, Looper.getMainLooper());
                requested = true;
            }
            if (fineGranted && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, singleUpdateListener, Looper.getMainLooper());
                requested = true;
            }

            if (!requested) {
                handler.removeCallbacks(timeoutRunnable);
                if (fallbackLastKnown != null) {
                    JSObject snapshot = buildLocationSnapshot(fallbackLastKnown, "CACHED_LOCATION");
                    call.resolve(snapshot);
                } else {
                    JSObject errRes = new JSObject();
                    errRes.put("status", "UNAVAILABLE");
                    errRes.put("source", "NONE");
                    errRes.put("confidence", "NONE");
                    errRes.put("locationLabel", "");
                    errRes.put("error", "Location providers disabled");
                    call.resolve(errRes);
                }
            }
        } catch (SecurityException se) {
            handler.removeCallbacks(timeoutRunnable);
            JSObject errRes = new JSObject();
            errRes.put("status", "PERMISSION_DENIED");
            errRes.put("source", "NONE");
            errRes.put("confidence", "NONE");
            errRes.put("locationLabel", "");
            errRes.put("error", "SecurityException: " + se.getMessage());
            call.resolve(errRes);
        } catch (Exception e) {
            handler.removeCallbacks(timeoutRunnable);
            if (fallbackLastKnown != null) {
                JSObject snapshot = buildLocationSnapshot(fallbackLastKnown, "CACHED_LOCATION");
                call.resolve(snapshot);
            } else {
                JSObject errRes = new JSObject();
                errRes.put("status", "UNAVAILABLE");
                errRes.put("source", "NONE");
                errRes.put("confidence", "NONE");
                errRes.put("locationLabel", "");
                errRes.put("error", "Error: " + e.getMessage());
                call.resolve(errRes);
            }
        }
    }

    private JSObject buildLocationSnapshot(Location loc, String source) {
        JSObject obj = new JSObject();
        if (loc == null) {
            obj.put("status", "UNAVAILABLE");
            obj.put("source", "NONE");
            obj.put("confidence", "NONE");
            obj.put("locationLabel", "");
            return obj;
        }

        double lat = loc.getLatitude();
        double lng = loc.getLongitude();
        float accuracy = loc.hasAccuracy() ? loc.getAccuracy() : 200.0f;
        long timeMs = loc.getTime() > 0 ? loc.getTime() : System.currentTimeMillis();

        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        isoFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        String capturedAtIso = isoFormat.format(new Date(timeMs));

        String label = reverseGeocode(lat, lng);

        obj.put("latitude", lat);
        obj.put("longitude", lng);
        obj.put("accuracyMeters", accuracy);
        obj.put("capturedAt", capturedAtIso);
        obj.put("source", source);
        obj.put("status", accuracy > 250 ? "APPROXIMATE" : "AVAILABLE");
        obj.put("locationLabel", label != null ? label : "");

        return obj;
    }

    private String reverseGeocode(double lat, double lng) {
        try {
            if (!Geocoder.isPresent()) return "";
            Geocoder geocoder = new Geocoder(getContext(), Locale.getDefault());
            List<Address> addresses = geocoder.getFromLocation(lat, lng, 1);
            if (addresses != null && !addresses.isEmpty()) {
                Address addr = addresses.get(0);

                // Preference hierarchy:
                // 1. SubLocality (Neighborhood e.g. "Jubilee Hills", "Madhapur", "Koramangala")
                // 2. Feature name (if not street numbers/coordinates)
                // 3. Locality (City e.g. "Hyderabad", "Bengaluru")
                // 4. SubAdminArea (District)
                String subLocality = addr.getSubLocality();
                String locality = addr.getLocality();
                String featureName = addr.getFeatureName();

                if (subLocality != null && !subLocality.trim().isEmpty()) {
                    return subLocality.trim();
                } else if (featureName != null && !featureName.matches("^\\d+.*") && !featureName.trim().isEmpty() && !featureName.equals(locality)) {
                    return featureName.trim();
                } else if (locality != null && !locality.trim().isEmpty()) {
                    return locality.trim();
                } else if (addr.getSubAdminArea() != null) {
                    return addr.getSubAdminArea().trim();
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Geocoder reverse-lookup skipped or failed: " + e.getMessage());
        }
        return "";
    }

    private boolean isBetterLocation(Location location, Location currentBestLocation) {
        if (currentBestLocation == null) return location != null;
        if (location == null) return false;

        long timeDelta = location.getTime() - currentBestLocation.getTime();
        boolean isSignificantlyNewer = timeDelta > 2 * 60 * 1000;
        boolean isSignificantlyOlder = timeDelta < -2 * 60 * 1000;
        boolean isNewer = timeDelta > 0;

        if (isSignificantlyNewer) return true;
        if (isSignificantlyOlder) return false;

        int accuracyDelta = (int) (location.getAccuracy() - currentBestLocation.getAccuracy());
        boolean isLessAccurate = accuracyDelta > 0;
        boolean isMoreAccurate = accuracyDelta < 0;
        boolean isSignificantlyLessAccurate = accuracyDelta > 200;

        if (isMoreAccurate) return true;
        if (isNewer && !isLessAccurate) return true;
        return isNewer && !isSignificantlyLessAccurate;
    }
}

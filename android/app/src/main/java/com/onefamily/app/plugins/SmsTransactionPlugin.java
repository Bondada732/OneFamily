package com.onefamily.app.plugins;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "SmsTransactionPlugin",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            }
        )
    }
)
public class SmsTransactionPlugin extends Plugin {

    private static final String TAG = "SmsTransactionPlugin";
    private static final String PREFS_NAME = "kinora_sms_prefs";
    private static final String KEY_PENDING_QUEUE = "pending_sms_queue";
    private static final String KEY_LAST_SMS_TIMESTAMP = "last_sms_timestamp";
    private static final String KEY_RECEIVER_TRIGGER_COUNT = "receiver_trigger_count";

    private static SmsTransactionPlugin sInstance = null;
    private boolean isListening = false;

    @Override
    public void load() {
        super.load();
        sInstance = this;
        Log.d(TAG, "SmsTransactionPlugin loaded into Capacitor bridge");
    }

    /**
     * Static callback for SmsTransactionReceiver to push live events to active JS bridge
     */
    public static boolean notifySmsReceived(String sender, String body, long timestamp) {
        if (sInstance != null) {
            try {
                JSObject eventData = new JSObject();
                eventData.put("sender", sender != null ? sender : "");
                eventData.put("body", body != null ? body : "");
                eventData.put("timestamp", String.valueOf(timestamp));

                sInstance.notifyListeners("smsReceived", eventData);
                sInstance.notifyListeners("transactionSmsReceived", eventData);
                Log.d(TAG, "Notified active JS listeners of incoming SMS from " + sender);
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Failed to notify JS listeners: " + e.getMessage());
            }
        }
        return false;
    }

    /**
     * Static callback for diagnostic event
     */
    public static void notifyDiagnosticEvent(boolean received, boolean senderAvailable, int messageLength, long timestamp) {
        if (sInstance != null) {
            try {
                JSObject diag = new JSObject();
                diag.put("received", received);
                diag.put("timestamp", String.valueOf(timestamp));
                diag.put("senderAvailable", senderAvailable);
                diag.put("messageLength", messageLength);
                diag.put("receiverTriggered", true);
                sInstance.notifyListeners("smsReceivedDiagnostic", diag);
            } catch (Exception ignored) {}
        }
    }

    /**
     * 1. Check granular SMS permissions
     */
    @PluginMethod
    public void checkSmsPermissions(PluginCall call) {
        checkPermission(call);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Context context = getContext();
        boolean hasReceive = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasRead = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;

        String state;
        if (hasReceive && hasRead) {
            state = "GRANTED";
        } else {
            // Check if user previously denied
            boolean shouldShowReceive = getActivity() != null && ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.RECEIVE_SMS);
            boolean shouldShowRead = getActivity() != null && ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.READ_SMS);
            if (!shouldShowReceive && !shouldShowRead) {
                state = "DENIED";
            } else {
                state = "DENIED";
            }
        }

        JSObject result = new JSObject();
        result.put("readSmsGranted", hasRead);
        result.put("receiveSmsGranted", hasReceive);
        result.put("permissionState", state);
        call.resolve(result);
    }

    /**
     * 2. Request native runtime SMS permissions
     */
    @PluginMethod
    public void requestSmsPermissions(PluginCall call) {
        requestPermission(call);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        requestPermissionForAlias("sms", call, "smsPermissionCallback");
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        checkPermission(call);
    }

    /**
     * 3. Start / Register Live Listener State
     */
    @PluginMethod
    public void startListener(PluginCall call) {
        isListening = true;
        JSObject ret = new JSObject();
        ret.put("listening", true);
        ret.put("receiverRegistered", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopListener(PluginCall call) {
        isListening = false;
        JSObject ret = new JSObject();
        ret.put("listening", false);
        call.resolve(ret);
    }

    /**
     * 4. Drain Pending SMS Queue (Messages captured by Manifest Receiver while app was closed)
     */
    @PluginMethod
    public void getPendingIncomingSms(PluginCall call) {
        Context context = getContext();
        JSArray messagesArray = new JSArray();

        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String queueJson = prefs.getString(KEY_PENDING_QUEUE, "[]");
            JSONArray queue = new JSONArray(queueJson);

            for (int i = 0; i < queue.length(); i++) {
                JSONObject item = queue.getJSONObject(i);
                JSObject msgObj = new JSObject();
                msgObj.put("sender", item.optString("sender", ""));
                msgObj.put("body", item.optString("body", ""));
                msgObj.put("timestamp", item.optString("timestamp", ""));
                msgObj.put("receivedAt", item.optString("receivedAt", ""));
                messagesArray.put(msgObj);
            }

            // Clear the queue after retrieving
            prefs.edit().putString(KEY_PENDING_QUEUE, "[]").apply();
            Log.d(TAG, "Drained " + messagesArray.length() + " pending SMS messages from offline queue");
        } catch (Exception e) {
            Log.e(TAG, "Error draining pending SMS queue: " + e.getMessage());
        }

        JSObject ret = new JSObject();
        ret.put("messages", messagesArray);
        ret.put("count", messagesArray.length());
        call.resolve(ret);
    }

    /**
     * 5. Diagnostic: Get Total SMS count in Inbox to verify ContentResolver
     */
    @PluginMethod
    public void getRecentSmsCount(PluginCall call) {
        Context context = getContext();
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            JSObject err = new JSObject();
            err.put("accessible", false);
            err.put("error", "READ_SMS permission not granted");
            err.put("count", 0);
            call.resolve(err);
            return;
        }

        Cursor cursor = null;
        try {
            cursor = context.getContentResolver().query(
                Uri.parse("content://sms/inbox"),
                new String[]{"_id"},
                null,
                null,
                null
            );

            int count = (cursor != null) ? cursor.getCount() : 0;
            JSObject ret = new JSObject();
            ret.put("accessible", true);
            ret.put("count", count);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject err = new JSObject();
            err.put("accessible", false);
            err.put("error", e.getMessage());
            err.put("count", 0);
            call.resolve(err);
        } finally {
            if (cursor != null) cursor.close();
        }
    }

    /**
     * 6. Diagnostic: Get Recent Financial SMS Candidates
     */
    @PluginMethod
    public void getRecentFinancialSmsCandidates(PluginCall call) {
        scanRecentSms(call);
    }

    @PluginMethod
    public void scanRecentSms(PluginCall call) {
        Context context = getContext();
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("READ_SMS permission not granted");
            return;
        }

        int days = call.getInt("days", 14);
        long cutoffTime = System.currentTimeMillis() - (days * 24L * 60L * 60L * 1000L);

        JSArray messagesArray = new JSArray();
        Uri[] uris = new Uri[]{
            Uri.parse("content://sms/inbox"),
            Uri.parse("content://sms")
        };

        boolean foundMessages = false;

        for (Uri uri : uris) {
            if (foundMessages) break;
            Cursor cursor = null;
            try {
                cursor = context.getContentResolver().query(
                    uri,
                    new String[]{"address", "body", "date"},
                    "date >= ?",
                    new String[]{String.valueOf(cutoffTime)},
                    "date DESC LIMIT 300"
                );

                if (cursor != null && cursor.moveToFirst()) {
                    int addressIdx = cursor.getColumnIndex("address");
                    int bodyIdx = cursor.getColumnIndex("body");
                    int dateIdx = cursor.getColumnIndex("date");

                    do {
                        String body = (bodyIdx >= 0) ? cursor.getString(bodyIdx) : "";
                        if (body != null && body.trim().length() > 0) {
                            String sender = (addressIdx >= 0) ? cursor.getString(addressIdx) : "";
                            long date = (dateIdx >= 0) ? cursor.getLong(dateIdx) : System.currentTimeMillis();

                            JSObject msgObj = new JSObject();
                            msgObj.put("sender", sender != null ? sender : "");
                            msgObj.put("body", body);
                            msgObj.put("timestamp", String.valueOf(date));
                            messagesArray.put(msgObj);
                        }
                    } while (cursor.moveToNext());

                    if (messagesArray.length() > 0) {
                        foundMessages = true;
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Query error for uri " + uri + ": " + e.getMessage());
            } finally {
                if (cursor != null) cursor.close();
            }
        }

        JSObject ret = new JSObject();
        ret.put("messages", messagesArray);
        ret.put("count", messagesArray.length());
        call.resolve(ret);
    }

    /**
     * 7. Full Automated Diagnostic Report
     */
    @PluginMethod
    public void runSmartExpenseDiagnostics(PluginCall call) {
        Context context = getContext();
        boolean hasReceive = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasRead = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long triggerCount = prefs.getLong(KEY_RECEIVER_TRIGGER_COUNT, 0);
        long lastSmsTime = prefs.getLong(KEY_LAST_SMS_TIMESTAMP, 0);
        String queueJson = prefs.getString(KEY_PENDING_QUEUE, "[]");
        int pendingQueueCount = 0;
        try {
            pendingQueueCount = new JSONArray(queueJson).length();
        } catch (Exception ignored) {}

        // Check Inbox Access
        boolean inboxAccessible = false;
        int inboxCount = 0;
        String inboxError = "";
        if (hasRead) {
            Cursor cursor = null;
            try {
                cursor = context.getContentResolver().query(
                    Uri.parse("content://sms/inbox"),
                    new String[]{"_id"},
                    null,
                    null,
                    null
                );
                if (cursor != null) {
                    inboxAccessible = true;
                    inboxCount = cursor.getCount();
                }
            } catch (Exception e) {
                inboxError = e.getMessage();
            } finally {
                if (cursor != null) cursor.close();
            }
        }

        JSObject diag = new JSObject();
        diag.put("androidVersion", Build.VERSION.RELEASE);
        diag.put("apiLevel", Build.VERSION.SDK_INT);
        diag.put("targetSdk", context.getApplicationInfo().targetSdkVersion);
        diag.put("manufacturer", Build.MANUFACTURER);
        diag.put("model", Build.MODEL);
        diag.put("readSmsPermission", hasRead);
        diag.put("receiveSmsPermission", hasReceive);
        diag.put("smsInboxAccessible", inboxAccessible);
        diag.put("smsInboxCount", inboxCount);
        diag.put("inboxError", inboxError);
        diag.put("receiverConfigured", true); // Defined in manifest
        diag.put("receiverTriggerCount", triggerCount);
        diag.put("lastSmsTimestamp", lastSmsTime > 0 ? String.valueOf(lastSmsTime) : null);
        diag.put("capacitorPluginLoaded", true);
        diag.put("pendingQueueCount", pendingQueueCount);
        diag.put("notificationCaptureImplemented", false);
        diag.put("notificationStatusMessage", "Notification capture is not currently implemented. Android SMS capture via Manifest BroadcastReceiver is active.");

        call.resolve(diag);
    }

    @Override
    protected void handleOnDestroy() {
        sInstance = null;
    }
}
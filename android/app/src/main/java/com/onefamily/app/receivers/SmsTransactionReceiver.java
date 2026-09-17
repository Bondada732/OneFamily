package com.onefamily.app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;

import com.onefamily.app.plugins.SmsTransactionPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

/**
 * SmsTransactionReceiver
 * Independent Android BroadcastReceiver declared in AndroidManifest.xml.
 * Executes whenever android.provider.Telephony.SMS_RECEIVED is broadcast by the OS,
 * regardless of whether KinoraOne is active, backgrounded, or closed.
 */
public class SmsTransactionReceiver extends BroadcastReceiver {

    private static final String TAG = "SmsTransactionReceiver";
    private static final String PREFS_NAME = "kinora_sms_prefs";
    private static final String KEY_PENDING_QUEUE = "pending_sms_queue";
    private static final String KEY_LAST_SMS_TIMESTAMP = "last_sms_timestamp";
    private static final String KEY_RECEIVER_TRIGGER_COUNT = "receiver_trigger_count";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            return;
        }

        try {
            // Update trigger count and timestamp in SharedPreferences for diagnostics
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            long triggerCount = prefs.getLong(KEY_RECEIVER_TRIGGER_COUNT, 0) + 1;
            long now = System.currentTimeMillis();
            prefs.edit()
                .putLong(KEY_RECEIVER_TRIGGER_COUNT, triggerCount)
                .putLong(KEY_LAST_SMS_TIMESTAMP, now)
                .apply();

            Log.d(TAG, "SMS broadcast received by SmsTransactionReceiver. Trigger count: " + triggerCount);

            // Extract SMS messages supporting multipart SMS
            SmsMessage[] messages = extractSmsMessages(intent);
            if (messages == null || messages.length == 0) {
                Log.w(TAG, "No SMS messages extracted from intent");
                return;
            }

            // Group multipart SMS segments by sender
            Map<String, StringBuilder> messageMap = new HashMap<>();
            long messageTimestamp = now;

            for (SmsMessage sms : messages) {
                if (sms != null) {
                    String sender = sms.getOriginatingAddress();
                    if (sender == null) sender = "Unknown";
                    String bodyPart = sms.getMessageBody();
                    if (bodyPart != null) {
                        if (!messageMap.containsKey(sender)) {
                            messageMap.put(sender, new StringBuilder());
                        }
                        messageMap.get(sender).append(bodyPart);
                    }
                    if (sms.getTimestampMillis() > 0) {
                        messageTimestamp = sms.getTimestampMillis();
                    }
                }
            }

            // Process each grouped SMS
            for (Map.Entry<String, StringBuilder> entry : messageMap.entrySet()) {
                String sender = entry.getKey();
                String fullBody = entry.getValue().toString().trim();

                if (fullBody.isEmpty()) continue;

                Log.d(TAG, "Processing SMS from " + sender + " (length: " + fullBody.length() + ")");

                // 1. Notify active plugin bridge if app is running
                boolean liveEmitted = SmsTransactionPlugin.notifySmsReceived(sender, fullBody, messageTimestamp);

                // 2. Also persist into queue so nothing is lost if JS bridge is disconnected/app was closed
                saveToPendingQueue(context, sender, fullBody, messageTimestamp);

                // 3. Emit diagnostic event
                SmsTransactionPlugin.notifyDiagnosticEvent(true, sender != null, fullBody.length(), messageTimestamp);
            }

        } catch (Exception e) {
            Log.e(TAG, "Error in SmsTransactionReceiver onReceive: " + e.getMessage(), e);
        }
    }

    /**
     * Extract SmsMessage array from Intent supporting modern Telephony API and PDU fallback
     */
    private SmsMessage[] extractSmsMessages(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            try {
                SmsMessage[] msgs = Telephony.Sms.Intents.getMessagesFromIntent(intent);
                if (msgs != null && msgs.length > 0) {
                    return msgs;
                }
            } catch (Exception e) {
                Log.w(TAG, "Telephony.Sms.Intents.getMessagesFromIntent failed, falling back to PDUs: " + e.getMessage());
            }
        }

        Bundle bundle = intent.getExtras();
        if (bundle == null) return null;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null || pdus.length == 0) return null;

        String format = bundle.getString("format");
        SmsMessage[] msgs = new SmsMessage[pdus.length];

        for (int i = 0; i < pdus.length; i++) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                msgs[i] = SmsMessage.createFromPdu((byte[]) pdus[i], format);
            } else {
                msgs[i] = SmsMessage.createFromPdu((byte[]) pdus[i]);
            }
        }
        return msgs;
    }

    /**
     * Save newly received SMS to SharedPreferences pending queue
     */
    private static synchronized void saveToPendingQueue(Context context, String sender, String body, long timestamp) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existingQueueJson = prefs.getString(KEY_PENDING_QUEUE, "[]");
            JSONArray queue = new JSONArray(existingQueueJson);

            JSONObject item = new JSONObject();
            item.put("sender", sender != null ? sender : "");
            item.put("body", body);
            item.put("timestamp", String.valueOf(timestamp));
            item.put("receivedAt", String.valueOf(System.currentTimeMillis()));

            queue.put(item);

            // Keep max 100 items in queue to prevent memory bloat
            if (queue.length() > 100) {
                JSONArray trimmed = new JSONArray();
                for (int i = queue.length() - 100; i < queue.length(); i++) {
                    trimmed.put(queue.get(i));
                }
                queue = trimmed;
            }

            prefs.edit().putString(KEY_PENDING_QUEUE, queue.toString()).apply();
            Log.d(TAG, "Saved SMS to pending queue. Total pending: " + queue.length());
        } catch (Exception e) {
            Log.e(TAG, "Failed to save SMS to pending queue: " + e.getMessage());
        }
    }
}

package com.onefamily.app.plugins;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.regex.Pattern;

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

    private BroadcastReceiver smsReceiver = null;
    private static final Pattern FINANCIAL_FILTER = Pattern.compile("(?i)(debited|credited|spent|paid|transferred|transfer|sent|received|upi|vpa|a/c|acct|inr|rs|₹)");

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Context context = getContext();
        boolean hasReceive = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasRead = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;

        JSObject result = new JSObject();
        if (hasReceive && hasRead) {
            result.put("permissionState", "GRANTED");
        } else {
            result.put("permissionState", "DENIED");
        }
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        requestPermissionForAlias("sms", call, "smsPermissionCallback");
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        checkPermission(call);
    }

    @PluginMethod
    public void startListener(PluginCall call) {
        if (smsReceiver == null) {
            smsReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
                        Bundle bundle = intent.getExtras();
                        if (bundle != null) {
                            Object[] pdus = (Object[]) bundle.get("pdus");
                            String format = bundle.getString("format");
                            if (pdus != null) {
                                for (Object pdu : pdus) {
                                    SmsMessage sms;
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                        sms = SmsMessage.createFromPdu((byte[]) pdu, format);
                                    } else {
                                        sms = SmsMessage.createFromPdu((byte[]) pdu);
                                    }
                                    if (sms != null) {
                                        String sender = sms.getOriginatingAddress();
                                        String body = sms.getMessageBody();

                                        if (body != null && FINANCIAL_FILTER.matcher(body).find()) {
                                            JSObject eventData = new JSObject();
                                            eventData.put("sender", sender != null ? sender : "");
                                            eventData.put("body", body);
                                            eventData.put("timestamp", String.valueOf(sms.getTimestampMillis()));
                                            notifyListeners("smsReceived", eventData);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            IntentFilter filter = new IntentFilter("android.provider.Telephony.SMS_RECEIVED");
            filter.setPriority(IntentFilter.SYSTEM_HIGH_PRIORITY);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                getContext().registerReceiver(smsReceiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                getContext().registerReceiver(smsReceiver, filter);
            }
        }

        JSObject ret = new JSObject();
        ret.put("listening", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopListener(PluginCall call) {
        if (smsReceiver != null) {
            try {
                getContext().unregisterReceiver(smsReceiver);
            } catch (Exception ignored) {}
            smsReceiver = null;
        }
        JSObject ret = new JSObject();
        ret.put("listening", false);
        call.resolve(ret);
    }

    @PluginMethod
    public void scanRecentSms(PluginCall call) {
        Context context = getContext();
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("READ_SMS permission not granted");
            return;
        }

        int days = call.getInt("days", 7);
        long cutoffTime = System.currentTimeMillis() - (days * 24L * 60L * 60L * 1000L);

        JSArray messagesArray = new JSArray();
        Uri uri = Uri.parse("content://sms/inbox");

        Cursor cursor = null;
        try {
            cursor = context.getContentResolver().query(
                uri,
                new String[]{"address", "body", "date"},
                "date >= ?",
                new String[]{String.valueOf(cutoffTime)},
                "date DESC LIMIT 100"
            );

            if (cursor != null && cursor.moveToFirst()) {
                int addressIdx = cursor.getColumnIndex("address");
                int bodyIdx = cursor.getColumnIndex("body");
                int dateIdx = cursor.getColumnIndex("date");

                do {
                    String body = cursor.getString(bodyIdx);
                    if (body != null && FINANCIAL_FILTER.matcher(body).find()) {
                        String sender = cursor.getString(addressIdx);
                        long date = cursor.getLong(dateIdx);

                        JSObject msgObj = new JSObject();
                        msgObj.put("sender", sender != null ? sender : "");
                        msgObj.put("body", body);
                        msgObj.put("timestamp", String.valueOf(date));
                        messagesArray.put(msgObj);
                    }
                } while (cursor.moveToNext());
            }
        } catch (Exception e) {
            call.reject("Failed to query SMS content provider: " + e.getMessage());
            return;
        } finally {
            if (cursor != null) cursor.close();
        }

        JSObject ret = new JSObject();
        ret.put("messages", messagesArray);
        call.resolve(ret);
    }

    @Override
    protected void handleOnDestroy() {
        if (smsReceiver != null) {
            try {
                getContext().unregisterReceiver(smsReceiver);
            } catch (Exception ignored) {}
            smsReceiver = null;
        }
    }
}

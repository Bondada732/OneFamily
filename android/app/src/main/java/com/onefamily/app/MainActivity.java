package com.onefamily.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.onefamily.app.plugins.SmsTransactionPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SmsTransactionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

package com.onefamily.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.onefamily.app.plugins.SmsTransactionPlugin;
import com.onefamily.app.plugins.LocationContextPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SmsTransactionPlugin.class);
        registerPlugin(LocationContextPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
                webView.clearCache(true);
            }
        } catch (Exception ignored) {}
    }
}

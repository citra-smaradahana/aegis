package com.citrasmaradahana.aegis;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity: notifikasi dengan suara (notification sound).
 * Channel default dibuat dengan sound agar push/local notification berbunyi.
 */
public class MainActivity extends BridgeActivity {

  private static final String CHANNEL_ID = "aegis_default";
  private static final String CHANNEL_NAME = "AEGIS KMB Notifikasi";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    createNotificationChannelWithSound();
  }

  private void createNotificationChannelWithSound() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
    NotificationManager manager = getSystemService(NotificationManager.class);
    if (manager == null) return;

    NotificationChannel channel = new NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_DEFAULT
    );
    channel.setDescription("Notifikasi aplikasi AEGIS KMB");
    channel.enableVibration(true);
    Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    if (soundUri != null) {
      AudioAttributes attrs = new AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_NOTIFICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build();
      channel.setSound(soundUri, attrs);
    }
    manager.createNotificationChannel(channel);
  }
}

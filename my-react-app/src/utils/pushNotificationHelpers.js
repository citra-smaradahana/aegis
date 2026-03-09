/**
 * Helper untuk Push Notification (FCM) - hanya berjalan di native (Capacitor Android/iOS)
 * Di web, fungsi ini no-op.
 * Saat app di foreground: tampilkan notifikasi di status bar + getar via Local Notifications
 */
import { Capacitor } from "@capacitor/core";
import { supabase } from "../supabaseClient";

const PLATFORM = Capacitor.getPlatform() === "ios" ? "ios" : "android";
const NOTIFICATION_CHANNEL_ID = "aegis-push";
const NOTIFICATION_CHANNEL_NAME = "Notifikasi AEGIS";

export function isPushSupported() {
  return Capacitor.isNativePlatform();
}

/**
 * Setup channel notifikasi dengan getar (Android)
 */
async function setupNotificationChannel() {
  if (Capacitor.getPlatform() !== "android") return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.requestPermissions();
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: NOTIFICATION_CHANNEL_NAME,
      description: "Notifikasi validasi, tasklist, dan laporan pending",
      importance: 4, // IMPORTANCE_HIGH
      vibration: true,
    });
  } catch (err) {
    console.warn("Setup notification channel:", err);
  }
}

/**
 * Tampilkan notifikasi di status bar saat push diterima (foreground)
 */
async function showForegroundNotification(notification) {
  const title = notification?.title || "AEGIS";
  const body = notification?.body || "Ada notifikasi baru";
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now() % 2147483647,
          title,
          body,
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      ],
    });
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (err) {
    console.warn("Show foreground notification:", err);
  }
}

/**
 * Daftar push notification dan simpan token ke Supabase
 * Panggil saat user sudah login
 */
export async function registerPushNotifications(userId) {
  if (!userId || !isPushSupported()) return;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    await setupNotificationChannel();

    // Request permission (Android 13+)
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt" || permStatus.receive === "denied") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") {
      console.warn("Push notification permission denied");
      return;
    }

    // Register
    await PushNotifications.register();

    // Listener: token diterima -> simpan ke Supabase
    PushNotifications.addListener(
      "registration",
      async ({ value: token }) => {
        try {
          await supabase.from("user_fcm_tokens").upsert(
            {
              user_id: userId,
              token,
              platform: PLATFORM,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,platform" }
          );
          console.log("FCM token saved for user", userId);
        } catch (err) {
          console.error("Error saving FCM token:", err);
        }
      }
    );

    // Listener: notifikasi diterima (foreground) -> tampilkan di status bar + getar
    PushNotifications.addListener(
      "pushNotificationReceived",
      async (notification) => {
        await showForegroundNotification(notification);
      }
    );

    // Listener: user tap notifikasi -> bisa navigate
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      async ({ notification }) => {
        try {
          const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch (_) {}
        const data = notification?.notification?.data || notification?.data || {};
        if (data?.type === "validation" && data?.action) {
          window.dispatchEvent(
            new CustomEvent("pushNotificationAction", { detail: data })
          );
        }
      }
    );

    // Listener: error
    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err);
    });
  } catch (err) {
    console.error("Push notification setup error:", err);
  }
}

/**
 * Hapus token saat logout (opsional)
 */
export async function unregisterPushNotifications(userId) {
  if (!userId || !isPushSupported()) return;
  try {
    await supabase
      .from("user_fcm_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("platform", PLATFORM);
  } catch (err) {
    console.error("Error removing FCM token:", err);
  }
}

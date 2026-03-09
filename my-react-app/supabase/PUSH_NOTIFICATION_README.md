# Push Notification - Panduan Setup

## Yang Sudah Diimplementasi

### 1. Client (Android)
- Plugin: `@capacitor/push-notifications`, `@capacitor/haptics`
- Permission: `POST_NOTIFICATIONS`, `VIBRATE`
- Firebase: `firebase-messaging` di build.gradle
- Kode: `registerPushNotifications()` dipanggil saat user login
- Token FCM disimpan ke tabel `user_fcm_tokens`

### 2. Database
- Tabel `user_fcm_tokens` - jalankan `user_fcm_tokens_table.sql` di Supabase SQL Editor

### 3. Edge Function
- `send-push-notification` - kirim push via FCM
- Secret: `FIREBASE_SERVICE_ACCOUNT` (isi JSON Service Account)

## Cara Deploy Edge Function

```bash
cd my-react-app
supabase functions deploy send-push-notification
```

## Cara Memanggil Edge Function

### Dari backend/script (dengan Service Role Key):

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/send-push-notification" \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "uuid-user", "title": "Validasi Baru", "body": "Ada validasi Fit To Work yang perlu ditindaklanjuti", "data": {"type": "validation", "action": "fit-to-work-validation"}}'
```

### Dari kode (hanya untuk testing - gunakan service role di server):

```javascript
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    user_id: 'uuid',
    title: 'Judul Notifikasi',
    body: 'Isi notifikasi',
    data: { type: 'validation', action: 'fit-to-work-validation' }
  }
});
```

## Trigger Otomatis (push-notification-trigger)

Edge Function `push-notification-trigger` menerima webhook dari Database dan mengirim push ke user terkait.

### Deploy

```bash
npx supabase functions deploy push-notification-trigger --project-ref bzwgwndwmmaxdmuktasf
```

### Konfigurasi Database Webhooks (Supabase Dashboard)

Buat webhook untuk tiap tabel berikut. URL: `https://bzwgwndwmmaxdmuktasf.supabase.co/functions/v1/push-notification-trigger`  
Header: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

| Tabel | Event | Deskripsi |
|-------|-------|-----------|
| `fit_to_work` | INSERT, UPDATE | Validasi FTW → notifikasi ke validator (jabatan tertentu di site) |
| `hazard_report` | INSERT | Tasklist baru → notifikasi ke PIC & Evaluator (cocok nama ke users) |
| `planned_task_observation` | INSERT, UPDATE | Laporan PTO pending → notifikasi ke PIC tindak lanjut |
| `take_5` | INSERT, UPDATE | Laporan Take 5 pending → notifikasi ke pelapor (user_id) untuk isi Hazard Report |
| `safety_meetings` | INSERT, UPDATE | Daily Attendance pending → notifikasi ke PJO & Asst PJO di site tersebut |

## Testing

1. Build & jalankan app di Android: `npm run android`
2. Login di app
3. Pastikan token tersimpan di `user_fcm_tokens`
4. Panggil Edge Function dengan user_id Anda
5. Notifikasi akan muncul + device bergetar

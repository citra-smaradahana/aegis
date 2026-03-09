# Build Aplikasi Android - AEGIS KMB

Aplikasi ini menggunakan **Capacitor** untuk membungkus React web app menjadi aplikasi Android native.

## Prasyarat

1. **Node.js** (sudah terinstall)
2. **Android Studio** - [Download](https://developer.android.com/studio)
3. **Android SDK** - Terinstall via Android Studio (SDK Platform 34 atau lebih baru direkomendasikan)
4. **Java 17** - Biasanya sudah termasuk dengan Android Studio

## Langkah Build

### 1. Build web app dan sync ke Android

```bash
npm run build
npx cap sync android
```

Atau gunakan script gabungan:

```bash
npm run android
```

### 2. Buka project di Android Studio

```bash
npx cap open android
```

Atau buka folder `android/` secara manual di Android Studio.

### 3. Build APK di Android Studio

1. Pilih **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. APK akan tersedia di `android/app/build/outputs/apk/debug/`

### 4. Build untuk Release (untuk upload Play Store)

1. Buat keystore untuk signing (jika belum punya)
2. Konfigurasi signing di `android/app/build.gradle`
3. Pilih **Build** → **Generate Signed Bundle / APK**
4. Pilih **Android App Bundle** (.aab) untuk upload ke Play Store

## Script yang Tersedia

| Script | Deskripsi |
|--------|-----------|
| `npm run cap:sync` | Sync web assets ke project Android |
| `npm run cap:android` | Sync + buka Android Studio |
| `npm run android` | Build web + sync + buka Android Studio |

## Struktur Project

```
my-react-app/
├── dist/              # Output build web (di-copy ke android)
├── android/           # Project Android native (Gradle)
│   ├── app/
│   └── ...
├── capacitor.config.json
└── ...
```

## Troubleshooting

- **"SDK not found"**: Pastikan ANDROID_HOME atau ANDROID_SDK_ROOT di-set di environment variables
- **Build gagal**: Pastikan Android Studio dan SDK terinstall lengkap
- **Web tidak update**: Jalankan `npm run build` lalu `npx cap sync android` ulang

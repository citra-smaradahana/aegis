# AEGIS KMB - Progressive Web App (PWA)

## 📱 Overview

AEGIS KMB adalah Progressive Web App (PWA) untuk sistem manajemen keselamatan yang dapat diinstall seperti aplikasi native di perangkat mobile dan desktop.

## ✨ Fitur PWA

- **Offline Support**: Dapat bekerja tanpa internet
- **Installable**: Dapat diinstall di home screen
- **Push Notifications**: Notifikasi real-time (opsional)
- **Background Sync**: Sinkronisasi data saat online
- **Responsive**: Optimal di semua ukuran layar

## 🚀 Deployment untuk Google Play Store

### 1. Build PWA

```bash
# Install dependencies
npm install

# Build aplikasi
npm run build

# Atau gunakan script otomatis
chmod +x build-and-deploy.sh
./build-and-deploy.sh
```

### 2. Generate Icons

1. Buka `public/icon-generator.html` di browser
2. Download semua icon yang diperlukan
3. Pindahkan icon ke folder `dist/`

### 3. Test PWA

```bash
# Serve build files
npx serve dist

# Buka browser dan test:
# - Install prompt muncul
# - Offline functionality
# - Background sync
```

### 4. Deploy ke Hosting

**Opsi 1: Vercel (Recommended)**

```bash
npm install -g vercel
vercel --prod
```

**Opsi 2: Netlify**

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Opsi 3: Firebase Hosting**

```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

### 5. Google Play Store dengan Bubblewrap

#### Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

#### Initialize TWA

```bash
bubblewrap init --manifest https://your-domain.com/manifest.json
```

#### Build APK

```bash
bubblewrap build
```

#### Test APK

```bash
bubblewrap install
```

## 📋 Requirements untuk Google Play Store

### 1. HTTPS Required

- Semua PWA harus menggunakan HTTPS
- SSL certificate valid

### 2. Manifest Requirements

- `name` dan `short_name`
- `start_url` harus valid
- `display` mode: `standalone` atau `fullscreen`
- Icon minimal 512x512px

### 3. Service Worker

- Harus ada service worker
- Minimal caching strategy
- Offline functionality

### 4. Performance

- Lighthouse score minimal 90
- First Contentful Paint < 3s
- Largest Contentful Paint < 2.5s

## 🔧 Konfigurasi

### Manifest.json

```json
{
  "name": "AEGIS KMB - Safety Management System",
  "short_name": "AEGIS KMB",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e40af",
  "background_color": "#ffffff"
}
```

### Service Worker

- Caching strategy: Cache First
- Background sync untuk form submissions
- Offline fallback pages

## 📊 Testing Checklist

### PWA Features

- [ ] Install prompt muncul
- [ ] App dapat diinstall
- [ ] Offline mode berfungsi
- [ ] Background sync bekerja
- [ ] Push notifications (opsional)

### Performance

- [ ] Lighthouse score > 90
- [ ] Loading time < 3s
- [ ] Responsive di semua device
- [ ] Smooth animations

### Functionality

- [ ] Semua form berfungsi offline
- [ ] Data tersinkronisasi saat online
- [ ] Image upload berfungsi
- [ ] Export Excel/PDF berfungsi

## 🐛 Troubleshooting

### Install Prompt Tidak Muncul

1. Pastikan HTTPS aktif
2. Check manifest.json valid
3. Service worker ter-register
4. User belum pernah install

### Offline Mode Tidak Berfungsi

1. Check service worker cache
2. Verify IndexedDB setup
3. Test network disconnection

### Background Sync Error

1. Check service worker registration
2. Verify IndexedDB permissions
3. Test sync event handling

## 📱 Google Play Store Submission

### 1. Create Developer Account

- Daftar di Google Play Console
- Bayar $25 one-time fee

### 2. Prepare Store Listing

- App description
- Screenshots (minimal 2)
- Feature graphic
- Privacy policy

### 3. Upload APK

- Upload APK yang di-build dengan Bubblewrap
- Test di internal testing
- Release ke production

### 4. Compliance

- Privacy policy
- Content rating
- Target audience
- Data safety

## 🔄 Update Process

### 1. Update Web App

```bash
npm run build
# Deploy ke hosting
```

### 2. Update TWA

```bash
bubblewrap update
bubblewrap build
```

### 3. Update Play Store

- Upload APK baru
- Update changelog
- Release update

## 📞 Support

Untuk bantuan lebih lanjut:

- Dokumentasi PWA: https://web.dev/progressive-web-apps/
- Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap
- Google Play Console: https://play.google.com/console

---

**Note**: Pastikan semua fitur offline dan sync sudah di-test dengan baik sebelum release ke production.

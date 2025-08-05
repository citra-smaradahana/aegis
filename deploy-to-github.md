# 🚀 Deploy AEGIS KMB PWA ke GitHub & Google Play Store

## 📋 Langkah-langkah Deployment

### 1. Setup GitHub Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial PWA release - AEGIS KMB Safety Management System"

# Add remote repository (ganti dengan URL repo Anda)
git remote add origin https://github.com/username/aegis-kmb-pwa.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy ke GitHub Pages

1. **Buka GitHub Repository**
2. **Settings > Pages**
3. **Source**: Deploy from a branch
4. **Branch**: main
5. **Folder**: / (root)
6. **Save**

### 3. Setup GitHub Actions untuk Auto-Deploy

Buat file `.github/workflows/deploy.yml`:

```yaml
name: Deploy PWA to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Build PWA
        run: npm run build

      - name: Copy PWA files
        run: |
          cp public/sw.js dist/
          cp public/manifest.json dist/

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 4. Generate Icons

1. **Buka file**: `public/create-icons.html` di browser
2. **Download semua icons**
3. **Upload icons ke folder**: `dist/` di repository

### 5. Test PWA

1. **Buka URL**: `https://username.github.io/aegis-kmb-pwa`
2. **Test fitur PWA**:
   - Install prompt
   - Offline mode
   - Background sync

## 📱 Google Play Store dengan Bubblewrap

### 1. Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

### 2. Initialize TWA Project

```bash
# Ganti dengan URL GitHub Pages Anda
bubblewrap init --manifest https://username.github.io/aegis-kmb-pwa/manifest.json
```

### 3. Build APK

```bash
bubblewrap build
```

### 4. Test APK

```bash
bubblewrap install
```

## 🔧 Konfigurasi TWA

Edit file `app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.aegis.kmb"
        minSdkVersion 21
        targetSdkVersion 30
        versionCode 1
        versionName "1.0.0"
    }
}
```

## 📋 Google Play Store Requirements

### 1. Developer Account

- Daftar di [Google Play Console](https://play.google.com/console)
- Bayar $25 one-time fee

### 2. App Information

- **App Name**: AEGIS KMB - Safety Management System
- **Short Description**: Sistem manajemen keselamatan untuk pelaporan Fit To Work, Take 5, dan Hazard
- **Full Description**:

  ```
  AEGIS KMB adalah aplikasi manajemen keselamatan yang memungkinkan karyawan untuk:

  ✅ Melaporkan Fit To Work
  ✅ Melakukan Take 5 assessment
  ✅ Melaporkan Hazard dan insiden
  ✅ Monitoring statistik real-time
  ✅ Export data ke Excel dan PDF
  ✅ Mode offline untuk area remote

  Fitur Utama:
  • Interface yang user-friendly
  • Sinkronisasi otomatis saat online
  • Dashboard monitoring lengkap
  • Notifikasi real-time
  • Backup data lokal
  ```

### 3. Screenshots

- **Phone**: 2-8 screenshots (1080x1920)
- **Tablet**: 1-8 screenshots (1200x1920)
- **Feature Graphic**: 1024x500

### 4. Content Rating

- **Category**: Business
- **Content**: Everyone
- **Rating**: 3+

### 5. Privacy Policy

Buat privacy policy yang mencakup:

- Data collection
- Data usage
- Data storage
- User rights

## 🚀 Deployment Checklist

### PWA Features

- [ ] Manifest.json valid
- [ ] Service worker ter-register
- [ ] Icons semua ukuran tersedia
- [ ] Offline mode berfungsi
- [ ] Background sync bekerja
- [ ] Install prompt muncul

### Performance

- [ ] Lighthouse score > 90
- [ ] Loading time < 3s
- [ ] Responsive design
- [ ] Smooth animations

### Security

- [ ] HTTPS enabled
- [ ] Content Security Policy
- [ ] Secure data handling
- [ ] Privacy compliance

### Google Play Store

- [ ] APK build successful
- [ ] App signing configured
- [ ] Store listing complete
- [ ] Content rating done
- [ ] Privacy policy uploaded

## 🔄 Update Process

### 1. Update Web App

```bash
# Make changes
git add .
git commit -m "Update: [description]"
git push origin main
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

- **PWA Documentation**: https://web.dev/progressive-web-apps/
- **Bubblewrap**: https://github.com/GoogleChromeLabs/bubblewrap
- **Google Play Console**: https://play.google.com/console
- **GitHub Pages**: https://pages.github.com/

---

**Note**: Pastikan semua testing selesai sebelum release ke production!

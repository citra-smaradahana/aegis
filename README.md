# 🛡️ AEGIS KMB - Safety Management System

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![React](https://img.shields.io/badge/React-18.0-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0-purple?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)

AEGIS KMB adalah Progressive Web App (PWA) untuk sistem manajemen keselamatan yang memungkinkan karyawan melaporkan dan memantau keselamatan kerja secara real-time.

## ✨ Fitur Utama

### 📱 Progressive Web App

- **Installable**: Dapat diinstall seperti aplikasi native
- **Offline Support**: Bekerja tanpa internet
- **Background Sync**: Sinkronisasi otomatis saat online
- **Push Notifications**: Notifikasi real-time

### 🛡️ Safety Management

- **Fit To Work**: Pelaporan kondisi kerja karyawan
- **Take 5**: Assessment keselamatan sebelum kerja
- **Hazard Report**: Pelaporan bahaya dan insiden
- **Tasklist**: Manajemen tugas keselamatan

### 📊 Monitoring & Analytics

- **Real-time Dashboard**: Statistik live
- **Export Data**: Excel dan PDF
- **Individual Reports**: Laporan per karyawan
- **Site-based Analytics**: Analisis per lokasi

### 🔧 Technical Features

- **Responsive Design**: Optimal di semua device
- **Image Upload**: Upload foto dengan crop
- **Form Validation**: Validasi real-time
- **Data Encryption**: Keamanan data

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm atau yarn
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/username/aegis-kmb-pwa.git
cd aegis-kmb-pwa

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Build for Production

```bash
# Build PWA
npm run build

# Preview build
npm run preview
```

## 📱 PWA Installation

### Desktop

1. Buka aplikasi di browser
2. Klik icon "Install" di address bar
3. Aplikasi akan terinstall di desktop

### Mobile

1. Buka aplikasi di browser mobile
2. Tap "Add to Home Screen"
3. Aplikasi akan terinstall di home screen

## 🌐 Deployment

### GitHub Pages

```bash
# Deploy ke GitHub Pages
npm run build
# Upload dist/ folder ke GitHub Pages
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## 📱 Google Play Store

### Build APK dengan Bubblewrap

```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Initialize TWA
bubblewrap init --manifest https://your-domain.com/manifest.json

# Build APK
bubblewrap build
```

### Requirements

- HTTPS domain
- Valid manifest.json
- Service worker
- PWA score > 90

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── FitToWorkForm/   # Fit To Work forms
│   ├── Take5Form/       # Take 5 forms
│   ├── HazardForm/      # Hazard forms
│   ├── tasklistForms/   # Tasklist forms
│   └── MonitoringPage/  # Dashboard components
├── config/             # Configuration files
├── utils/              # Utility functions
├── supabaseClient.js   # Supabase configuration
└── App.jsx            # Main application
```

## 🔧 Configuration

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### PWA Configuration

- `public/manifest.json`: PWA manifest
- `public/sw.js`: Service worker
- `public/create-icons.html`: Icon generator

## 📊 Database Schema

### Tables

- `users`: User management
- `fit_to_work`: Fit To Work reports
- `take_5`: Take 5 assessments
- `hazard_report`: Hazard reports
- `tasklist`: Task management

## 🧪 Testing

### PWA Testing

```bash
# Test PWA features
npm run build
npx serve dist
# Open in browser and test:
# - Install prompt
# - Offline mode
# - Background sync
```

### Lighthouse Testing

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --view
```

## 🔒 Security

- **HTTPS Required**: Semua deployment harus HTTPS
- **Data Encryption**: Data dienkripsi di transit dan storage
- **Authentication**: Supabase Auth integration
- **Authorization**: Role-based access control

## 📈 Performance

- **Lighthouse Score**: > 90
- **First Contentful Paint**: < 3s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [PWA_README.md](PWA_README.md)
- **Deployment Guide**: [deploy-to-github.md](deploy-to-github.md)
- **Issues**: [GitHub Issues](https://github.com/username/aegis-kmb-pwa/issues)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Framework
- [Vite](https://vitejs.dev/) - Build Tool
- [Supabase](https://supabase.com/) - Backend as a Service
- [PWA](https://web.dev/progressive-web-apps/) - Progressive Web Apps

---

**Made with ❤️ for Safety Management**

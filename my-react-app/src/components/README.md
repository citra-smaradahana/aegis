# Struktur Komponen - Desktop & Mobile Separation

## Overview

Komponen telah dipisahkan menjadi versi desktop dan mobile untuk memastikan perubahan pada satu tampilan tidak mempengaruhi tampilan lainnya.

## Struktur Folder

### 1. HazardForm/

- `index.jsx` - Komponen utama yang memilih antara desktop/mobile berdasarkan ukuran layar
- `HazardFormDesktop.jsx` - Versi desktop dengan layout dan styling khusus desktop
- `HazardFormMobile.jsx` - Versi mobile dengan layout dan styling khusus mobile

### 2. FitToWorkForm/

- `index.jsx` - Komponen utama yang memilih antara desktop/mobile berdasarkan ukuran layar
- `FitToWorkFormDesktop.jsx` - Versi desktop dengan layout dan styling khusus desktop
- `FitToWorkFormMobile.jsx` - Versi mobile dengan layout dan styling khusus mobile

### 3. Take5Form/

- `index.jsx` - Komponen utama yang memilih antara desktop/mobile berdasarkan ukuran layar
- `Take5FormDesktop.jsx` - Versi desktop dengan layout dan styling khusus desktop
- `Take5FormMobile.jsx` - Versi mobile dengan layout dan styling khusus mobile

### 4. TasklistPage/

- `index.jsx` - Komponen utama yang memilih antara desktop/mobile berdasarkan ukuran layar
- `TasklistPageDesktop.jsx` - Versi desktop dengan tabel dan sidebar detail panel
- `TasklistPageMobile.jsx` - Versi mobile dengan tab navigation dan card layout

## Cara Kerja

### Komponen Index

Setiap folder memiliki file `index.jsx` yang:

1. Mendeteksi ukuran layar (breakpoint: 768px)
2. Memilih komponen yang sesuai (desktop atau mobile)
3. Menangani event resize untuk switching dinamis

### Breakpoint

- **Desktop**: > 768px
- **Mobile**: ≤ 768px

## Keuntungan

1. **Pemisahan yang Bersih**: Desktop dan mobile benar-benar terpisah
2. **Maintenance Mudah**: Perubahan di desktop tidak mempengaruhi mobile
3. **Performance**: Hanya load komponen yang diperlukan
4. **Flexibility**: Bisa memiliki fitur berbeda untuk desktop dan mobile

## Penggunaan

Import tetap sama seperti sebelumnya:

```jsx
import HazardForm from "./components/HazardForm";
import FitToWorkForm from "./components/FitToWorkForm";
import Take5Form from "./components/Take5Form";
import TasklistPage from "./components/TasklistPage";
```

Komponen index akan otomatis memilih versi yang tepat berdasarkan ukuran layar.

## File Lama

File lama masih ada untuk backup:

- `HazardForm.jsx` (original)
- `FitToWorkForm.jsx` (original)
- `Take5Form.jsx` (original)
- `TasklistPage.jsx` (original)

Bisa dihapus setelah memastikan komponen baru berfungsi dengan baik.

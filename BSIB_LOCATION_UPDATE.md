# Update LocationDetailSelector untuk Site BSIB

## Perubahan yang Dilakukan

### 1. LocationDetailSelector.jsx

- **Desktop**: Ketika Site BSIB terpilih, Detail Lokasi akan menampilkan dropdown dengan opsi:

  - Office
  - Workshop
  - OSP
  - PIT A
  - PIT C
  - PIT E
  - Candrian
  - HLO

- **Mobile**: Ketika Site BSIB terpilih, Detail Lokasi akan membuka halaman baru dengan menu yang sama seperti desktop

### 2. siteLocations.js

- Diperbarui konfigurasi BSIB untuk menghapus "Lainnya" dan mengurutkan ulang lokasi sesuai permintaan

## Cara Kerja

1. **Deteksi Device**: Komponen menggunakan `window.innerWidth <= 768` untuk mendeteksi mobile/desktop
2. **Desktop BSIB**: Menampilkan dropdown HTML native dengan styling yang konsisten
3. **Mobile BSIB**: Menampilkan halaman full-screen dengan navigasi yang sama seperti komponen mobile lainnya
4. **Site Lain**: Tetap menggunakan behavior yang sudah ada sebelumnya

## Implementasi

- Menggunakan `useState` untuk state mobile detection
- Menggunakan `useEffect` untuk listen resize event
- Conditional rendering berdasarkan site dan device type
- Mempertahankan semua props dan styling yang sudah ada

## Testing

Untuk test implementasi:

1. Pilih Site BSIB
2. Coba pada desktop (dropdown akan muncul)
3. Coba pada mobile atau resize browser ke mobile width (halaman baru akan muncul)
4. Pastikan site lain tetap berfungsi normal

# Mobile Dropdown Components

Komponen ini dibuat untuk mengganti tampilan dropdown overlay yang kurang user-friendly pada mobile dengan halaman pilihan yang lebih baik.

## Komponen yang Dibuat

### 1. SiteSelectionPage.jsx

Halaman full-screen untuk memilih site/lokasi dengan tampilan yang lebih baik:

- Header dengan tombol kembali
- List site dengan radio button selection
- Footer dengan tombol konfirmasi
- Animasi hover dan selection

### 2. MobileSiteSelector.jsx

Wrapper component yang mengganti dropdown dengan halaman pilihan:

- Tampilan seperti input field dengan icon dropdown
- Ketika diklik, membuka SiteSelectionPage
- Mendukung disabled state dan styling custom

### 3. LocationDetailSelector.jsx

Komponen untuk memilih detail lokasi berdasarkan site yang dipilih:

- Menggunakan data dari `siteLocations.js`
- Halaman pilihan terpisah untuk detail lokasi
- Mendukung custom input untuk site tertentu

### 4. PICSelector.jsx

Komponen untuk memilih PIC (Person In Charge) dengan fitur search:

- Fetch data PIC berdasarkan site yang dipilih
- Fitur search untuk mencari berdasarkan nama atau jabatan
- Halaman pilihan terpisah dengan interface yang konsisten
- Menampilkan nama dan jabatan PIC

## Cara Penggunaan

### Untuk Site Selection:

```jsx
import MobileSiteSelector from "../MobileSiteSelector";

<MobileSiteSelector
  value={form.lokasi}
  onChange={handleChange}
  placeholder="Pilih Lokasi"
  disabled={!!selectedTake5}
  style={getFieldBorderStyle("lokasi")}
  required
/>;
```

### Untuk Detail Location:

```jsx
import LocationDetailSelector from "../LocationDetailSelector";

<LocationDetailSelector
  site={form.lokasi}
  value={form.detailLokasi}
  onChange={handleDetailLokasiChange}
  placeholder="Pilih Detail Lokasi"
  disabled={!!selectedTake5 || !form.lokasi}
  style={getFieldBorderStyle("detailLokasi")}
  required
/>;
```

### Untuk PIC Selection:

```jsx
import PICSelector from "../PICSelector";

<PICSelector
  value={form.pic}
  onChange={handleChange}
  placeholder="Pilih PIC"
  site={form.lokasi}
  style={getFieldBorderStyle("pic")}
  required
/>;
```

## Form yang Sudah Diupdate

1. **HazardFormMobile.jsx** - Menggunakan MobileSiteSelector, LocationDetailSelector, dan PICSelector
2. **Take5FormMobile.jsx** - Menggunakan MobileSiteSelector dan LocationDetailSelector
3. **MonitoringPage.jsx** - Menggunakan CUSTOM_INPUT_SITES untuk konsistensi

## Keuntungan

1. **UX yang Lebih Baik**: Tidak ada lagi overlay dropdown yang menutupi konten
2. **Navigasi yang Jelas**: Header dengan tombol kembali yang jelas
3. **Selection yang Mudah**: Radio button yang jelas untuk pilihan
4. **Konsistensi**: Menggunakan data dari `siteLocations.js` untuk konsistensi
5. **Responsive**: Tampilan yang optimal untuk mobile
6. **Tidak Ada Zoom**: Mencegah zoom otomatis pada mobile saat double-tap

## Pencegahan Zoom pada Mobile

### Meta Tag Viewport

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
```

### CSS untuk Mencegah Zoom

- Font size minimum 16px untuk input fields
- `-webkit-appearance: none` untuk menghilangkan styling default
- `touch-action: manipulation` untuk mencegah double-tap zoom
- `-webkit-tap-highlight-color: transparent` untuk menghilangkan highlight tap

### Class CSS yang Ditambahkan

- `.mobile-dropdown` - Untuk komponen dropdown mobile
- `.site-selector` - Untuk selector site
- `.location-selector` - Untuk selector detail lokasi
- `.pic-selector` - Untuk selector PIC
- `.clickable` - Untuk elemen yang dapat diklik

## Data Source

Semua komponen menggunakan data dari `src/config/siteLocations.js`:

- `CUSTOM_INPUT_SITES` untuk daftar site
- `getLocationOptions(site)` untuk detail lokasi berdasarkan site
- `allowsCustomInput(site)` untuk mengecek apakah site mendukung input custom

# UI Component Library & Design System
## Aplikasi Kasir Toko Sembako

> Panduan dokumentasi lengkap pustaka komponen UI, design tokens, standar aksesibilitas, dan tata letak visual aplikasi Kasir Toko Sembako.
> Dibuat mengacu pada standar Anti-Slop (WCAG AA, responsif, hemat elemen, dial ENERGY 2 / RHYTHM 2 / MOTION 1).

---

## 1. Global & Design Tokens

### A. Color Palette (Minimalist Red Theme)
- **Primary Red 600 (`#DC2626`)**: Warna utama aksi, navigasi aktif, brand highlight, tombol CTA.
- **Primary Dark 700 (`#B91C1C`)**: State hover pada tombol primer dan banner gradien.
- **Deep Crimson 900 (`#7F1D1D`)**: Teks kontras tinggi dan batas aksen.
- **Red Soft 50 (`#FEF2F2`)**: Latar belakang kartu penekanan, status badge, dan highlight.
- **Surface Dark 950 (`#020617`)**: Latar belakang sidebar navigasi desktop dan mobile drawer.
- **Surface Light 50 (`#F8FAFC`)**: Latar belakang utama area aplikasi.
- **Card Background (`#FFFFFF`)**: Permukaan kartu konten dengan border tipis `border-slate-200/80`.
- **Status Semantic**:
  - **Success (`#16A34A` / `emerald-600`)**: Sukses simpan, transaksi selesai, stok aman.
  - **Warning (`#D97706` / `amber-600`)**: Stok menipis, barang belum terdaftar, konfirmasi aksi.
  - **Danger (`#DC2626` / `rose-600`)**: Stok habis, hapus data, logout, error API.

### B. Typography & Font System
- **Primary Font Family**: `Inter`, `Google Sans`, `system-ui`, sans-serif.
- **Monospace Font (Angka & Kode)**: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Anonymous Pro` (digunakan pada kode barang, barcode, nomor struk, dan angka kalkulator).
- **Scale**:
  - Display / Hero: `2rem - 2.5rem` (font-extrabold / font-black)
  - Heading 1: `1.5rem - 1.875rem` (font-bold)
  - Heading 2: `1.25rem` (font-bold)
  - Body Text: `0.875rem (14px)` (font-normal / font-medium)
  - Caption / Label: `0.75rem (12px)` (font-semibold)
  - Micro / Pill: `0.625rem (10px)` (font-bold)

---

## 2. Common Component Catalog

### 1. Button (`src/components/common/Button.jsx`)
- **Variants**:
  - `primary`: `bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20`
  - `secondary`: `bg-slate-900 hover:bg-slate-800 text-white`
  - `outline`: `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`
  - `ghost`: `text-slate-600 hover:bg-slate-100 hover:text-slate-900`
  - `danger`: `bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20`
- **Sizes**: `sm` (px-2.5 py-1 text-xs), `md` (px-4 py-2 text-sm), `lg` (px-5 py-2.5 text-base)
- **Features**: Mendukung prop `icon`, `isLoading` (dengan spinner internal), dan `disabled`.

### 2. Input Fields (`src/components/common/Input.jsx`)
- **Fitur**: Label eksplisit, tanda bintang required merah, ikon pendukung kiri, elemen tombol kanan (misal: tombol Scan Kamera), focus ring merah `focus:ring-2 focus:ring-red-100 focus:border-red-500`, pesan helper, dan pesan error validasi.

### 3. Currency Input (`src/components/common/CurrencyInput.jsx`)
- **Fitur**: Prefix statis `Rp`, pemisah ribuan otomatis dengan titik, parsing nilai numerik instan ke parent component, dan seleksi nilai saat focus.

### 4. Dropdown Select (`src/components/common/Select.jsx`)
- **Fitur**: Opsi terstruktur `{ value, label }`, placeholder default, border rounded-xl, state disabled, dan helper text.

### 5. Textarea (`src/components/common/Textarea.jsx`)
- **Fitur**: Multiline text input, pengaturan jumlah baris (`rows`), resize dinonaktifkan untuk kerapian layout.

### 6. Selection Controls (`Checkbox.jsx`, `Radio.jsx`, `ToggleSwitch.jsx`)
- **Checkbox**: Kotak centang dengan warna aktif merah `text-red-600 focus:ring-red-500`.
- **Radio**: Pilihan tunggal dengan deskripsi baris kedua.
- **Toggle Switch**: Saklar iOS style dengan latar belakang merah saat aktif `peer-checked:bg-red-600`.

### 7. Badges & Indicators (`Badge.jsx`, `StatusBadge.jsx`, `StockBadge.jsx`)
- **Badge**: Badge serbaguna dengan dot indicator (varian: `primary`, `secondary`, `success`, `warning`, `danger`, `neutral`).
- **StatusBadge**: Khusus menampilkan status aktif/nonaktif, status registrasi barang, dan alur konversi barang belum terdaftar.
- **StockBadge**: Menghitung stok aman (hijau), stok menipis (kuning), dan stok habis (merah).

### 8. Modal & Confirm Dialog (`Modal.jsx`, `ConfirmDialog.jsx`)
- **Modal**: Backdrop blur halus `bg-black/50 backdrop-blur-xs`, animasi masuk, header dengan tombol tutup silang, dan pembatasan lebar (`max-w-md`, `max-w-2xl`, `max-w-4xl`).
- **ConfirmDialog**: Dialog konfirmasi destruktif/penting dengan pilihan tipe `warning`, `danger`, `info`, `success`.

### 9. Alert & Notification (`Alert.jsx`, `Toast.jsx`)
- **Alert**: Kotak informasi inline dengan varian `info`, `success`, `warning`, `danger` serta opsi tombol dismiss.
- **Toast**: Pemberitahuan melayang di kanan bawah layar dengan auto-dismiss berdurasi 3 detik.

### 10. Navigation Helpers (`Breadcrumbs.jsx`, `Pagination.jsx`, `Tabs.jsx`)
- **Breadcrumbs**: Panduan rekam jejak navigasi halaman hierarkis.
- **Pagination**: Penomoran halaman dinamis dengan tombol prev/next dan indikator elipsis `...`.
- **Tabs**: Tab switcher dengan pill aktif putih berbayang halus dan badge kuantitas item.

### 11. Feedback Helpers (`EmptyState.jsx`, `LoadingSpinner.jsx`, `Tooltip.jsx`, `Avatar.jsx`)
- **EmptyState**: Penanda konten kosong dengan ikon ramah, judul, deskripsi, dan tombol aksi pembuat pertama.
- **LoadingSpinner**: Animasi putar elegan dengan aksen border merah menyala.
- **Tooltip**: Label bantuan melayang saat hover kursor.
- **Avatar**: Inisial huruf tebal atau foto profil dengan indikator dot peran (role).

---

## 3. Section Matrix & Screen Implementations

| No | Modul / Komponen | File Implementasi | Deskripsi UI |
|---|---|---|---|
| 1 | **Global UI Library** | `src/components/common/*` | Koleksi seluruh elemen input, button, badge, dan modal dasar. |
| 2 | **Autentikasi** | `src/pages/auth/LoginPage.jsx` | Form login minimalis, 1-klik akun demo, tab switch peran, dan proteksi sesi. |
| 3 | **Navigasi Sidebar** | `src/layouts/OwnerLayout.jsx` & `CashierLayout.jsx` | Sidebar obsidian gelap, logo merah, menu navigasi, kartu profil di bawah, dan tombol logout. |
| 4 | **Dashboard Pemilik** | `src/pages/owner/OwnerDashboard.jsx` | Banner gradien merah, 4 kartu metrik utama, grafik batang penjualan, dan ranking produk. |
| 5 | **Dashboard Kasir** | `src/pages/cashier/CashierDashboard.jsx` | Ringkasan penjualan kasir yang sedang bertugas dan shortcut cepat menuju POS. |
| 6 | **Data Master Barang** | `src/pages/owner/products/*` | Tabel produk lengkap dengan barcode, modal tambah/ubah dengan kamera scanner. |
| 7 | **Kategori Barang** | `src/pages/owner/categories/*` | Manajemen kategori pengelompokan produk sembako. |
| 8 | **Satuan Barang** | `src/pages/owner/units/*` | Pengaturan takaran satuan (Kg, Pcs, Liter) dengan toggle desimal. |
| 9 | **Daftar & Cek Harga** | `src/pages/prices/PriceListPage.jsx` | Mesin pencarian harga cepat tanpa login untuk kasir dan pelanggan. |
| 10 | **Barang Belum Terdaftar** | `src/pages/owner/unregistered/*` | Perekaman harga sementara yang langsung dapat dikonversi ke Master Produk. |
| 11 | **Riwayat Perubahan Harga** | `src/pages/owner/products/ProductDetailPage.jsx` | Log pencatatan otomatis database saat terjadi penyesuaian harga jual. |
| 12 | **Terminal Kasir / POS** | `src/pages/pos/POSPage.jsx` | Grid produk, filter kategori, panel keranjang dinamis, kalkulator desimal. |
| 13 | **Scanner Barcode Kamera** | `src/components/pos/BarcodeScannerModal.jsx` | Pemindai barcode video real-time via kamera HP atau webcam. |
| 14 | **Pembayaran Kasir** | `src/components/pos/PaymentModal.jsx` | Input uang diterima, tombol nominal cepat, metode pembayaran, hitung kembalian. |
| 15 | **Feedback Sukses POS** | `src/components/pos/TransactionSuccessModal.jsx` | Dialog nota selesai, kembalian, dan shortcut cetak struk atau transaksi baru. |
| 16 | **Kalkulator Cepat** | `src/pages/calculator/QuickCalculatorPage.jsx` | Alat hitung cepat belanja manual dan kembalian tanpa merusak stok. |
| 17 | **Riwayat Transaksi** | `src/pages/transactions/TransactionListPage.jsx` | Daftar seluruh faktur penjualan dengan filter tanggal dan kasir. |
| 18 | **Detail Faktur** | `src/pages/transactions/TransactionDetailPage.jsx` | Rincian lengkap item transaksi, metode bayar, dan data kasir. |
| 19 | **Struk Thermal** | `src/pages/transactions/ReceiptPrintPage.jsx` | Format cetak struk printer kasir 58mm / 80mm yang hemat kertas. |
| 20 | **Closing Kasir** | `src/pages/closing/ClosingPage.jsx` | Rekonsiliasi fisik uang tunai di laci kasir terhadap catatan sistem. |
| 21 | **Laporan Penjualan** | `src/pages/owner/ReportPage.jsx` | Analisis omzet, laba kotor, performa kasir, dan ekspor data CSV. |
| 22 | **Manajemen Kasir** | `src/pages/owner/users/UserListPage.jsx` | Tambah kasir baru, reset kata sandi, dan saklar status akses. |
| 23 | **Showcase Design System** | `src/pages/owner/components/UIComponentShowcasePage.jsx` | Halaman interaktif untuk memvalidasi dan menguji semua komponen UI. |

---

## 4. Standar Kualitas Anti-Slop

1. **Kejujuran Data & Konten**: Tidak menggunakan data statistik fiktif, avatar AI palsu, atau testimoni buatan (mematuhi R-17, R-18, R-36, R-38).
2. **Kontras & Keterbacaan (WCAG AA)**: Seluruh teks pada tombol, badge, dan background memenuhi rasio kontras minimal 4.5:1 (R-25).
3. **Aksesibilitas Keyboard**: Semua dialog dapat ditutup dengan `Escape`, formulir dapat diisi dengan `Tab`, dan tombol dapat dipicu dengan `Enter`/`Space` (R-32).
4. **Responsivitas Mobile**: Ukuran tombol minimal 44px (touch target), tidak ada elemen overflow horizontal, serta drawer navigasi yang mulus (R-03).
5. **Set Dials Desain**:
   - **ENERGY: 2 (Balanced)**
   - **RHYTHM: 2 (Consistent dengan penekanan terarah)**
   - **MOTION: 1 (Fungsional, transisi halus tanpa animasi berlebihan)**

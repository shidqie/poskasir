# *TECHNICAL REQUIREMENTS DOCUMENT (TRD)*

## Aplikasi Kasir Toko Sembako

---

# 1. Tujuan Dokumen

Dokumen ini mendefinisikan kebutuhan teknis untuk pembangunan Aplikasi Kasir Toko Sembako.

Aplikasi memiliki fungsi utama untuk:

1. Menampilkan harga barang dengan cepat.
2. Mencari barang berdasarkan nama.
3. Membaca *barcode* bawaan produk menggunakan kamera HP.
4. Menyimpan harga barang yang sebelumnya belum terdaftar.
5. Melakukan transaksi penjualan.
6. Menghitung jumlah barang secara otomatis.
7. Menghitung total belanja.
8. Menghitung uang kembalian.
9. Menyediakan Kalkulator Cepat yang tidak terhubung dengan transaksi.
10. Menyimpan riwayat transaksi.
11. Mengelola stok.
12. Menghitung pendapatan harian.
13. Melakukan tutup kasir.
14. Menampilkan laporan penjualan.

---

# 2. Arsitektur Sistem

Aplikasi menggunakan arsitektur:

**React → Supabase → PostgreSQL**

dan:

**GitHub → Vercel**

Struktur teknis:

```text
Pengguna
   │
   ▼
React Web Application
   │
   ├── POS
   ├── Scan Barcode
   ├── Daftar Harga
   ├── Kalkulator Cepat
   ├── Dashboard
   └── Laporan
   │
   ▼
Supabase JavaScript SDK
   │
   ├── Supabase Auth
   ├── Data API
   ├── Database RPC
   └── Row Level Security
   │
   ▼
PostgreSQL Database
```

Aplikasi tidak menggunakan:

* Laravel
* PHP
* MySQL
* *Backend server* terpisah

---

# 3. Teknologi Utama

## *Frontend*

* React
* Vite
* JavaScript
* Tailwind CSS
* React Router
* Zustand
* TanStack Query
* Supabase JavaScript SDK

## *Backend Service*

* Supabase

## *Database*

* PostgreSQL melalui Supabase

## Autentikasi

* Supabase Auth

## Keamanan Data

* PostgreSQL *Row Level Security* (RLS)
* Supabase Auth
* PostgreSQL *grants*

## Penyimpanan Transaksi

* PostgreSQL *Database Function / RPC*

## *Deployment*

* Vercel

## *Repository*

* GitHub

---

# 4. Arsitektur Aplikasi

Aplikasi dibagi menjadi beberapa modul:

```text
Authentication
Dashboard
Products
Categories
Units
Price Lookup
Unregistered Prices
Barcode Scanner
Point of Sale
Cart
Payment
Quick Calculator
Transactions
Inventory
Cash Closing
Reports
User Management
Settings
```

---

# 5. Struktur Proyek React

```text
src/
│
├── assets/
│
├── components/
│   ├── common/
│   ├── dashboard/
│   ├── products/
│   ├── barcode/
│   ├── pos/
│   ├── calculator/
│   ├── transactions/
│   └── reports/
│
├── features/
│   ├── auth/
│   ├── products/
│   ├── prices/
│   ├── scanner/
│   ├── cart/
│   ├── checkout/
│   ├── transactions/
│   └── closing/
│
├── hooks/
│
├── layouts/
│   ├── OwnerLayout.jsx
│   └── CashierLayout.jsx
│
├── lib/
│   └── supabase.js
│
├── pages/
│   ├── auth/
│   ├── owner/
│   └── cashier/
│
├── routes/
│
├── services/
│
├── stores/
│   ├── authStore.js
│   └── cartStore.js
│
├── utils/
│   ├── currency.js
│   ├── calculation.js
│   └── barcode.js
│
├── App.jsx
└── main.jsx
```

Selain itu:

```text
supabase/
│
├── migrations/
├── functions/
└── seed.sql
```

---

# 6. Hak Akses

Sistem memiliki dua *role* utama:

```text
owner
cashier
```

## Pemilik

Dapat:

* Melihat seluruh transaksi.
* Melihat seluruh laporan.
* Menambah barang.
* Mengubah barang.
* Mengubah harga.
* Mengelola kategori.
* Mengelola satuan.
* Melihat stok.
* Melakukan penyesuaian stok.
* Melihat barang belum terdaftar.
* Mengubah barang belum terdaftar menjadi Data Barang.
* Mengelola akun Kasir.
* Melihat seluruh hasil tutup kasir.

## Kasir

Dapat:

* Melakukan transaksi.
* Mencari harga barang.
* Scan *barcode*.
* Menambahkan harga sementara.
* Menggunakan Kalkulator Cepat.
* Melihat transaksi sendiri.
* Melakukan tutup kasir.

Kasir tidak dapat mengubah harga Data Barang resmi tanpa hak Pemilik.

---

# 7. Autentikasi

Autentikasi menggunakan Supabase Auth.

Data login:

```text
email
password
```

Alur:

```text
Login
  ↓
Supabase Auth
  ↓
Validasi pengguna
  ↓
Session dibuat
  ↓
Ambil profile
  ↓
Baca role
  ↓
Redirect
```

Jika:

```text
role = owner
```

maka diarahkan ke:

```text
/owner/dashboard
```

Jika:

```text
role = cashier
```

maka diarahkan ke:

```text
/cashier/dashboard
```

---

# 8. Struktur Route

## Umum

```text
/login
```

## Pemilik

```text
/owner/dashboard
/owner/products
/owner/products/new
/owner/products/:id
/owner/categories
/owner/units
/owner/prices
/owner/unregistered-products
/owner/transactions
/owner/transactions/:id
/owner/reports
/owner/closings
/owner/users
/owner/settings
```

## Kasir

```text
/cashier/dashboard
/pos
/price-list
/quick-calculator
/transactions
/transactions/:id
/closing
```

---

# 9. Database Utama

Database memiliki tabel:

```text
profiles
categories
units
products
unregistered_prices
transactions
transaction_items
stock_movements
cash_closings
product_price_history
settings
```

---

# 10. Tabel Profiles

Menyimpan informasi pengguna setelah akun dibuat melalui Supabase Auth.

```text
profiles
```

| Kolom      | Tipe        |
| ---------- | ----------- |
| id         | UUID PK     |
| full_name  | VARCHAR     |
| role       | VARCHAR     |
| status     | BOOLEAN     |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

`id` mengacu pada:

```text
auth.users.id
```

Nilai `role`:

```text
owner
cashier
```

---

# 11. Tabel Categories

```text
categories
```

| Kolom      | Tipe        |
| ---------- | ----------- |
| id         | UUID PK     |
| name       | VARCHAR     |
| status     | BOOLEAN     |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Contoh:

```text
Sembako
Mie Instan
Minuman
Makanan Ringan
Sabun
Bumbu
Rokok
Kebutuhan Rumah Tangga
Lainnya
```

---

# 12. Tabel Units

Digunakan karena barang sembako dapat dijual dalam satuan berbeda.

```text
units
```

| Kolom         | Tipe        |
| ------------- | ----------- |
| id            | UUID PK     |
| name          | VARCHAR     |
| symbol        | VARCHAR     |
| allow_decimal | BOOLEAN     |
| created_at    | TIMESTAMPTZ |

Contoh:

```text
Pcs
Bungkus
Botol
Dus
Kg
Gram
Liter
Ml
Sachet
```

`allow_decimal` digunakan untuk menentukan apakah barang dapat menggunakan jumlah pecahan.

Contoh:

```text
Kg = true
Pcs = false
```

Sehingga sistem dapat mendukung:

```text
Beras = 1.5 Kg
```

tetapi tidak:

```text
Indomie = 1.5 Pcs
```

---

# 13. Tabel Products

```text
products
```

| Kolom         | Tipe                |
| ------------- | ------------------- |
| id            | UUID PK             |
| code          | VARCHAR UNIQUE      |
| barcode       | VARCHAR UNIQUE NULL |
| name          | VARCHAR             |
| category_id   | UUID FK             |
| unit_id       | UUID FK             |
| selling_price | NUMERIC(14,2)       |
| stock         | NUMERIC(14,3)       |
| minimum_stock | NUMERIC(14,3) NULL  |
| status        | BOOLEAN             |
| created_by    | UUID                |
| created_at    | TIMESTAMPTZ         |
| updated_at    | TIMESTAMPTZ         |

Barcode disimpan menggunakan tipe teks, bukan angka.

Hal ini dilakukan karena nilai *barcode* adalah identitas, bukan nilai yang akan dihitung.

Barcode bersifat:

```text
NULLABLE
```

karena tidak semua barang memiliki *barcode*.

---

# 14. Contoh Data Products

```text
Nama        : Indomie Goreng
Barcode     : 8996001301057
Harga       : 3500
Satuan      : Pcs
Stok        : 50
```

Barang tanpa barcode:

```text
Nama        : Beras Ramos
Barcode     : NULL
Harga       : 15000
Satuan      : Kg
Stok        : 30.500
```

---

# 15. Daftar Harga Barang Belum Terdaftar

Tabel:

```text
unregistered_prices
```

digunakan untuk barang yang sudah diketahui harganya tetapi belum memiliki Data Barang lengkap.

Struktur:

| Kolom                | Tipe                |
| -------------------- | ------------------- |
| id                   | UUID PK             |
| barcode              | VARCHAR UNIQUE NULL |
| name                 | VARCHAR             |
| selling_price        | NUMERIC(14,2)       |
| unit_name            | VARCHAR NULL        |
| notes                | TEXT NULL           |
| status               | VARCHAR             |
| created_by           | UUID                |
| converted_product_id | UUID NULL           |
| created_at           | TIMESTAMPTZ         |
| updated_at           | TIMESTAMPTZ         |

Status:

```text
pending
converted
inactive
```

---

# 16. Fungsi Daftar Harga Belum Terdaftar

Contoh Kasir menemukan barang baru.

Kasir scan *barcode*.

Hasil:

```text
8991234567890
```

Database tidak menemukan produk.

Kasir memasukkan:

```text
Nama  : Kopi ABC Susu
Harga : Rp2.500
```

Data disimpan ke:

```text
unregistered_prices
```

Pada pencarian berikutnya harga tersebut sudah dapat ditemukan.

---

# 17. Konversi Menjadi Data Barang

Pemilik dapat memilih:

**Jadikan Data Barang**

Data dari:

```text
unregistered_prices
```

digunakan untuk mengisi:

```text
products
```

Pemilik melengkapi:

* Kategori
* Satuan
* Stok
* Kode barang

Setelah berhasil:

```text
status = converted
```

dan:

```text
converted_product_id = products.id
```

---

# 18. Pencarian Harga

Fungsi pencarian harga harus mencari data dengan urutan:

```text
products
↓
unregistered_prices
```

Jika ditemukan di `products`:

```text
Status: Terdaftar
```

Jika ditemukan di `unregistered_prices`:

```text
Status: Belum Terdaftar
```

---

# 19. Scan Barcode Melalui Kamera HP

Pemindaian menggunakan kamera perangkat.

Kasir memilih:

**Scan Barcode**

Aplikasi meminta izin penggunaan kamera.

Kemudian menggunakan kamera belakang HP sebagai kamera utama.

Prioritas kamera:

```text
facingMode = environment
```

Format utama yang perlu didukung:

```text
EAN-13
EAN-8
UPC-A
UPC-E
Code 128
```

karena format tersebut umum digunakan pada produk ritel.

---

# 20. Strategi Scanner Barcode

Aplikasi tidak boleh hanya bergantung pada API `BarcodeDetector` bawaan browser karena dukungannya belum merata.

Implementasi harus menyediakan:

```text
Native BarcodeDetector jika tersedia
+
fallback barcode decoder berbasis JavaScript/WASM
```

Dengan demikian pemindaian tetap dapat berjalan pada lebih banyak browser HP.

---

# 21. Alur Scanner

```text
Buka Scanner
     ↓
Minta Permission Kamera
     ↓
Kamera Aktif
     ↓
Deteksi Barcode
     ↓
Barcode ditemukan
     ↓
Stop Scanner Sementara
     ↓
Cari barcode di products
```

Jika ditemukan:

```text
Tambah barang ke keranjang
```

Jika tidak:

```text
Cari di unregistered_prices
```

Jika tetap tidak ditemukan:

```text
Barang Belum Terdaftar
```

---

# 22. Barcode Barang Terdaftar

Contoh:

```text
Scan
↓
8996001301057
↓
products.barcode ditemukan
↓
Indomie Goreng
Rp3.500
```

Kemudian:

```text
quantity + 1
```

Jika barang belum ada di keranjang:

```text
quantity = 1
```

---

# 23. Barcode Belum Terdaftar

Jika tidak ditemukan:

```text
Barcode 899XXXXXXXXXX
belum terdaftar
```

Tampilkan tombol:

```text
Tambah Harga
Tambah Barang
Batal
```

Jika Kasir hanya mengetahui harga:

```text
Tambah Harga
```

Jika Pemilik ingin langsung melengkapi:

```text
Tambah Barang
```

---

# 24. Barang Tanpa Barcode

Untuk:

* Beras
* Telur
* Gula curah
* Minyak curah
* Barang kiloan
* Barang repack

Kasir menggunakan:

```text
Search by Name
```

Pencarian harus mendukung pencarian sebagian.

Contoh:

```text
"beras"
```

menghasilkan:

```text
Beras Ramos
Beras Setra Ramos
Beras Pandan Wangi
```

---

# 25. Keranjang POS

State keranjang dikelola menggunakan Zustand.

Struktur:

```text
cartItems = [
  {
    sourceType,
    productId,
    temporaryPriceId,
    name,
    price,
    unit,
    quantity,
    subtotal
  }
]
```

`sourceType`:

```text
product
temporary
```

---

# 26. Barang Sementara dalam Transaksi

Barang dari `unregistered_prices` dapat digunakan sebagai barang sementara agar transaksi tidak terhambat.

Jika digunakan:

```text
product_id = NULL
```

dan:

```text
temporary_price_id = unregistered_prices.id
```

Barang tersebut:

* Tetap dihitung dalam transaksi.
* Tetap masuk pendapatan.
* Tidak mengurangi stok karena belum memiliki data stok resmi.
* Ditandai sebagai barang belum terdaftar.

---

# 27. Menambahkan Barang

Barang dapat ditambahkan melalui:

```text
Klik produk
Cari nama
Scan barcode
```

Jika produk sudah ada di keranjang:

```text
quantity = quantity + 1
```

Tidak membuat baris baru.

---

# 28. Perhitungan Keranjang

Perhitungan dilakukan langsung di React.

Formula:

```text
subtotal = price × quantity
```

Total:

```text
totalAmount = SUM(subtotal)
```

Jumlah:

```text
totalQuantity = SUM(quantity)
```

Contoh:

```text
Indomie
3 × Rp3.500
= Rp10.500

Aqua
2 × Rp4.000
= Rp8.000

Total
= Rp18.500
```

---

# 29. Quantity Desimal

Untuk barang tertentu:

```text
Beras
Telur
Gula
```

dapat digunakan nilai:

```text
0.5
1.25
2.5
```

jika satuannya mengizinkan pecahan.

Validasi:

```text
units.allow_decimal = true
```

Untuk barang `Pcs`:

```text
1
2
3
```

tanpa pecahan.

---

# 30. Kalkulator Cepat

Kalkulator Cepat merupakan fitur lokal pada React.

Tidak menggunakan database.

Tidak menjalankan proses:

```text
INSERT
UPDATE
RPC
```

Data langsung hilang ketika di-*reset* atau halaman ditutup.

---

# 31. Hitung Barang

State:

```text
values = []
total = 0
```

Contoh input:

```text
5
3
7
2
```

Formula:

```text
total = SUM(values)
```

Hasil:

```text
17 Barang
```

Tombol:

```text
Tambah
Hapus
Reset
```

---

# 32. Hitung Kembalian Cepat

Input:

```text
totalBelanja
uangDiterima
```

Formula:

```text
kembalian =
uangDiterima - totalBelanja
```

Contoh:

```text
Total   : Rp37.500
Bayar   : Rp50.000
Kembali : Rp12.500
```

Jika kurang:

```text
Total : Rp75.000
Bayar : Rp50.000
```

hasil:

```text
Kurang Rp25.000
```

---

# 33. Nominal Cepat

Pada pembayaran POS dan Kalkulator Kembalian tersedia:

```text
Uang Pas
Rp20.000
Rp50.000
Rp100.000
```

Selain nominal tetap, aplikasi dapat menghasilkan nominal terdekat.

Contoh:

```text
Total = Rp67.500
```

Pilihan:

```text
Rp70.000
Rp100.000
Uang Pas
```

---

# 34. Tabel Transactions

```text
transactions
```

| Kolom              | Tipe           |
| ------------------ | -------------- |
| id                 | UUID PK        |
| transaction_number | VARCHAR UNIQUE |
| cashier_id         | UUID FK        |
| transaction_date   | TIMESTAMPTZ    |
| total_quantity     | NUMERIC(14,3)  |
| subtotal           | NUMERIC(14,2)  |
| total_amount       | NUMERIC(14,2)  |
| payment_amount     | NUMERIC(14,2)  |
| change_amount      | NUMERIC(14,2)  |
| payment_method     | VARCHAR        |
| status             | VARCHAR        |
| idempotency_key    | UUID UNIQUE    |
| created_at         | TIMESTAMPTZ    |

Status:

```text
completed
cancelled
```

Metode pembayaran MVP:

```text
cash
```

Struktur tetap disiapkan agar nanti dapat mendukung:

```text
qris
transfer
```

---

# 35. Transaction Items

```text
transaction_items
```

| Kolom              | Tipe          |
| ------------------ | ------------- |
| id                 | UUID PK       |
| transaction_id     | UUID FK       |
| product_id         | UUID NULL     |
| temporary_price_id | UUID NULL     |
| item_name          | VARCHAR       |
| unit_name          | VARCHAR       |
| price              | NUMERIC(14,2) |
| quantity           | NUMERIC(14,3) |
| subtotal           | NUMERIC(14,2) |
| source_type        | VARCHAR       |
| created_at         | TIMESTAMPTZ   |

Harga barang disimpan kembali pada `transaction_items`.

Dengan demikian perubahan harga produk di masa mendatang tidak mengubah transaksi lama.

---

# 36. Proses Checkout

React tidak boleh menjadi sumber final nilai transaksi.

Saat tombol:

**Selesaikan Transaksi**

ditekan, React mengirim data ke PostgreSQL Function.

Contoh:

```text
process_sale()
```

Data yang dikirim:

```text
items
payment_amount
payment_method
idempotency_key
```

---

# 37. Data Checkout

Contoh:

```json
{
  "items": [
    {
      "product_id": "uuid-product",
      "quantity": 2
    }
  ],
  "payment_amount": 50000,
  "payment_method": "cash",
  "idempotency_key": "uuid"
}
```

React tidak mengirim harga final sebagai sumber kebenaran.

---

# 38. Fungsi Process Sale

`process_sale()` bertugas:

1. Memastikan pengguna login.
2. Memastikan pengguna memiliki akses transaksi.
3. Memeriksa `idempotency_key`.
4. Mengambil barang dari database.
5. Mengambil harga terbaru.
6. Memeriksa stok.
7. Mengunci baris stok yang sedang diproses.
8. Menghitung subtotal.
9. Menghitung total.
10. Memvalidasi uang pembayaran.
11. Menghitung kembalian.
12. Membuat transaksi.
13. Membuat detail transaksi.
14. Mengurangi stok.
15. Membuat mutasi stok.
16. Mengembalikan hasil transaksi.

---

# 39. Pencegahan Transaksi Ganda

Setiap checkout membuat:

```text
idempotency_key
```

berupa UUID.

Jika Kasir menekan tombol pembayaran dua kali dengan `idempotency_key` yang sama, database tidak membuat transaksi kedua.

Selain itu tombol:

**Selesaikan Transaksi**

harus menjadi:

```text
disabled
```

selama proses checkout berjalan.

---

# 40. Validasi Stok

Untuk barang resmi:

```text
quantity <= stock
```

Jika:

```text
Stok = 3
Permintaan = 5
```

sistem menolak transaksi.

Pesan:

**Stok tidak mencukupi. Stok tersedia 3.**

---

# 41. Stock Movements

Tabel:

```text
stock_movements
```

| Kolom          | Tipe          |
| -------------- | ------------- |
| id             | UUID PK       |
| product_id     | UUID FK       |
| transaction_id | UUID NULL     |
| movement_type  | VARCHAR       |
| quantity       | NUMERIC(14,3) |
| stock_before   | NUMERIC(14,3) |
| stock_after    | NUMERIC(14,3) |
| notes          | TEXT          |
| created_by     | UUID          |
| created_at     | TIMESTAMPTZ   |

Jenis:

```text
sale
stock_in
adjustment
cancelled_sale
```

---

# 42. Nomor Transaksi

Format:

```text
TRX-YYYYMMDD-XXXX
```

Contoh:

```text
TRX-20260830-0001
TRX-20260830-0002
```

Nomor harus:

```text
UNIQUE
```

dan dibuat dari sisi database.

---

# 43. Product Price History

Tabel:

```text
product_price_history
```

| Kolom      | Tipe          |
| ---------- | ------------- |
| id         | UUID PK       |
| product_id | UUID FK       |
| old_price  | NUMERIC(14,2) |
| new_price  | NUMERIC(14,2) |
| changed_by | UUID          |
| changed_at | TIMESTAMPTZ   |

Ketika Pemilik mengubah harga:

```text
Rp3.500
→
Rp4.000
```

perubahan dicatat.

---

# 44. Pembayaran

Modal pembayaran menampilkan:

```text
Total Belanja
Uang Diterima
Nominal Cepat
Kembalian
```

Tombol:

```text
Selesaikan Transaksi
Batal
```

Validasi:

```text
payment_amount >= total_amount
```

---

# 45. Struk

Setelah transaksi berhasil, React menerima hasil checkout.

Struk berisi:

```text
Nama Toko
Nomor Transaksi
Tanggal
Waktu
Nama Kasir

Nama Barang
Quantity × Harga
Subtotal

Total Barang
Total
Bayar
Kembalian
```

Struk mendukung:

```text
58 mm
80 mm
```

Pencetakan dilakukan melalui fungsi cetak browser dengan CSS khusus cetak.

---

# 46. Cash Closing

Tabel:

```text
cash_closings
```

| Kolom             | Tipe          |
| ----------------- | ------------- |
| id                | UUID PK       |
| cashier_id        | UUID FK       |
| closing_date      | DATE          |
| transaction_count | INTEGER       |
| total_sales       | NUMERIC(14,2) |
| system_cash       | NUMERIC(14,2) |
| actual_cash       | NUMERIC(14,2) |
| difference        | NUMERIC(14,2) |
| notes             | TEXT NULL     |
| created_at        | TIMESTAMPTZ   |

---

# 47. Perhitungan Tutup Kasir

Sistem menghitung:

```text
system_cash =
SUM(total_amount)
```

untuk transaksi:

```text
payment_method = cash
status = completed
cashier_id = current cashier
tanggal = hari ini
```

Kasir memasukkan:

```text
actual_cash
```

Kemudian:

```text
difference =
actual_cash - system_cash
```

---

# 48. Status Closing

Jika:

```text
difference = 0
```

Status:

**Sesuai**

Jika:

```text
difference < 0
```

Status:

**Kurang**

Jika:

```text
difference > 0
```

Status:

**Lebih**

Contoh:

```text
Sistem : Rp3.450.000
Aktual : Rp3.440.000

Selisih:
-Rp10.000
```

---

# 49. Pendapatan Harian

Pendapatan harian:

```text
SUM(transactions.total_amount)
```

dengan:

```text
status = completed
```

dan tanggal sesuai filter.

Transaksi Kalkulator Cepat tidak ikut karena memang tidak disimpan.

---

# 50. Dashboard Pemilik

Data:

```text
Pendapatan Hari Ini
Jumlah Transaksi
Jumlah Barang Terjual
Rata-rata Transaksi
Barang Terlaris
Transaksi Terbaru
Penjualan per Kasir
```

Rumus rata-rata:

```text
averageTransaction =
totalRevenue / transactionCount
```

---

# 51. Dashboard Kasir

Menampilkan:

```text
Penjualan Saya Hari Ini
Jumlah Transaksi Saya
Barang Terjual
Transaksi Terakhir
```

Akses cepat:

```text
Mulai Transaksi
Scan Barcode
Daftar Harga
Kalkulator Cepat
```

---

# 52. Row Level Security

Semua tabel yang dapat diakses melalui Supabase Data API harus menggunakan RLS.

## Kasir

Kasir dapat:

```text
SELECT products
SELECT categories
SELECT units
SELECT unregistered_prices
SELECT own transactions
INSERT unregistered_prices
EXECUTE process_sale
INSERT own cash closing
```

Kasir tidak dapat:

```text
UPDATE product price
DELETE products
VIEW other cashier private data
UPDATE completed transaction
```

## Pemilik

Pemilik mendapatkan akses administratif sesuai kebutuhan aplikasi.

---

# 53. Keamanan RPC

Fungsi transaksi tidak boleh dapat dijalankan oleh pengguna anonim.

Hak eksekusi hanya diberikan kepada:

```text
authenticated
```

Jika fungsi menggunakan hak yang lebih tinggi untuk melakukan transaksi lintas tabel, fungsi harus:

* Memvalidasi `auth.uid()`.
* Memvalidasi *role* pengguna.
* Menggunakan `search_path` yang aman.
* Menggunakan nama schema secara eksplisit.
* Membatasi hak eksekusi fungsi.

---

# 54. Environment Variables

React:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Disimpan pada:

```text
.env.local
```

File `.env.local` tidak dimasukkan ke GitHub.

---

# 55. Key yang Dilarang pada Frontend

Tidak boleh memasukkan:

```text
service_role
secret key
database password
direct database connection string
```

ke:

```text
React source code
GitHub public repository
VITE_* environment variable
```

React hanya menggunakan Supabase *publishable key* yang akses datanya dibatasi oleh RLS.

---

# 56. Kamera dan HTTPS

Fitur kamera HP menggunakan:

```text
navigator.mediaDevices.getUserMedia()
```

Akses kamera memerlukan izin pengguna.

Pada produksi aplikasi harus berjalan melalui:

```text
HTTPS
```

Vercel menyediakan koneksi HTTPS untuk aplikasi yang telah di-*deploy*.

---

# 57. Penanganan Permission Kamera

Jika izin diberikan:

```text
Aktifkan scanner
```

Jika izin ditolak:

```text
Tidak dapat mengakses kamera.
Aktifkan izin kamera atau cari barang berdasarkan nama.
```

Jika kamera tidak tersedia:

```text
Kamera tidak tersedia pada perangkat ini.
Gunakan pencarian barang.
```

---

# 58. Scanner UX

Ketika barcode berhasil dibaca:

1. Berikan indikator suara atau getaran jika tersedia.
2. Jangan membaca barcode yang sama berulang kali dalam waktu sangat singkat.
3. Beri jeda singkat setelah hasil berhasil.
4. Tambahkan produk.
5. Aktifkan scanner kembali.

Hal ini mencegah:

```text
1 scan
```

terbaca menjadi:

```text
3 atau 4 item
```

secara tidak sengaja.

---

# 59. State Management

Zustand digunakan untuk state yang bersifat lokal dan interaktif.

Contoh:

```text
cart
scanner state
payment modal
calculator state
```

TanStack Query digunakan untuk data server:

```text
products
categories
transactions
reports
```

---

# 60. Caching Produk

Daftar produk dapat di-*cache* sementara pada sisi React untuk mempercepat pencarian.

Setelah terjadi:

```text
checkout
update product
update price
```

data terkait harus di-*invalidate* dan diambil ulang.

---

# 61. Error Handling

## Barang Tidak Ditemukan

```text
Barang belum terdaftar.
```

## Barcode Tidak Ditemukan

```text
Barcode belum terdaftar.
```

## Stok Kurang

```text
Stok tidak mencukupi.
```

## Pembayaran Kurang

```text
Pembayaran kurang RpXX.XXX.
```

## Kamera Ditolak

```text
Izin kamera diperlukan untuk scan barcode.
```

## Internet Terputus

```text
Koneksi internet terputus.
Periksa koneksi dan coba kembali.
```

## Checkout Gagal

```text
Transaksi gagal disimpan.
Data transaksi belum diproses.
Silakan coba kembali.
```

---

# 62. Kondisi Internet Terputus

MVP tidak mendukung transaksi penuh secara *offline*.

Jika internet terputus:

* Keranjang yang sedang aktif tetap disimpan sementara pada state browser.
* Kasir masih dapat melihat isi keranjang.
* Checkout dinonaktifkan.
* Sistem menampilkan status koneksi.

Setelah internet kembali:

```text
checkout
```

dapat dilakukan.

---

# 63. Responsivitas

Aplikasi mendukung:

```text
Desktop
Laptop
Tablet
Smartphone
```

## POS Desktop

Prioritas:

```text
Daftar Barang | Keranjang
```

## POS Mobile

Prioritas:

```text
Search
Scan Barcode
Cart
Payment
```

Tombol harus cukup besar untuk penggunaan layar sentuh.

---

# 64. Format Rupiah

Seluruh nilai uang ditampilkan dalam format:

```text
Rp15.000
Rp125.000
Rp1.250.000
```

Nilai database tetap disimpan sebagai angka:

```text
15000
125000
1250000
```

Format Rupiah dilakukan pada tampilan.

---

# 65. Format Waktu

Database menyimpan waktu menggunakan:

```text
TIMESTAMPTZ
```

Tampilan mengikuti zona waktu operasional toko.

Contoh:

```text
30 Agustus 2026
08:45
```

---

# 66. Index Database

Index dibuat minimal pada:

```text
products.barcode
products.name
products.code
transactions.transaction_date
transactions.cashier_id
transactions.transaction_number
transaction_items.transaction_id
unregistered_prices.barcode
unregistered_prices.name
cash_closings.cashier_id
```

Tujuannya mempercepat pencarian yang sering dilakukan.

---

# 67. Constraint Database

Wajib:

```text
products.code UNIQUE
products.barcode UNIQUE WHERE NOT NULL
transactions.transaction_number UNIQUE
transactions.idempotency_key UNIQUE
```

Harga:

```text
selling_price >= 0
```

Quantity:

```text
quantity > 0
```

Stok:

```text
stock >= 0
```

---

# 68. Deployment

Alur:

```text
Development Local
       ↓
GitHub
       ↓
Vercel Preview
       ↓
Testing
       ↓
Production
```

---

# 69. Vercel

Aplikasi React dibangun melalui Vite.

Perintah:

```text
npm run build
```

Hasil Vite:

```text
dist/
```

Vercel digunakan untuk:

* *Preview deployment*.
* *Production deployment*.
* Domain.
* HTTPS.
* Environment Variables.

---

# 70. Environment Deployment

Pisahkan:

```text
Development
Preview
Production
```

Jika memungkinkan, gunakan database Supabase pengembangan terpisah dari database produksi.

Tujuannya agar pengujian tidak mengubah transaksi produksi.

---

# 71. React Router pada Production

Karena aplikasi menggunakan navigasi sisi klien, konfigurasi Vercel harus memastikan route seperti:

```text
/pos
/transactions
/owner/products
```

tetap mengarahkan aplikasi ke React ketika halaman diakses langsung atau di-*refresh*.

---

# 72. Backup

Database transaksi harus memiliki strategi cadangan.

Data penting:

```text
products
prices
transactions
transaction_items
stock_movements
cash_closings
profiles
```

Backup bukan pengganti riwayat perubahan harga dan mutasi stok.

---

# 73. Logging

Sistem perlu mencatat aktivitas penting:

```text
login
perubahan harga
penyesuaian stok
transaksi
pembatalan transaksi
closing
konversi barang sementara
```

Untuk MVP, perubahan penting dapat dicatat menggunakan tabel riwayat khusus atau metadata `created_by/updated_by`.

---

# 74. Performance Requirement

Target penggunaan normal:

### Tambah Barang ke Cart

```text
< 200 ms
```

karena dilakukan lokal.

### Perhitungan Total

```text
instan
```

### Perhitungan Kembalian

```text
instan
```

### Pencarian Barang

Target:

```text
< 1 detik
```

### Lookup Barcode

Target:

```text
< 1 detik
```

setelah barcode berhasil dibaca.

### Checkout

Target:

```text
< 2 detik
```

dalam kondisi jaringan normal.

---

# 75. Security Requirement

Sistem wajib:

1. Menggunakan Supabase Authentication.
2. Mengaktifkan RLS.
3. Membatasi akses berdasarkan role.
4. Tidak menyimpan password secara manual.
5. Tidak menyimpan secret Supabase pada frontend.
6. Memvalidasi transaksi kembali pada database.
7. Tidak mempercayai harga yang dikirim frontend.
8. Membatasi RPC hanya untuk pengguna terautentikasi.
9. Mencegah transaksi ganda.
10. Mencatat Kasir pada setiap transaksi.

---

# 76. Pengujian Unit

Fungsi yang harus diuji:

```text
currency formatter
subtotal calculation
total calculation
change calculation
quick calculator
quantity validation
payment validation
```

Contoh:

```text
Price = 3500
Qty = 3

Expected subtotal =
10500
```

---

# 77. Pengujian Integrasi

Wajib menguji:

```text
Login → Profile
Barcode → Product
Cart → Checkout
Checkout → Transaction
Checkout → Transaction Items
Checkout → Stock
Checkout → Stock Movement
Closing → Transaction Summary
```

---

# 78. Pengujian RLS

Pengujian harus memastikan:

Kasir tidak dapat:

```text
ubah harga
hapus produk
melihat data yang dilarang
memanipulasi transaksi selesai
```

Pengguna yang belum login tidak dapat mengakses data internal.

---

# 79. Pengujian Barcode

Skenario:

1. Barcode valid dan barang ditemukan.
2. Barcode valid tetapi barang belum terdaftar.
3. Barcode tidak terbaca.
4. Kamera ditolak.
5. Kamera tidak tersedia.
6. Barcode sama dipindai berulang.
7. Barang tanpa barcode dicari melalui nama.
8. Barcode berhasil dikonversi menjadi produk.

---

# 80. Acceptance Criteria Teknis

## Authentication

* Login bekerja.
* Session tersimpan.
* Role terbaca.
* Route terlindungi.

## Data Barang

* Produk dapat dibuat.
* Produk dapat diubah.
* Harga dapat diubah Pemilik.
* Barcode bersifat opsional.
* Barcode tidak dapat duplikat.

## Barcode

* Kamera HP dapat dibuka.
* Barcode produk dapat dibaca.
* Produk dapat dicari berdasarkan barcode.
* Produk langsung ditambahkan jika ditemukan.
* Barang tidak terdaftar dapat dicatat.
* Scan berulang tidak menghasilkan jumlah yang salah.

## Daftar Harga

* Harga dapat dicari berdasarkan nama.
* Barang sementara dapat disimpan.
* Barang sementara dapat ditemukan kembali.
* Pemilik dapat mengubahnya menjadi Data Barang.

## POS

* Barang dapat dimasukkan.
* Quantity dapat diubah.
* Quantity desimal didukung untuk satuan tertentu.
* Subtotal dihitung.
* Total dihitung.
* Pembayaran dihitung.
* Kembalian dihitung.

## Kalkulator Cepat

* Hitung Barang bekerja tanpa database.
* Hitung Kembalian bekerja tanpa database.
* Reset bekerja.
* Tidak membuat transaksi.

## Checkout

* Harga diverifikasi database.
* Stok diverifikasi database.
* Transaksi tersimpan secara utuh.
* Detail tersimpan.
* Stok berkurang.
* Mutasi stok tercatat.
* Transaksi ganda dicegah.

## Closing

* Pendapatan sistem dihitung.
* Uang aktual dapat dimasukkan.
* Selisih dihitung.
* Closing tersimpan.

## Deployment

* React berhasil dibangun.
* Aplikasi berjalan di Vercel.
* Supabase berhasil terhubung.
* Environment Variable bekerja.
* Route React dapat diakses langsung.
* Kamera dapat digunakan melalui HTTPS.

---

# 81. Prioritas Implementasi

## Tahap 1 — Fondasi

1. React + Vite.
2. Tailwind CSS.
3. Supabase.
4. Authentication.
5. Role Pemilik dan Kasir.
6. Layout.
7. Protected Route.

## Tahap 2 — Master Barang

8. Kategori.
9. Satuan.
10. Data Barang.
11. Harga.
12. Stok.
13. Daftar Harga.
14. Barang Belum Terdaftar.

## Tahap 3 — POS

15. Search Barang.
16. Keranjang.
17. Quantity.
18. Subtotal.
19. Total.
20. Pembayaran.
21. Kembalian.
22. Checkout RPC.

## Tahap 4 — Barcode

23. Kamera HP.
24. Scanner.
25. Lookup barcode.
26. Barcode tidak terdaftar.
27. Tambah barang dari hasil scan.

## Tahap 5 — Kalkulator Cepat

28. Hitung Barang.
29. Hitung Kembalian.
30. Nominal Cepat.
31. Reset.

## Tahap 6 — Transaksi

32. Riwayat transaksi.
33. Detail transaksi.
34. Struk.
35. Mutasi stok.

## Tahap 7 — Laporan

36. Dashboard.
37. Pendapatan harian.
38. Barang terjual.
39. Barang terlaris.
40. Tutup Kasir.

## Tahap 8 — Production

41. RLS.
42. Pengujian.
43. Environment Production.
44. Vercel.
45. Domain.
46. Production Testing.

---

# 82. Stack Final

```text
React
+
Vite
+
Tailwind CSS
+
React Router
+
Zustand
+
TanStack Query
+
Supabase JavaScript SDK
+
Supabase Auth
+
PostgreSQL
+
Supabase Database RPC
+
Row Level Security
+
GitHub
+
Vercel
```

---

# 83. Arsitektur Final

```text
                 PEMILIK / KASIR
                        │
                        ▼
              ┌───────────────────┐
              │   React + Vite    │
              │   Tailwind CSS    │
              └─────────┬─────────┘
                        │
          ┌─────────────┼──────────────┐
          │             │              │
          ▼             ▼              ▼
       POS & Cart   Quick Calculator  Barcode
                                      Camera
          │             │              │
          └─────────────┼──────────────┘
                        │
                        ▼
              Supabase JavaScript
                        │
           ┌────────────┼─────────────┐
           │            │             │
           ▼            ▼             ▼
      Supabase Auth    Data API    Database RPC
           │            │             │
           └────────────┼─────────────┘
                        ▼
                 PostgreSQL
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
       Products    Transactions      Stock
                        │
                        ▼
                 Reports / Closing


DEPLOYMENT

React Source
     │
     ▼
   GitHub
     │
     ▼
   Vercel
     │
     ▼
Production HTTPS
```

---

# 84. Kesimpulan Teknis

Aplikasi dibangun sebagai aplikasi web berbasis React dan Vite. Seluruh antarmuka POS, Kalkulator Cepat, pencarian harga, pembayaran, serta perhitungan kembalian dijalankan melalui React agar interaksi terasa cepat.

Supabase digunakan sebagai layanan autentikasi, PostgreSQL database, Data API, dan tempat menjalankan fungsi transaksi.

Kalkulator Cepat hanya berjalan di sisi React dan tidak menyimpan data ke database.

Barang dapat ditemukan melalui pencarian nama atau barcode bawaan produk. Barcode dipindai melalui kamera HP. Jika produk belum terdaftar, nama dan harga dapat disimpan terlebih dahulu sehingga pada transaksi berikutnya Kasir tidak perlu kembali menanyakan harga kepada Pemilik.

Proses transaksi resmi dijalankan melalui PostgreSQL Database Function agar validasi harga, stok, penyimpanan transaksi, detail transaksi, serta pengurangan stok dapat dilakukan sebagai satu proses yang konsisten.

Aplikasi diterapkan melalui Vercel dan terhubung dengan Supabase sebagai layanan data utama.

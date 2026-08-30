# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Aplikasi Kasir Toko Sembako

## 1. Nama Produk

**Aplikasi Kasir Toko Sembako**

Aplikasi berbasis *web* yang digunakan untuk membantu kasir dalam mengetahui harga barang, menghitung barang, menghitung total pembelian dan uang kembalian, mencatat transaksi, serta mengetahui pendapatan penjualan harian.

---

# 2. Latar Belakang

Proses transaksi pada toko sembako masih menghadapi beberapa kendala. Kasir tidak selalu menghafal harga seluruh barang sehingga pada kondisi tertentu harus menanyakan harga kepada pemilik terlebih dahulu. Hal tersebut membuat proses pelayanan menjadi lebih lama, terutama ketika toko sedang ramai.

Perhitungan jumlah barang, total pembelian, dan uang kembalian juga masih sering dilakukan secara manual. Cara tersebut membutuhkan ketelitian dan dapat menyebabkan kesalahan dalam menghitung jumlah barang maupun uang yang harus dikembalikan kepada pelanggan.

Selain itu, pada akhir hari kasir masih perlu menghitung hasil penjualan untuk mengetahui jumlah pendapatan yang diperoleh pada hari tersebut.

Toko juga menjual berbagai jenis barang. Sebagian produk kemasan sudah memiliki *barcode* bawaan dari produsen, sedangkan barang seperti beras eceran, telur, gula curah, minyak curah, dan barang eceran lainnya tidak selalu memiliki *barcode*.

Oleh karena itu, diperlukan aplikasi kasir yang dapat digunakan dengan cara yang sederhana dan cepat, mendukung pencarian barang berdasarkan nama maupun *barcode* bawaan produk, menghitung transaksi secara otomatis, dan mencatat hasil penjualan harian.

---

# 3. Permasalahan

Permasalahan utama yang ingin diselesaikan adalah:

1. Kasir tidak selalu menghafal harga barang sehingga harus menanyakan harga kepada pemilik terlebih dahulu.

2. Proses mengetahui harga suatu barang membutuhkan waktu lebih lama apabila barang belum diketahui oleh kasir.

3. Perhitungan jumlah barang masih dilakukan secara manual sehingga dapat terjadi kesalahan jumlah.

4. Perhitungan total pembelian membutuhkan waktu lebih lama jika dilakukan secara manual.

5. Kasir dapat salah dalam menghitung uang kembalian pelanggan.

6. Dalam kondisi toko ramai, proses menghitung barang dan kembalian perlu dilakukan dengan lebih cepat.

7. Barang baru yang belum pernah dicatat harganya menyebabkan kasir harus kembali menanyakan harga kepada pemilik pada transaksi berikutnya.

8. Tidak seluruh barang toko sembako memiliki *barcode*.

9. Produk kemasan yang memiliki *barcode* bawaan belum dimanfaatkan untuk mempercepat pencarian barang.

10. Pada akhir hari, kasir masih harus menghitung pendapatan penjualan secara manual.

11. Pemilik belum dapat melihat jumlah transaksi dan pendapatan harian secara langsung melalui sistem.

---

# 4. Tujuan Produk

Aplikasi dibuat untuk:

1. Mempercepat proses pelayanan transaksi.

2. Membantu kasir mengetahui harga barang tanpa harus menghafalnya.

3. Mengurangi kebutuhan kasir untuk menanyakan harga barang kepada pemilik.

4. Memanfaatkan *barcode* bawaan produk untuk mempercepat pencarian barang.

5. Memungkinkan pemindaian *barcode* menggunakan kamera HP tanpa alat *barcode scanner* khusus.

6. Tetap mendukung barang yang tidak memiliki *barcode*.

7. Menghitung jumlah barang secara otomatis.

8. Menghitung subtotal dan total pembelian secara otomatis.

9. Menghitung uang kembalian secara otomatis.

10. Menyediakan kalkulator cepat untuk menghitung jumlah barang atau kembalian tanpa membuat transaksi.

11. Menyimpan harga barang baru agar dapat digunakan kembali.

12. Menyimpan transaksi penjualan secara otomatis.

13. Menghitung pendapatan harian secara otomatis.

14. Membantu pemilik memantau aktivitas penjualan toko.

---

# 5. Target Pengguna

Aplikasi memiliki dua jenis pengguna utama:

## 5.1 Pemilik

Pemilik memiliki hak akses untuk:

* Melihat *dashboard*.
* Mengelola data barang.
* Mengelola harga barang.
* Mengelola kategori barang.
* Mengelola satuan barang.
* Mengelola stok barang.
* Melihat daftar harga.
* Melihat barang yang belum terdaftar.
* Menambahkan dan mengubah *barcode* barang.
* Melihat seluruh transaksi.
* Melihat pendapatan harian.
* Melihat laporan penjualan.
* Melihat hasil tutup kasir.
* Mengelola akun kasir.

## 5.2 Kasir

Kasir memiliki hak akses untuk:

* Melakukan transaksi.
* Mencari barang berdasarkan nama.
* Memindai *barcode* melalui kamera HP.
* Melihat harga barang.
* Menambahkan barang ke transaksi.
* Mengubah jumlah barang.
* Menggunakan Kalkulator Cepat.
* Melihat daftar harga.
* Menambahkan barang baru ke daftar harga sesuai hak akses.
* Memproses pembayaran.
* Melihat uang kembalian.
* Mencetak atau menampilkan struk.
* Melihat riwayat transaksi sendiri.
* Melakukan tutup kasir.

---

# 6. Ruang Lingkup Produk

Versi awal aplikasi mencakup:

* Login.
* Hak akses Pemilik dan Kasir.
* *Dashboard*.
* Data barang.
* Kategori barang.
* Satuan barang.
* Harga barang.
* Stok barang.
* Daftar harga.
* Barang belum terdaftar.
* Pemindaian *barcode* melalui kamera HP.
* Pencarian berdasarkan nama barang.
* POS / transaksi kasir.
* Keranjang transaksi.
* Perhitungan jumlah barang.
* Perhitungan subtotal.
* Perhitungan total belanja.
* Pembayaran.
* Perhitungan kembalian.
* Kalkulator Cepat.
* Struk.
* Riwayat transaksi.
* Pendapatan harian.
* Tutup kasir.
* Laporan penjualan.

---

# 7. Login

Pengguna harus melakukan login sebelum menggunakan aplikasi.

Data login:

* Email
* Password

Setelah berhasil login, sistem membaca hak akses pengguna.

Jika pengguna adalah:

**Pemilik**

maka diarahkan ke:

**Dashboard Pemilik**

Jika pengguna adalah:

**Kasir**

maka diarahkan ke:

**Dashboard Kasir**

---

# 8. Dashboard Pemilik

*Dashboard* Pemilik memberikan gambaran aktivitas penjualan toko.

Informasi utama:

### Pendapatan Hari Ini

Contoh:

**Rp3.450.000**

### Jumlah Transaksi Hari Ini

Contoh:

**87 Transaksi**

### Barang Terjual Hari Ini

Contoh:

**214 Barang**

### Rata-Rata Nilai Transaksi

Contoh:

**Rp39.655**

Informasi tambahan:

* Transaksi terbaru.
* Barang paling banyak terjual.
* Grafik penjualan harian.
* Penjualan berdasarkan Kasir.
* Riwayat tutup kasir.

---

# 9. Dashboard Kasir

*Dashboard* Kasir menampilkan informasi sederhana:

* Penjualan Kasir Hari Ini.
* Jumlah Transaksi.
* Jumlah Barang Terjual.
* Transaksi Terakhir.

Tersedia tombol utama:

**Mulai Transaksi**

dan akses cepat:

**Kalkulator Cepat**

**Daftar Harga**

---

# 10. Data Barang

Data Barang merupakan data utama produk yang dijual oleh toko.

Informasi barang:

| Data        | Keterangan                                  |
| ----------- | ------------------------------------------- |
| Nama Barang | Nama produk                                 |
| Kode Barang | Kode internal, jika diperlukan              |
| Barcode     | Barcode bawaan produk, opsional             |
| Kategori    | Jenis barang                                |
| Satuan      | Pcs, bungkus, botol, kg, liter, dan lainnya |
| Harga Jual  | Harga yang digunakan saat transaksi         |
| Stok        | Jumlah barang tersedia                      |
| Status      | Aktif atau Tidak Aktif                      |

Contoh:

| Nama Barang    |    Harga | Satuan | Barcode   |
| -------------- | -------: | ------ | --------- |
| Indomie Goreng |  Rp3.500 | Pcs    | Ada       |
| Aqua 600 ml    |  Rp4.000 | Botol  | Ada       |
| Beras Ramos    | Rp15.000 | Kg     | Tidak Ada |
| Telur Ayam     | Rp30.000 | Kg     | Tidak Ada |

---

# 11. Barcode Bawaan Produk

Aplikasi menggunakan **barcode bawaan yang sudah terdapat pada kemasan produk**.

Toko tidak perlu membuat *barcode* sendiri untuk produk yang sudah memiliki *barcode* dari produsen.

Contoh produk:

* Mie instan.
* Minuman kemasan.
* Sabun.
* Kopi.
* Susu.
* Biskuit.
* Produk rumah tangga.
* Produk kemasan lainnya.

---

# 12. Scan Barcode Melalui Kamera HP

Kasir dapat memilih:

**Scan Barcode**

Kemudian kamera HP terbuka.

Alur:

Scan barcode produk

↓

Sistem membaca nomor barcode

↓

Sistem mencari barang

↓

Barang ditemukan

↓

Nama dan harga ditampilkan

↓

Barang masuk ke keranjang

Tidak diperlukan alat *barcode scanner* tambahan.

---

# 13. Scan Barang yang Sudah Terdaftar

Contoh:

Kasir memindai *barcode* Aqua 600 ml.

Sistem membaca:

**899XXXXXXXXXX**

Kemudian menemukan:

**Aqua 600 ml**

Harga:

**Rp4.000**

Barang langsung masuk ke keranjang:

**Aqua 600 ml × 1**

Jika dipindai kembali:

**Aqua 600 ml × 2**

Scan ketiga:

**Aqua 600 ml × 3**

Barang yang sama tidak dibuat menjadi baris baru.

---

# 14. Barcode Belum Terdaftar

Jika *barcode* berhasil dibaca tetapi belum tersedia dalam Data Barang, sistem menampilkan:

**Barang Belum Terdaftar**

Barcode:

**899XXXXXXXXXX**

Tersedia tombol:

**Tambah Barang Baru**

Pada formulir:

Nama Barang

Harga Jual

Kategori

Satuan

Stok

Barcode

Nilai *barcode* otomatis diisi berdasarkan hasil scan.

Setelah data disimpan, barang dapat langsung digunakan pada transaksi berikutnya.

---

# 15. Barang Tanpa Barcode

Tidak semua barang toko sembako memiliki *barcode*.

Contoh:

* Beras eceran.
* Telur.
* Gula curah.
* Minyak curah.
* Tepung eceran.
* Bumbu.
* Barang kiloan.
* Barang yang dikemas ulang toko.

Barang tersebut tetap dapat dimasukkan ke Data Barang.

Contoh:

Nama:

**Beras Ramos**

Harga:

**Rp15.000**

Satuan:

**Kg**

Barcode:

**Tidak Ada**

Barang dapat dicari berdasarkan nama.

---

# 16. Pencarian Barang

Kasir dapat menemukan barang melalui:

### Scan Barcode

Untuk barang yang memiliki *barcode* bawaan.

### Cari Nama

Kasir mengetik nama barang.

Contoh:

**Gula**

Sistem dapat menampilkan:

Gula 1 Kg — Rp17.000

Gula 500 Gram — Rp9.000

Gula Sachet — Rp1.000

### Pilih dari Daftar

Barang yang sering dijual dapat langsung dipilih dari daftar.

---

# 17. Daftar Harga

Aplikasi menyediakan menu:

**Daftar Harga**

Tujuannya agar Kasir dapat mencari harga barang tanpa menanyakan kepada Pemilik.

Informasi minimal:

| Nama Barang    |    Harga | Satuan |
| -------------- | -------: | ------ |
| Beras Ramos    | Rp15.000 | Kg     |
| Gula Pasir     | Rp17.000 | Kg     |
| Aqua 600 ml    |  Rp4.000 | Botol  |
| Indomie Goreng |  Rp3.500 | Pcs    |

Kasir dapat melakukan pencarian berdasarkan nama barang.

---

# 18. Barang yang Belum Terdaftar Sebelumnya

Jika suatu barang belum tersedia dalam Data Barang maupun Daftar Harga, pengguna dapat menambahkan harga barang tersebut.

Contoh:

Nama Barang:

**Korek Api Gas**

Harga:

**Rp5.000**

Kemudian pilih:

**Simpan**

Data masuk ke:

**Daftar Harga Barang Belum Terdaftar**

Tujuannya agar harga tersebut tidak perlu ditanyakan kembali pada transaksi berikutnya.

---

# 19. Daftar Harga Barang Belum Terdaftar

Daftar ini digunakan untuk barang yang sudah diketahui nama dan harganya tetapi belum dilengkapi sebagai Data Barang.

Contoh:

| Nama Barang   |   Harga | Tanggal Ditambahkan | Status          |
| ------------- | ------: | ------------------- | --------------- |
| Korek Api Gas | Rp5.000 | 30/08/2026          | Belum Terdaftar |
| Plastik Besar | Rp2.000 | 30/08/2026          | Belum Terdaftar |

Data minimal:

* Nama Barang.
* Harga.

Data tambahan dapat dilengkapi kemudian oleh Pemilik.

---

# 20. Menjadikan Daftar Harga sebagai Data Barang

Pemilik dapat memilih:

**Jadikan Data Barang**

Data awal:

Nama:

Korek Api Gas

Harga:

Rp5.000

Kemudian Pemilik melengkapi:

* Kategori.
* Satuan.
* Stok.
* Barcode jika tersedia.
* Status.

Setelah disimpan, data menjadi Data Barang resmi.

---

# 21. Halaman POS

Halaman POS merupakan halaman utama transaksi Kasir.

Tampilan dibagi menjadi dua bagian.

## Bagian Daftar Barang

Menampilkan:

* Pencarian.
* Tombol Scan Barcode.
* Kategori.
* Nama Barang.
* Harga.
* Stok.

## Bagian Keranjang

Contoh:

| Barang         |   Harga | Jumlah | Subtotal |
| -------------- | ------: | -----: | -------: |
| Indomie Goreng | Rp3.500 |      2 |  Rp7.000 |
| Aqua 600 ml    | Rp4.000 |      3 | Rp12.000 |

Di bagian bawah:

**Total Barang: 5**

**Total Belanja: Rp19.000**

Tombol:

**Bayar Rp19.000**

---

# 22. Menambahkan Barang ke Transaksi

Barang dapat ditambahkan melalui:

1. Scan *barcode*.
2. Pencarian nama.
3. Pilih barang dari daftar.

Jika barang belum terdapat di keranjang:

Jumlah = 1

Jika sudah ada:

Jumlah = jumlah sebelumnya + 1

Contoh:

Indomie × 1

Kasir memilih Indomie kembali.

Menjadi:

**Indomie × 2**

---

# 23. Mengubah Jumlah Barang

Pada setiap item tersedia:

**−**

**Jumlah**

**+**

Contoh:

Indomie

Rp3.500

**− 2 +**

Subtotal:

**Rp7.000**

Jika menjadi:

3

Subtotal berubah otomatis:

**Rp10.500**

---

# 24. Perhitungan Jumlah Barang

Total jumlah barang dihitung otomatis.

Contoh:

Indomie × 3

Aqua × 2

Roti × 4

Maka:

**Total Barang = 9**

Kasir tidak perlu menjumlahkan barang secara manual.

---

# 25. Perhitungan Subtotal

Formula:

**Subtotal = Harga × Jumlah**

Contoh:

Harga:

Rp4.000

Jumlah:

3

Maka:

**Subtotal = Rp12.000**

---

# 26. Perhitungan Total Belanja

Sistem menjumlahkan seluruh subtotal.

Contoh:

Indomie:

Rp7.000

Aqua:

Rp12.000

Roti:

Rp15.000

Maka:

**Total Belanja = Rp34.000**

---

# 27. Pembayaran

Setelah barang selesai dimasukkan, Kasir memilih:

**Bayar**

Sistem menampilkan:

### Total Belanja

**Rp67.500**

### Uang Diterima

Kasir dapat:

* Mengetik nominal.
* Memilih nominal cepat.
* Memilih Uang Pas.

---

# 28. Nominal Cepat

Aplikasi menyediakan pilihan nominal agar proses pembayaran lebih cepat.

Contoh:

Total:

Rp67.500

Pilihan:

**Rp70.000**

**Rp100.000**

**Uang Pas**

Jika Kasir memilih:

**Rp100.000**

sistem langsung menghitung kembalian.

---

# 29. Uang Pas

Jika pelanggan memberikan uang sesuai total belanja, Kasir memilih:

**Uang Pas**

Contoh:

Total:

Rp47.500

Sistem mengisi:

Bayar:

Rp47.500

Kembalian:

**Rp0**

---

# 30. Perhitungan Kembalian

Formula:

**Kembalian = Uang Diterima − Total Belanja**

Contoh:

Total:

Rp67.500

Bayar:

Rp100.000

Kembalian:

**Rp32.500**

Hasil langsung muncul pada layar.

---

# 31. Pembayaran Kurang

Jika:

Total:

Rp75.000

Bayar:

Rp50.000

Sistem menampilkan:

**Pembayaran masih kurang Rp25.000**

Transaksi tidak dapat diselesaikan sampai pembayaran mencukupi.

---

# 32. Kalkulator Cepat

Selain POS, aplikasi menyediakan fitur terpisah:

**Kalkulator Cepat**

Fitur ini digunakan ketika Kasir hanya ingin melakukan perhitungan tanpa membuat transaksi.

Kalkulator Cepat memiliki dua fungsi:

1. Hitung Barang.
2. Hitung Kembalian.

Data dari Kalkulator Cepat tidak masuk ke transaksi, stok, ataupun laporan.

---

# 33. Kalkulator Hitung Barang

Kasir dapat memasukkan beberapa jumlah barang.

Contoh:

5

3

7

2

Sistem menghitung:

**5 + 3 + 7 + 2 = 17 Barang**

Kasir dapat menggunakan tombol:

**Tambah**

**Kurangi**

**Reset**

Fitur ini berguna ketika Kasir hanya perlu menghitung jumlah fisik barang secara cepat.

---

# 34. Kalkulator Kembalian

Kasir memasukkan:

### Total Belanja

Rp37.500

### Uang Diterima

Rp50.000

Sistem menampilkan:

### Kembalian

**Rp12.500**

Tersedia nominal cepat:

* Rp20.000.
* Rp50.000.
* Rp100.000.
* Uang Pas.

---

# 35. Aturan Kalkulator Cepat

1. Kalkulator tidak membuat transaksi.
2. Kalkulator tidak mengurangi stok.
3. Kalkulator tidak masuk ke laporan.
4. Kalkulator tidak menambah pendapatan.
5. Data perhitungan tidak perlu disimpan.
6. Kasir dapat menggunakan tombol Reset setelah selesai.
7. Hitung Barang hanya menjumlahkan angka yang dimasukkan.
8. Hitung Kembalian menggunakan total belanja dan uang diterima.

---

# 36. Penyelesaian Transaksi POS

Setelah pembayaran berhasil, sistem:

1. Membuat nomor transaksi.
2. Menyimpan transaksi.
3. Menyimpan detail barang.
4. Menyimpan harga setiap barang.
5. Menyimpan jumlah barang.
6. Menyimpan subtotal.
7. Menyimpan total transaksi.
8. Menyimpan uang diterima.
9. Menyimpan kembalian.
10. Menyimpan Kasir.
11. Menyimpan tanggal dan waktu transaksi.
12. Mengurangi stok barang.
13. Memperbarui pendapatan harian.
14. Menampilkan struk.

---

# 37. Struk Penjualan

Contoh:

**TOKO SEMBAKO**

TRX-20260830-0001

30 Agustus 2026
08:45

Kasir: Kasir 01

---

Indomie Goreng
2 × Rp3.500
Rp7.000

Aqua 600 ml
3 × Rp4.000
Rp12.000

---

Total Barang: 5

Total: Rp19.000

Bayar: Rp20.000

Kembalian: Rp1.000

---

Terima Kasih

Struk dapat:

* Ditampilkan di layar.
* Dicetak.

---

# 38. Riwayat Transaksi

Pemilik dapat melihat seluruh transaksi.

Kasir hanya melihat transaksi yang dilakukan sesuai hak aksesnya.

Kolom:

| Tanggal    | No. Transaksi | Kasir    | Total Barang |    Total | Status  | Aksi   |
| ---------- | ------------- | -------- | -----------: | -------: | ------- | ------ |
| 30/08/2026 | TRX-0001      | Kasir 01 |            5 | Rp19.000 | Selesai | Detail |

Tombol:

**Detail**

menampilkan semua barang dalam transaksi.

---

# 39. Pendapatan Harian

Sistem otomatis menghitung transaksi yang berhasil.

Contoh:

TRX-001 = Rp50.000

TRX-002 = Rp75.000

TRX-003 = Rp35.000

Maka:

**Pendapatan Hari Ini = Rp160.000**

Kasir tidak perlu menjumlahkan seluruh transaksi secara manual pada akhir hari.

---

# 40. Tutup Kasir

Pada akhir hari Kasir memilih:

**Tutup Kasir**

Sistem menampilkan:

Jumlah Transaksi:

**87**

Barang Terjual:

**214**

Pendapatan Sistem:

**Rp3.450.000**

Kasir kemudian memasukkan:

**Uang Aktual**

Contoh:

Rp3.440.000

Sistem menghitung:

**Selisih = Uang Aktual − Uang Sistem**

Hasil:

**-Rp10.000**

Status:

**Kurang Rp10.000**

Jika hasil:

Rp0

Status:

**Sesuai**

---

# 41. Laporan Penjualan

Pemilik dapat melihat laporan berdasarkan:

* Hari.
* Minggu.
* Bulan.
* Rentang tanggal.

Laporan minimal menampilkan:

* Jumlah transaksi.
* Jumlah barang terjual.
* Total pendapatan.
* Barang paling banyak terjual.
* Penjualan per Kasir.
* Riwayat transaksi.

---

# 42. Struktur Menu Pemilik

**Dashboard**

**Barang**

* Data Barang
* Kategori
* Satuan
* Daftar Harga
* Barang Belum Terdaftar

**Transaksi**

* Riwayat Transaksi

**Laporan**

* Penjualan
* Barang Terlaris
* Pendapatan

**Kasir**

* Data Kasir

**Closing**

* Riwayat Tutup Kasir

**Pengaturan**

**Logout**

---

# 43. Struktur Menu Kasir

**Dashboard**

**POS / Kasir**

**Scan Barcode**

**Daftar Harga**

**Kalkulator Cepat**

* Hitung Barang
* Hitung Kembalian

**Riwayat Transaksi**

**Tutup Kasir**

**Logout**

---

# 44. Alur Transaksi dengan Barcode

Kasir membuka POS

↓

Pilih Scan Barcode

↓

Kamera HP terbuka

↓

Scan barcode bawaan produk

↓

Sistem mencari barang

### Jika Ditemukan

Nama dan Harga muncul

↓

Barang masuk keranjang

↓

Lanjut scan atau pilih barang lainnya

### Jika Tidak Ditemukan

Muncul Barang Belum Terdaftar

↓

Tambah Barang Baru

↓

Barcode otomatis terisi

↓

Isi Nama dan Harga

↓

Simpan

↓

Barang dapat digunakan

---

# 45. Alur Transaksi Tanpa Barcode

Kasir membuka POS

↓

Cari nama barang

↓

Sistem menampilkan barang dan harga

↓

Kasir memilih barang

↓

Barang masuk keranjang

↓

Atur jumlah

↓

Sistem menghitung total

↓

Bayar

↓

Sistem menghitung kembalian

↓

Simpan transaksi

---

# 46. Aturan Bisnis Umum

1. Harga barang ditentukan oleh Pemilik.
2. Kasir dapat melihat harga barang.
3. Barcode menggunakan barcode bawaan produk.
4. Barcode tidak wajib untuk semua barang.
5. Barang tanpa barcode tetap dapat digunakan.
6. Barang tanpa barcode dicari berdasarkan nama.
7. Satu barcode hanya boleh digunakan oleh satu barang.
8. Barang yang sama dalam satu transaksi otomatis menambah jumlah.
9. Jumlah barang minimal satu.
10. Jumlah barang tidak boleh melebihi stok apabila pengelolaan stok digunakan.
11. Subtotal dihitung otomatis.
12. Total belanja dihitung otomatis.
13. Kembalian dihitung otomatis.
14. Pembayaran kurang tidak dapat diselesaikan.
15. Harga transaksi lama tidak berubah apabila harga barang diperbarui.
16. Transaksi selesai dihitung sebagai pendapatan.
17. Transaksi batal tidak dihitung sebagai pendapatan.
18. Kalkulator Cepat tidak dianggap sebagai transaksi.
19. Data Kalkulator Cepat tidak memengaruhi stok.
20. Data Kalkulator Cepat tidak masuk laporan.
21. Barang baru yang sudah diketahui harganya dapat disimpan agar tidak perlu ditanyakan kembali.
22. Pemilik dapat mengubah data barang dan harga.
23. Setiap transaksi menyimpan identitas Kasir.
24. Pendapatan harian dihitung dari transaksi yang berhasil.

---

# 47. Kebutuhan Nonfungsional

## Kecepatan

Pencarian barang, perubahan jumlah, total belanja, dan perhitungan kembalian harus tampil dengan cepat tanpa memuat ulang halaman.

## Kemudahan Penggunaan

Antarmuka harus sederhana dan dapat digunakan oleh Kasir tanpa proses yang rumit.

## Mobile Friendly

Fitur Scan Barcode harus dapat digunakan melalui kamera HP.

## Responsif

Aplikasi dapat digunakan melalui:

* HP.
* Tablet.
* Laptop.
* Komputer.

## Akurasi

Seluruh perhitungan transaksi dilakukan oleh sistem.

## Keamanan

Akses dibatasi berdasarkan akun dan role pengguna.

## Penyimpanan

Transaksi dan perubahan data utama harus tersimpan pada database.

## Koneksi

Aplikasi membutuhkan koneksi internet untuk mengakses database dan menyimpan transaksi.

---

# 48. Teknologi yang Digunakan

Aplikasi direncanakan menggunakan:

**Frontend**

React + Vite

**Styling**

Tailwind CSS

**State Management**

Zustand

**Database**

Supabase PostgreSQL

**Authentication**

Supabase Auth

**Backend Service**

Supabase

**Deployment**

Vercel

Aplikasi tidak menggunakan Laravel atau backend PHP terpisah.

---

# 49. Prioritas MVP

Fitur wajib pada versi pertama:

1. Login.
2. Role Pemilik dan Kasir.
3. Data Barang.
4. Harga Barang.
5. Kategori.
6. Satuan.
7. Daftar Harga.
8. Barang Belum Terdaftar.
9. POS.
10. Pencarian Nama Barang.
11. Scan Barcode melalui kamera HP.
12. Barcode bawaan produk.
13. Penambahan barang baru dari hasil scan.
14. Keranjang.
15. Tambah dan kurangi jumlah barang.
16. Hitung jumlah barang.
17. Hitung subtotal.
18. Hitung total.
19. Pembayaran.
20. Nominal pembayaran cepat.
21. Uang Pas.
22. Hitung kembalian.
23. Kalkulator Cepat Hitung Barang.
24. Kalkulator Cepat Hitung Kembalian.
25. Penyimpanan transaksi.
26. Struk.
27. Riwayat transaksi.
28. Pendapatan harian.
29. Tutup kasir.
30. Laporan penjualan.

---

# 50. Acceptance Criteria

## Harga Barang

* Kasir dapat mencari harga berdasarkan nama barang.
* Harga langsung muncul.
* Harga yang sudah tersimpan dapat ditemukan kembali.
* Kasir tidak perlu bertanya kembali kepada Pemilik untuk barang yang sudah terdaftar.

## Barcode

* Kamera HP dapat digunakan untuk scan barcode.
* Sistem menggunakan barcode bawaan produk.
* Barang yang sudah terdaftar dapat ditemukan melalui barcode.
* Barang langsung menampilkan nama dan harga.
* Scan barang yang sama menambah jumlah.
* Barcode yang belum terdaftar menampilkan pilihan tambah barang.
* Barcode hasil scan otomatis masuk ke formulir barang baru.
* Barang tanpa barcode tetap dapat digunakan.

## POS

* Barang dapat ditambahkan ke keranjang.
* Jumlah dapat ditambah dan dikurangi.
* Total jumlah barang dihitung otomatis.
* Subtotal dihitung otomatis.
* Total belanja dihitung otomatis.

## Pembayaran

* Uang diterima dapat dimasukkan.
* Tersedia nominal cepat.
* Tersedia Uang Pas.
* Kembalian dihitung otomatis.
* Pembayaran kurang ditampilkan dengan jelas.

## Kalkulator Cepat

* Kasir dapat menghitung jumlah barang tanpa membuat transaksi.
* Kasir dapat menghitung kembalian tanpa membuat transaksi.
* Kalkulator dapat direset.
* Hasil kalkulator tidak masuk ke laporan atau pendapatan.

## Transaksi

* Transaksi berhasil tersimpan.
* Detail barang tersimpan.
* Kasir yang melakukan transaksi tersimpan.
* Tanggal dan waktu tersimpan.
* Struk dapat ditampilkan.
* Transaksi masuk ke pendapatan harian.

## Pendapatan

* Jumlah transaksi harian dapat dilihat.
* Pendapatan harian dihitung otomatis.
* Pemilik dapat melihat hasil penjualan.
* Kasir tidak perlu menjumlahkan seluruh transaksi secara manual.

## Tutup Kasir

* Pendapatan menurut sistem ditampilkan.
* Kasir dapat memasukkan uang aktual.
* Sistem menghitung selisih.
* Hasil tutup kasir tersimpan.

---

# 51. Indikator Keberhasilan

Produk dianggap berhasil apabila:

1. Kasir dapat mengetahui harga barang dengan lebih cepat.
2. Barang yang sudah pernah dimasukkan tidak perlu ditanyakan kembali harganya.
3. Barcode bawaan produk dapat digunakan melalui kamera HP.
4. Barang tanpa barcode tetap dapat diproses.
5. Jumlah barang dapat dihitung dengan lebih cepat.
6. Total belanja dihitung otomatis.
7. Kembalian dihitung otomatis.
8. Kesalahan perhitungan dapat dikurangi.
9. Kalkulator Cepat dapat digunakan tanpa harus membuat transaksi.
10. Seluruh transaksi resmi tersimpan.
11. Pendapatan harian dapat diketahui secara otomatis.
12. Pemilik dapat memantau penjualan toko melalui aplikasi.

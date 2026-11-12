# PasarKarya

Marketplace jasa digital marketing untuk UMKM.

- **Frontend:** React + Vite
- **Backend:** Express (Node.js)
- **Database:** MySQL (via `mysql2`)
- **Pembayaran:** Midtrans Snap (mode Sandbox / uji coba)

---

## Daftar isi
1. [Prasyarat](#1-prasyarat)
2. [Menjalankan project](#2-menjalankan-project)
3. [Konfigurasi `.env`](#3-konfigurasi-env)
4. [Database](#4-database)
5. [Pembayaran Midtrans Sandbox](#5-pembayaran-midtrans-sandbox)
6. [Akun demo](#6-akun-demo)
7. [Struktur project](#7-struktur-project)
8. [Daftar API](#8-daftar-api)
9. [Troubleshooting](#9-troubleshooting)
10. [Catatan keamanan & deploy](#10-catatan-keamanan--deploy)

---

## 1. Prasyarat

| Kebutuhan | Keterangan |
|---|---|
| Node.js 20+ | Cek dengan `node -v` |
| npm | Ikut terpasang bersama Node.js |
| MySQL 5.7+ / MariaDB 10.3+ | Paling mudah lewat **Laragon** atau **XAMPP** |
| Akun Midtrans Sandbox | Gratis, hanya untuk fitur pembayaran |

## 2. Menjalankan project

Buka terminal (PowerShell) di folder project, lalu:

```powershell
npm install
Copy-Item .env.example .env
# Buka .env, isi JWT_SECRET (teks acak panjang) dan key Midtrans (lihat bagian 5)
npm run dev
```

Sebelum `npm run dev`, **pastikan MySQL sudah menyala** (Laragon: klik *Start All*; XAMPP: Start pada baris MySQL).

Kalau berhasil, terminal menampilkan:
- `PasarKarya API listening on port 4000` (backend)
- `Local: http://localhost:5173/` (frontend)

Buka:
- Web: http://localhost:5173
- Cek backend: http://localhost:4000/api/health

Jangan tutup terminal selama project dipakai. Untuk berhenti, tekan `Ctrl + C`.

> Server **tidak restart otomatis**. Setiap kali mengubah `.env` atau kode server, hentikan (`Ctrl + C`) lalu jalankan `npm run dev` lagi.

## 3. Konfigurasi `.env`

Salin dari `.env.example`. Daftar variabelnya:

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `4000` | Port backend |
| `JWT_SECRET` | *(wajib di production)* | Kunci penanda sesi login. Isi teks acak panjang |
| `DB_HOST` | `127.0.0.1` | Alamat MySQL |
| `DB_PORT` | `3306` | Port MySQL |
| `DB_USER` | `root` | User MySQL (Laragon/XAMPP: `root`) |
| `DB_PASSWORD` | *(kosong)* | Password MySQL (Laragon/XAMPP: kosong) |
| `DB_NAME` | `pasarkarya` | Nama database, dibuat otomatis |
| `MIDTRANS_SERVER_KEY` | | Server Key Midtrans (**rahasia**) |
| `MIDTRANS_CLIENT_KEY` | | Client Key Midtrans |
| `MIDTRANS_IS_PRODUCTION` | `false` | `true` hanya untuk Midtrans produksi |
| `UPLOAD_DIR` | `server/uploads` | Folder penyimpanan foto upload. Saat deploy, arahkan ke disk yang persisten |
| `SEED_DEMO` | `true` di development, `false` di production | Buat akun & layanan demo saat server start |
| `CLIENT_URL` | *(semua origin)* | Batasi asal frontend saat deploy |

Untuk frontend yang di-host terpisah dari backend, set `VITE_API_URL` pada environment build frontend.

## 4. Database

Kamu **tidak perlu membuat database atau mengimpor file `.sql`** secara manual. Saat server start, otomatis:

1. Membuat database `DB_NAME` jika belum ada.
2. Membuat tabel dari `server/schema.sql` (aman diulang, memakai `IF NOT EXISTS`).
3. Menambah kolom baru pada tabel lama jika ada (migrasi ringan).
4. Mengisi akun & layanan demo jika `SEED_DEMO=true`.

Tabel:

| Tabel | Isi |
|---|---|
| `users` | Akun admin & customer (password di-hash bcrypt) |
| `services` | Katalog layanan |
| `orders` | Pesanan, status pembayaran, status pengerjaan, token Midtrans |

Melihat data: buka **phpMyAdmin** (`http://localhost/phpmyadmin`), HeidiSQL, atau DBeaver, lalu pilih database `pasarkarya`.

Mereset data: hapus database `pasarkarya` lewat phpMyAdmin, lalu jalankan `npm run dev` lagi.

## 5. Pembayaran Midtrans Sandbox

Pembayaran memakai Midtrans Snap mode **Sandbox**. Tidak ada uang sungguhan.

### Setup sekali
1. Daftar/login di https://dashboard.midtrans.com, pilih environment **Sandbox**.
2. Buka **Settings > Access Keys**. Salin **Server Key** dan **Client Key** (diawali `SB-Mid-`).
3. Tempel ke `.env`:
   ```
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx
   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx
   ```
4. Restart `npm run dev`.

### Alur pembayaran
1. Customer membuat pesanan (status: *Menunggu pembayaran*).
2. Di halaman **Pesanan**, klik **Bayar sekarang**. Server meminta token Snap ke Midtrans, popup pembayaran terbuka.
3. Customer memilih metode dan menyelesaikan pembayaran.
4. Server menerima status dari Midtrans lewat dua jalur: **Cek status** (server bertanya langsung ke Midtrans, otomatis dijalankan saat popup ditutup) dan **webhook** (Midtrans memberi tahu server).
5. Status pesanan menjadi **Lunas / Sedang dikerjakan**.

### Cara "membayar" di Sandbox
Buka https://simulator.sandbox.midtrans.com.

- **Virtual Account (paling mudah):** di popup pilih *Bank Transfer* dan salin nomor VA. Di simulator pilih *Virtual Account*, pilih bank yang sama, tempel nomor, klik **Inquire** lalu **Pay**. Kembali ke web, klik **Cek status**.
- **Kartu kredit:** pakai kartu uji dari menu **Testing Credential** di simulator. Tidak perlu membuka simulator untuk membayar.
- **QRIS / GoPay / ShopeePay:** gunakan menu *QRIS* atau *Deeplink* di simulator.

Nominal dan nomor yang ditempel di simulator harus sama dengan yang ada di popup.

### Webhook (opsional di komputer lokal)
Endpoint webhook: `POST /api/payments/midtrans/notification` (dijaga verifikasi signature).

Midtrans tidak bisa mengirim ke `localhost`, tetapi itu tidak masalah karena tombol **Cek status** sudah cukup. Untuk mencoba webhook:
1. Jalankan tunnel ke port 4000 (ngrok atau Cloudflare Tunnel).
2. Di dashboard Midtrans: **Settings > Payment > Notification URL**, isi `https://<url-tunnel>/api/payments/midtrans/notification`.

### Status pesanan
| Status | Arti |
|---|---|
| Menunggu pembayaran | Belum dibayar |
| Sedang dikerjakan | Sudah lunas, dikerjakan |
| Selesai | Ditandai admin |
| Dibatalkan | Dibatalkan admin, atau pembayaran kedaluwarsa/ditolak Midtrans |

### Foto layanan & beranda
Admin bisa memasang foto tanpa mengubah kode:

- **Foto layanan:** login sebagai admin, buka tab **Layanan**. Saat **Tambah layanan** ada kolom *Foto layanan (opsional)*. Untuk layanan yang sudah ada, klik **Tambah foto / Ganti foto** (atau **Hapus foto**). Foto tampil di kartu dan halaman detail layanan. Layanan tanpa foto tetap memakai ikon.
- **Foto beranda:** di tab **Layanan** yang sama, bagian **Foto beranda** paling atas. Foto menggantikan lingkaran ilustrasi di bagian utama halaman depan.

Aturan foto: JPG, PNG, atau WebP, maksimal 5 MB di server. Browser otomatis mengecilkan foto besar (sisi terpanjang 1600 px) sebelum diunggah. Tipe file diperiksa dari isi file, bukan dari nama, dan file disimpan dengan nama acak.

Foto tersimpan di folder `server/uploads` (path-nya disimpan di kolom `services.image_url` dan tabel `settings`). **Folder ini bukan bagian dari database**, jadi sertakan saat backup dan jangan dihapus. Folder ini sudah masuk `.gitignore`.

## 6. Akun demo

Dibuat otomatis saat development (`SEED_DEMO=true`) dan tidak menimpa akun yang sudah ada.

**Admin**

| Email | Password |
|---|---|
| `admin@pasarkarya.test` | `AdminDemo123!` |

**Customer**

| Nama | Email | Password |
|---|---|---|
| Pelanggan Demo | `pelanggan@pasarkarya.test` | `Pelanggan123!` |
| Siti Rahma | `siti@pasarkarya.test` | `SitiDemo123!` |
| Budi Santoso | `budi@pasarkarya.test` | `BudiDemo123!` |
| Maya Putri | `maya@pasarkarya.test` | `MayaDemo123!` |
| Andi Pratama | `andi@pasarkarya.test` | `AndiDemo123!` |
| Rani Amelia | `rani@pasarkarya.test` | `RaniDemo123!` |

Admin tidak bisa membuat pesanan; gunakan akun customer untuk mencoba pembayaran.

## 7. Struktur project

```
pasarkarya-react/
├─ client/src/
│  ├─ main.jsx         # titik masuk React
│  ├─ App.jsx          # kerangka: navbar, routing, login/logout
│  ├─ style.css        # seluruh tampilan (CSS biasa, tanpa framework)
│  ├─ pages/           # satu file per halaman
│  │  ├─ Home.jsx
│  │  ├─ Services.jsx
│  │  ├─ ServiceDetail.jsx
│  │  ├─ MyOrders.jsx
│  │  └─ Admin.jsx
│  ├─ components/      # potongan UI yang dipakai ulang
│  │  ├─ ServiceCard.jsx, Status.jsx, Stat.jsx, OrderTable.jsx
│  │  └─ AuthModal.jsx, InvoiceModal.jsx, Footer.jsx
│  └─ lib/             # fungsi bantu non-tampilan
│     ├─ api.js        # request ke backend (+token), alamat foto
│     ├─ format.js     # format rupiah & tanggal
│     ├─ payment.js    # popup Midtrans Snap
│     └─ upload.js     # upload foto (mengecilkan foto dulu di browser)
├─ server/
│  ├─ index.js         # titik masuk: init database, seed, jalankan server
│  ├─ app.js           # setup Express, mounting route, error handler
│  ├─ config.js        # membaca .env
│  ├─ db.js            # koneksi MySQL + helper query (all / one / run)
│  ├─ schema.sql       # definisi tabel
│  ├─ seed.js          # akun & layanan demo
│  ├─ middleware/
│  │  └─ auth.js       # verifikasi JWT, cek role admin
│  ├─ routes/
│  │  ├─ auth.js       # register, login, me
│  │  ├─ services.js   # katalog layanan (publik)
│  │  ├─ orders.js     # pesanan customer + token & cek status pembayaran
│  │  ├─ payments.js   # webhook Midtrans
│  │  ├─ settings.js   # pengaturan tampilan publik (foto beranda)
│  │  └─ admin.js      # ringkasan, pesanan, layanan, laporan, pelanggan
│  ├─ services/
│  │  ├─ midtrans.js   # klien API Midtrans, verifikasi signature
│  │  └─ payments.js   # menerapkan status Midtrans ke tabel orders
│  └─ utils/
│     ├─ http.js       # HttpError, asyncHandler, filter tanggal
│     └─ images.js     # validasi & simpan foto upload
├─ server/uploads/     # foto upload (dibuat otomatis, tidak di-commit)
├─ .env.example
├─ index.html
├─ package.json
├─ .prettierrc         # gaya format kode
└─ vite.config.js
```

## 8. Daftar API

Semua endpoint berawalan `/api`. Endpoint bertanda 🔒 butuh header `Authorization: Bearer <token>`.

| Method | Path | Keterangan |
|---|---|---|
| GET | `/health` | Cek server hidup |
| POST | `/auth/register` | Daftar customer (password min. 8 karakter) |
| POST | `/auth/login` | Login, mengembalikan token |
| GET | `/auth/me` 🔒 | Data user dari token |
| GET | `/services` | Daftar layanan aktif |
| GET | `/services/:id` | Detail layanan |
| GET | `/settings` | Foto beranda (publik) |
| POST | `/orders` 🔒 | Buat pesanan (khusus customer) |
| GET | `/orders/mine` 🔒 | Pesanan milik sendiri |
| POST | `/orders/:id/snap-token` 🔒 | Minta token popup Midtrans |
| POST | `/orders/:id/sync` 🔒 | Cek status pembayaran ke Midtrans |
| POST | `/payments/midtrans/notification` | Webhook Midtrans (verifikasi signature) |
| GET | `/admin/overview` 🔒 admin | Ringkasan pemasukan & pesanan |
| GET | `/admin/orders` 🔒 admin | Semua pesanan (filter `from`, `to`, `status`) |
| PATCH | `/admin/orders/:id/status` 🔒 admin | Ubah status: `processing`, `completed`, `cancelled` |
| GET | `/admin/services` 🔒 admin | Semua layanan |
| POST | `/admin/services` 🔒 admin | Tambah layanan |
| PATCH | `/admin/services/:id` 🔒 admin | Ubah `active` dan/atau `image_url` (hanya field yang dikirim) |
| POST | `/admin/uploads` 🔒 admin | Unggah foto (data URL base64), mengembalikan `url` |
| PUT | `/admin/settings` 🔒 admin | Atur foto beranda (`hero_image`) |
| GET | `/admin/reports` 🔒 admin | Laporan pemasukan (filter `from`, `to`) |
| GET | `/admin/customers` 🔒 admin | Daftar pelanggan + total transaksi |

### Merapikan kode
Gaya penulisan kode diatur di `.prettierrc`. Untuk merapikan semua file client dengan satu perintah:
```powershell
npx prettier --write client/src
```

## 9. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `MySQL tidak bisa dihubungi ... ECONNREFUSED` | MySQL belum menyala. Nyalakan di Laragon/XAMPP, lalu `Ctrl + C` dan `npm run dev` lagi. Jika tetap gagal, coba `DB_HOST=localhost` di `.env`, atau cek port dengan `netstat -ano \| findstr 3306`. |
| `User atau password MySQL salah` | Periksa `DB_USER` dan `DB_PASSWORD` di `.env`. |
| Database `pasarkarya` tidak muncul di phpMyAdmin | Server belum berhasil start, atau daftar belum di-refresh. Pastikan ada tulisan `listening on port 4000`, lalu refresh. |
| `Midtrans belum dikonfigurasi` | `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` belum diisi, atau server belum di-restart. |
| `Server Key Midtrans salah` | Key salah/tertukar dengan Client Key, atau memakai key Production padahal mode Sandbox. |
| Simulator: nomor VA tidak ditemukan | Salah bank, atau popup belum sampai layar nomor VA. |
| Status tidak berubah setelah membayar | Klik **Cek status**. Webhook tidak masuk di localhost, itu normal. |
| Foto gagal diunggah / tidak tampil | Pastikan file JPG/PNG/WebP. Foto tampil dari `http://localhost:4000/uploads/...`; cek backend menyala dan folder `server/uploads` bisa ditulis. |
| `EADDRINUSE` | Port 4000/5173 dipakai program lain. Tutup terminal lama yang masih menjalankan project. |
| `'npm' is not recognized` | Node.js belum terpasang, atau terminal perlu dibuka ulang setelah instalasi. |
| Halaman web kosong / layanan tidak muncul | Backend error. Lihat terminal, cari pesan merah. |

## 10. Catatan keamanan & deploy

- Jangan commit `.env` maupun `node_modules` (sudah ada di `.gitignore`). **Jangan bagikan Server Key Midtrans.**
- Akun demo hanya untuk pengujian lokal. Di production: set `NODE_ENV=production`, isi `JWT_SECRET` yang panjang dan acak (server menolak start tanpa itu), dan `SEED_DEMO=false`.
- Untuk produksi Midtrans, gunakan key Production dan set `MIDTRANS_IS_PRODUCTION=true`. Isi Notification URL dengan domain publik.
- Foto upload disimpan di disk server (`UPLOAD_DIR`). Di hosting serverless/ephemeral, foto akan hilang saat restart: pakai disk persisten atau pindahkan ke object storage.
- Pastikan hosting menyediakan MySQL yang persisten dan mengizinkan koneksi dari backend. Jika pembuatan database dari kode tidak diizinkan, buat database kosong secara manual lalu isi `DB_NAME`.

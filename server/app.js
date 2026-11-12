const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { clientUrl, uploadDir } = require('./config');
const { HttpError } = require('./utils/http');

// `app` adalah server web-nya. Di bawah ini dipasang 'penjaga' (middleware) dan daftar rute (URL) yang dilayani.
const app = express();

// CORS: mengizinkan frontend (port 5173) memanggil backend ini (port 4000). Tanpa ini browser memblokirnya.
app.use(cors({ origin: clientUrl }));
// Foto dikirim sebagai base64 di JSON (maks 5 MB asli, +/-7 MB setelah base64).
app.use(express.json({ limit: '8mb' }));

// Pastikan folder foto upload ada, lalu sajikan isinya lewat alamat /uploads/...
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir, {
  index: false,
  maxAge: '7d',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
}));

// Cek cepat apakah server hidup: buka http://localhost:4000/api/health
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'PasarKarya API' }));
// Daftar rute. Tiap file di folder routes/ mengurus satu kelompok URL:
// /api/auth (login), /api/services (katalog), /api/orders (pesanan), /api/payments (webhook Midtrans),
// /api/admin (khusus admin), /api/settings (pengaturan tampilan).
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

// Alamat /api/... yang tidak dikenal dijawab 404.
app.use('/api', (req, res, next) => next(new HttpError(404, 'Endpoint tidak ditemukan.')));

// Error handler terpusat: HttpError -> status + pesan; sisanya dicatat dan dijawab 500.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Ukuran file terlalu besar.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Format JSON tidak valid.' });
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

module.exports = app;

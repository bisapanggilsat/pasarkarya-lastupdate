// Semua pengaturan aplikasi dibaca dari file .env di satu tempat ini.
// File lain cukup memakai require('./config'), tidak ada yang membaca process.env sendiri-sendiri.
require('dotenv').config();
const path = require('path');

// Di production (saat dipublikasikan) aturannya lebih ketat, mis. JWT_SECRET wajib diisi.
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET wajib diisi di production.');
}

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  // Kunci rahasia untuk menandatangani token login (JWT). Siapa pun yang tahu kunci ini bisa memalsukan login,
  // makanya di production wajib diisi sendiri dan tidak boleh dibagikan.
  jwtSecret: process.env.JWT_SECRET || 'local-development-secret-change-me',
  clientUrl: process.env.CLIENT_URL || true,
  // Folder penyimpanan foto layanan. Untuk deploy, arahkan ke disk yang persisten lewat UPLOAD_DIR.
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'),
  // Akun & layanan demo otomatis dibuat saat development. Di production default-nya mati.
  seedDemo: process.env.SEED_DEMO ? process.env.SEED_DEMO === 'true' : !isProduction,
  // Midtrans: ambil key di dashboard.midtrans.com (Settings > Access Keys). Mode Sandbox = uji coba.
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pasarkarya'
  }
};

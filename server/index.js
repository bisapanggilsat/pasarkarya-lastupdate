const { port, seedDemo, db: dbConfig } = require('./config');
const { initDatabase } = require('./db');
const { seedDemoData } = require('./seed');
const app = require('./app');

// Urutan start server: 1) siapkan database (buat DB + tabel), 2) isi data demo (kalau diaktifkan),
// 3) baru mulai menerima request. Kalau database gagal disiapkan, server tidak dijalankan sama sekali.
async function main() {
  await initDatabase();
  if (seedDemo) await seedDemoData();
  app.listen(port, '0.0.0.0', () => console.log(`PasarKarya API listening on port ${port}`));
}

// Kalau ada yang gagal saat start, tampilkan petunjuk yang mudah dipahami lalu hentikan program.
main().catch((err) => {
  const hints = {
    ECONNREFUSED: `MySQL tidak bisa dihubungi di ${dbConfig.host}:${dbConfig.port}. Pastikan MySQL/XAMPP sudah menyala.`,
    ER_ACCESS_DENIED_ERROR: 'User atau password MySQL salah. Cek DB_USER dan DB_PASSWORD di file .env.',
    ER_BAD_DB_ERROR: `Database "${dbConfig.database}" tidak ditemukan dan gagal dibuat otomatis.`
  };
  console.error(hints[err.code] || 'Server gagal start.');
  console.error(err);
  process.exit(1);
});

// Data awal untuk demo/pengujian: akun admin + customer dan beberapa layanan.
// Aman dijalankan berulang kali: yang sudah ada tidak dibuat dobel dan tidak ditimpa.
const bcrypt = require('bcryptjs');
const { all, one, run } = require('./db');

// Password di bawah hanya untuk demo. Di database tersimpan dalam bentuk hash, bukan teks ini.
const DEMO_USERS = [
  { name: 'Administrator PasarKarya', email: 'admin@pasarkarya.test', password: 'AdminDemo123!', role: 'admin' },
  { name: 'Pelanggan Demo', email: 'pelanggan@pasarkarya.test', password: 'Pelanggan123!', role: 'customer' },
  { name: 'Siti Rahma', email: 'siti@pasarkarya.test', password: 'SitiDemo123!', role: 'customer' },
  { name: 'Budi Santoso', email: 'budi@pasarkarya.test', password: 'BudiDemo123!', role: 'customer' },
  { name: 'Maya Putri', email: 'maya@pasarkarya.test', password: 'MayaDemo123!', role: 'customer' },
  { name: 'Andi Pratama', email: 'andi@pasarkarya.test', password: 'AndiDemo123!', role: 'customer' },
  { name: 'Rani Amelia', email: 'rani@pasarkarya.test', password: 'RaniDemo123!', role: 'customer' }
];

// [title, category, description, price, turnaround, featured]
const DEMO_SERVICES = [
  ['Social Media Management', 'Media Sosial', 'Pengelolaan kalender konten, penjadwalan, dan evaluasi performa media sosial untuk bisnis Anda.', 1250000, '30 hari', 1],
  ['Paket Konten Instagram', 'Pembuatan Konten', 'Ide konten, caption, dan desain visual yang konsisten dengan identitas brand.', 850000, '7 hari', 1],
  ['Desain Promo & Campaign', 'Desain Promosi', 'Materi promosi digital untuk katalog, diskon, launching produk, dan campaign musiman.', 350000, '3 hari', 0],
  ['Website Optimization', 'Optimisasi Website', 'Audit dasar performa, SEO on-page, struktur konten, dan rekomendasi peningkatan website.', 1500000, '10 hari', 1],
  ['Brand Starter Kit', 'Desain Promosi', 'Paket aset visual awal untuk membantu UMKM tampil konsisten di kanal digital.', 650000, '5 hari', 0],
  ['SEO Content Plan', 'Optimisasi Website', 'Riset topik dan kalender konten SEO yang disesuaikan dengan target pelanggan.', 550000, '5 hari', 0]
];

// Idempotent: akun yang emailnya sudah ada dilewati, layanan hanya diisi kalau tabel masih kosong.
async function seedDemoData() {
  // Ambil email yang sudah ada supaya hanya akun yang belum ada yang dibuat (hash bcrypt itu lambat,
  // jadi tidak dihitung percuma).
  const existing = new Set((await all('SELECT email FROM users')).map((u) => u.email));
  for (const user of DEMO_USERS) {
    if (existing.has(user.email)) continue;
    await run('INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
      user.name,
      user.email,
      bcrypt.hashSync(user.password, 10),
      user.role
    ]);
  }

  // Layanan demo hanya dimasukkan kalau tabelnya masih kosong.
  if (!(await one('SELECT id FROM services LIMIT 1'))) {
    await run(
      'INSERT INTO services (title, category, description, price, turnaround, featured) VALUES ?',
      [DEMO_SERVICES]
    );
  }
}

module.exports = { seedDemoData };

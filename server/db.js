// Koneksi ke MySQL. File lain memakai fungsi bantu all / one / run di bawah, jadi tidak perlu membuat koneksi sendiri.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { db: cfg } = require('./config');

// Pool = kumpulan koneksi yang dipakai bergantian, lebih efisien daripada membuka koneksi baru di setiap request.
const pool = mysql.createPool({
  host: cfg.host,
  port: cfg.port,
  user: cfg.user,
  password: cfg.password,
  database: cfg.database,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  // Tanggal dikembalikan sebagai string 'YYYY-MM-DD HH:MM:SS' (UTC), sama seperti format SQLite
  // sebelumnya, sehingga frontend tidak perlu diubah.
  dateStrings: true,
  // SUM() di MySQL bertipe DECIMAL; paksa jadi number biasa supaya JSON-nya angka, bukan string.
  decimalNumbers: true
});

// Semua koneksi memakai UTC agar CURRENT_TIMESTAMP konsisten.
pool.pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));

// Tiga fungsi bantu untuk query. Tanda `?` di SQL diisi dari array params, jadi input pengguna tidak pernah
// disambung langsung ke teks SQL (ini mencegah serangan SQL injection).
//   all = semua baris hasil | one = baris pertama saja | run = INSERT/UPDATE/DELETE
const all = async (sql, params = []) => (await pool.query(sql, params))[0];
const one = async (sql, params = []) => (await all(sql, params))[0];
// Untuk INSERT/UPDATE/DELETE: hasilnya punya insertId dan affectedRows.
const run = async (sql, params = []) => (await pool.query(sql, params))[0];

// Tambah kolom ke tabel yang sudah ada (CREATE TABLE IF NOT EXISTS tidak mengubah tabel lama).
async function ensureColumn(table, column, definition) {
  const exists = await one(
    'SELECT 1 AS found FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  if (!exists) await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

// Buat database kalau belum ada, lalu buat tabel. Dipanggil sekali saat server start.
async function initDatabase() {
  const bootstrap = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password
  });
  try {
    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS ${bootstrap.escapeId(cfg.database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await bootstrap.end();
  }

  const schema = fs
    .readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    .replace(/^\s*--.*$/gm, ''); // buang komentar dulu supaya tidak ikut ter-split
  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Jalankan tiap perintah CREATE TABLE satu per satu.
  for (const statement of statements) {
    await pool.query(statement);
  }

  // Migrasi untuk database yang dibuat sebelum kolom-kolom ini ada.
  await ensureColumn('orders', 'midtrans_token', 'VARCHAR(100) NULL DEFAULT NULL');
  await ensureColumn('services', 'image_url', 'VARCHAR(255) NULL DEFAULT NULL');
}

module.exports = { pool, all, one, run, initDatabase };

// Semua rute di sini khusus admin: ringkasan, pesanan, layanan, foto, laporan, dan pelanggan.
const express = require('express');
const { all, one, run } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { HttpError, asyncHandler, dateRange } = require('../utils/http');
const { saveImageFromDataUrl, deleteStoredImage, isStoredImageUrl } = require('../utils/images');

const router = express.Router();
// Dua penjaga berlapis: harus login DAN harus admin.
router.use(requireAuth, requireAdmin);

const ADMIN_ORDER_STATUSES = ['processing', 'completed', 'cancelled'];

// ---------- Ringkasan ----------
// Angka ringkasan dashboard. COUNT dan SUM dihitung langsung oleh database; revenue hanya menjumlah pesanan lunas.
router.get('/overview', asyncHandler(async (req, res) => {
  const totals = await one(`
    SELECT
      COUNT(*) AS orders,
      CAST(COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS UNSIGNED) AS revenue,
      COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS pending,
      COUNT(CASE WHEN order_status = 'processing' THEN 1 END) AS processing
    FROM orders`);
  const recent = await all(`
    SELECT o.*, u.name AS customer_name, s.title AS service_title
    FROM orders o
    JOIN users u ON u.id = o.user_id
    JOIN services s ON s.id = o.service_id
    ORDER BY o.id DESC LIMIT 8`);
  res.json({ totals, recent });
}));

// ---------- Pesanan ----------
// Daftar semua pesanan, bisa difilter lewat query: ?from=&to=&status=
router.get('/orders', asyncHandler(async (req, res) => {
  const { from, to, status } = req.query;
  const range = dateRange('o.created_at', from, to);
  const clauses = [...range.clauses];
  const params = [...range.params];
  if (status) {
    clauses.push('o.payment_status = ?');
    params.push(status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  res.json(await all(
    `SELECT o.*, u.name AS customer_name, u.email, s.title AS service_title
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN services s ON s.id = o.service_id
     ${where}
     ORDER BY o.id DESC`,
    params
  ));
}));

// Admin mengubah tahap pengerjaan. Aturannya: hanya pesanan yang sudah dibayar, dan pesanan yang sudah
// selesai/dibatalkan tidak bisa diubah lagi.
router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!ADMIN_ORDER_STATUSES.includes(status)) throw new HttpError(422, 'Status tidak valid.');

  const order = await one('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) throw new HttpError(404, 'Pesanan tidak ditemukan.');
  if (order.payment_status !== 'paid') throw new HttpError(409, 'Pesanan belum dibayar.');

  const result = await run(
    "UPDATE orders SET order_status = ? WHERE id = ? AND order_status NOT IN ('completed', 'cancelled')",
    [status, order.id]
  );
  if (result.affectedRows === 0) throw new HttpError(409, 'Pesanan sudah berstatus akhir.');
  res.json({ ok: true });
}));

// ---------- Layanan ----------
router.get('/services', asyncHandler(async (req, res) => {
  res.json(await all('SELECT * FROM services ORDER BY id DESC'));
}));

// Tambah layanan baru (semua field wajib; harga harus bilangan bulat positif; foto opsional).
router.post('/services', asyncHandler(async (req, res) => {
  const { title, category, description, price, turnaround, image_url: imageUrl } = req.body || {};
  if (!title || !category || !description || !turnaround || !Number.isInteger(Number(price)) || Number(price) < 1) {
    throw new HttpError(422, 'Semua field layanan wajib diisi dengan benar.');
  }
  if (imageUrl && !isStoredImageUrl(imageUrl)) throw new HttpError(422, 'Foto layanan tidak valid.');
  const result = await run(
    'INSERT INTO services (title, category, description, price, turnaround, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [title, category, description, Number(price), turnaround, imageUrl || null]
  );
  res.status(201).json({ id: result.insertId });
}));

// Ubah layanan: aktif/nonaktif dan/atau foto. Hanya field yang dikirim yang diubah.
router.patch('/services/:id', asyncHandler(async (req, res) => {
  const service = await one('SELECT id, image_url FROM services WHERE id = ?', [req.params.id]);
  if (!service) throw new HttpError(404, 'Layanan tidak ditemukan.');
  const body = req.body || {};

  // Hanya field yang dikirim yang diubah.
  if ('active' in body) {
    await run('UPDATE services SET active = ? WHERE id = ?', [body.active ? 1 : 0, service.id]);
  }
  if ('image_url' in body) {
    if (body.image_url && !isStoredImageUrl(body.image_url)) throw new HttpError(422, 'Foto layanan tidak valid.');
    await run('UPDATE services SET image_url = ? WHERE id = ?', [body.image_url || null, service.id]);
    if (service.image_url !== body.image_url) await deleteStoredImage(service.image_url);
  }
  res.json({ ok: true });
}));

// ---------- Foto & tampilan ----------
// Terima foto (data URL base64), periksa dan simpan sebagai file, lalu kembalikan path-nya.
router.post('/uploads', asyncHandler(async (req, res) => {
  res.status(201).json({ url: await saveImageFromDataUrl(req.body?.data) });
}));

// Atur foto beranda. Foto lama dihapus dari disk supaya folder uploads tidak menumpuk.
router.put('/settings', asyncHandler(async (req, res) => {
  const heroImage = req.body?.hero_image || null;
  if (heroImage && !isStoredImageUrl(heroImage)) throw new HttpError(422, 'Foto tidak valid.');

  const previous = await one("SELECT setting_value FROM settings WHERE setting_key = 'hero_image'");
  await run(
    "INSERT INTO settings (setting_key, setting_value) VALUES ('hero_image', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
    [heroImage, heroImage]
  );
  if (previous?.setting_value && previous.setting_value !== heroImage) await deleteStoredImage(previous.setting_value);
  res.json({ ok: true });
}));

// ---------- Laporan ----------
// Laporan pemasukan: hanya pesanan yang sudah lunas, bisa dibatasi rentang tanggal. Totalnya dijumlah di sini.
router.get('/reports', asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const range = dateRange('o.created_at', from, to);
  const clauses = ["o.payment_status = 'paid'", ...range.clauses];
  const rows = await all(
    `SELECT o.invoice_no, o.created_at, o.amount, o.payment_status, o.order_status, o.payment_method,
            u.name AS customer_name, s.title AS service_title
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN services s ON s.id = o.service_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY o.created_at DESC`,
    range.params
  );
  res.json({ rows, total: rows.reduce((sum, r) => sum + r.amount, 0), count: rows.length });
}));

// ---------- Pelanggan ----------
// Daftar pelanggan beserta jumlah pesanan dan total belanja (LEFT JOIN: pelanggan tanpa pesanan tetap muncul).
router.get('/customers', asyncHandler(async (req, res) => {
  res.json(await all(`
    SELECT u.id, u.name, u.email, u.created_at,
           COUNT(o.id) AS orders,
           CAST(COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.amount ELSE 0 END), 0) AS UNSIGNED) AS spent
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.role = 'customer'
    GROUP BY u.id, u.name, u.email, u.created_at
    ORDER BY u.id DESC`));
}));

module.exports = router;

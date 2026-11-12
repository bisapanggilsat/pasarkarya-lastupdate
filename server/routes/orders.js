// Pesanan milik customer yang sedang login, plus alur pembayaran lewat Midtrans.
const express = require('express');
const crypto = require('crypto');
const { all, one, run } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { HttpError, asyncHandler } = require('../utils/http');
const midtrans = require('../services/midtrans');
const { applyMidtransResult } = require('../services/payments');

const router = express.Router();
// Metode pembayaran yang boleh dipilih di form pesanan.
const PAYMENT_METHODS = ['qris', 'bank_transfer', 'ewallet'];

const generateInvoiceNo = () => `PK-${Date.now().toString().slice(-9)}${crypto.randomInt(10, 100)}`;

const ORDER_WITH_SERVICE = `
  SELECT o.*, s.title AS service_title
  FROM orders o JOIN services s ON s.id = o.service_id`;

// Semua rute di file ini wajib login.
router.use(requireAuth);

// Buat pesanan. Harga diambil dari database (bukan dari kiriman browser), jadi tidak bisa dimanipulasi
// dengan mengubah angka di sisi pengguna.
router.post('/', asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') throw new HttpError(403, 'Admin tidak dapat membuat pesanan pelanggan.');

  const { serviceId, brief, paymentMethod } = req.body || {};
  const service = await one('SELECT * FROM services WHERE id = ? AND active = 1', [serviceId]);
  if (!service || !brief?.trim() || !PAYMENT_METHODS.includes(paymentMethod)) {
    throw new HttpError(422, 'Periksa layanan, brief, dan metode pembayaran.');
  }

  const result = await run(
    'INSERT INTO orders (invoice_no, user_id, service_id, brief, amount, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
    [generateInvoiceNo(), req.user.id, service.id, brief.trim(), service.price, paymentMethod]
  );
  const order = await one(
    `SELECT o.*, s.title AS service_title, u.name AS customer_name
     FROM orders o
     JOIN services s ON s.id = o.service_id
     JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [result.insertId]
  );
  res.status(201).json(order);
}));

// Daftar pesanan milik user yang sedang login saja.
router.get('/mine', asyncHandler(async (req, res) => {
  res.json(await all(`${ORDER_WITH_SERVICE} WHERE o.user_id = ? ORDER BY o.id DESC`, [req.user.id]));
}));

// Ambil pesanan sekaligus memastikan pesanan itu milik user yang sedang login (orang lain tidak boleh
// membayar atau mengintip pesanan yang bukan miliknya).
async function findOwnedOrder(req) {
  const order = await one('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) throw new HttpError(404, 'Pesanan tidak ditemukan.');
  if (order.user_id !== req.user.id || req.user.role !== 'customer') {
    throw new HttpError(403, 'Tidak memiliki akses ke pesanan ini.');
  }
  return order;
}

const findOrderWithService = (id) => one(`${ORDER_WITH_SERVICE} WHERE o.id = ?`, [id]);

// Langkah 1 pembayaran: minta token Snap ke Midtrans. Frontend memakainya untuk membuka popup bayar.
router.post('/:id/snap-token', asyncHandler(async (req, res) => {
  if (!midtrans.isConfigured()) {
    throw new HttpError(503, 'Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env.');
  }
  const order = await findOwnedOrder(req);
  if (order.payment_status === 'paid') throw new HttpError(409, 'Pesanan sudah dibayar.');
  if (order.order_status === 'cancelled') throw new HttpError(409, 'Pesanan sudah dibatalkan atau kedaluwarsa.');

  // Midtrans menolak order_id yang sama dua kali, jadi token dibuat sekali lalu dipakai ulang.
  let token = order.midtrans_token;
  if (!token) {
    const service = await one('SELECT * FROM services WHERE id = ?', [order.service_id]);
    const customer = await one('SELECT name, email FROM users WHERE id = ?', [order.user_id]);
    token = await midtrans.createSnapToken({ order, service, customer });
    await run('UPDATE orders SET midtrans_token = ? WHERE id = ?', [token, order.id]);
  }
  res.json({ token, clientKey: midtrans.clientKey, snapJsUrl: midtrans.snapJsUrl });
}));

// Langkah 2: tanya status ke Midtrans lalu perbarui pesanan. Dipakai setelah popup ditutup dan oleh
// tombol "Cek status", jadi pembayaran tetap tercatat walau webhook belum bisa masuk (mis. di localhost).
router.post('/:id/sync', asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req);
  if (order.payment_status === 'pending' && order.midtrans_token) {
    const status = await midtrans.getTransactionStatus(order.invoice_no);
    if (status) await applyMidtransResult(order, status);
  }
  res.json(await findOrderWithService(order.id));
}));

module.exports = router;

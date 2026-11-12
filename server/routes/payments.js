const express = require('express');
const { one } = require('../db');
const midtrans = require('../services/midtrans');
const { applyMidtransResult } = require('../services/payments');
const { HttpError, asyncHandler } = require('../utils/http');

const router = express.Router();

// Webhook dari Midtrans. Publik (tanpa login), tapi dijaga dengan verifikasi signature.
// Daftarkan URL-nya di dashboard Midtrans: Settings > Payment > Notification URL
//   https://<url-publik-kamu>/api/payments/midtrans/notification
router.post('/midtrans/notification', asyncHandler(async (req, res) => {
  const notification = req.body || {};
  if (!midtrans.verifySignature(notification)) throw new HttpError(403, 'Signature tidak valid.');

  const order = await one('SELECT * FROM orders WHERE invoice_no = ?', [notification.order_id]);
  // Notifikasi uji dari dashboard Midtrans memakai order_id palsu: cukup dijawab 200.
  if (order) await applyMidtransResult(order, notification);
  res.json({ ok: true });
}));

module.exports = router;

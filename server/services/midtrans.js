// Klien tipis untuk Midtrans (Snap + Status API) memakai fetch bawaan Node 18+. Tanpa library tambahan.
const crypto = require('crypto');
const { midtrans: cfg } = require('../config');
const { HttpError } = require('../utils/http');

const SNAP_JS_URL = cfg.isProduction
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';
const SNAP_API = cfg.isProduction
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
const CORE_API = cfg.isProduction ? 'https://api.midtrans.com/v2' : 'https://api.sandbox.midtrans.com/v2';

const isConfigured = () => Boolean(cfg.serverKey && cfg.clientKey);

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${cfg.serverKey}:`).toString('base64')}`
      }
    });
  } catch (err) {
    console.error('Midtrans tidak terjangkau:', err.message);
    throw new HttpError(502, 'Tidak bisa menghubungi Midtrans. Periksa koneksi internet.');
  }
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

// Minta token Snap untuk satu pesanan. order_id di Midtrans = nomor invoice kita.
async function createSnapToken({ order, service, customer }) {
  const { res, data } = await request(SNAP_API, {
    method: 'POST',
    body: JSON.stringify({
      transaction_details: { order_id: order.invoice_no, gross_amount: order.amount },
      item_details: [{ id: String(service.id), price: order.amount, quantity: 1, name: service.title.slice(0, 50) }],
      customer_details: { first_name: customer.name, email: customer.email }
    })
  });
  if (!res.ok || !data.token) {
    console.error('Midtrans menolak permintaan Snap:', res.status, data);
    if (res.status === 401) throw new HttpError(502, 'Server Key Midtrans salah. Periksa MIDTRANS_SERVER_KEY di .env.');
    throw new HttpError(502, `Midtrans menolak permintaan: ${(data.error_messages || []).join(', ') || res.status}`);
  }
  return data.token;
}

// Tanya status transaksi langsung ke Midtrans. Hasil null = Midtrans belum punya transaksi ini.
async function getTransactionStatus(orderId) {
  const { res, data } = await request(`${CORE_API}/${encodeURIComponent(orderId)}/status`);
  if (res.status === 401 || data.status_code === '401') {
    throw new HttpError(502, 'Server Key Midtrans salah. Periksa MIDTRANS_SERVER_KEY di .env.');
  }
  // Midtrans kadang membalas HTTP 200 dengan status_code "404" di body.
  if (res.status === 404 || data.status_code === '404') return null;
  if (!res.ok) throw new HttpError(502, 'Gagal mengambil status pembayaran dari Midtrans.');
  return data;
}

// Tanda tangan notifikasi: SHA512(order_id + status_code + gross_amount + ServerKey).
function verifySignature(n) {
  if (!n || !n.order_id || !n.status_code || !n.gross_amount || !n.signature_key || !cfg.serverKey) return false;
  const expected = crypto
    .createHash('sha512')
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${cfg.serverKey}`)
    .digest('hex');
  const given = Buffer.from(String(n.signature_key));
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

// Ringkas status Midtrans jadi 3 kemungkinan: paid | failed | pending.
function resolveOutcome({ transaction_status: status, fraud_status: fraud }) {
  if (status === 'settlement') return 'paid';
  if (status === 'capture') return fraud === 'challenge' ? 'pending' : 'paid';
  if (['deny', 'cancel', 'expire', 'failure'].includes(status)) return 'failed';
  return 'pending';
}

// Petakan payment_type Midtrans ke 3 metode yang dikenal aplikasi. null = biarkan apa adanya.
function mapPaymentType(type) {
  if (type === 'qris') return 'qris';
  if (['gopay', 'shopeepay', 'dana', 'ovo', 'linkaja'].includes(type)) return 'ewallet';
  if (['bank_transfer', 'echannel'].includes(type)) return 'bank_transfer';
  return null;
}

module.exports = {
  isConfigured,
  clientKey: cfg.clientKey,
  snapJsUrl: SNAP_JS_URL,
  createSnapToken,
  getTransactionStatus,
  verifySignature,
  resolveOutcome,
  mapPaymentType
};

const { run } = require('../db');
const { HttpError } = require('../utils/http');
const midtrans = require('./midtrans');

// Terapkan status dari Midtrans (hasil webhook atau cek status) ke tabel orders.
// Dipakai dua jalur sekaligus, dan aman dipanggil berulang (idempotent).
async function applyMidtransResult(order, data) {
  if (Number(data.gross_amount) !== order.amount) {
    throw new HttpError(400, 'Nominal pembayaran tidak sesuai dengan pesanan.');
  }

  const outcome = midtrans.resolveOutcome(data);

  // Kondisi di WHERE memastikan pesanan yang sudah lunas/dibatalkan tidak tertimpa.
  if (outcome === 'paid') {
    await run(
      `UPDATE orders
       SET payment_status = 'paid', order_status = 'processing', payment_method = COALESCE(?, payment_method)
       WHERE id = ? AND payment_status = 'pending' AND order_status = 'waiting_payment'`,
      [midtrans.mapPaymentType(data.payment_type), order.id]
    );
  } else if (outcome === 'failed') {
    await run(
      "UPDATE orders SET order_status = 'cancelled' WHERE id = ? AND payment_status = 'pending' AND order_status = 'waiting_payment'",
      [order.id]
    );
  }
  return outcome;
}

module.exports = { applyMidtransResult };

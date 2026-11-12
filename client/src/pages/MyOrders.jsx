import { useEffect, useState } from 'react';
import { request } from '../lib/api.js';
import { payWithSnap } from '../lib/payment.js';
import { FileText, ShoppingBag } from 'lucide-react';
import { date, money } from '../lib/format.js';
import Status from '../components/Status.jsx';
import { Link } from 'react-router-dom';
import InvoiceModal from '../components/InvoiceModal.jsx';

// Halaman 'Pesanan saya': daftar pesanan milik user, plus tombol bayar (Midtrans) dan cek status.
function MyOrders({ user, openAuth, toast }) {
  const [orders, setOrders] = useState([]);
  // busy = id pesanan yang sedang diproses (0 = tidak ada), untuk menonaktifkan tombolnya.
  const [busy, setBusy] = useState(0);
  const [invoice, setInvoice] = useState(null);
  // Ambil ulang daftar pesanan dari backend.
  const load = () =>
    request('/orders/mine')
      .then(setOrders)
      .catch((e) => toast(e.message));
  // Muat pesanan saat halaman dibuka (hanya kalau sudah login).
  useEffect(() => {
    if (user) load();
  }, [user]);
  // Klik 'Bayar sekarang': buka popup Midtrans (lib/payment.js). Setelah popup selesai atau ditutup, server
  // menanyakan status ke Midtrans, lalu daftar pesanan dimuat ulang.
  async function pay(id) {
    setBusy(id);
    try {
      const { result, order } = await payWithSnap(request, id);
      if (order.payment_status === 'paid') toast('Pembayaran berhasil. Terima kasih!');
      else if (order.order_status === 'cancelled') toast('Pembayaran dibatalkan atau kedaluwarsa.');
      else if (result === 'pending')
        toast('Menunggu pembayaran. Selesaikan pembayaran, lalu klik Cek status.');
      load();
    } catch (e) {
      toast(e.message);
      load();
    } finally {
      setBusy(0);
    }
  }
  // Klik 'Cek status': minta server menanyakan status pembayaran ke Midtrans
  // (berguna setelah membayar lewat simulator).
  async function check(id) {
    setBusy(id);
    try {
      const order = await request(`/orders/${id}/sync`, { method: 'POST' });
      toast(
        order.payment_status === 'paid'
          ? 'Pembayaran sudah diterima.'
          : order.order_status === 'cancelled'
            ? 'Pembayaran dibatalkan atau kedaluwarsa.'
            : 'Pembayaran belum diterima.',
      );
      load();
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(0);
    }
  }
  if (!user)
    return (
      <main className="page-shell">
        <div className="empty-state">
          <ShoppingBag size={30} />
          <h2>Masuk untuk melihat pesanan</h2>
          <button className="btn btn-primary" onClick={openAuth}>
            Masuk / Daftar
          </button>
        </div>
      </main>
    );
  return (
    <main className="page-shell">
      <div className="page-intro compact">
        <div className="eyebrow">YOUR WORKSPACE</div>
        <h1>
          Pesanan <em>saya.</em>
        </h1>
        <p>Pantau pembayaran dan perkembangan layananmu.</p>
      </div>
      <div className="order-list">
        {orders.map((o) => (
          <div className="order-card" key={o.id}>
            <div className="order-main">
              <span className="category">{o.invoice_no}</span>
              <h3>{o.service_title}</h3>
              <small>
                Dibuat {date(o.created_at)} · {money(o.amount)}
              </small>
            </div>
            <div className="order-state">
              <Status
                value={
                  o.payment_status === 'paid' || o.order_status === 'cancelled'
                    ? o.order_status
                    : o.payment_status
                }
              />
              {o.payment_status === 'paid' ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setInvoice(o)}>
                  Invoice <FileText size={15} />
                </button>
              ) : (
                o.order_status !== 'cancelled' && (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={busy === o.id}
                      onClick={() => pay(o.id)}
                    >
                      {busy === o.id ? 'Memproses...' : 'Bayar sekarang'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={busy === o.id}
                      onClick={() => check(o.id)}
                    >
                      Cek status
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        ))}
        {!orders.length && (
          <div className="empty-state">
            Belum ada pesanan. <Link to="/layanan">Jelajahi layanan →</Link>
          </div>
        )}
      </div>
      {invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)} />}
    </main>
  );
}

export default MyOrders;

import { useEffect, useState } from 'react';
import { imgSrc, request } from '../lib/api.js';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, CheckCircle2, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import { money } from '../lib/format.js';

// Halaman detail satu layanan, plus form pemesanan (brief dan metode pembayaran).
function ServiceDetail({ user, toast, openAuth }) {
  // id layanan diambil dari alamat URL.
  const id = requireParams();
  const [s, setS] = useState(null);
  const [brief, setBrief] = useState('');
  const [method, setMethod] = useState('qris');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  // Ambil data layanan dari backend setiap kali id di URL berubah.
  useEffect(() => {
    request('/services/' + id)
      .then(setS)
      .catch(() => setS(null));
  }, [id]);
  // Tombol 'Buat pesanan': harus login dan brief wajib diisi. Pesanan dibuat dulu dengan status menunggu
  // pembayaran; pembayarannya dilakukan nanti di halaman Pesanan.
  async function checkout() {
    if (!user) {
      openAuth();
      return;
    }
    if (!brief.trim()) {
      toast('Ceritakan sedikit kebutuhan bisnismu terlebih dahulu.');
      return;
    }
    setLoading(true);
    try {
      const o = await request('/orders', {
        method: 'POST',
        body: JSON.stringify({ serviceId: Number(id), brief, paymentMethod: method }),
      });
      setCreated(o);
    } catch (e) {
      toast(e.message);
    } finally {
      setLoading(false);
    }
  }
  if (!s)
    return (
      <main className="page-shell">
        <div className="empty-state">Layanan tidak ditemukan.</div>
      </main>
    );
  return (
    <main className="page-shell detail-layout">
      <div>
        <Link to="/layanan" className="back-link">
          ← Kembali ke layanan
        </Link>
        <div className={'detail-visual' + (s.image_url ? ' has-photo' : '')}>
          {s.image_url ? (
            <img className="detail-photo" src={imgSrc(s.image_url)} alt={s.title} />
          ) : (
            <>
              <span className="eyebrow">PASARKARYA / SERVICE 0{s.id}</span>
              <div className="detail-icon">
                <Sparkles size={48} />
              </div>
              <span className="detail-word">
                Make your
                <br />
                <em>next move.</em>
              </span>
            </>
          )}
        </div>
        <div className="detail-content">
          <span className="category">{s.category}</span>
          <h1>{s.title}</h1>
          <p>{s.description}</p>
          <div className="detail-facts">
            <span>
              <Clock3 size={16} /> Estimasi pengerjaan <b>{s.turnaround}</b>
            </span>
            <span>
              <ShieldCheck size={16} /> Brief & progres terpantau
            </span>
          </div>
          <h3>Apa yang kamu dapatkan</h3>
          <ul className="check-list">
            <li>
              <Check /> Diskusi kebutuhan dan tujuan bisnis
            </li>
            <li>
              <Check /> Output sesuai ruang lingkup layanan
            </li>
            <li>
              <Check /> Update progres melalui status pesanan
            </li>
          </ul>
        </div>
      </div>
      <aside className="checkout-card">
        <span className="eyebrow">RINGKASAN PESANAN</span>
        <h3>{s.title}</h3>
        <div className="price-line">
          <span>Harga layanan</span>
          <b>{money(s.price)}</b>
        </div>
        <label className="field-label">Ceritakan kebutuhanmu</label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Contoh: Saya punya usaha kuliner dan ingin meningkatkan engagement Instagram..."
          rows="5"
        />
        <label className="field-label">Metode pembayaran</label>
        <div className="payment-options">
          {[
            ['qris', 'QRIS'],
            ['bank_transfer', 'Transfer bank'],
            ['ewallet', 'E-wallet'],
          ].map(([v, l]) => (
            <button
              key={v}
              className={method === v ? 'payment-option selected' : 'payment-option'}
              onClick={() => setMethod(v)}
            >
              {l}
              {method === v && <CheckCircle2 size={16} />}
            </button>
          ))}
        </div>
        <div className="price-total">
          <span>Total pembayaran</span>
          <b>{money(s.price)}</b>
        </div>
        <button className="btn btn-primary btn-block" onClick={checkout} disabled={loading}>
          {loading ? 'Memproses...' : 'Buat pesanan'} <ArrowUpRight size={17} />
        </button>
        <small className="secure-note">
          <ShieldCheck size={14} /> Pembayaran via Midtrans Sandbox (mode uji, tanpa uang asli).
        </small>
        {created && (
          <div className="created-box">
            <CheckCircle2 />
            <b>Pesanan berhasil dibuat!</b>
            <span>{created.invoice_no}</span>
            <Link to="/pesanan">Lihat pesanan & bayar →</Link>
          </div>
        )}
      </aside>
    </main>
  );
}

// Mengambil bagian terakhir URL, mis. '/layanan/3' menjadi '3'.
function requireParams() {
  return window.location.pathname.split('/').pop();
}

export default ServiceDetail;

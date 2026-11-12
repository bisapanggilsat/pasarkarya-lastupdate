import { useState } from 'react';
import { request } from '../lib/api.js';
import { ArrowUpRight, Command, X } from 'lucide-react';

// Popup Masuk/Daftar. Satu form dipakai untuk dua mode; `mode` menentukan endpoint yang dipanggil.
function AuthModal({ mode, setMode, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Kirim form ke /auth/login atau /auth/register. Kalau sukses, onSuccess() (fungsi login di App.jsx) dijalankan;
  // kalau gagal, pesan error dari server ditampilkan di form.
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const d = await request('/auth/' + (mode === 'login' ? 'login' : 'register'), {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onSuccess(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="auth-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        <span className="brand">
          <span className="brandmark">
            <Command size={18} />
          </span>{' '}
          pasar<span className="brandaccent">karya.</span>
        </span>
        <div className="eyebrow">WELCOME TO YOUR NEXT CHAPTER</div>
        <h2>{mode === 'login' ? 'Senang melihatmu lagi.' : 'Mulai tumbuh bersama.'}</h2>
        <p>
          {mode === 'login'
            ? 'Masuk untuk mengelola pesanan dan progresmu.'
            : 'Buat akun pelanggan PasarKarya dalam beberapa langkah.'}
        </p>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label>Nama lengkap</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama kamu"
              />
            </>
          )}
          <label>Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="nama@email.com"
          />
          <label>Password</label>
          <input
            type="password"
            minLength="8"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimal 8 karakter"
          />
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Tunggu sebentar...' : mode === 'login' ? 'Masuk ke akun' : 'Buat akun'}{' '}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <div className="auth-switch">
          {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
          </button>
        </div>
        <div className="demo-hint">- · -</div>
      </div>
    </div>
  );
}

export default AuthModal;

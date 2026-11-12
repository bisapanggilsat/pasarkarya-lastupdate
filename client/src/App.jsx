import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { request } from './lib/api.js';
import { ArrowUpRight, CheckCircle2, Command, LogOut, Menu } from 'lucide-react';
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import MyOrders from './pages/MyOrders.jsx';
import Admin from './pages/Admin.jsx';
import Footer from './components/Footer.jsx';
import AuthModal from './components/AuthModal.jsx';

// Komponen utama aplikasi: navbar, daftar halaman (routing), footer, dan data yang dipakai bersama
// seperti user yang sedang login. Halaman-halamannya ada di folder pages/.
function App() {
  // useState = 'ingatan' komponen. Kalau nilainya diubah lewat setXxx, tampilan otomatis ter-update.
  // user diisi dari localStorage supaya tetap login walau halaman di-refresh.
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pk_user') || 'null'));
  const [services, setServices] = useState([]);
  // toast = pesan singkat yang muncul di pojok layar (mis. 'Berhasil masuk').
  const [toast, setToast] = useState('');
  const [mobile, setMobile] = useState(false);
  const nav = useNavigate();
  // authOpen = apakah popup Masuk/Daftar sedang terbuka. authMode = 'login' atau 'register'.
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  // useEffect dengan [] di akhir = dijalankan sekali saat aplikasi pertama dibuka.
  // Di sini: ambil daftar layanan dari backend.
  useEffect(() => {
    request('/services')
      .then(setServices)
      .catch(() => {});
  }, []);
  // Setiap kali toast berubah, pasang timer: pesan hilang sendiri setelah 3,2 detik.
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  // Dipanggil setelah login/daftar berhasil. Token (tiket masuk dari server) disimpan di browser, lalu dikirim
  // di setiap request berikutnya (lihat lib/api.js). Admin langsung diarahkan ke /admin.
  function login(data) {
    localStorage.setItem('pk_token', data.token);
    localStorage.setItem('pk_user', JSON.stringify(data.user));
    setUser(data.user);
    setAuthOpen(false);
    setToast('Berhasil masuk. Selamat datang kembali!');
    nav(data.user.role === 'admin' ? '/admin' : '/');
  }
  // Keluar: hapus token dan data user dari browser.
  function logout() {
    localStorage.removeItem('pk_token');
    localStorage.removeItem('pk_user');
    setUser(null);
    nav('/');
    setToast('Anda telah keluar.');
  }
  // Penanda apakah user yang login adalah admin (dipakai untuk menampilkan menu Admin).
  const isAdmin = user?.role === 'admin';
  return (
    <>
      <header className="topbar">
        <div className="navwrap">
          <Link to="/" className="brand">
            <span className="brandmark">
              <Command size={19} />
            </span>
            <span>
              pasar<span className="brandaccent">karya.</span>
            </span>
          </Link>
          <nav className={mobile ? 'navlinks open' : 'navlinks'}>
            <Link to="/layanan" onClick={() => setMobile(false)}>
              Jelajahi layanan
            </Link>
            <a href="/#cara-kerja" onClick={() => setMobile(false)}>
              Cara kerja
            </a>
            <a href="/#tentang" onClick={() => setMobile(false)}>
              Tentang kami
            </a>
          </nav>
          <div className="navactions">
            {user ? (
              <>
                <span className="navhello">Halo, {user.name.split(' ')[0]}</span>
                {isAdmin ? (
                  <Link className="btn btn-dark btn-sm" to="/admin">
                    Dashboard <ArrowUpRight size={15} />
                  </Link>
                ) : (
                  <Link className="btn btn-dark btn-sm" to="/pesanan">
                    Pesanan saya
                  </Link>
                )}
                <button className="iconbtn" title="Keluar" onClick={logout}>
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthOpen(true);
                  }}
                >
                  Masuk
                </button>
                <button
                  className="btn btn-dark btn-sm"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthOpen(true);
                  }}
                >
                  Mulai sekarang <ArrowUpRight size={15} />
                </button>
              </>
            )}
            <button className="mobile-toggle iconbtn" onClick={() => setMobile(!mobile)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>
      {/* Routing: alamat (URL) di browser menentukan halaman mana yang ditampilkan. */}
      <Routes>
        <Route
          path="/"
          element={
            <Home
              services={services}
              user={user}
              openAuth={() => setAuthOpen(true)}
              toast={setToast}
            />
          }
        />
        <Route
          path="/layanan"
          element={
            <Services
              services={services}
              user={user}
              toast={setToast}
              openAuth={() => setAuthOpen(true)}
            />
          }
        />
        <Route
          path="/layanan/:id"
          element={
            <ServiceDetail user={user} toast={setToast} openAuth={() => setAuthOpen(true)} />
          }
        />
        <Route
          path="/pesanan"
          element={<MyOrders user={user} toast={setToast} openAuth={() => setAuthOpen(true)} />}
        />
        <Route path="/admin/*" element={<Admin user={user} toast={setToast} logout={logout} />} />
        <Route
          path="*"
          element={
            <Home
              services={services}
              user={user}
              openAuth={() => setAuthOpen(true)}
              toast={setToast}
            />
          }
        />
      </Routes>
      <Footer />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {authOpen && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setAuthOpen(false)}
          onSuccess={login}
        />
      )}
    </>
  );
}

export default App;

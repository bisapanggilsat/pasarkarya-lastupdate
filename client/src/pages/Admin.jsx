import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { imgSrc, request } from '../lib/api.js';
import { uploadImage } from '../lib/upload.js';
import { date, money } from '../lib/format.js';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  ClipboardList,
  Clock3,
  Command,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import Stat from '../components/Stat.jsx';
import OrderTable from '../components/OrderTable.jsx';
import Status from '../components/Status.jsx';

// Jenis file foto yang boleh dipilih di kolom upload.
const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

// Dashboard admin dengan 5 tab: ringkasan, pesanan, layanan, pelanggan, laporan.
// Semua datanya diambil dari endpoint /admin/... yang hanya bisa diakses oleh akun admin.
function Admin({ user, toast, logout }) {
  // tab = menu yang sedang dibuka.
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [report, setReport] = useState({ rows: [], total: 0, count: 0 });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // modal = apakah popup 'Tambah layanan' terbuka. newService = isi form di popup itu.
  const [modal, setModal] = useState(false);
  const [newService, setNewService] = useState({
    title: '',
    category: 'Media Sosial',
    description: '',
    price: '',
    turnaround: '7 hari',
  });
  // busy = sedang upload atau menyimpan (tombol dinonaktifkan). hero = foto beranda saat ini.
  const [busy, setBusy] = useState(false);
  const [hero, setHero] = useState(null);
  const nav = useNavigate();
  // Ambil foto beranda yang sedang terpasang.
  useEffect(() => {
    request('/settings')
      .then((d) => setHero(d.hero_image))
      .catch(() => {});
  }, []);
  // Tambah atau ganti foto sebuah layanan: upload file dulu (dapat path foto), lalu simpan path itu ke layanannya.
  async function changePhoto(s, file, input) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(request, file);
      await request('/admin/services/' + s.id, {
        method: 'PATCH',
        body: JSON.stringify({ image_url: url }),
      });
      toast('Foto layanan diperbarui.');
      load();
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
      input.value = '';
    }
  }
  // Hapus foto layanan (layanan kembali memakai ikon).
  async function removePhoto(s) {
    try {
      await request('/admin/services/' + s.id, {
        method: 'PATCH',
        body: JSON.stringify({ image_url: null }),
      });
      toast('Foto layanan dihapus.');
      load();
    } catch (e) {
      toast(e.message);
    }
  }
  // Simpan foto beranda (atau hapus, kalau url = null).
  async function saveHero(url) {
    try {
      await request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ hero_image: url }),
      });
      setHero(url);
      toast(url ? 'Foto beranda diperbarui.' : 'Foto beranda dihapus.');
    } catch (e) {
      toast(e.message);
    }
  }
  // Upload foto baru untuk beranda, lalu simpan.
  async function changeHero(file, input) {
    if (!file) return;
    setBusy(true);
    try {
      saveHero(await uploadImage(request, file));
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
      input.value = '';
    }
  }
  // Ambil semua data dashboard sekaligus (Promise.all = beberapa request dijalankan bersamaan).
  async function load() {
    try {
      if (!user || user.role !== 'admin') return;
      const [o, s, c] = await Promise.all([
        request('/admin/overview'),
        request('/admin/services'),
        request('/admin/customers'),
      ]);
      setOverview(o);
      setServices(s);
      setCustomers(c);
      const ord = await request('/admin/orders');
      setOrders(ord);
    } catch (e) {
      toast(e.message);
    }
  }
  // Penjaga halaman: yang belum login atau bukan admin dikembalikan ke beranda.
  useEffect(() => {
    if (!user) {
      toast('Silakan login sebagai admin.');
      nav('/');
      return;
    }
    if (user.role !== 'admin') {
      toast('Halaman ini khusus admin.');
      nav('/');
      return;
    }
    load();
  }, [user]);
  // Ambil laporan pemasukan sesuai rentang tanggal (from / to) yang dipilih.
  async function getReport() {
    try {
      setReport(await request(`/admin/reports?from=${from}&to=${to}`));
    } catch (e) {
      toast(e.message);
    }
  }
  // Laporan dimuat ulang setiap tab Laporan dibuka atau tanggalnya diubah.
  useEffect(() => {
    if (tab === 'reports') getReport();
  }, [tab, from, to]);
  // Admin mengubah status pengerjaan pesanan (diproses, selesai, atau dibatalkan).
  async function updateStatus(id, status) {
    try {
      await request(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast('Status pesanan diperbarui.');
      load();
    } catch (e) {
      toast(e.message);
    }
  }
  // Simpan layanan baru dari form di popup.
  async function addService(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await request('/admin/services', { method: 'POST', body: JSON.stringify(newService) });
      toast('Layanan berhasil ditambahkan.');
      setModal(false);
      setNewService({
        title: '',
        category: 'Media Sosial',
        description: '',
        price: '',
        turnaround: '7 hari',
      });
      load();
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }
  // Aktifkan atau nonaktifkan layanan (yang nonaktif tidak tampil untuk pelanggan).
  async function toggleService(s) {
    try {
      await request('/admin/services/' + s.id, {
        method: 'PATCH',
        body: JSON.stringify({ active: !s.active }),
      });
      load();
    } catch (e) {
      toast(e.message);
    }
  }
  // Unduh laporan sebagai file Excel (library xlsx, dibuat langsung di browser).
  function exportXlsx() {
    const data = report.rows.map((r) => ({
      Invoice: r.invoice_no,
      Tanggal: date(r.created_at),
      Pelanggan: r.customer_name,
      Layanan: r.service_title,
      Metode: r.payment_method,
      Jumlah: r.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, 'laporan-pasarkarya.xlsx');
  }
  // Unduh laporan sebagai PDF (library jsPDF). Kalau baris sudah melewati bawah halaman, pindah ke halaman baru.
  function exportPdf() {
    const d = new jsPDF();
    d.setFontSize(18);
    d.text('Laporan Keuangan PasarKarya', 14, 18);
    d.setFontSize(9);
    d.text(`Periode: ${from || 'Awal'} — ${to || 'Sekarang'}`, 14, 26);
    d.text(`Total pemasukan: ${money(report.total)}`, 14, 34);
    let y = 46;
    report.rows.forEach((r, i) => {
      if (y > 275) {
        d.addPage();
        y = 18;
      }
      d.text(
        `${i + 1}. ${r.invoice_no} | ${date(r.created_at)} | ${r.customer_name} | ${money(r.amount)}`,
        14,
        y,
      );
      y += 8;
    });
    d.save('laporan-pasarkarya.pdf');
  }
  // Pengaman tambahan: kalau bukan admin, jangan tampilkan apa-apa.
  if (!user || user.role !== 'admin') return null;
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/" className="brand">
          <span className="brandmark">
            <Command size={18} />
          </span>{' '}
          pasar<span className="brandaccent">karya.</span>
        </Link>
        <div className="admin-label">WORKSPACE</div>
        {[
          ['overview', 'overview', 'Ringkasan', LayoutDashboard],
          ['orders', 'orders', 'Pesanan', ClipboardList],
          ['services', 'services', 'Layanan', Package],
          ['customers', 'customers', 'Pelanggan', Users],
          ['reports', 'reports', 'Keuangan', ChartNoAxesCombined],
        ].map(([id, path, label, Icon]) => (
          <button
            key={id}
            className={tab === id ? 'side-link active' : 'side-link'}
            onClick={() => setTab(id)}
          >
            <Icon size={17} />
            {label}
            {id === 'orders' && overview?.totals.pending > 0 && <i>{overview.totals.pending}</i>}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="admin-profile">
            <div className="profile-avatar">{user.name[0]}</div>
            <div>
              <b>{user.name}</b>
              <small>Administrator</small>
            </div>
          </div>
          <button className="side-link" onClick={logout}>
            <LogOut size={17} />
            Keluar
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <div>
            <span className="eyebrow">PASARKARYA / ADMIN</span>
            <h1>
              {
                {
                  overview: 'Ringkasan',
                  orders: 'Manajemen Pesanan',
                  services: 'Katalog Layanan',
                  customers: 'Data Pelanggan',
                  reports: 'Laporan Keuangan',
                }[tab]
              }
            </h1>
          </div>
          <button className="admin-view" onClick={() => nav('/')}>
            Lihat website <ArrowUpRight size={15} />
          </button>
        </div>
        {tab === 'overview' && (
          <>
            {overview && (
              <div className="stats-grid">
                <Stat
                  icon={Wallet}
                  label="Total pemasukan"
                  value={money(overview.totals.revenue)}
                  note="Transaksi berstatus lunas"
                />
                <Stat
                  icon={ClipboardList}
                  label="Total pesanan"
                  value={overview.totals.orders}
                  note="Semua pesanan tercatat"
                />
                <Stat
                  icon={Clock3}
                  label="Menunggu pembayaran"
                  value={overview.totals.pending}
                  note="Perlu tindak lanjut"
                />
                <Stat
                  icon={TrendingUp}
                  label="Sedang dikerjakan"
                  value={overview.totals.processing}
                  note="Pesanan aktif"
                />
              </div>
            )}
            <div className="admin-panel">
              <div className="panel-head">
                <div>
                  <h3>Pesanan terbaru</h3>
                  <p>Aktivitas transaksi yang baru masuk.</p>
                </div>
                <button className="text-link" onClick={() => setTab('orders')}>
                  Lihat semua <ArrowRight size={15} />
                </button>
              </div>
              <OrderTable orders={orders.slice(0, 6)} updateStatus={updateStatus} />
            </div>
            <div className="admin-panel">
              <div className="panel-head">
                <div>
                  <h3>Performa layanan</h3>
                  <p>Layanan yang tersedia di marketplace.</p>
                </div>
                <button className="text-link" onClick={() => setTab('services')}>
                  Kelola layanan <ArrowRight size={15} />
                </button>
              </div>
              <div className="mini-service-list">
                {services.slice(0, 4).map((s) => (
                  <div key={s.id}>
                    <span className="mini-dot"></span>
                    <b>{s.title}</b>
                    <span>{money(s.price)}</span>
                    <Status value={s.active ? 'Aktif' : 'Nonaktif'} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {tab === 'orders' && (
          <div className="admin-panel">
            <div className="panel-head">
              <div>
                <h3>Semua pesanan</h3>
                <p>Kelola status pengerjaan dan pembayaran.</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={load}>
                <Download size={15} /> Refresh
              </button>
            </div>
            <OrderTable orders={orders} updateStatus={updateStatus} />
          </div>
        )}
        {tab === 'services' && (
          <div className="admin-panel">
            <div className="panel-head">
              <div>
                <h3>Daftar layanan</h3>
                <p>Atur katalog jasa yang tampil untuk pelanggan.</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
                <Plus size={16} /> Tambah layanan
              </button>
            </div>
            <div className="hero-setting">
              {hero ? (
                <img src={imgSrc(hero)} alt="Foto beranda" />
              ) : (
                <div className="service-admin-icon">
                  <Sparkles />
                </div>
              )}
              <div className="service-admin-info">
                <b>Foto beranda</b>
                <small>Tampil di bagian utama halaman depan.</small>
              </div>
              <label className="btn btn-ghost btn-sm file-btn">
                {hero ? 'Ganti foto' : 'Unggah foto'}
                <input
                  type="file"
                  hidden
                  accept={PHOTO_ACCEPT}
                  disabled={busy}
                  onChange={(e) => changeHero(e.target.files[0], e.target)}
                />
              </label>
              {hero && (
                <button className="btn btn-ghost btn-sm" onClick={() => saveHero(null)}>
                  Hapus
                </button>
              )}
            </div>
            <div className="service-admin-list">
              {services.map((s) => (
                <div key={s.id}>
                  {s.image_url ? (
                    <img className="service-admin-thumb" src={imgSrc(s.image_url)} alt="" />
                  ) : (
                    <div className="service-admin-icon">
                      <Sparkles />
                    </div>
                  )}
                  <div className="service-admin-info">
                    <b>{s.title}</b>
                    <small>
                      {s.category} · {s.turnaround}
                    </small>
                  </div>
                  <strong>{money(s.price)}</strong>
                  <Status value={s.active ? 'Aktif' : 'Nonaktif'} />
                  <label className="btn btn-ghost btn-sm file-btn">
                    {s.image_url ? 'Ganti foto' : 'Tambah foto'}
                    <input
                      type="file"
                      hidden
                      accept={PHOTO_ACCEPT}
                      disabled={busy}
                      onChange={(e) => changePhoto(s, e.target.files[0], e.target)}
                    />
                  </label>
                  {s.image_url && (
                    <button className="btn btn-ghost btn-sm" onClick={() => removePhoto(s)}>
                      Hapus foto
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleService(s)}>
                    {s.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'customers' && (
          <div className="admin-panel">
            <div className="panel-head">
              <div>
                <h3>Daftar pelanggan</h3>
                <p>Ringkasan pelanggan yang terdaftar.</p>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Pesanan</th>
                    <th>Total transaksi</th>
                    <th>Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <b>{c.name}</b>
                      </td>
                      <td>{c.email}</td>
                      <td>{c.orders}</td>
                      <td>{money(c.spent)}</td>
                      <td>{date(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'reports' && (
          <>
            <div className="report-filters">
              <div>
                <label>Dari tanggal</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label>Sampai tanggal</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <button className="btn btn-dark btn-sm" onClick={getReport}>
                Terapkan filter
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setFrom('');
                  setTo('');
                }}
              >
                Reset
              </button>
            </div>
            <div className="stats-grid report-stats">
              <Stat
                icon={Wallet}
                label="Total pemasukan"
                value={money(report.total)}
                note="Hanya transaksi lunas"
              />
              <Stat
                icon={ClipboardList}
                label="Transaksi berhasil"
                value={report.count}
                note="Sesuai periode filter"
              />
            </div>
            <div className="admin-panel">
              <div className="panel-head">
                <div>
                  <h3>Rincian pemasukan</h3>
                  <p>Data transaksi lunas sesuai rentang tanggal.</p>
                </div>
                <div className="export-actions">
                  <button className="btn btn-ghost btn-sm" onClick={exportPdf}>
                    <FileText size={15} /> PDF
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={exportXlsx}>
                    <Download size={15} /> Excel
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Tanggal</th>
                      <th>Pelanggan</th>
                      <th>Layanan</th>
                      <th>Metode</th>
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((r) => (
                      <tr key={r.invoice_no}>
                        <td>
                          <b>{r.invoice_no}</b>
                        </td>
                        <td>{date(r.created_at)}</td>
                        <td>{r.customer_name}</td>
                        <td>{r.service_title}</td>
                        <td>{r.payment_method}</td>
                        <td>
                          <b>{money(r.amount)}</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!report.rows.length && (
                  <div className="table-empty">Belum ada transaksi lunas pada periode ini.</div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      {modal && (
        <div className="modal-backdrop" onMouseDown={() => setModal(false)}>
          <div className="auth-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(false)}>
              <X />
            </button>
            <div className="eyebrow">SERVICE CATALOG</div>
            <h2>Tambah layanan</h2>
            <form onSubmit={addService}>
              <label>Nama layanan</label>
              <input
                required
                value={newService.title}
                onChange={(e) => setNewService({ ...newService, title: e.target.value })}
              />
              <label>Kategori</label>
              <select
                value={newService.category}
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
              >
                {['Media Sosial', 'Pembuatan Konten', 'Desain Promosi', 'Optimisasi Website'].map(
                  (c) => (
                    <option>{c}</option>
                  ),
                )}
              </select>
              <label>Deskripsi</label>
              <textarea
                required
                rows="3"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              />
              <label>Harga (Rupiah)</label>
              <input
                type="number"
                min="1"
                required
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
              />
              <label>Estimasi pengerjaan</label>
              <input
                required
                value={newService.turnaround}
                onChange={(e) => setNewService({ ...newService, turnaround: e.target.value })}
              />
              <label>Foto layanan (opsional)</label>
              <input
                type="file"
                accept={PHOTO_ACCEPT}
                onChange={async (e) => {
                  const f = e.target.files[0];
                  if (!f) return;
                  setBusy(true);
                  try {
                    const url = await uploadImage(request, f);
                    setNewService((v) => ({ ...v, image_url: url }));
                  } catch (err) {
                    toast(err.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              {newService.image_url && (
                <img
                  className="upload-preview"
                  src={imgSrc(newService.image_url)}
                  alt="Pratinjau"
                />
              )}
              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy ? 'Memproses...' : 'Simpan layanan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;

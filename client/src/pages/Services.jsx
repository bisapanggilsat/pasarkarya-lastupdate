import { useState } from 'react';
import { Search } from 'lucide-react';
import ServiceCard from '../components/ServiceCard.jsx';

// Halaman daftar semua layanan, dengan kolom cari dan filter kategori.
function Services({ services }) {
  // q = kata yang diketik di kolom cari. cat = kategori yang sedang dipilih.
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Semua');
  // Daftar kategori diambil dari data layanan (Set membuang yang kembar).
  const cats = ['Semua', ...new Set(services.map((s) => s.category))];
  // Layanan yang tampil: kategorinya cocok DAN judul/deskripsinya mengandung kata yang dicari.
  const filtered = services.filter(
    (s) =>
      (cat === 'Semua' || s.category === cat) &&
      (s.title + ' ' + s.description).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <main className="page-shell">
      <div className="page-intro">
        <div className="eyebrow">THE SERVICE DIRECTORY</div>
        <h1>
          Temukan partner
          <br />
          <em>untuk bertumbuh.</em>
        </h1>
        <p>Pilih layanan yang paling sesuai dengan tahap dan kebutuhan bisnismu.</p>
      </div>
      <div className="filterbar">
        <div className="searchbox">
          <Search size={17} />
          <input placeholder="Cari layanan..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="filterchips">
          {cats.map((c) => (
            <button
              className={cat === c ? 'chip active' : 'chip'}
              key={c}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="service-grid listing">
        {filtered.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">Belum ada layanan yang cocok dengan pencarianmu.</div>
      )}
    </main>
  );
}

export default Services;

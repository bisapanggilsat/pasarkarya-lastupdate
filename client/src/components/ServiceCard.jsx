import { Link } from 'react-router-dom';
import { imgSrc } from '../lib/api.js';
import { ArrowUpRight, Clock3, Compass, Globe, Instagram, Sparkles } from 'lucide-react';
import { money } from '../lib/format.js';

// Satu kartu layanan di daftar. Kalau layanan punya foto, foto yang tampil; kalau tidak,
// tampil ikon sesuai kategori.
function ServiceCard({ service: s }) {
  return (
    <Link to={`/layanan/${s.id}`} className="service-card">
      <div className={'service-visual' + (s.image_url ? ' has-photo' : '')}>
        {s.image_url ? (
          <img className="service-photo" src={imgSrc(s.image_url)} alt={s.title} loading="lazy" />
        ) : (
          <span className="service-symbol">
            {s.category === 'Media Sosial' ? (
              <Instagram />
            ) : s.category === 'Pembuatan Konten' ? (
              <Sparkles />
            ) : s.category === 'Desain Promosi' ? (
              <Compass />
            ) : (
              <Globe />
            )}
          </span>
        )}
        <span className="visual-index">PK / 0{s.id}</span>
        <span className="visual-arrow">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="service-info">
        <span className="category">{s.category}</span>
        <h3>{s.title}</h3>
        <p>{s.description}</p>
        <div className="service-meta">
          <b>{money(s.price)}</b>
          <span>
            <Clock3 size={14} /> {s.turnaround}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ServiceCard;

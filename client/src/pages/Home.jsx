import { useEffect, useState } from 'react';
import { imgSrc, request } from '../lib/api.js';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Globe,
  Instagram,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import ServiceCard from '../components/ServiceCard.jsx';

// Halaman beranda: bagian hero (atas), layanan pilihan, cara kerja, dan ajakan di bagian bawah.
function Home({ services, user, openAuth, toast }) {
  const [heroImage, setHeroImage] = useState(null);
  // Ambil foto beranda yang diatur admin. Kalau belum ada, tampil ilustrasi bawaan.
  useEffect(() => {
    request('/settings')
      .then((d) => setHeroImage(d.hero_image))
      .catch(() => {});
  }, []);
  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse"></span> PARTNER PERTUMBUHAN DIGITAL UMKM
            </div>
            <h1>
              Bisnis hebat,
              <br />
              <span>layak terlihat.</span>
            </h1>
            <p className="hero-desc">
              Semua kebutuhan digital marketing bisnis kecilmu, dikurasi oleh para kreator dan
              strategist yang paham cara membangun brand.
            </p>
            <div className="hero-buttons">
              <Link className="btn btn-primary btn-lg" to="/layanan">
                Temukan layanan <ArrowUpRight size={18} />
              </Link>
              <a className="text-link" href="#cara-kerja">
                Kenali cara kerja <ArrowRight size={16} />
              </a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <i>R</i>
                <i>A</i>
                <i>D</i>
                <i>+</i>
              </div>
              <div>
                <b>Dirancang untuk UMKM</b>
                <small>Strategi yang relevan, hasil yang terukur.</small>
              </div>
            </div>
          </div>
          <div className={'hero-art' + (heroImage ? ' has-photo' : '')}>
            {heroImage && <img className="hero-photo" src={imgSrc(heroImage)} alt="PasarKarya" />}
            <div className="art-orbit orbit-one"></div>
            <div className="art-orbit orbit-two"></div>
            <div className="art-center">
              <span className="center-icon">
                <Sparkles size={34} />
              </span>
              <b>
                Grow with
                <br />
                intention.
              </b>
              <small>IDE · KONTEN · PERFORMA</small>
            </div>
            <div className="float-card card-social">
              <span className="float-icon pink">
                <Instagram size={18} />
              </span>
              <div>
                <b>Social presence</b>
                <small>Lebih konsisten</small>
              </div>
              <TrendingUp size={18} className="green-icon" />
            </div>
            <div className="float-card card-web">
              <span className="float-icon blue">
                <Globe size={18} />
              </span>
              <div>
                <b>Website ready</b>
                <small>Lebih mudah ditemukan</small>
              </div>
              <CheckCircle2 size={18} className="green-icon" />
            </div>
            <div className="float-tag">✦ Small business, big energy</div>
          </div>
        </div>
        <div className="hero-bottom">
          <span>MEMBANTU BRAND LOKAL BERTUMBUH</span>
          <div>
            <span>STRATEGI</span>
            <span>✳</span>
            <span>KREATIVITAS</span>
            <span>✳</span>
            <span>HASIL</span>
          </div>
        </div>
      </section>
      <section className="section services-section">
        <div className="section-head">
          <div>
            <div className="eyebrow">LAYANAN PILIHAN</div>
            <h2>
              Yang kamu butuhkan
              <br />
              untuk <em>naik level.</em>
            </h2>
          </div>
          <Link to="/layanan" className="text-link">
            Lihat semua layanan <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="service-grid">
          {services.slice(0, 3).map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>
      <section className="process-section" id="cara-kerja">
        <div className="process-inner">
          <div className="eyebrow light">SIMPLE BY DESIGN</div>
          <h2>
            Mulai dari ide.
            <br />
            <span>Selesai dengan progres.</span>
          </h2>
          <div className="steps">
            <div>
              <b>01</b>
              <h3>Pilih layanan</h3>
              <p>Temukan dukungan digital yang sesuai kebutuhan bisnismu.</p>
            </div>
            <div>
              <b>02</b>
              <h3>Ceritakan kebutuhan</h3>
              <p>Isi brief singkat agar tim memahami tujuan dan karakter brand.</p>
            </div>
            <div>
              <b>03</b>
              <h3>Mulai bertumbuh</h3>
              <p>Lakukan pembayaran dan pantau progres pesanan dari dashboard.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="cta-section" id="tentang">
        <div>
          <div className="eyebrow">WAKTUNYA BISNISMU BERSINAR</div>
          <h2>
            Ide bagus jangan
            <br />
            berhenti di kepala.
          </h2>
          <p>Ubah rencana digital marketing menjadi langkah nyata bersama PasarKarya.</p>
        </div>
        <Link to="/layanan" className="btn btn-dark btn-lg">
          Mulai eksplorasi <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}

export default Home;

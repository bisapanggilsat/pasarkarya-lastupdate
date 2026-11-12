import { Link } from 'react-router-dom';
import { Command } from 'lucide-react';

// Bagian bawah halaman (sama di semua halaman).
function Footer() {
  return (
    <footer className="footer">
      <Link to="/" className="brand">
        <span className="brandmark">
          <Command size={18} />
        </span>{' '}
        pasar<span className="brandaccent">karya.</span>
      </Link>
      <span>Digital growth, made more accessible.</span>
      <span>© 2026 PasarKarya</span>
    </footer>
  );
}

export default Footer;

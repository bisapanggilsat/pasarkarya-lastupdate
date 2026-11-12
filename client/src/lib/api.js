// Alamat backend. Secara default memakai alamat yang sama dengan web ini tetapi di port 4000
// (jadi jalan di localhost maupun lewat jaringan WiFi). Bisa diganti lewat VITE_API_URL.
export const API = (
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000/api`
).replace(/\/$/, '');

// Alamat dasar untuk file foto di backend (alamat API tanpa akhiran '/api').
export const FILES = API.replace(/\/api$/, '');

// Mengubah path foto dari database (mis. '/uploads/abc.jpg') jadi alamat lengkap yang bisa dipakai <img>.
export const imgSrc = (u) => (u ? (/^https?:/.test(u) ? u : FILES + u) : null);

// Semua komunikasi ke backend lewat fungsi ini. Otomatis: menambah token login ke header, mengirim dan
// menerima JSON, serta melempar error berisi pesan dari server kalau gagal.
export async function request(url, opts = {}) {
  const token = localStorage.getItem('pk_token');
  const res = await fetch(API + url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data;
}

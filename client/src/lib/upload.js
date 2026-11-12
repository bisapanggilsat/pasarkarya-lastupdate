// Upload foto dari browser ke server (khusus admin). Tanpa library tambahan.
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIDE = 1600; // sisi terpanjang setelah dikecilkan
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;

const readAsDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(blob);
  });

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('File foto tidak bisa dibaca.'));
    };
    img.src = url;
  });

// Foto dari HP bisa 5-10 MB. Dikecilkan dulu supaya upload cepat dan tidak ditolak server (maks 5 MB).
async function shrink(file) {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && file.size <= KEEP_AS_IS_BYTES) return file;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // PNG transparan jadi latar putih saat dikonversi ke JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  return blob || file;
}

// Mengembalikan path foto di server (mis. "/uploads/ab12....jpg").
// `request` adalah fungsi fetch ber-token milik lib/api.js.
export async function uploadImage(request, file) {
  if (!ALLOWED.includes(file.type)) throw new Error('File harus berupa foto JPG, PNG, atau WebP.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Ukuran foto terlalu besar (maksimal 25 MB).');
  const data = await readAsDataURL(await shrink(file));
  const { url } = await request('/admin/uploads', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return url;
}

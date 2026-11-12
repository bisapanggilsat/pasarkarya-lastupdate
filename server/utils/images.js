const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { uploadDir } = require('../config');
const { HttpError } = require('./http');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Tipe file ditentukan dari isi file (magic bytes), bukan dari nama atau header yang bisa dipalsukan.
function detectImageExt(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return '.webp';
  return null;
}

// Simpan foto dengan nama acak (nama dari pengguna tidak pernah dipakai), kembalikan path publiknya.
async function saveImage(buf) {
  const ext = detectImageExt(buf);
  if (!ext) throw new HttpError(415, 'File harus berupa foto JPG, PNG, atau WebP.');
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const name = crypto.randomBytes(12).toString('hex') + ext;
  await fs.promises.writeFile(path.join(uploadDir, name), buf);
  return `/uploads/${name}`;
}

// Foto dikirim dari browser sebagai data URL base64 (lihat limit JSON di app.js).
const DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

async function saveImageFromDataUrl(dataUrl) {
  const match = typeof dataUrl === 'string' ? DATA_URL.exec(dataUrl) : null;
  if (!match) throw new HttpError(422, 'Foto tidak valid. Gunakan file JPG, PNG, atau WebP.');
  if (match[1].length * 0.75 > MAX_IMAGE_BYTES * 1.01) throw new HttpError(413, 'Ukuran foto maksimal 5 MB.');
  const buf = Buffer.from(match[1], 'base64');
  if (buf.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Ukuran foto maksimal 5 MB.');
  return saveImage(buf);
}

// Hanya path hasil upload kita sendiri yang boleh disimpan di database (bukan URL/skrip sembarang).
const isStoredImageUrl = (url) => typeof url === 'string' && /^\/uploads\/[a-f0-9]{24}\.(?:jpg|png|webp)$/.test(url);

// Hapus foto lama. basename() mencegah path keluar dari folder uploads.
async function removeImage(urlPath) {
  if (!urlPath || !urlPath.startsWith('/uploads/')) return;
  await fs.promises.unlink(path.join(uploadDir, path.basename(urlPath))).catch(() => {});
}

module.exports = {
  MAX_IMAGE_BYTES,
  detectImageExt,
  saveImage,
  removeImage,
  deleteStoredImage: removeImage,
  saveImageFromDataUrl,
  isStoredImageUrl
};

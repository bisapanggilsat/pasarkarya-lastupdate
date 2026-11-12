// 'Satpam' untuk rute yang butuh login. Token JWT = tiket digital berisi id, nama, dan role user, ditandatangani
// server dengan JWT_SECRET sehingga tidak bisa dipalsukan. Browser menyimpannya dan mengirimnya di setiap request.
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { HttpError } = require('../utils/http');

// Hanya data yang aman yang masuk ke token dan respons (password tidak pernah ikut).
const toSafeUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
// Membuat token yang berlaku 7 hari.
const signToken = (user) => jwt.sign(toSafeUser(user), jwtSecret, { expiresIn: '7d' });

// Dipasang di rute yang wajib login: baca token dari header 'Authorization: Bearer ...', periksa tanda tangannya,
// lalu simpan data user ke req.user. Token hilang, salah, atau kedaluwarsa akan ditolak dengan 401.
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) return next(new HttpError(401, 'Silakan login terlebih dahulu.'));
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    next(new HttpError(401, 'Sesi tidak valid. Silakan login kembali.'));
  }
}

// Pembuat penjaga berdasarkan peran (role).
const requireRole = (role, message) => (req, res, next) =>
  req.user.role === role ? next() : next(new HttpError(403, message));

// Hanya akun dengan role 'admin' yang boleh lewat (selain itu dijawab 403).
const requireAdmin = requireRole('admin', 'Akses khusus admin.');

module.exports = { toSafeUser, signToken, requireAuth, requireAdmin };

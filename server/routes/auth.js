// Daftar akun, login, dan cek siapa yang sedang login.
const express = require('express');
const bcrypt = require('bcryptjs');
const { one, run } = require('../db');
const { toSafeUser, signToken, requireAuth } = require('../middleware/auth');
const { HttpError, asyncHandler } = require('../utils/http');

const router = express.Router();

// Daftar akun baru (selalu sebagai 'customer'). Password di-hash dengan bcrypt sebelum disimpan.
// Email kembar ditolak oleh database (kolom UNIQUE) dan dijawab 409.
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || String(password).length < 8) {
    throw new HttpError(422, 'Nama, email, dan password minimal 8 karakter wajib diisi.');
  }
  try {
    const result = await run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
      String(name).trim(),
      String(email).toLowerCase().trim(),
      bcrypt.hashSync(String(password), 10),
      'customer'
    ]);
    const user = await one('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json({ token: signToken(user), user: toSafeUser(user) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Email sudah digunakan.');
    throw err;
  }
}));

// Login: cari user dari email, cocokkan password dengan hash-nya, lalu kirim token. Pesan error sengaja sama
// untuk 'email salah' dan 'password salah' supaya orang tidak bisa menebak email mana yang terdaftar.
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await one('SELECT * FROM users WHERE email = ?', [String(email || '').toLowerCase().trim()]);
  if (!user || !bcrypt.compareSync(String(password || ''), user.password)) {
    throw new HttpError(401, 'Email atau password tidak sesuai.');
  }
  res.json({ token: signToken(user), user: toSafeUser(user) });
}));

// Mengembalikan data user dari token (untuk memastikan sesi masih valid).
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

module.exports = router;

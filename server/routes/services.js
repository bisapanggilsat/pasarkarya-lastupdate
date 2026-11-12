// Katalog layanan untuk pengunjung (tanpa perlu login). Hanya layanan yang aktif yang ditampilkan.
const express = require('express');
const { all, one } = require('../db');
const { HttpError, asyncHandler } = require('../utils/http');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(await all('SELECT * FROM services WHERE active = 1 ORDER BY featured DESC, id DESC'));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const service = await one('SELECT * FROM services WHERE id = ? AND active = 1', [req.params.id]);
  if (!service) throw new HttpError(404, 'Layanan tidak ditemukan.');
  res.json(service);
}));

module.exports = router;

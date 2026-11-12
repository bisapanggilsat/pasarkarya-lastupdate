const express = require('express');
const { one } = require('../db');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

// Pengaturan tampilan yang boleh dilihat publik (saat ini: foto hero beranda).
router.get('/', asyncHandler(async (req, res) => {
  const row = await one("SELECT setting_value FROM settings WHERE setting_key = 'hero_image'");
  res.json({ hero_image: row?.setting_value || null });
}));

module.exports = router;

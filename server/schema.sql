-- Skema database PasarKarya (MySQL 5.7+ / MariaDB 10.3+).
-- Dijalankan otomatis saat server start. Aman diulang (IF NOT EXISTS).
-- Satu statement diakhiri ";" di akhir baris. Jangan taruh ";" di tengah baris.

-- users: semua akun. Password disimpan sebagai hash bcrypt (bukan teks asli).
-- role menentukan hak akses: 'admin' atau 'customer'.
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- UNIQUE: tidak boleh ada dua akun dengan email yang sama.
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- services: katalog layanan yang dijual.
-- price disimpan dalam rupiah penuh (bilangan bulat), bukan desimal.
-- active = 0 menyembunyikan layanan dari pelanggan tanpa menghapusnya.
CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  price INT UNSIGNED NOT NULL,
  turnaround VARCHAR(60) NOT NULL,
  -- image_url: path foto (mis. /uploads/abc.jpg). Filenya ada di folder server/uploads, bukan di database.
  image_url VARCHAR(255) NULL DEFAULT NULL,
  -- featured = 1 berarti layanan ditampilkan paling atas / di beranda.
  featured TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_services_active (active, featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- orders: satu baris = satu pesanan pelanggan untuk satu layanan.
-- amount disalin dari harga layanan saat pesanan dibuat, supaya tidak ikut berubah kalau harga layanan diubah nanti.
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- invoice_no sekaligus menjadi order_id di Midtrans, jadi harus unik.
  invoice_no VARCHAR(32) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  brief TEXT NOT NULL,
  amount INT UNSIGNED NOT NULL,
  payment_method ENUM('qris','bank_transfer','ewallet') NOT NULL,
  -- payment_status = status pembayaran. order_status = tahap pengerjaan (menunggu bayar, diproses, selesai, atau batal).
  payment_status ENUM('pending','paid') NOT NULL DEFAULT 'pending',
  order_status ENUM('waiting_payment','processing','completed','cancelled') NOT NULL DEFAULT 'waiting_payment',
  -- Token popup pembayaran Midtrans. Disimpan supaya popup yang sama bisa dibuka lagi.
  midtrans_token VARCHAR(100) NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_invoice (invoice_no),
  KEY idx_orders_user (user_id),
  KEY idx_orders_service (service_id),
  KEY idx_orders_created (created_at),
  -- Foreign key: pesanan hanya boleh menunjuk user dan layanan yang benar-benar ada.
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_orders_service FOREIGN KEY (service_id) REFERENCES services (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- settings: pengaturan tampilan berbentuk pasangan kunci-nilai (saat ini hanya 'hero_image').
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(60) NOT NULL,
  setting_value VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

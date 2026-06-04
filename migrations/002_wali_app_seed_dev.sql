-- DEV ONLY — contoh akun wali untuk testing MVP
-- PIN: 456789 (bcrypt hash di bawah)
-- Sesuaikan nomor_hp dengan data wali_santri yang sudah ada di DB

-- Generate hash baru: node -e "require('bcryptjs').hash('456789',10).then(console.log)"

INSERT INTO wali_akun (
  nomor_hp,
  pin_hash,
  nama,
  status,
  must_change_pin
)
VALUES (
  '628123456789',
  '$2b$10$.b7scYojAGBeAzlsw70/GO75MZcUKDIm5UJJ7XHlHLEL0CJYLKUEe',
  'Wali Contoh Dev',
  'active',
  false
)
ON CONFLICT (nomor_hp) DO NOTHING;

-- Pastikan wali_santri punya baris dengan nomor_hp yang sama:
-- UPDATE wali_santri SET nomor_hp = '628123456789' WHERE id = 1;

-- ============================================================
-- Cek & tambah user PJO/Asst PJO untuk site BSIB
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Cek user PJO/Asst PJO yang ada per site
SELECT site, jabatan, nama, id
FROM users
WHERE jabatan IN (
  'Penanggung Jawab Operasional',
  'Asst. Penanggung Jawab Operasional',
  'Assisten Penanggung Jawab Operasional'
)
ORDER BY site, jabatan, nama;

-- 2. Cek khusus site BSIB
SELECT id, nama, jabatan, site, nrp
FROM users
WHERE site = 'BSIB'
  AND jabatan IN (
    'Penanggung Jawab Operasional',
    'Asst. Penanggung Jawab Operasional',
    'Assisten Penanggung Jawab Operasional'
  );

-- 3. Jika kosong: update jabatan user yang ada di BSIB menjadi PJO/Asst PJO
--    (ganti USER_ID dengan id user yang ingin dijadikan PJO)
-- UPDATE users SET jabatan = 'Penanggung Jawab Operasional' WHERE id = 'USER_ID' AND site = 'BSIB';
-- UPDATE users SET jabatan = 'Asst. Penanggung Jawab Operasional' WHERE id = 'USER_ID' AND site = 'BSIB';

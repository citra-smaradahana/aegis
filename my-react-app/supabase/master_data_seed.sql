-- Seed master data dari config existing
-- Jalankan SETELAH master_data_tables.sql

-- Sites
INSERT INTO master_sites (name, sort_order) VALUES
  ('Head Office', 1), ('Balikpapan', 2), ('ADRO', 3), ('AMMP', 4), ('BSIB', 5),
  ('GAMR', 6), ('HRSB', 7), ('HRSE', 8), ('PABB', 9), ('PBRB', 10),
  ('PKJA', 11), ('PPAB', 12), ('PSMM', 13), ('REBH', 14), ('RMTU', 15), ('PMTU', 16)
ON CONFLICT (name) DO NOTHING;

-- Site Locations untuk BSIB
INSERT INTO master_site_locations (site_id, name, sort_order)
SELECT s.id, loc, row_number() OVER ()
FROM master_sites s, (VALUES ('Office'), ('Workshop'), ('OSP'), ('PIT A'), ('PIT C'), ('PIT E'), ('Candrian'), ('HLO')) AS t(loc)
WHERE s.name = 'BSIB'
ON CONFLICT (site_id, name) DO NOTHING;

-- Default locations untuk site lain (Office, Workshop, Lainnya)
INSERT INTO master_site_locations (site_id, name, sort_order)
SELECT s.id, loc, row_number() OVER ()
FROM master_sites s, (VALUES ('Office'), ('Workshop'), ('Lainnya')) AS t(loc)
WHERE s.name != 'BSIB'
ON CONFLICT (site_id, name) DO NOTHING;

-- Ketidaksesuaian
INSERT INTO master_ketidaksesuaian (name, sort_order) VALUES
  ('APD', 1), ('Area Parkir', 2), ('Bahaya Peledakan', 3), ('Bahaya Biologi', 4), ('Bahaya Elektrikal', 5),
  ('External Issue', 6), ('Fasilitas Mixing Plant', 7), ('Fasilitas Office', 8), ('Fasilitas Workshop', 9),
  ('Izin Kerja', 10), ('Kelayakan Bangunan', 11), ('Kelayakan Tools', 12), ('Kelengkapan Tanggap Darurat', 13),
  ('Kondisi Fisik Pekerja', 14), ('Kondisi Kendaraan/Unit', 15), ('Lingkungan Kerja', 16), ('Penandaan', 17),
  ('Rambu', 18), ('Tools Inspection', 19)
ON CONFLICT (name) DO NOTHING;

-- Sub Ketidaksesuaian (sample - full data from hazardKetidaksesuaianOptions)
INSERT INTO master_sub_ketidaksesuaian (ketidaksesuaian_id, name, sort_order)
SELECT k.id, sub, row_number() OVER ()
FROM master_ketidaksesuaian k, (VALUES
  ('Cara Penggunaan APD'), ('Kesesuaian dan Kelayakan APD'), ('Pengawas Tidak Memastikan Kesesuaian dan Kelayakan APD Pekerja Saat Aktivitas Telah Berlangsung'), ('Tidak Menggunakan APD')
) AS t(sub)
WHERE k.name = 'APD'
ON CONFLICT (ketidaksesuaian_id, name) DO NOTHING;

-- Prosedur
INSERT INTO master_prosedur (name, sort_order) VALUES
  ('Prosedur Kerja Aman', 1), ('Prosedur Penggunaan APD', 2), ('Prosedur Operasi Mesin', 3),
  ('Prosedur Pekerjaan di Ketinggian', 4), ('Prosedur Pekerjaan Panas', 5), ('Prosedur Pengangkatan Manual', 6),
  ('Prosedur Pekerjaan di Ruang Terbatas', 7)
ON CONFLICT (name) DO NOTHING;

-- Jabatan
INSERT INTO master_jabatan (name, sort_order) VALUES
  ('Penanggung Jawab Operasional', 1), ('Asst. Penanggung Jawab Operasional', 2), ('SHERQ Officer', 3),
  ('SHERQ Supervisor', 4), ('SHERQ System & Compliance Officer', 5), ('Technical Service', 6),
  ('Field Leading Hand', 7), ('Plant Leading Hand', 8), ('Operator MMU', 9), ('Operator Plant', 10),
  ('Operator WOPP', 11), ('Mekanik', 12), ('Crew', 13), ('Administrator', 14), ('Admin Site Project', 15),
  ('Blaster', 16), ('Quality Controller', 17), ('Training & Development Specialist', 18)
ON CONFLICT (name) DO NOTHING;

-- Alasan Observasi
INSERT INTO master_alasan_observasi (name, sort_order) VALUES
  ('Pekerja Baru', 1), ('Kinerja Pekerja Kurang Baik', 2), ('Tes Praktek', 3), ('Kinerja Pekerja Baik', 4),
  ('Observasi Rutin', 5), ('Baru Terjadi Insiden', 6), ('Pekerja Dengan Pengetahuan Terbatas', 7)
ON CONFLICT (name) DO NOTHING;

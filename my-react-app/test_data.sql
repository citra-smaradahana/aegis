-- Insert test data untuk PTO
INSERT INTO planned_task_observation (
    id,
    tanggal,
    site,
    detail_lokasi,
    alasan_observasi,
    observer_id,
    observee_id,
    pekerjaan_yang_dilakukan,
    langkah_kerja_aman,
    apd_sesuai,
    area_kerja_aman,
    peralatan_aman,
    peduli_keselamatan,
    paham_resiko_prosedur,
    tindakan_perbaikan,
    pic_tindak_lanjut_id,
    status,
    created_by
) VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    'BSIB',
    'Area Workshop',
    'Observasi Rutin',
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Maintenance Equipment',
    false,  -- Ada temuan
    true,
    true,
    false,  -- Ada temuan
    true,
    true,
    'Perlu perbaikan safety guard pada mesin',
    (SELECT id FROM users LIMIT 1),
    'pending',
    (SELECT id FROM users LIMIT 1)
);

-- Insert test data untuk Take 5
INSERT INTO take_5 (
    id,
    tanggal,
    site,
    detail_lokasi,
    potensi_bahaya,
    deskripsi_kondisi,
    status,
    user_id
) VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    'BSIB',
    'Area Loading',
    'Jatuh dari ketinggian',
    'Pekerja tidak menggunakan safety harness saat bekerja di ketinggian',
    'pending',
    (SELECT id FROM users LIMIT 1)
);

-- Insert test data PTO kedua (status closed)
INSERT INTO planned_task_observation (
    id,
    tanggal,
    site,
    detail_lokasi,
    alasan_observasi,
    observer_id,
    observee_id,
    pekerjaan_yang_dilakukan,
    langkah_kerja_aman,
    apd_sesuai,
    area_kerja_aman,
    peralatan_aman,
    peduli_keselamatan,
    paham_resiko_prosedur,
    tindakan_perbaikan,
    pic_tindak_lanjut_id,
    status,
    created_by
) VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    'BSIB',
    'Area Office',
    'Observasi Rutin',
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Administrative Work',
    true,   -- Semua aman
    true,
    true,
    true,
    true,
    true,
    NULL,   -- Tidak ada tindakan perbaikan
    NULL,   -- Tidak ada PIC
    'closed',
    (SELECT id FROM users LIMIT 1)
);

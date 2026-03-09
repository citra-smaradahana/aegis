-- Pengingat Fit To Work jam 7 WITA
-- Menjalankan Edge Function fit-to-work-reminder setiap hari jam 7 WITA (23:00 UTC)
--
-- LANGKAH:
-- 1. Deploy Edge Function: supabase functions deploy fit-to-work-reminder
-- 2. (Opsional) Set CRON_SECRET di Supabase Dashboard > Edge Functions > fit-to-work-reminder > Secrets
-- 3. Enable extensions: Database > Extensions > pg_cron, pg_net
-- 4. Ganti YOUR_PROJECT_REF dan YOUR_SERVICE_ROLE_KEY di bawah, lalu jalankan script ini di SQL Editor
--    Atau gunakan Vault (lihat komentar di bawah)

-- Opsi A: Langsung pakai URL dan key (ganti YOUR_PROJECT_REF dan YOUR_SERVICE_ROLE_KEY)
-- Untuk update: jalankan dulu: SELECT cron.unschedule('fit-to-work-reminder-7wita');
-- Jadwalkan: setiap hari jam 23:00 UTC = 7:00 WITA
SELECT cron.schedule(
  'fit-to-work-reminder-7wita',
  '0 23 * * *',  -- 23:00 UTC = 7:00 WITA
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fit-to-work-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Opsi B: Pakai Vault (lebih aman - simpan secret di Vault dulu)
-- 1. Jalankan sekali untuk buat secret:
--    SELECT vault.create_secret('https://xxx.supabase.co', 'project_url');
--    SELECT vault.create_secret('your-service-role-key', 'service_role_key');
--
-- 2. Lalu gunakan jadwal ini:
/*
SELECT cron.schedule(
  'fit-to-work-reminder-7wita',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/fit-to-work-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
*/

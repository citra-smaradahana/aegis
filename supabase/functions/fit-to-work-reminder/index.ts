// Supabase Edge Function: Pengingat Fit To Work jam 7 WITA
// Dipanggil oleh pg_cron setiap hari jam 7 WITA
// Kirim notifikasi ke user yang belum mengisi Fit To Work hari ini
// Deploy: supabase functions deploy fit-to-work-reminder

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Tanggal hari ini dalam zona WITA (YYYY-MM-DD) */
function getTodayWITA(): string {
  const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;
  const now = new Date();
  const wita = new Date(now.getTime() + WITA_OFFSET_MS);
  return wita.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Opsional: verifikasi CRON_SECRET untuk mencegah panggilan sembarangan
    // Cek header X-Cron-Secret atau body.secret (jangan pakai Authorization karena dipakai untuk Supabase)
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
      const headerSecret = req.headers.get("X-Cron-Secret") || "";
      let bodySecret = "";
      try {
        const body = await req.clone().json().catch(() => ({}));
        bodySecret = body?.secret || body?.cron_secret || "";
      } catch {
        /* ignore */
      }
      if (headerSecret !== cronSecret && bodySecret !== cronSecret) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = getTodayWITA();

    // 1. Ambil user_id yang punya FCM token
    const { data: tokenRows, error: tokenErr } = await supabase
      .from("user_fcm_tokens")
      .select("user_id")
      .limit(5000);

    if (tokenErr || !tokenRows?.length) {
      return new Response(
        JSON.stringify({ ok: true, message: "Tidak ada user dengan FCM token", notified: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIdsWithToken = [...new Set(tokenRows.map((r) => r.user_id))];

    // 2. Ambil users (id, nrp) untuk user yang punya token
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, nrp")
      .in("id", userIdsWithToken);

    if (usersErr || !users?.length) {
      return new Response(
        JSON.stringify({ ok: true, message: "Tidak ada user", notified: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Ambil nrp yang sudah isi Fit To Work hari ini
    const { data: ftwRows, error: ftwErr } = await supabase
      .from("fit_to_work")
      .select("nrp")
      .eq("tanggal", today);

    if (ftwErr) {
      console.error("fit_to_work query error:", ftwErr);
      return new Response(
        JSON.stringify({ error: "Gagal cek fit_to_work" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nrpSudahIsi = new Set((ftwRows || []).map((r) => String(r.nrp || "").trim()).filter(Boolean));

    // 4. User yang belum isi: punya nrp dan nrp tidak ada di ftw hari ini
    const userIdsToNotify = users
      .filter((u) => {
        const nrp = String(u.nrp || "").trim();
        return nrp && !nrpSudahIsi.has(nrp);
      })
      .map((u) => u.id);

    if (userIdsToNotify.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Semua user sudah mengisi Fit To Work hari ini",
          notified: 0,
          today,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Kirim push ke setiap user via send-push-notification
    const functionUrl = `${supabaseUrl}/functions/v1/send-push-notification`;
    const title = "Pengingat Fit To Work";
    const body = "Anda belum mengisi Fit To Work hari ini. Silakan isi sebelum memulai pekerjaan.";
    const data = { type: "fit-to-work", action: "reminder" };

    const results = await Promise.all(
      userIdsToNotify.map((userId) =>
        fetch(functionUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            title,
            body,
            data,
          }),
        })
      )
    );

    const successCount = results.filter((r) => r.ok).length;

    return new Response(
      JSON.stringify({
        ok: true,
        notified: successCount,
        total: userIdsToNotify.length,
        today,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fit-to-work-reminder error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

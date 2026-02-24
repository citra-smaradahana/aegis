// Supabase Edge Function: Terima webhook dari Database, kirim push ke user terkait
// Dipanggil oleh Supabase Database Webhooks
// Event: fit_to_work (Validasi FTW), hazard_report (Tasklist), planned_task_observation (PTO pending), take_5 (Take 5 pending), safety_meetings (Daily Attendance)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALIDATOR_JABATANS = [
  "Administrator",
  "Admin Site Project",
  "Field Leading Hand",
  "Plant Leading Hand",
  "Asst. Penanggung Jawab Operasional",
  "Penanggung Jawab Operasional",
  "SHE",
  "SHERQ Officer",
];

const PJO_JABATANS = [
  "Penanggung Jawab Operasional",
  "Asst. Penanggung Jawab Operasional",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    if (!table || !record) {
      return new Response(
        JSON.stringify({ error: "Payload tidak valid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const userIdsToNotify: string[] = [];
    let title = "";
    let body = "";
    let data: Record<string, string> = {};

    // --- FIT TO WORK: Not Fit To Work perlu validasi ---
    if (table === "fit_to_work") {
      const statusFatigue = (record.status_fatigue || "").trim();
      const workflowStatus = (record.workflow_status || "").trim();
      const site = (record.site || "").trim();

      if (
        statusFatigue === "Not Fit To Work" &&
        ["Pending", "Level1_Review", "Level1 Review"].includes(workflowStatus) &&
        site
      ) {
        const { data: validators } = await supabase
          .from("users")
          .select("id")
          .eq("site", site)
          .in("jabatan", VALIDATOR_JABATANS);

        if (validators?.length) {
          userIdsToNotify.push(...validators.map((u) => u.id));
          title = "Validasi Fit To Work";
          body = "Ada validasi Fit To Work yang perlu ditindaklanjuti";
          data = { type: "validation", action: "fit-to-work-validation" };
        }
      }
    }

    // --- HAZARD REPORT: Tasklist baru (PIC & Evaluator) ---
    if (table === "hazard_report") {
      const status = (record.status || "").trim();
      const lokasi = (record.lokasi || "").trim();
      const picNama = (record.pic || "").trim();
      const evaluatorNama = (record.evaluator_nama || "").trim();

      if (lokasi && (picNama || evaluatorNama)) {
        const namesToFind = [picNama, evaluatorNama].filter(Boolean);
        const foundIds = new Set<string>();
        for (const name of namesToFind) {
          const { data: users } = await supabase
            .from("users")
            .select("id")
            .eq("site", lokasi)
            .ilike("nama", name);
          if (users?.length) {
            users.forEach((u) => foundIds.add(u.id));
          }
        }
        foundIds.forEach((id) => userIdsToNotify.push(id));
        title = "Tasklist";
        body = "Ada task baru yang perlu ditindaklanjuti";
        data = { type: "tasklist", action: "tasklist" };
      }
    }

    // --- PLANNED TASK OBSERVATION (PTO): Laporan pending ---
    if (table === "planned_task_observation") {
      const status = (record.status || "").trim();
      const picId = record.pic_tindak_lanjut_id;

      if (status === "pending" && picId) {
        userIdsToNotify.push(picId);
        title = "Laporan PTO Pending";
        body = "Ada laporan PTO yang menunggu tindak lanjut Anda";
        data = { type: "pto", action: "hazard" };
      }
    }

    // --- TAKE 5: Laporan pending (pelapor perlu isi hazard form) ---
    if (table === "take_5") {
      const status = (record.status || "").trim();
      const hazardId = record.hazard_id;
      const pelaporUserId = record.user_id;

      if (status === "pending" && !hazardId && pelaporUserId) {
        userIdsToNotify.push(pelaporUserId);
        title = "Laporan Take 5 Pending";
        body = "Ada laporan Take 5 yang perlu dilengkapi dengan Hazard Report";
        data = { type: "take5", action: "hazard" };
      }
    }

    // --- SAFETY MEETINGS (Daily Attendance): Laporan pending perlu approval PJO/Asst PJO ---
    if (table === "safety_meetings") {
      const status = (record.status || "").trim();
      const site = (record.site || "").trim();

      if (status === "Pending" && site) {
        const { data: pjoUsers } = await supabase
          .from("users")
          .select("id")
          .eq("site", site)
          .in("jabatan", PJO_JABATANS);

        if (pjoUsers?.length) {
          userIdsToNotify.push(...pjoUsers.map((u) => u.id));
          title = "Daily Attendance Pending";
          body = "Ada laporan Daily Attendance yang menunggu approval Anda";
          data = { type: "daily-attendance", action: "approval" };
        }
      }
    }

    if (userIdsToNotify.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "Tidak ada user yang perlu dinotifikasi" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Kirim push ke setiap user (deduplicate)
    const uniqueIds = [...new Set(userIdsToNotify)];
    const functionUrl = `${supabaseUrl}/functions/v1/send-push-notification`;

    const results = await Promise.all(
      uniqueIds.map((userId) =>
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
        total: uniqueIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("push-notification-trigger error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import React, { useState, useEffect } from "react";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";

const ITEMS = [
  {
    kategori: "Lampu & Kelistrikan", icon: "💡", color: "#f59e0b",
    items: [
      "Lampu depan (High & Low beam) berfungsi",
      "Lampu belakang dan rem berfungsi",
      "Lampu sein kiri dan kanan berfungsi",
      "Klakson berfungsi normal",
      "Lampu hazard berfungsi",
      "Lampu mundur berfungsi",
    ],
  },
  {
    kategori: "Ban & Roda", icon: "🛞", color: "#3b82f6",
    items: [
      "Kondisi ban tidak retak, gundul, atau botak",
      "Tekanan angin ban sesuai standar",
      "Ban serep tersedia dan layak pakai",
      "Mur roda dalam kondisi kencang, tidak ada yang hilang",
    ],
  },
  {
    kategori: "Rem & Kemudi", icon: "🛑", color: "#ef4444",
    items: [
      "Pedal rem berfungsi dengan baik dan jarak pengereman normal",
      "Rem tangan/parkir berfungsi normal",
      "Setir/kemudi tidak ada play yang berlebihan",
      "Power steering (jika ada) berfungsi normal",
    ],
  },
  {
    kategori: "Mesin & Cairan", icon: "⚙️", color: "#10b981",
    items: [
      "Level oli mesin dalam kondisi normal",
      "Level air radiator mencukupi",
      "Level minyak rem mencukupi",
      "Tidak ada kebocoran oli, air, atau BBM",
      "Suhu mesin normal saat dioperasikan",
    ],
  },
  {
    kategori: "Body & Kelengkapan", icon: "🚗", color: "#8b5cf6",
    items: [
      "Kaca depan bersih dan tidak retak",
      "Wiper berfungsi dan tidak aus",
      "Spion lengkap dan dapat disetel",
      "Sabuk pengaman berfungsi dengan baik",
      "APAR ada di dalam kendaraan (jika wajib)",
      "Kotak P3K tersedia",
      "Segitiga pengaman tersedia",
    ],
  },
  {
    kategori: "Dokumen Kendaraan", icon: "📄", color: "#6b7280",
    items: [
      "STNK/dokumen kendaraan masih berlaku",
      "Stiker inspeksi/kelayakan kendaraan masih berlaku",
      "SIM pengemudi sesuai jenis kendaraan",
    ],
  },
];

const OPTIONS = [
  { value: "ok", label: "✅ OK", bg: "#10b981", light: "#ecfdf5", border: "#a7f3d0" },
  { value: "nok", label: "❌ NOK", bg: "#ef4444", light: "#fef2f2", border: "#fecaca" },
  { value: "na", label: "N/A", bg: "#6b7280", light: "#f3f4f6", border: "#d1d5db" },
];

function useFormState() {
  const [answers, setAnswers] = useState({});
  const [noPol, setNoPol] = useState("");
  const [jenisKendaraan, setJenisKendaraan] = useState("");
  const [namaPengemudi, setNamaPengemudi] = useState("");
  const [kmMeter, setKmMeter] = useState("");
  const [catatan, setCatatan] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const totalItems = ITEMS.reduce((s, k) => s + k.items.length, 0);
  const answeredItems = Object.keys(answers).length;
  const progress = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;
  const nokItems = Object.values(answers).filter((v) => v === "nok").length;
  const setScore = (kat, idx, val) => setAnswers((p) => ({ ...p, [`${kat}-${idx}`]: val }));
  const getScore = (kat, idx) => answers[`${kat}-${idx}`];
  return { noPol, setNoPol, jenisKendaraan, setJenisKendaraan, namaPengemudi, setNamaPengemudi, kmMeter, setKmMeter, catatan, setCatatan, submitted, setSubmitted, answeredItems, totalItems, progress, nokItems, setScore, getScore };
}

// ─── DESKTOP ──────────────────────────────────────────────────────────────────
const InspeksiKendaraanDesktop = ({ user, onBack }) => {
  const { noPol, setNoPol, jenisKendaraan, setJenisKendaraan, namaPengemudi, setNamaPengemudi, kmMeter, setKmMeter, catatan, setCatatan, submitted, setSubmitted, answeredItems, totalItems, progress, nokItems, setScore, getScore } = useFormState();
  const identFields = [{ l: "No. Polisi", v: noPol, s: setNoPol, p: "KT 1234 AB" }, { l: "Jenis Kendaraan", v: jenisKendaraan, s: setJenisKendaraan, p: "Light Vehicle" }, { l: "Nama Pengemudi", v: namaPengemudi, s: setNamaPengemudi, p: "Nama lengkap" }, { l: "Kilometer", v: kmMeter, s: setKmMeter, p: "45230" }];

  return (
    <div style={{ width: "100%", height: "100vh", background: "transparent", display: "flex", flexDirection: "column", padding: "24px 80px 0 24px", overflow: "hidden" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <h2 style={{ margin: 0, color: "#60a5fa", fontWeight: 900, fontSize: 28 }}>Inspeksi Kendaraan</h2>
          <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 14 }}>{user?.site || "Site"} · {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 6, background: "#374151", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#60a5fa", borderRadius: 999, transition: "width 0.3s ease" }} />
            </div>
            <span style={{ color: "#9ca3af", fontSize: 13, whiteSpace: "nowrap", textAlign: "left" }}>
              {nokItems > 0 && <span style={{ color: "#fbbf24", marginRight: 8 }}>⚠️ {nokItems} NOK</span>}
              {answeredItems}/{totalItems} • {progress}%
            </span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, minHeight: 0, textAlign: "left" }}>
          {!submitted ? (
            <>
              <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#93c5fd", marginBottom: 10 }}>🚗 Identitas Kendaraan</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {identFields.map((f) => (
                    <div key={f.l} style={{ flex: 1, minWidth: 140 }}>
                      <label style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{f.l}</label>
                      <input value={f.v} onChange={(e) => f.s(e.target.value)} placeholder={f.p}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #374151", borderRadius: 8, background: "#111827", color: "#e5e7eb", fontSize: 13, boxSizing: "border-box", marginTop: 4, outline: "none" }} />
                    </div>
                  ))}
                </div>
              </div>
              {nokItems > 0 && (
                <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fca5a5", marginBottom: 14, display: "flex", gap: 8 }}>
                  <span>⚠️</span><span>Terdapat <strong>{nokItems} item NOT OK</strong>. Kendaraan memerlukan pemeriksaan lebih lanjut sebelum dioperasikan.</span>
                </div>
              )}
              <div style={{ background: "#1e3a5f", border: "1px solid #1e40af", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#93c5fd", marginBottom: 14, display: "flex", gap: 8 }}>
                <span>ℹ️</span><span><strong>✅ OK</strong> = Memenuhi standar, <strong>❌ NOK</strong> = Tidak memenuhi, <strong>N/A</strong> = Tidak berlaku</span>
              </div>
              {ITEMS.map((k) => (
                <div key={k.kategori} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
                  <div style={{ background: `${k.color}18`, borderLeft: `4px solid ${k.color}`, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>{k.icon}</span>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f3f4f6" }}>{k.kategori}</div>
                  </div>
                  {k.items.map((item, idx) => {
                    const score = getScore(k.kategori, idx);
                    return (
                      <div key={idx} style={{ padding: "12px 16px", borderBottom: idx < k.items.length - 1 ? "1px solid #374151" : "none", background: score === "nok" ? "#450a0a" : "transparent", transition: "background 0.2s" }}>
                        <div style={{ fontSize: 13, color: "#d1d5db", marginBottom: 8 }}>{idx + 1}. {item}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {OPTIONS.map((opt) => (
                            <button key={opt.value} onClick={() => setScore(k.kategori, idx, opt.value)}
                              style={{ padding: "5px 12px", borderRadius: 6, border: `1.5px solid ${score === opt.value ? opt.bg : "#4b5563"}`, background: score === opt.value ? opt.bg : "#374151", color: score === opt.value ? "white" : "#d1d5db", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#93c5fd", marginBottom: 8 }}>📝 Catatan & Tindak Lanjut</div>
                <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catat temuan, kerusakan, atau eskalasi yang diperlukan..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #374151", background: "#111827", color: "#e5e7eb", fontSize: 12, resize: "vertical", minHeight: 80, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
              </div>
              <button onClick={() => { if (!noPol || !namaPengemudi) { alert("No. Polisi dan Nama Pengemudi wajib diisi."); return; } if (progress < 100) { alert("Harap isi semua item."); return; } setSubmitted(true); }}
                style={{ width: "100%", padding: "13px", background: progress === 100 && noPol && namaPengemudi ? nokItems > 0 ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #ef4444, #b91c1c)" : "#374151", border: "none", borderRadius: 10, color: progress === 100 && noPol && namaPengemudi ? "white" : "#6b7280", fontSize: 14, fontWeight: 700, cursor: progress === 100 && noPol && namaPengemudi ? "pointer" : "not-allowed", marginBottom: 24 }}>
                {progress === 100 ? nokItems > 0 ? `⚠️ Kirim (${nokItems} Item NOK)` : "✅ Kirim Laporan Inspeksi" : `Lengkapi dulu (${progress}%)`}
              </button>
            </>
          ) : (
            <div style={{ background: nokItems > 0 ? "#431407" : "#064e3b", border: `1px solid ${nokItems > 0 ? "#f59e0b" : "#10b981"}`, borderRadius: 12, padding: 32, textAlign: "center", color: nokItems > 0 ? "#fde68a" : "#d1fae5" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{nokItems > 0 ? "⚠️" : "🎉"}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{nokItems > 0 ? `Laporan Dikirim — ${nokItems} Item NOK` : "Laporan Berhasil Dikirim!"}</div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>{nokItems > 0 ? "Segera lakukan tindak lanjut untuk item yang tidak memenuhi standar." : "Kendaraan dalam kondisi baik dan layak operasi."}</div>
              <button onClick={onBack} style={{ marginTop: 16, padding: "10px 24px", background: nokItems > 0 ? "#f59e0b" : "#10b981", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Kembali ke Inspeksi</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MOBILE ───────────────────────────────────────────────────────────────────
const InspeksiKendaraanMobile = ({ user, onBack, onNavigate, tasklistTodoCount }) => {
  const { noPol, setNoPol, jenisKendaraan, setJenisKendaraan, namaPengemudi, setNamaPengemudi, kmMeter, setKmMeter, catatan, setCatatan, submitted, setSubmitted, answeredItems, totalItems, progress, nokItems, setScore, getScore } = useFormState();
  const identFields = [{ l: "No. Polisi", v: noPol, s: setNoPol, p: "KT 1234 AB" }, { l: "Jenis Kendaraan", v: jenisKendaraan, s: setJenisKendaraan, p: "Light Vehicle" }, { l: "Nama Pengemudi", v: namaPengemudi, s: setNamaPengemudi, p: "Nama lengkap" }, { l: "Kilometer", v: kmMeter, s: setKmMeter, p: "45230" }];

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc", paddingBottom: "calc(70px + env(safe-area-inset-bottom))" }}>
      <MobileHeader user={user} onBack={onBack} title="Inspeksi Kendaraan" />
      <div style={{ padding: 16, paddingTop: 76 }}>
        {/* Progress Card */}
        <div style={{ background: "white", borderRadius: 12, padding: "12px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>Progres Inspeksi</span>
            <span style={{ fontWeight: 700, color: "#ef4444" }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#ef4444", borderRadius: 999, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, textAlign: "right" }}>
            {answeredItems} dari {totalItems} item selesai
          </div>
        </div>
        {!submitted ? (
          <>
          <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {identFields.map((f) => (
                  <div key={f.l} style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{f.l}</label>
                    <input value={f.v} onChange={(e) => f.s(e.target.value)} placeholder={f.p}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box", marginTop: 4, outline: "none" }} />
                  </div>
                ))}
              </div>
            </div>
            {nokItems > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 12, display: "flex", gap: 8 }}>
                <span>⚠️</span><span>Terdapat <strong>{nokItems} item NOT OK</strong>. Kendaraan memerlukan pemeriksaan lebih lanjut.</span>
              </div>
            )}
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#7f1d1d", marginBottom: 12, display: "flex", gap: 8 }}>
              <span>ℹ️</span><span><strong>✅ OK</strong> = Memenuhi, <strong>❌ NOK</strong> = Tidak memenuhi, <strong>N/A</strong> = Tidak berlaku</span>
            </div>
            {ITEMS.map((k) => (
              <div key={k.kategori} style={{ background: "white", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 12, overflow: "hidden" }}>
                <div style={{ background: `${k.color}12`, borderLeft: `4px solid ${k.color}`, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>{k.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{k.kategori}</div>
                </div>
                {k.items.map((item, idx) => {
                  const score = getScore(k.kategori, idx);
                  return (
                    <div key={idx} style={{ padding: "12px 16px", borderBottom: idx < k.items.length - 1 ? "1px solid #f3f4f6" : "none", background: score === "nok" ? "#fef2f2" : "transparent", transition: "background 0.2s" }}>
                      <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>{idx + 1}. {item}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {OPTIONS.map((opt) => (
                          <button key={opt.value} onClick={() => setScore(k.kategori, idx, opt.value)}
                            style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${score === opt.value ? opt.bg : opt.border}`, background: score === opt.value ? opt.bg : opt.light, color: score === opt.value ? "white" : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 8 }}>📝 Catatan & Tindak Lanjut</div>
              <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catat temuan, kerusakan, atau eskalasi..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, resize: "vertical", minHeight: 80, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
            </div>
            <button onClick={() => { if (!noPol || !namaPengemudi) { alert("No. Polisi dan Nama Pengemudi wajib diisi."); return; } if (progress < 100) { alert("Harap isi semua item."); return; } setSubmitted(true); }}
              style={{ width: "100%", padding: "14px", background: progress === 100 && noPol && namaPengemudi ? nokItems > 0 ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #ef4444, #b91c1c)" : "#d1d5db", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: progress === 100 && noPol && namaPengemudi ? "pointer" : "not-allowed", boxShadow: progress === 100 && noPol && namaPengemudi ? `0 4px 14px ${nokItems > 0 ? "rgba(245, 158, 11, 0.4)" : "rgba(239, 68, 68, 0.4)"}` : "none" }}>
              {progress === 100 ? nokItems > 0 ? `⚠️ Kirim (${nokItems} Item NOK)` : "✅ Kirim Laporan Inspeksi" : `Lengkapi dulu (${progress}%)`}
            </button>
          </>
        ) : (
          <div style={{ background: nokItems > 0 ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #10b981, #059669)", borderRadius: 12, padding: 24, textAlign: "center", color: "white" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{nokItems > 0 ? "⚠️" : "🎉"}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{nokItems > 0 ? `Laporan Dikirim — ${nokItems} Item NOK` : "Laporan Berhasil Dikirim!"}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{nokItems > 0 ? "Segera lakukan tindak lanjut untuk item NOK." : "Kendaraan dalam kondisi baik dan layak operasi."}</div>
            <button onClick={onBack} style={{ marginTop: 14, padding: "10px 24px", background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Kembali ke Inspeksi</button>
          </div>
        )}
      </div>
      <MobileBottomNavigation activeTab={null} tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => { if (tab === "home") onNavigate("dashboard"); else if (tab === "tasklist") onNavigate("tasklist"); else if (tab === "profile") onNavigate("profile"); }} />
    </div>
  );
};

function InspeksiKendaraan({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile ? <InspeksiKendaraanMobile user={user} onBack={onBack} onNavigate={onNavigate} tasklistTodoCount={tasklistTodoCount} /> : <InspeksiKendaraanDesktop user={user} onBack={onBack} />;
}
export default InspeksiKendaraan;

import React, { useState, useEffect } from "react";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";

const POWER_TOOLS_ITEMS = [
  {
    kategori: "Kondisi Fisik", icon: "🔍", color: "#f59e0b",
    items: [
      "Badan/casing alat tidak retak, pecah, atau rusak",
      "Kabel power tidak terkelupas, terputus, atau terbakar",
      "Steker/konektor dalam kondisi baik dan tidak longgar",
      "Handle/gagang dalam kondisi baik, tidak licin",
    ],
  },
  {
    kategori: "Keselamatan", icon: "🦺", color: "#ef4444",
    items: [
      "Guard/pelindung terpasang dengan benar dan berfungsi",
      "Tombol safety / trigger lock berfungsi normal",
      "Switch ON/OFF berfungsi dengan baik",
      "Tidak ada modifikasi yang tidak aman pada alat",
    ],
  },
  {
    kategori: "Kelayakan Operasi", icon: "⚙️", color: "#3b82f6",
    items: [
      "Tag inspeksi/sertifikasi masih berlaku",
      "Kapasitas/spesifikasi sesuai kebutuhan pekerjaan",
      "Mata/bit/blade sesuai jenis dan dalam kondisi tajam/baik",
      "Tidak ada getaran abnormal saat dioperasikan",
    ],
  },
  {
    kategori: "Penyimpanan & Pemeliharaan", icon: "🗃️", color: "#8b5cf6",
    items: [
      "Alat disimpan di tempat yang ditentukan dan bersih",
      "Pelumasan/perawatan rutin dilakukan sesuai jadwal",
      "Catatan pemeliharaan tersedia dan terkini",
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
  const [namaAlat, setNamaAlat] = useState("");
  const [nomorAlat, setNomorAlat] = useState("");
  const [catatan, setCatatan] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const totalItems = POWER_TOOLS_ITEMS.reduce((s, k) => s + k.items.length, 0);
  const answeredItems = Object.keys(answers).length;
  const progress = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;
  const setScore = (kat, idx, val) => setAnswers((p) => ({ ...p, [`${kat}-${idx}`]: val }));
  const getScore = (kat, idx) => answers[`${kat}-${idx}`];
  return { answers, namaAlat, setNamaAlat, nomorAlat, setNomorAlat, catatan, setCatatan, submitted, setSubmitted, totalItems, answeredItems, progress, setScore, getScore };
}

// ─── DESKTOP ──────────────────────────────────────────────────────────────────
const InspeksiPowerToolsDesktop = ({ user, onBack }) => {
  const { namaAlat, setNamaAlat, nomorAlat, setNomorAlat, catatan, setCatatan, submitted, setSubmitted, answeredItems, totalItems, progress, setScore, getScore } = useFormState();

  return (
    <div style={{ width: "100%", height: "100vh", background: "transparent", display: "flex", flexDirection: "column", padding: "24px 80px 0 24px", overflow: "hidden" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <h2 style={{ margin: 0, color: "#60a5fa", fontWeight: 900, fontSize: 28 }}>Inspeksi Power Tools</h2>
          <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 14 }}>
            {user?.site || "Site"} · {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 6, background: "#374151", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#60a5fa", borderRadius: 999, transition: "width 0.3s ease" }} />
            </div>
            <span style={{ color: "#9ca3af", fontSize: 13, whiteSpace: "nowrap", textAlign: "left" }}>{answeredItems}/{totalItems} • {progress}%</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, minHeight: 0, textAlign: "left" }}>
          {!submitted ? (
            <>
              {/* Identitas */}
              <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#93c5fd", marginBottom: 10 }}>📝 Identitas Alat</div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[{ label: "Nama / Jenis Alat", val: namaAlat, set: setNamaAlat, ph: "Contoh: Angle Grinder" },
                    { label: "No. Alat / Seri", val: nomorAlat, set: setNomorAlat, ph: "Contoh: PT-001" }].map((f) => (
                    <div key={f.label} style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{f.label}</label>
                      <input value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #374151", borderRadius: 8, background: "#111827", color: "#e5e7eb", fontSize: 13, boxSizing: "border-box", marginTop: 4, outline: "none" }} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#1e3a5f", border: "1px solid #1e40af", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#93c5fd", marginBottom: 14, display: "flex", gap: 8 }}>
                <span>ℹ️</span><span><strong>✅ OK</strong> = Memenuhi standar, <strong>❌ NOK</strong> = Tidak memenuhi, <strong>N/A</strong> = Tidak berlaku</span>
              </div>
              {POWER_TOOLS_ITEMS.map((k) => (
                <div key={k.kategori} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
                  <div style={{ background: `${k.color}18`, borderLeft: `4px solid ${k.color}`, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>{k.icon}</span>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f3f4f6" }}>{k.kategori}</div>
                  </div>
                  {k.items.map((item, idx) => {
                    const score = getScore(k.kategori, idx);
                    return (
                      <div key={idx} style={{ padding: "12px 16px", borderBottom: idx < k.items.length - 1 ? "1px solid #374151" : "none" }}>
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
                <div style={{ fontWeight: 700, fontSize: 13, color: "#93c5fd", marginBottom: 8 }}>📝 Catatan Umum</div>
                <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tambahkan catatan atau temuan penting..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #374151", background: "#111827", color: "#e5e7eb", fontSize: 12, resize: "vertical", minHeight: 72, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
              </div>
              <button
                onClick={() => { if (!namaAlat) { alert("Nama alat wajib diisi."); return; } if (progress < 100) { alert("Harap isi semua item."); return; } setSubmitted(true); }}
                style={{ width: "100%", padding: "13px", background: progress === 100 && namaAlat ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#374151", border: "none", borderRadius: 10, color: progress === 100 && namaAlat ? "white" : "#6b7280", fontSize: 14, fontWeight: 700, cursor: progress === 100 && namaAlat ? "pointer" : "not-allowed", marginBottom: 24 }}
              >
                {progress === 100 ? "✅ Kirim Laporan Inspeksi" : `Lengkapi dulu (${progress}%)`}
              </button>
            </>
          ) : (
            <div style={{ background: "#431407", border: "1px solid #f59e0b", borderRadius: 12, padding: 32, textAlign: "center", color: "#fde68a" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Laporan Berhasil Dikirim!</div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>Inspeksi Power Tools telah dicatat.</div>
              <button onClick={onBack} style={{ marginTop: 16, padding: "10px 24px", background: "#f59e0b", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Kembali ke Inspeksi</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MOBILE ───────────────────────────────────────────────────────────────────
const InspeksiPowerToolsMobile = ({ user, onBack, onNavigate, tasklistTodoCount }) => {
  const { namaAlat, setNamaAlat, nomorAlat, setNomorAlat, catatan, setCatatan, submitted, setSubmitted, answeredItems, totalItems, progress, setScore, getScore } = useFormState();

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc", paddingBottom: "calc(70px + env(safe-area-inset-bottom))" }}>
      <MobileHeader user={user} onBack={onBack} title="Inspeksi Power Tools" />
      <div style={{ padding: 16, paddingTop: 76 }}>
        {/* Progress Card */}
        <div style={{ background: "white", borderRadius: 12, padding: "12px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>Progres Inspeksi</span>
            <span style={{ fontWeight: 700, color: "#f59e0b" }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#f59e0b", borderRadius: 999, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, textAlign: "right" }}>
            {answeredItems} dari {totalItems} item selesai
          </div>
        </div>

        {!submitted ? (
          <>
            <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[{ label: "Nama / Jenis Alat", val: namaAlat, set: setNamaAlat, ph: "Contoh: Angle Grinder" },
                  { label: "No. Alat / Seri", val: nomorAlat, set: setNomorAlat, ph: "Contoh: PT-001" }].map((f) => (
                  <div key={f.label} style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{f.label}</label>
                    <input value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box", marginTop: 4, outline: "none" }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#92400e", marginBottom: 12, display: "flex", gap: 8 }}>
              <span>ℹ️</span><span><strong>✅ OK</strong> = Memenuhi, <strong>❌ NOK</strong> = Tidak memenuhi, <strong>N/A</strong> = Tidak berlaku</span>
            </div>
            {POWER_TOOLS_ITEMS.map((k) => (
              <div key={k.kategori} style={{ background: "white", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 12, overflow: "hidden" }}>
                <div style={{ background: `${k.color}12`, borderLeft: `4px solid ${k.color}`, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>{k.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{k.kategori}</div>
                </div>
                {k.items.map((item, idx) => {
                  const score = getScore(k.kategori, idx);
                  return (
                    <div key={idx} style={{ padding: "12px 16px", borderBottom: idx < k.items.length - 1 ? "1px solid #f3f4f6" : "none" }}>
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
              <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 8 }}>📝 Catatan Umum</div>
              <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tambahkan catatan atau temuan penting..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, resize: "vertical", minHeight: 72, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
            </div>
            <button
              onClick={() => { if (!namaAlat) { alert("Nama alat wajib diisi."); return; } if (progress < 100) { alert("Harap isi semua item."); return; } setSubmitted(true); }}
              style={{ width: "100%", padding: "14px", background: progress === 100 && namaAlat ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#d1d5db", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: progress === 100 && namaAlat ? "pointer" : "not-allowed", boxShadow: progress === 100 && namaAlat ? "0 4px 14px rgba(245, 158, 11, 0.4)" : "none" }}
            >
              {progress === 100 ? "✅ Kirim Laporan Inspeksi" : `Lengkapi dulu (${progress}%)`}
            </button>
          </>
        ) : (
          <div style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 12, padding: 24, textAlign: "center", color: "white" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Laporan Berhasil Dikirim!</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Inspeksi Power Tools telah dicatat.</div>
            <button onClick={onBack} style={{ marginTop: 14, padding: "10px 24px", background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Kembali ke Inspeksi</button>
          </div>
        )}
      </div>
      <MobileBottomNavigation activeTab={null} tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => { if (tab === "home") onNavigate("dashboard"); else if (tab === "tasklist") onNavigate("tasklist"); else if (tab === "profile") onNavigate("profile"); }} />
    </div>
  );
};

function InspeksiPowerTools({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile ? <InspeksiPowerToolsMobile user={user} onBack={onBack} onNavigate={onNavigate} tasklistTodoCount={tasklistTodoCount} /> : <InspeksiPowerToolsDesktop user={user} onBack={onBack} />;
}
export default InspeksiPowerTools;

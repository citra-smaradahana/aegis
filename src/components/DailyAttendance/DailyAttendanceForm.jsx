import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { supabase } from "../../supabaseClient";
import { sessionManager } from "../../utils/sessionManager";
import { getTodayWITA } from "../../utils/dateTimeHelpers";
import { fetchUsersAttendanceForValidator } from "../../utils/fitToWorkAbsentHelpers";
import { downloadPdfFromElement } from "../../utils/downloadPdfFromElement";
import DailyAttendancePrint from "./DailyAttendancePrint";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import "./DailyAttendance.css";

/**
 * Form Input Laporan Harian (Daily Attendance Record)
 * Sekaligus Preview sebelum cetak.
 * Mobile: MobileHeader, BottomNav, ukuran lebih compact.
 */
const DailyAttendanceForm = ({ user: userProp, onBack, onNavigate, tasklistTodoCount = 0 }) => {
  // Fallback ke session jika userProp tidak diteruskan
  const sessionUser = userProp || sessionManager.getSession();
  // Hapus useNavigate, pakai prop onBack dari App.jsx
  const printComponentRef = useRef();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [user, setUser] = useState(null);
  const [showPreview, setShowPreview] = useState(false); // Modal Preview State
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // State Form Header
  const [formData, setFormData] = useState({
    date: getTodayWITA(),
    // Format waktu HTML input type="time" harus HH:mm (24 jam)
    timeStart: new Date()
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Pastikan 24 jam
      })
      .replace(/\./g, ":"), // Ganti titik dengan titik dua jika locale ID pakai titik
    timeEnd: "",
    duration: "15", // default 15 menit
    place: "",
    meetingType: "Briefing", // Default
    topic: "",
    agenda: "", // Jika beda dengan topic
    site: "",
    department: "",
    area: "",
    approver_id: "",
    approver_name: "",
  });

  // State Form Notulen (Arrays)
  const [topics, setTopics] = useState([
    { content: "", presenter: "", attachment: false, notes: "" },
  ]);
  const [issues, setIssues] = useState([]);
  const [actions, setActions] = useState([]);

  // State Data Absensi (Halaman 2)
  const [attendanceList, setAttendanceList] = useState([]);

  // Daftar PJO / Asst PJO untuk dropdown Approval
  const [approverList, setApproverList] = useState([]);

  // Style Constants - Inline styles (Tailwind tidak aktif di project)
  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 12,
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
  const btnDanger = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 8,
    fontWeight: 500,
    fontSize: 14,
    color: "#fff",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    border: "none",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
  const btnOutline = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 12,
    fontWeight: 600,
    color: "#2563eb",
    background: "#fff",
    border: "2px solid #93c5fd",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  // Load Initial Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Refetch approver saat site/area tersedia (fallback jika initial load site kosong)
  useEffect(() => {
    const site = (formData.site || formData.area || "").trim();
    if (site) fetchApproverList(site);
  }, [formData.site, formData.area]);

  // Refetch daftar hadir untuk tanggal tertentu
  const fetchAttendanceForDate = async (tanggal, userOverride) => {
    const u = userOverride || user || sessionUser;
    const siteForFetch = u?.site;
    if (!siteForFetch || !tanggal) return;
    try {
      const { data: sqlAttendance, error: rpcError } = await supabase.rpc(
        "get_daily_attendance_ftw",
        { p_tanggal: tanggal, p_site: siteForFetch },
      );
      if (!rpcError && sqlAttendance && Array.isArray(sqlAttendance)) {
        const mapped = sqlAttendance.map((row) => ({
          user_id: row.user_id,
          nama: row.nama || "",
          jabatan: row.jabatan || "",
          nrp: row.nrp || "",
          hari_masuk: row.hari_masuk ?? 0,
          sleep_today: row.sleep_today ?? "",
          sleep_48h: row.sleep_48h ?? "",
          attendance_last_ftw_date: tanggal,
          tidak_mengkonsumsi_obat: row.tidak_mengkonsumsi_obat ?? true,
          tidak_ada_masalah_pribadi: row.tidak_ada_masalah_pribadi ?? true,
          siap_bekerja: row.siap_bekerja ?? true,
        }));
        setAttendanceList(mapped);
      } else {
        const attendanceData = await fetchUsersAttendanceForValidator(
          u,
          ["Field Leading Hand", "Plant Leading Hand"],
        );
        if (attendanceData && Array.isArray(attendanceData)) {
          const presentUsers = attendanceData.filter(
            (u) => u.attendance_last_ftw_date === tanggal,
          );
          setAttendanceList(presentUsers);
        } else {
          setAttendanceList([]);
        }
      }
    } catch (attError) {
      console.warn("Gagal mengambil data absensi:", attError);
      setAttendanceList([]);
    }
  };

  const fetchApproverList = async (siteForFetch) => {
    const site = (siteForFetch || "").trim();
    if (!site) return;
    try {
      // Jabatan PJO dan Asst PJO (termasuk variasi ejaan)
      const jabatanPJO = [
        "Penanggung Jawab Operasional",
        "Asst. Penanggung Jawab Operasional",
        "Assisten Penanggung Jawab Operasional",
      ];
      const { data, error } = await supabase
        .from("users")
        .select("id, nama, jabatan")
        .eq("site", site)
        .in("jabatan", jabatanPJO)
        .order("jabatan");
      if (error) {
        console.warn("Gagal fetch approver list:", error);
        setApproverList([]);
        return;
      }
      setApproverList(data || []);
    } catch (e) {
      console.warn("Gagal fetch approver list:", e);
      setApproverList([]);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Gunakan user dari session (userProp) sebagai sumber utama - app pakai custom login
      const authUser = (await supabase.auth.getUser())?.data?.user;
      const userId = authUser?.id || sessionUser?.id;

      if (!userId && !sessionUser) {
        return;
      }

      // Ambil detail user dari DB jika ada auth; fallback ke userProp
      let userData = null;
      if (userId) {
        const res = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        userData = res?.data;
      }

      setUser(userData || sessionUser);

      // Pre-fill form - gunakan userData dari DB, fallback ke session (site user)
      const siteValue = userData?.site || sessionUser?.site || "";
      setFormData((prev) => ({
        ...prev,
        place: siteValue,
        site: siteValue,
        department: userData?.departemen || sessionUser?.departemen || "",
        area: siteValue,
        topic: "Safety Briefing Harian (P5M)", // Default topic
      }));

      const tanggal = formData.date || getTodayWITA();
      await Promise.all([
        fetchAttendanceForDate(tanggal, userData || sessionUser),
        fetchApproverList(siteValue),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      setErrorMsg(error.message || "Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Print (desktop - buka dialog print)
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Daily_Attendance_${formData.date}_${formData.site}`,
  });

  // Handle Download PDF (mobile - auto download)
  const handleDownloadPdf = async () => {
    if (!printComponentRef?.current) return;
    try {
      setIsDownloadingPdf(true);
      const filename = `Daily_Attendance_${formData.date}_${formData.site || "report"}`;
      await downloadPdfFromElement(printComponentRef, filename);
    } catch (err) {
      console.error("Gagal download PDF:", err);
      alert("Gagal mengunduh PDF. Silakan coba lagi.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Handle Form Changes
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;

    // Auto duration logic
    let updatedData = { ...formData, [name]: value };
    if (name === "timeStart" || name === "timeEnd") {
      const { timeStart, timeEnd } = updatedData;
      if (timeStart && timeEnd) {
        const [h1, m1] = timeStart.split(":").map(Number);
        const [h2, m2] = timeEnd.split(":").map(Number);
        const totalMinutes = h2 * 60 + m2 - (h1 * 60 + m1);
        updatedData.duration = totalMinutes > 0 ? totalMinutes.toString() : "0";
      }
    }

    setFormData(updatedData);

    // Saat tanggal berubah, refetch daftar hadir
    if (name === "date" && value) {
      fetchAttendanceForDate(value);
    }
    // Saat site berubah, refetch daftar approver
    if (name === "site" && value) {
      fetchApproverList(value);
    }
  };

  const handleTopicChange = (index, field, value) => {
    const newTopics = [...topics];
    newTopics[index][field] = value;
    setTopics(newTopics);
  };

  const addTopic = () =>
    setTopics([
      ...topics,
      { content: "", presenter: "", attachment: false, notes: "" },
    ]);
  const removeTopic = (index) => {
    if (topics.length > 1) {
      const newTopics = [...topics];
      newTopics.splice(index, 1);
      setTopics(newTopics);
    }
  };

  // --- Handlers for Issues ---
  const handleIssueChange = (index, field, value) => {
    const newIssues = [...issues];
    newIssues[index][field] = value;
    setIssues(newIssues);
  };

  const addIssue = () =>
    setIssues([...issues, { content: "", submittedBy: "" }]);

  const removeIssue = (index) => {
    const newIssues = [...issues];
    newIssues.splice(index, 1);
    setIssues(newIssues);
  };

  // --- Handlers for Actions ---
  const handleActionChange = (index, field, value) => {
    const newActions = [...actions];
    newActions[index][field] = value;
    setActions(newActions);
  };

  const addAction = () =>
    setActions([...actions, { content: "", pic: "", due: "", status: "Open" }]);

  const removeAction = (index) => {
    const newActions = [...actions];
    newActions.splice(index, 1);
    setActions(newActions);
  };

  // Save Function
  const handleSave = async () => {
    try {
      if (!user) {
        alert("Sesi habis, silakan login ulang.");
        return;
      }

      const payload = {
        date: formData.date,
        site: formData.site,
        meeting_type: formData.meetingType,
        time_start: formData.timeStart,
        time_end: formData.timeEnd,
        duration: parseInt(formData.duration || "0"),
        location: formData.place,
        topic: formData.topic,
        department: formData.department,
        area: formData.area || formData.site || "",
        agenda_items: topics,
        issues: issues,
        actions: actions,
        attendance_list: attendanceList,
        creator_id: user.id,
        approver_id: formData.approver_id || null,
        approver_name: formData.approver_name || null,
        status: "Pending", // Default status menunggu approval
      };

      // Simpan ke database
      const { data, error } = await supabase
        .from("safety_meetings")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      alert("Laporan berhasil disimpan! Menunggu approval PJO/Asst PJO.");
      if (onBack) onBack(); // Kembali ke menu utama
    } catch (err) {
      console.error("Gagal menyimpan laporan:", err);
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Memuat data formulir...</div>;

  return (
    <div
      className={isMobile ? "daily-attendance-form-mobile" : ""}
      style={{
        width: "100%",
        height: isMobile ? "auto" : "100vh",
        minHeight: isMobile ? "100vh" : undefined,
        background: isMobile ? "#f8fafc" : "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: isMobile ? 0 : "0 24px",
        overflow: "hidden",
        paddingBottom: isMobile ? "calc(70px + env(safe-area-inset-bottom))" : 0,
      }}
    >
      {isMobile && (
        <MobileHeader
          user={user || sessionUser}
          onBack={onBack}
          title="Buat Laporan Harian"
          showBack={true}
        />
      )}

      <div
        style={{
          background: "transparent",
          borderRadius: isMobile ? 0 : 18,
          boxShadow: "none",
          padding: isMobile ? "72px 16px 16px" : "24px 0",
          maxWidth: 1000,
          width: "100%",
          margin: "0 auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {!isMobile && (
          <div
            style={{
              flexShrink: 0,
              background: "transparent",
              border: "none",
              borderRadius: 18,
              padding: "0 0 24px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={() => onBack && onBack()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 12,
                  fontWeight: 600,
                  color: "#374151",
                  background: "#fff",
                  border: "2px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                }}
              >
                <span style={{ fontSize: 18 }}>&larr;</span> Kembali
              </button>
              <h1 style={{ margin: 0, color: "#1e293b", fontWeight: 800, fontSize: 24 }}>
                Buat Laporan Harian
              </h1>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowPreview(true)}
                style={btnOutline}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#eff6ff";
                  e.currentTarget.style.borderColor = "#60a5fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#93c5fd";
                }}
              >
                👁️ Lihat Preview
              </button>
              <button
                onClick={handlePrint}
                style={btnPrimary}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.4)";
                }}
              >
                🖨️ Cetak PDF
              </button>
            </div>
          </div>
        )}

        {isMobile && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              style={{
                ...btnPrimary,
                width: "100%",
                padding: "10px 16px",
                fontSize: 14,
                opacity: isDownloadingPdf ? 0.7 : 1,
              }}
            >
              {isDownloadingPdf ? "⏳ Mengunduh..." : "📥 Download PDF"}
            </button>
          </div>
        )}

        {/* Main Content - Scrollable */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            paddingBottom: isMobile ? 24 : 80,
            paddingRight: isMobile ? 0 : 8,
          }}
          className="custom-scrollbar"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 24 }}>
            {/* Section 1: Info Pertemuan */}
            <div
              className="daily-attendance-section bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              style={isMobile ? { borderRadius: 12 } : {}}
            >
              <div
                className="bg-gray-50 border-b border-gray-200 flex items-center gap-3"
                style={{ padding: isMobile ? "10px 14px" : "16px 24px" }}
              >
                <span
                  className="bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-sm"
                  style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, fontSize: isMobile ? 11 : 14 }}
                >
                  1
                </span>
                <h2
                  className="font-bold text-gray-800"
                  style={{ margin: 0, fontSize: isMobile ? 14 : 18 }}
                >
                  Info Pertemuan
                </h2>
              </div>
              <div
                className="grid grid-cols-1 md:grid-cols-2"
                style={{
                  padding: isMobile ? "12px 14px" : "24px",
                  gap: isMobile ? 12 : 24,
                }}
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Area / Site
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.area || formData.site || ""}
                    className="block w-full rounded-lg border-gray-300 bg-gray-100 text-gray-700 shadow-sm sm:text-sm p-2.5 border cursor-not-allowed"
                    title="Area otomatis dari site user"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleHeaderChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Departemen
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleHeaderChange}
                    placeholder="Contoh: Produksi, Maintenance"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Jenis Pertemuan
                  </label>
                  <select
                    name="meetingType"
                    value={formData.meetingType}
                    onChange={handleHeaderChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition"
                  >
                    <option value="P5M">P5M (Pagi)</option>
                    <option value="Safety Talk">Safety Talk</option>
                    <option value="Briefing">Briefing Umum</option>
                    <option value="Rapat">Rapat / Meeting</option>
                    <option value="Sosialisasi">Sosialisasi</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tempat / Lokasi
                  </label>
                  <input
                    type="text"
                    name="place"
                    value={formData.place}
                    onChange={handleHeaderChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition"
                  />
                </div>
                <div
                  className="grid grid-cols-2"
                  style={{ gap: isMobile ? 8 : 16 }}
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      name="timeStart"
                      value={formData.timeStart}
                      onChange={handleHeaderChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      name="timeEnd"
                      value={formData.timeEnd}
                      onChange={handleHeaderChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Durasi (Menit - Otomatis)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="duration"
                      placeholder="Auto"
                      value={formData.duration}
                      readOnly
                      className="block w-full rounded-lg border-gray-300 bg-gray-100 text-gray-500 shadow-sm sm:text-sm p-2.5 border pr-12 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400 text-xs font-medium">
                      Menit
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Approval (Mengetahui)
                  </label>
                  <select
                    name="approver_id"
                    value={formData.approver_id || ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      const sel = approverList.find((a) => a.id === id);
                      setFormData((prev) => ({
                        ...prev,
                        approver_id: id,
                        approver_name: sel ? sel.nama : "",
                      }));
                    }}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition"
                  >
                    <option value="">-- Pilih PJO / Asst PJO --</option>
                    {approverList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama} ({a.jabatan})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {approverList.length === 0
                      ? "Tidak ada PJO/Asst PJO untuk site ini. Tambah user dengan jabatan tersebut di User Management."
                      : "Pilih approver untuk mengisi kolom Mengetahui pada formulir"}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Notulen */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              style={isMobile ? { borderRadius: 12 } : {}}
            >
              <div
                className="bg-gray-50 border-b border-gray-200 flex items-center justify-between"
                style={{ padding: isMobile ? "10px 14px" : "16px 24px" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-sm"
                    style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, fontSize: isMobile ? 11 : 14 }}
                  >
                    2
                  </span>
                  <h2
                    className="font-bold text-gray-800"
                    style={{ margin: 0, fontSize: isMobile ? 14 : 18 }}
                  >
                    Notulen (Isi Rapat)
                  </h2>
                </div>
                <button
                  onClick={addTopic}
                  style={{
                    ...btnPrimary,
                    padding: isMobile ? "6px 12px" : "8px 16px",
                    fontSize: isMobile ? 12 : 14,
                  }}
                >
                  <span className="leading-none">+</span> Tambah Topik
                </button>
              </div>
              <div
                className="space-y-4"
                style={{ padding: isMobile ? "12px 14px" : "24px" }}
              >
                {topics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group hover:border-blue-300 transition"
                  >
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => removeTopic(idx)}
                        style={btnDanger}
                        title="Hapus Topik"
                      >
                        ✕ Hapus
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <span className="flex-none bg-white text-gray-500 w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shadow-sm">
                        {idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            Isi Topik
                          </label>
                          <textarea
                            placeholder="Apa yang dibahas?"
                            value={topic.content}
                            onChange={(e) =>
                              handleTopicChange(idx, "content", e.target.value)
                            }
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            Dibawakan Oleh
                          </label>
                          <input
                            type="text"
                            placeholder="Nama Pembicara"
                            value={topic.presenter}
                            onChange={(e) =>
                              handleTopicChange(
                                idx,
                                "presenter",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            Catatan Tambahan
                          </label>
                          <input
                            type="text"
                            placeholder="Opsional"
                            value={topic.notes}
                            onChange={(e) =>
                              handleTopicChange(idx, "notes", e.target.value)
                            }
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Masalah */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              style={isMobile ? { borderRadius: 12 } : {}}
            >
              <div
                className="bg-gray-50 border-b border-gray-200 flex items-center justify-between"
                style={{ padding: isMobile ? "10px 14px" : "16px 24px" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-sm"
                    style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, fontSize: isMobile ? 11 : 14 }}
                  >
                    3
                  </span>
                  <h2 className="font-bold text-gray-800" style={{ margin: 0, fontSize: isMobile ? 14 : 18 }}>
                    Masalah Karyawan
                  </h2>
                </div>
                <button
                  onClick={addIssue}
                  style={{ ...btnPrimary, padding: isMobile ? "6px 12px" : "8px 16px", fontSize: isMobile ? 12 : 14 }}
                >
                  <span className="leading-none">+</span> Tambah Masalah
                </button>
              </div>
              <div className="space-y-4" style={{ padding: isMobile ? "12px 14px" : "24px" }}>
                {issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group hover:border-blue-300 transition"
                  >
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => removeIssue(idx)}
                        style={btnDanger}
                        title="Hapus Masalah"
                      >
                        ✕ Hapus
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <span className="flex-none bg-white text-gray-500 w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shadow-sm">
                        {idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            Masalah
                          </label>
                          <textarea
                            placeholder="Deskripsi masalah..."
                            value={issue.content}
                            onChange={(e) =>
                              handleIssueChange(idx, "content", e.target.value)
                            }
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            Disampaikan Oleh
                          </label>
                          <input
                            type="text"
                            placeholder="Nama Penyampai"
                            value={issue.submittedBy}
                            onChange={(e) =>
                              handleIssueChange(
                                idx,
                                "submittedBy",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {issues.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-4 italic">
                    Belum ada masalah yang dicatat.
                  </p>
                )}
              </div>
            </div>

            {/* Section 4: Tindakan */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              style={isMobile ? { borderRadius: 12 } : {}}
            >
              <div
                className="bg-gray-50 border-b border-gray-200 flex items-center justify-between"
                style={{ padding: isMobile ? "10px 14px" : "16px 24px" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-sm"
                    style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, fontSize: isMobile ? 11 : 14 }}
                  >
                    4
                  </span>
                  <h2 className="font-bold text-gray-800" style={{ margin: 0, fontSize: isMobile ? 14 : 18 }}>
                    Tindakan Perbaikan
                  </h2>
                </div>
                <button
                  onClick={addAction}
                  style={{ ...btnPrimary, padding: isMobile ? "6px 12px" : "8px 16px", fontSize: isMobile ? 12 : 14 }}
                >
                  <span className="leading-none">+</span> Tambah Tindakan
                </button>
              </div>
              <div className="space-y-4" style={{ padding: isMobile ? "12px 14px" : "24px" }}>
                {actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group hover:border-blue-300 transition"
                  >
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => removeAction(idx)}
                        style={btnDanger}
                        title="Hapus Tindakan"
                      >
                        ✕ Hapus
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <span className="flex-none bg-white text-gray-500 w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shadow-sm">
                        {idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="md:col-span-2 lg:col-span-4">
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            Tindakan Perbaikan
                          </label>
                          <textarea
                            placeholder="Apa yang akan dilakukan?"
                            value={action.content}
                            onChange={(e) =>
                              handleActionChange(idx, "content", e.target.value)
                            }
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            PIC
                          </label>
                          <input
                            type="text"
                            placeholder="Nama PIC"
                            value={action.pic}
                            onChange={(e) =>
                              handleActionChange(idx, "pic", e.target.value)
                            }
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            Tenggat Waktu
                          </label>
                          <input
                            type="date"
                            value={action.due}
                            onChange={(e) =>
                              handleActionChange(idx, "due", e.target.value)
                            }
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            Status
                          </label>
                          <select
                            value={action.status}
                            onChange={(e) =>
                              handleActionChange(idx, "status", e.target.value)
                            }
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {actions.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-4 italic">
                    Belum ada tindakan yang dicatat.
                  </p>
                )}
              </div>
            </div>

            {/* Section 5: Absensi (Read Only - dari Fit To Work) */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              style={isMobile ? { borderRadius: 12 } : {}}
            >
              <div
                className="bg-gray-50 border-b border-gray-200"
                style={{ padding: isMobile ? "10px 14px" : "16px 24px" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-sm"
                    style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, fontSize: isMobile ? 11 : 14 }}
                  >
                    5
                  </span>
                  <h2 className="font-bold text-gray-800" style={{ margin: 0, fontSize: isMobile ? 14 : 18 }}>
                    Data Absensi
                  </h2>
                </div>
              </div>
              <div style={{ padding: isMobile ? "12px 14px" : "24px" }}>
                <div className="mb-4 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span>ℹ️</span>
                  Data dari user yang mengisi Fit To Work pada tanggal yang dipilih. <strong>
                    {attendanceList.length}
                  </strong>{" "}
                  peserta hadir. (Read only)
                </div>

                <div className="overflow-x-auto border rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Nama
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Jabatan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          NRP
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Hari Kerja
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Tidur 24h
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Tidur 48h
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceList.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {row.nama || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {row.jabatan || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {row.nrp || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {row.hari_masuk ?? "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {row.sleep_today !== undefined && row.sleep_today !== null && row.sleep_today !== ""
                              ? parseFloat(row.sleep_today).toFixed(1)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {row.sleep_48h !== undefined && row.sleep_48h !== null && row.sleep_48h !== ""
                              ? parseFloat(row.sleep_48h).toFixed(1)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                      {attendanceList.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50 italic"
                          >
                            Tidak ada data. Ubah tanggal atau pastikan ada user yang mengisi Fit To Work.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 pb-8">
              <button
                onClick={handleSave}
                style={{ ...btnPrimary, fontSize: "16px", padding: "12px 32px" }}
              >
                <span>💾</span> Simpan Laporan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print content untuk mobile - selalu di DOM agar bisa di-capture untuk PDF */}
      {isMobile && (
        <div
          ref={printComponentRef}
          style={{
            position: "absolute",
            left: -9999,
            top: 0,
            width: "210mm",
            background: "#fff",
          }}
        >
          <DailyAttendancePrint
            data={{
              ...formData,
              area: formData.area || formData.site || "",
              topics,
              issues,
              actions,
              creatorName: user?.nama,
              creatorJabatan: user?.jabatan || "",
              approverName: formData.approver_name || "(Menunggu Ttd)",
              approverJabatan:
                approverList.find((a) => a.id === formData.approver_id)?.jabatan || "",
              status: "Pending",
            }}
            attendanceData={attendanceList}
          />
        </div>
      )}

      {/* Modal Preview (desktop only) */}
      {showPreview && !isMobile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col"
            style={{ height: "90vh", maxHeight: "90vh" }}
          >
            <div className="flex justify-between items-center p-4 border-b bg-gray-50 shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                Preview Cetak PDF
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>
            <div
              className="flex-1 bg-gray-100 p-8 custom-scrollbar"
              style={{
                minHeight: 0,
                overflowY: "scroll",
                overflowX: "auto",
              }}
            >
              <div
                className="daily-attendance-paper-preview bg-white"
                style={{
                  width: "210mm",
                  maxWidth: "210mm",
                  margin: "0 auto",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
                  borderRadius: 2,
                }}
                ref={printComponentRef}
              >
                <DailyAttendancePrint
                  data={{
                    ...formData,
                    area: formData.area || formData.site || "",
                    topics,
                    issues,
                    actions,
                    creatorName: user?.nama,
                    creatorJabatan: user?.jabatan || "",
                    approverName: formData.approver_name || "(Menunggu Ttd)",
                    approverJabatan:
                      approverList.find((a) => a.id === formData.approver_id)
                        ?.jabatan || "",
                    status: "Pending",
                  }}
                  attendanceData={attendanceList}
                />
              </div>
            </div>
            <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowPreview(false)}
                style={btnOutline}
              >
                Tutup
              </button>
              <button onClick={handlePrint} style={btnPrimary}>
                Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobile && onNavigate && (
        <MobileBottomNavigation
          activeTab={null}
          tasklistTodoCount={tasklistTodoCount}
          onNavigate={(tab) => {
            if (tab === "home") onNavigate("dashboard");
            else if (tab === "tasklist") onNavigate("tasklist");
            else if (tab === "profile") onNavigate("profile");
          }}
        />
      )}
    </div>
  );
};

export default DailyAttendanceForm;

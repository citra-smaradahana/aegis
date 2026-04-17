import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import SelectModalWithSearch from "../SelectModalWithSearch";
import { downloadPdfFromElement } from "../../utils/downloadPdfFromElement";
import Inspeksi5RPrint from "./Inspeksi5RPrint";

// ─── ACCESS CONTROL ───────────────────────────────────────────────────────────
const HISTORY_ACCESS_ROLES = ["evaluator", "admin"];
const HISTORY_ACCESS_JABATAN = [
  "admin site project",
  "field leading hand",
  "plant leading hand",
  "maintenance leading hand",
  "asst. penanggung jawab operasional",
  "penanggung jawab operasional",
  "administrator"
];

const canAccessHistory = (user) => {
  if (!user) return false;
  const role = (user.role || "").toLowerCase();
  const jabatan = (user.jabatan || "").toLowerCase().trim();
  return HISTORY_ACCESS_ROLES.includes(role) || HISTORY_ACCESS_JABATAN.includes(jabatan);
};

// ─── AREA CONFIG ──────────────────────────────────────────────────────────────
const AREA_OPTIONS = [
  {
    id: "office",
    label: "Area Office",
    icon: "🏢",
    description: "Ruang kantor, administrasi, dan area kerja berbasis dokumen",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    bg: "#eff6ff",
    border: "#bfdbfe",
    darkBg: "#1e3a5f",
    darkBorder: "#1e40af",
    tags: ["Ruang Kantor", "Ruang Rapat", "Area Administrasi"],
    inspectorLabel: "5R Inspector",
    docRef: "BSI-OHS-FO-180",
  },
  {
    id: "non-office",
    label: "Area Non-Office",
    icon: "🛠️",
    description: "Workshop, gudang, area operasional, dan site produksi",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    bg: "#fffbeb",
    border: "#fde68a",
    darkBg: "#451a03",
    darkBorder: "#92400e",
    tags: ["Workshop", "Gudang", "Area Lapangan", "Site"],
    inspectorLabel: "5S Inspector",
    docRef: "BSI-OHS-FO-179",
  },
];

// ─── CHECKLIST DATA PER AREA ──────────────────────────────────────────────────

const KATEGORI_5R_OFFICE = [
  {
    kode: "S1", nama: "Seiri — Ringkas", icon: "🗂️", color: "#ef4444",
    en_nama: "Sort — Sortir",
    deskripsi: "Sortir: Memilah barang yang diperlukan dan tidak diperlukan",
    items: [
      { id: "Tidak ada bahan referensi, dokumen, gambar, dll yang tidak relevan", en: "No unnecessary reference materials, documents, drawings, etc." },
      { id: "Tidak ada bahan referensi, dokumen, dll yang tidak relevan (duplikat/kadaluarsa)", en: "No unnecessary reference materials, documents, etc. (duplicate/expired)" },
      { id: "Tidak ada peralatan, dokumen, dll yang berlebih", en: "No excess equipment, documents, etc." },
      { id: "Area penyimpanan ditentukan untuk menyimpan barang yang tidak dibutuhkan dan dokumen yang sudah kadaluarsa", en: "Storage area is defined to store unneeded items and expired documents" },
      { id: "Ada standar untuk membuang atau menghilangkan suatu barang yang tidak diperlukan dan diikuti", en: "Standards for disposing of unnecessary items exist and are being followed" },
    ],
  },
  {
    kode: "S2", nama: "Seiton — Rapi", icon: "📐", color: "#f59e0b",
    en_nama: "Set in Order — Susun",
    deskripsi: "Susun: Menata barang agar mudah diambil dan dikembalikan",
    items: [
      { id: "Meja dan lemari bebas dari tumpukan kertas dan benda lain", en: "Desks and cabinets are free from piles of paper and other objects" },
      { id: "Semua alat dan perlengkapan disimpan pada tempat yang tetap", en: "All tools and equipment are stored in a fixed place" },
      { id: "Peralatan dan perlengkapan diatur dengan baik agar mudah untuk pengambilan dan pengembalian", en: "Equipment and supplies are well-arranged for easy retrieval and return" },
      { id: "Labeling lemari, rak dan file agar memungkinkan untuk identifikasi segera", en: "Labeling of cabinets, shelves, and files to allow for immediate identification" },
      { id: "Dokumen disimpan sesuai dengan pedoman retensi catatan", en: "Documents are stored according to record retention guidelines" },
      { id: "Tampilan rapi, bebas dari kekacauan, berlabel dan up-to-date", en: "Neat appearance, free from clutter, labeled and up-to-date" },
      { id: "Peralatan keselamatan mudah diakses dan dalam kondisi yang baik", en: "Safety equipment is easily accessible and in good condition" },
    ],
  },
  {
    kode: "S3", nama: "Seisō — Resik", icon: "🧹", color: "#10b981",
    en_nama: "Shine — Sapu",
    deskripsi: "Sapu: Membersihkan dan merawat area kerja secara rutin",
    items: [
      { id: "Lantai tetap bersih dan tidak ada tanda-tanda kerusakan", en: "Floors remain clean and there are no signs of damage" },
      { id: "Dinding dan langit-langit dalam kondisi yang baik dan bebas dari tanda-tanda kotor dan debu", en: "Walls and ceilings are in good condition and free from dirt and dust" },
      { id: "Rak dan lemari dijaga tetap bersih dan dalam kondisi yang baik", en: "Shelves and cabinets are kept clean and in good condition" },
      { id: "Perlengkapan dan peralatan dijaga tetap bersih dan dalam kondisi yang baik", en: "Supplies and equipment are kept clean and in good condition" },
      { id: "Meja kerja, meja biasa dan perabotan lainnya dijaga kebersihannya", en: "Workstations, desks and other furniture are kept clean" },
      { id: "Penerangan cukup dan sudut serta intensitas pencahayaan sesuai", en: "Lighting is sufficient and the angle and intensity of lighting is appropriate" },
      { id: "Pergerakan udara yang baik dalam ruangan", en: "Good air movement in the room" },
      { id: "Tempat sampah dikosongkan secara rutin atau teratur", en: "Trash cans are emptied regularly" },
      { id: "Kawasan tanpa rokok, tidak ditemukan puntung rokok berserakan", en: "No smoking area, no scattered cigarette butts found" },
      { id: "Area merokok tersedia asbak dan tidak ditemukan puntung rokok berserakan", en: "Smoking area has ashtrays and no scattered cigarette butts found" },
    ],
  },
  {
    kode: "S4", nama: "Seiketsu — Rawat", icon: "📋", color: "#3b82f6",
    en_nama: "Standardize — Standarisasi",
    deskripsi: "Standarisasi: Mempertahankan standar 3S pertama secara konsisten",
    items: [
      { id: "Kontrol visual dan display board atau papan tampil digunakan dan diperbaharui secara berkala", en: "Visual controls and display boards are used and updated regularly" },
      { id: "Prosedur untuk mempertahankan 3S pertama ditampilkan", en: "Procedures for maintaining the first three S's are displayed" },
      { id: "Daftar periksa, jadwal, dan rutinitas 5S ditentukan dan digunakan", en: "5S checklists, schedules, and routines are defined and used" },
      { id: "Setiap orang tahu tanggungjawabnya, kapan dan harus bagaimana", en: "Everyone knows their responsibilities, when and how" },
      { id: "Audit rutin berlangsung menggunakan daftar periksa dan pengukuran", en: "Regular audits take place using checklists and measurement" },
    ],
  },
  {
    kode: "S5", nama: "Shitsuke — Rajin", icon: "🏆", color: "#8b5cf6",
    en_nama: "Sustain — Swa-Disiplin",
    deskripsi: "Swa-Disiplin: Membudayakan 5S sebagai gaya hidup, bukan sekadar rutinnya",
    items: [
      { id: "5S tampaknya menjadi cara hidup bukan hanya rutinitas", en: "5S seems to be a way of life, not just a routine" },
      { id: "Kisah kesuksesan ditampilkan (berupa gambar sebelum dan sesudahnya)", en: "Success stories are displayed (as before and after pictures)" },
      { id: "Penghargaan dan pengakuan merupakan bagian dari sistem 5S", en: "Rewards and recognition are part of the 5S system" },
    ],
  },
];

const KATEGORI_5R_NON_OFFICE = [
  {
    kode: "S1", nama: "Seiri — Ringkas", icon: "🗂️", color: "#ef4444",
    en_nama: "Sort — Sortir",
    deskripsi: "Sortir: Memilah barang yang diperlukan dan tidak diperlukan",
    items: [
      { id: "Tidak ada barang yang tidak diperlukan tertinggal atau disimpan di tempat kerja", en: "No unnecessary items are left or stored in the workplace" },
      { id: "Semua mesin dan peralatan digunakan secara teratur", en: "All machines and pieces of equipment are in regular use" },
      { id: "Semua peralatan, perkakas, dan perlengkapan digunakan secara teratur", en: "All tools, fixtures and fittings are in regular use" },
      { id: "Area penyimpanan ditentukan untuk menyimpan barang yang rusak, tidak dapat digunakan atau kadang-kadang digunakan", en: "Storage area is defined to store broken, unusable or occasionally used items" },
      { id: "Ada standar untuk membuang atau menghilangkan suatu barang yang tidak diperlukan dan sedang diikuti", en: "Standards for eliminating unnecessary items exist and are being followed" },
    ],
  },
  {
    kode: "S2", nama: "Seiton — Rapi", icon: "📐", color: "#f59e0b",
    en_nama: "Set in Order — Susun",
    deskripsi: "Susun: Menata barang agar lokasi jelas dan mudah diakses",
    items: [
      { id: "Letak alat dan perlengkapan dengan jelas dan tertata dengan baik", en: "Locations of tools and equipment are clear and well organized" },
      { id: "Letak bahan dan juga produk jelas dan terorganisir dengan baik", en: "Locations of materials and products are clear and well organized" },
      { id: "Ada label untuk menunjukan lokasi, wadah, kotak, rak dan barang yang disimpan", en: "Labels exist to indicate locations, containers, boxes, shelves and stored items" },
      { id: "Ada bukti pengendalian inventaris (berupa kartu Kanban, FIFO, min/max, dll)", en: "Evidence of inventory control exists (i.e. Kanban cards, FIFO, minimum/maximum, etc.)" },
      { id: "Garis pemisah diidentifikasi dengan jelas dan bersih sesuai dengan standar", en: "Dividing lines are clearly identified and clean as per standard" },
      { id: "Peralatan dan perlengkapan keselamatan jelas dan dalam kondisi yang baik", en: "Safety equipment and supplies are clear and in good condition" },
    ],
  },
  {
    kode: "S3", nama: "Seisō — Resik", icon: "🧹", color: "#10b981",
    en_nama: "Shine — Sapu",
    deskripsi: "Sapu: Membersihkan dan merawat area kerja secara rutin",
    items: [
      { id: "Lantai, dinding, plafon, dan pipa dalam kondisi yang baik dan bersih atau bebas dari kotor dan debu", en: "Floors, walls, ceilings and pipework are in good condition and free from dirt and dust" },
      { id: "Rak, lemari dan rak-rak dijaga dalam keadaan bersih", en: "Racks, cabinets and shelves are kept clean" },
      { id: "Mesin, peralatan dan perkakas kebersihannya dijaga", en: "Machines, equipment and tools are kept clean" },
      { id: "Barang, bahan, dan produk tetap dijaga kebersihannya", en: "Stored items, materials and products are kept clean" },
      { id: "Penerangan yang cukup dan penerangan bebas dari debu", en: "Lighting is enough and all lighting is free from dust" },
      { id: "Adanya pergerakan udara yang baik dalam ruangan (untuk membatasi penyebaran virus)", en: "Good movement of air exists through the room (to limit the spread of viruses)" },
      { id: "Adanya pengendalian hama dan efektif", en: "Pest control exists and effective" },
      { id: "Alat dan bahan pembersih mudah dijangkau", en: "Cleaning tools and materials are easily accessible" },
      { id: "Tugas membersihkan ditentukan dan diikuti", en: "Cleaning assignments are defined and are being followed" },
      { id: "Kawasan tanpa rokok, tidak ditemukan puntung rokok berserakan", en: "No smoking area, no scattered cigarette butts found" },
      { id: "Area merokok tersedia asbak dan tidak ditemukan puntung rokok berserakan", en: "Smoking area has ashtrays and no scattered cigarette butts found" },
    ],
  },
  {
    kode: "S4", nama: "Seiketsu — Rawat", icon: "📋", color: "#3b82f6",
    en_nama: "Standardize — Standarisasi",
    deskripsi: "Standarisasi: Mempertahankan standar 3S pertama secara konsisten",
    items: [
      { id: "Tampilan informasi, tanda, kode warna dan penanda lainnya dibuat", en: "Information displays, signs, color coding and other markings are established" },
      { id: "Prosedur untuk mempertahankan 3S sebelumnya ditampilkan", en: "Procedures for maintaining the first three S's are being displayed" },
      { id: "Daftar periksa, jadwal, dan rutinitas 5S ditentukan dan digunakan", en: "5S checklists, schedules and routines are defined and being used" },
      { id: "Setiap orang tahu tanggungjawabnya, kapan dan harus bagaimana", en: "Everyone knows his responsibilities, when and how" },
      { id: "Audit rutin dilakukan dengan menggunakan daftar periksa dan pengukuran", en: "Regular audits are carried out using checklists and measures" },
    ],
  },
  {
    kode: "S5", nama: "Shitsuke — Rajin", icon: "🏆", color: "#8b5cf6",
    en_nama: "Sustain — Swa-Disiplin",
    deskripsi: "Swa-Disiplin: Membudayakan 5S sebagai gaya hidup, bukan sekadar rutinitas",
    items: [
      { id: "5S tampaknya menjadi cara hidup bukan hanya rutinitas", en: "5S seems to be the way of life rather than just a routine" },
      { id: "Kisah kesuksesan ditampilkan (berupa gambar sebelum dan sesudahnya)", en: "Success stories are being displayed (i.e. before and after pictures)" },
      { id: "Penghargaan dan pengakuan merupakan bagian dari sistem 5S", en: "Rewards and recognition is part of the 5S system" },
    ],
  },
];

function getKategori(areaType) {
  return areaType === "office" ? KATEGORI_5R_OFFICE : KATEGORI_5R_NON_OFFICE;
}

const OPTIONS = [
  { value: "ok",  label: "✅ OK",  bg: "#10b981", light: "#ecfdf5", border: "#a7f3d0" },
  { value: "nok", label: "❌ NOK", bg: "#ef4444", light: "#fef2f2", border: "#fecaca" },
  { value: "na",  label: "N/A",   bg: "#6b7280", light: "#f3f4f6", border: "#d1d5db" },
];

function use5RForm(areaType, user) {
  const kategori = getKategori(areaType);
  const todayISO = new Date().toISOString().split("T")[0];
  const [answers,       setAnswers]       = useState({});
  const [catatan,       setCatatan]       = useState({});
  const [photos,        setPhotos]        = useState({}); // { "S1-0": { file, preview } }
  const [tanggal,       setTanggal]       = useState("");
  const [workArea,      setWorkArea]      = useState("");
  const [leaderName,    setLeaderName]    = useState("");
  const [inspectorName, setInspectorName] = useState(user?.nama || "");
  const [submitted,     setSubmitted]     = useState(false);

  // Sync inspectorName jika user berubah
  useEffect(() => {
    if (user?.nama) setInspectorName(user.nama);
  }, [user?.nama]);

  const totalItems    = kategori.reduce((s, k) => s + k.items.length, 0);
  const answeredItems = Object.keys(answers).length;
  const progress      = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;

  // Semua key yang bernilai NOK
  const nokKeys = Object.entries(answers).filter(([, v]) => v === "nok").map(([k]) => k);
  // NOK yang belum ada fotonya
  const nokWithoutPhoto = nokKeys.filter((k) => !photos[k]);
  const allNokHavePhoto = nokWithoutPhoto.length === 0;

  const setScore = (kode, idx, val) => {
    const key = `${kode}-${idx}`;
    setAnswers((p) => ({ ...p, [key]: val }));
    // Jika jawaban diubah dari NOK → lainnya, hapus foto yang sudah diupload
    if (val !== "nok") {
      setPhotos((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  };
  const getScore = (kode, idx) => answers[`${kode}-${idx}`];

  const setPhoto = useCallback(async (kode, idx, file) => {
    if (!file) return;
    const key = `${kode}-${idx}`;
    const preview = URL.createObjectURL(file);
    setPhotos((p) => ({ ...p, [key]: { file, preview } }));
  }, []);

  const removePhoto = (kode, idx) => {
    const key = `${kode}-${idx}`;
    setPhotos((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const resetForm = () => {
    setAnswers({}); setCatatan({}); setPhotos({}); setSubmitted(false);
  };

  return {
    kategori, catatan, setCatatan,
    photos, setPhoto, removePhoto, nokKeys, nokWithoutPhoto, allNokHavePhoto,
    tanggal, setTanggal, workArea, setWorkArea,
    leaderName, setLeaderName, inspectorName, setInspectorName,
    submitted, setSubmitted, totalItems, answeredItems, progress,
    setScore, getScore, resetForm,
  };
}

// ─── LOGIKA SUBMIT ────────────────────────────────────────────────────────────
async function submitInspeksi5R({ user, areaType, form, photos, setSubmitting, setSubmitError, onSuccess }) {
  setSubmitting(true);
  setSubmitError(null);

  try {
    const area = AREA_OPTIONS.find(a => a.id === areaType);
    const kategori = getKategori(areaType);
    
    // 1. Upload semua foto NOK
    const photoUrls = {};
    const photoKeys = Object.keys(photos);
    
    for (const key of photoKeys) {
      const { file } = photos[key];
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${key}.${fileExt}`;
      const filePath = `entries/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("inspeksi-5r-foto")
        .upload(filePath, file);

      if (uploadError) throw new Error(`Gagal upload foto ${key}: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("inspeksi-5r-foto")
        .getPublicUrl(filePath);
      
      photoUrls[key] = urlData.publicUrl;
    }

    // 2. Hitung statistik skor
    const answers = kategori.reduce((acc, k) => {
      k.items.forEach((_, idx) => {
        const key = `${k.kode}-${idx}`;
        acc[key] = form.getScore(k.kode, idx);
      });
      return acc;
    }, {});

    const total_items = Object.values(answers).length;
    const total_ok    = Object.values(answers).filter(v => v === 'ok').length;
    const total_nok   = Object.values(answers).filter(v => v === 'nok').length;
    const total_na    = Object.values(answers).filter(v => v === 'na').length;
    const divisor     = total_items - total_na;
    const score_pct   = divisor > 0 ? Math.round((total_ok / divisor) * 100) : 0;

    // 3. Simpan Header
    const { data: header, error: headerErr } = await supabase
      .from("inspeksi_5r")
      .insert({
        area_type: areaType,
        doc_ref: area?.docRef,
        tanggal: form.tanggal,
        work_area: form.workArea,
        leader_name: form.leaderName,
        inspector_name: form.inspectorName,
        site: user?.site,
        submitted_by: user?.id,
        submitted_by_nama: user?.nama,
        total_items,
        total_ok,
        total_nok,
        total_na,
        score_pct
      })
      .select()
      .single();

    if (headerErr) throw headerErr;

    // 4. Simpan Items checklist
    const itemRows = [];
    kategori.forEach(k => {
      k.items.forEach((itemObj, idx) => {
        const key = `${k.kode}-${idx}`;
        const score = answers[key];
        itemRows.push({
          inspeksi_id: header.id,
          kategori_kode: k.kode,
          item_index: idx,
          item_text: itemObj.id,
          score: score,
          foto_url: score === 'nok' ? photoUrls[key] : null
        });
      });
    });

    const { error: itemsErr } = await supabase.from("inspeksi_5r_items").insert(itemRows);
    if (itemsErr) throw itemsErr;

    // 5. Simpan Catatan per kategori
    const catatanRows = Object.entries(form.catatan)
      .filter(([, text]) => text && text.trim().length > 0)
      .map(([kode, text]) => ({
        inspeksi_id: header.id,
        kategori_kode: kode,
        catatan: text
      }));

    if (catatanRows.length > 0) {
      const { error: catErr } = await supabase.from("inspeksi_5r_catatan").insert(catatanRows);
      if (catErr) throw catErr;
    }

    onSuccess();
  } catch (err) {
    console.error("Error submitting 5R:", err);
    setSubmitError(err.message || "Gagal menyimpan laporan.");
  } finally {
    setSubmitting(false);
  }
}

// ═══════════════════════════════════════════════════════
// FOTO NOK ─ komponen reusable foto wajib per item NOK
// ═══════════════════════════════════════════════════════
function FotoNOK({ kode, idx, photos, setPhoto, removePhoto, isDark = false }) {
  const key     = `${kode}-${idx}`;
  const photo   = photos[key];
  const camRef  = useRef();
  const galRef  = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1280, 1280, 0.75);
      await setPhoto(kode, idx, compressed);
    } catch {
      await setPhoto(kode, idx, file);
    }
    e.target.value = "";
  };

  if (photo) {
    return (
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={photo.preview} alt="Foto temuan"
            style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8,
              border: `2px solid ${isDark ? "#374151" : "#fecaca"}` }} />
          <button onClick={() => removePhoto(kode, idx)}
            style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20,
              background: "#ef4444", border: "none", borderRadius: "50%", color: "white",
              fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
            ✕
          </button>
        </div>
        <span style={{ fontSize: 12, color: isDark ? "#10b981" : "#065f46", fontWeight: 600 }}>
          ✅ Foto temuan terlampir
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 8,
      background: isDark ? "#1c1f26" : "#fff5f5",
      border: `1.5px dashed ${isDark ? "#ef444460" : "#fca5a5"}` }}>
      <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginBottom: 8 }}>
        📷 Wajib lampirkan foto temuan
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => camRef.current?.click()}
          style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
            background: isDark ? "#374151" : "#fee2e2", color: isDark ? "#d1d5db" : "#991b1b",
            fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          📷 Kamera
        </button>
        <button type="button" onClick={() => galRef.current?.click()}
          style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
            background: isDark ? "#374151" : "#fee2e2", color: isDark ? "#d1d5db" : "#991b1b",
            fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          🖼️ Galeri
        </button>
      </div>
      <input ref={camRef} type="file" accept="image/*" capture="environment"
        onChange={handleFile} style={{ display: "none" }} />
      <input ref={galRef} type="file" accept="image/*"
        onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DETAIL MODAL ─ Tampilan Rincian & Tombol Download
// ═══════════════════════════════════════════════════════
const Inspeksi5RDetail = ({ laporan, detail, loading, onClose, isMobile }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const printRef = useRef(null);

  if (!laporan) return null;

  const handleDownload = async () => {
    if (!detail) return;
    try {
      setIsDownloading(true);
      const filename = `Inspeksi_5R_${laporan.work_area}_${laporan.tanggal}`.replace(/\s+/g, "_");
      await downloadPdfFromElement(printRef, filename, { orientation: "portrait" });
    } catch (err) {
      console.error("Download PDF failed:", err);
      alert("Gagal mengunduh PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getKategoriData = (kode, areaType) => {
    const list = areaType === "office" ? KATEGORI_5R_OFFICE : KATEGORI_5R_NON_OFFICE;
    return list.find(k => k.kode === kode);
  };

  const getItemEn = (itemText, kategoriKode, areaType) => {
    const kat = getKategoriData(kategoriKode, areaType);
    if (!kat) return "";
    const itemObj = kat.items.find(i => i.id === itemText);
    return itemObj ? itemObj.en : "";
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 20, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      {/* Backdrop for closing */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 650, height: isMobile ? "100%" : "90vh", background: "#f8fafc", borderRadius: isMobile ? 0 : 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
        
        {/* Header Modal */}
        <div style={{ padding: "16px 20px", background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>✕</button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>Detail Inspeksi 5R</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{laporan.work_area} • {laporan.tanggal}</div>
            </div>
          </div>
          <button onClick={handleDownload} disabled={loading || isDownloading}
            style={{ padding: "8px 16px", background: "#10b981", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: (loading || isDownloading) ? 0.6 : 1 }}>
            {isDownloading ? "⏳" : "📥"} PDF
          </button>
        </div>

        {/* Content Scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Memuat rincian laporan...</div>
          ) : detail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Summary Card */}
              <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ position: "relative", width: 70, height: 70, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", flexShrink: 0 }}>
                  <svg style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${laporan.score_pct}, 100`} />
                  </svg>
                  <span style={{ fontWeight: 900, fontSize: 18, color: "#0f172a", zIndex: 1 }}>{Math.round(laporan.score_pct)}%</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Skor Kepatuhan Total</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>{laporan.total_ok} OK / {laporan.total_items - laporan.total_na} Berlaku</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "#ecfdf5", padding: "2px 8px", borderRadius: 4 }}>{laporan.total_ok} OK</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fef2f2", padding: "2px 8px", borderRadius: 4 }}>{laporan.total_nok} NOK</span>
                  </div>
                </div>
              </div>

              {/* Identity Details */}
              <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Informasi Umum</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { l: "Area", v: laporan.work_area },
                    { l: "Tipe", v: laporan.area_type === 'office' ? "Office (FO-180)" : "Non-Office (FO-179)" },
                    { l: "Inspektor", v: laporan.inspector_name || laporan.submitted_by_nama },
                    { l: "5S Leader", v: laporan.leader_name || "-" },
                  ].map((info, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{info.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{info.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hasil Penilaian</div>
                
                {detail.items.sort((a,b) => a.kategori_kode.localeCompare(b.kategori_kode) || a.item_index - b.item_index).map((item, idx) => {
                  const kat = getKategoriData(item.kategori_kode);
                  return (
                    <div key={item.id} style={{ background: "white", borderRadius: 12, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", borderLeft: `4px solid ${item.score === 'ok' ? '#10b981' : item.score === 'nok' ? '#ef4444' : '#94a3b8'}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                         <div style={{ fontSize: 11, fontWeight: 700, color: kat?.color || "#64748b" }}>{item.kategori_kode} — {kat?.nama}</div>
                         <div style={{ fontSize: 11, fontWeight: 800, color: item.score === 'ok' ? '#10b981' : item.score === 'nok' ? '#ef4444' : '#64748b' }}>
                            {item.score.toUpperCase()}
                         </div>
                      </div>
                      <div style={{ fontSize: 14, color: "#1f2937", fontWeight: 600, marginBottom: 2 }}>
                        {idx + 1}. {item.item_text}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic", marginBottom: 10 }}>
                        {getItemEn(item.item_text, item.kategori_kode, laporan.area_type)}
                      </div>
                      {item.foto_url && (
                        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                          <img src={item.foto_url} alt="Temuan NOK" style={{ width: "100%", height: 180, objectFit: "cover" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Comments Section */}
              {detail.catatan && detail.catatan.some(c => c.catatan) && (
                <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Catatan Tambahan</div>
                  {detail.catatan.filter(c => c.catatan).map((c, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{c.kategori_kode}</div>
                      <div style={{ fontSize: 13, color: "#334155" }}>{c.catatan}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Hidden PDF Template for generation */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "794px" }}>
        <div ref={printRef} style={{ width: "794px" }}>
          <Inspeksi5RPrint 
            laporan={laporan} 
            items={(detail?.items || []).map(item => ({
              ...item,
              item_en: getItemEn(item.item_text, item.kategori_kode, laporan.area_type)
            }))} 
            catatan={detail?.catatan || []} 
          />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// RIWAYAT 5R ─ Komponen daftar laporan masa lalu
// ═══════════════════════════════════════════════════════
function Riwayat5R({ user, isMobile, onBack }) { // Added onBack for better navigation if needed
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLaporan, setSelectedLaporan] = useState(null); // Data header laporan yang dipilih
  const [detailData, setDetailData] = useState(null); // { items, catatan }
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const handleViewDetail = async (laporan) => {
    setSelectedLaporan(laporan);
    setFetchingDetail(true);
    try {
      const { data: items, error: errItems } = await supabase
        .from("inspeksi_5r_items")
        .select("*")
        .eq("inspeksi_id", laporan.id);
      
      const { data: catatan, error: errCatatan } = await supabase
        .from("inspeksi_5r_catatan")
        .select("*")
        .eq("inspeksi_id", laporan.id);

      if (errItems || errCatatan) throw (errItems || errCatatan);

      setDetailData({ items: items || [], catatan: catatan || [] });
    } catch (err) {
      console.error("Gagal ambil detail 5R:", err);
      alert("Gagal memuat detail laporan.");
    } finally {
      setFetchingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedLaporan(null);
    setDetailData(null);
  };

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("v_inspeksi_5r_summary")
          .select("*")
          .eq("site", user.site)
          .order("tanggal", { ascending: false })
          .limit(50);
        
        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error("Gagal fetch riwayat 5R:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user.site]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Memuat riwayat...</div>;

  if (history.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#6b7280", background: isMobile ? "white" : "#1f2937", borderRadius: 16, border: "1px dashed #374151", margin: 16 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
        <div style={{ fontWeight: 600 }}>Belum ada riwayat inspeksi</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Laporan yang Anda kirim akan muncul di sini.</div>
      </div>
    );
  }

  const renderCard = (item) => (
    <div key={item.id} 
      onClick={() => handleViewDetail(item)}
      style={{
        background: isMobile ? "white" : "#1f2937",
        border: `1px solid ${isMobile ? "#e5e7eb" : "#374151"}`,
        borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        cursor: "pointer",
        transition: "transform 0.2s"
      }}
      onMouseEnter={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, px: 8, py: 2, borderRadius: 6, background: item.area_type === 'office' ? "#dbeafe" : "#fef3c7", color: item.area_type === 'office' ? "#1e40af" : "#92400e" }}>
          {item.area_type === 'office' ? "🏢 OFFICE" : "🏗️ NON-OFFICE"}
        </span>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{item.tanggal}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 15, color: isMobile ? "#111827" : "#f3f4f6", marginBottom: 4 }}>{item.work_area}</div>
      <div style={{ fontSize: 13, color: isMobile ? "#4b5563" : "#9ca3af", marginBottom: 12 }}>Inspektor: {item.inspector_name || item.submitted_by_nama}</div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: `1px solid ${isMobile ? "#f3f4f6" : "#374151"}`, paddingTop: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Skor Kepatuhan</div>
          <div style={{ height: 6, background: "#374151", borderRadius: 999, overflow: "hidden" }}>
             <div style={{ height: "100%", width: `${item.score_pct}%`, background: item.score_pct >= 85 ? "#10b981" : item.score_pct >= 70 ? "#f59e0b" : "#ef4444" }} />
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: item.score_pct >= 85 ? "#10b981" : item.score_pct >= 70 ? "#f59e0b" : "#ef4444" }}>
          {item.score_pct}%
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? "0 16px" : "0 24px", paddingBottom: 40 }}>
      {history.map(renderCard)}

      <Inspeksi5RDetail 
        laporan={selectedLaporan} 
        detail={detailData} 
        loading={fetchingDetail} 
        onClose={closeDetail} 
        isMobile={isMobile} 
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SELECTION SCREEN ─ DESKTOP
// ═══════════════════════════════════════════════════════
const SelectionDesktop = ({ user, onSelect, onBack, hasHistoryAccess, onShowHistory }) => (
  <div style={{ width: "100%", height: "100vh", background: "transparent", display: "flex", flexDirection: "column", padding: "24px 80px 0 24px", overflow: "hidden" }}>
    <div style={{ maxWidth: 1000, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, width: "100%" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, flexShrink: 0 }}>
        <h2 style={{ margin: 0, color: "#60a5fa", fontWeight: 900, fontSize: 32 }}>Inspeksi 5R</h2>
        <p style={{ margin: "8px 0 0", color: "#9ca3af", fontSize: 16 }}>
          {user?.site || "Site"} · {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div style={{ marginTop: 16, display: "inline-block", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, padding: "6px 20px", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>
          Pilih Menu Inspeksi
        </div>
      </div>

      {/* Selection Cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 10px 40px", minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: hasHistoryAccess ? "repeat(3, 1fr)" : "1fr 1fr", gap: 20, maxWidth: hasHistoryAccess ? 1100 : 750, margin: "0 auto" }}>
          {AREA_OPTIONS.map((area) => (
            <button
              key={area.id}
              onClick={() => onSelect(area.id)}
              style={{
                background: "#1f2937",
                border: "2px solid #374151",
                borderRadius: 16,
                padding: "32px 24px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = `2px solid ${area.color}`;
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = `0 12px 32px ${area.color}25`;
                e.currentTarget.style.background = `${area.color}0d`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "2px solid #374151";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "#1f2937";
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 16, background: area.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0, boxShadow: `0 4px 14px ${area.color}40` }}>
                {area.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", marginBottom: 4 }}>{area.label}</div>
                <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.5 }}>{area.description}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
                {area.tags.map((tag) => (
                  <span key={tag} style={{ background: `${area.color}15`, color: area.color, border: `1px solid ${area.color}30`, borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "3px 10px" }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ color: area.color, fontSize: 13, fontWeight: 700, marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
                Mulai Inspeksi <span style={{ fontSize: 16 }}>→</span>
              </div>
            </button>
          ))}

          {/* RIWAYAT CARD */}
          {hasHistoryAccess && (
            <button
              onClick={onShowHistory}
              style={{
                background: "#1f2937",
                border: "2px solid #374151",
                borderRadius: 16,
                padding: "32px 24px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = `2px solid #f59e0b`;
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = `0 12px 32px #f59e0b25`;
                e.currentTarget.style.background = `#f59e0b0d`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "2px solid #374151";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "#1f2937";
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0, boxShadow: `0 4px 14px #f59e0b40` }}>
                📂
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", marginBottom: 4 }}>Riwayat Laporan</div>
                <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.5 }}>Lihat, pantau, dan evaluasi hasil inspeksi 5R yang telah dikirim di site Anda</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
                 <span style={{ background: "#f59e0b15", color: "#f59e0b", border: "1px solid #f59e0b30", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "3px 10px" }}>Monitoring</span>
                 <span style={{ background: "#f59e0b15", color: "#f59e0b", border: "1px solid #f59e0b30", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "3px 10px" }}>Arsip</span>
              </div>
              <div style={{ color: "#f59e0b", fontSize: 13, fontWeight: 700, marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
                Buka Riwayat <span style={{ fontSize: 16 }}>→</span>
              </div>
            </button>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 24, marginBottom: 24, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "1px solid #374151", borderRadius: 8, padding: "10px 24px", color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>
          ← Kembali ke Inspeksi
        </button>
      </div>
    </div>
  </div>
);
// ═══════════════════════════════════════════════════════
// SELECTION SCREEN ─ MOBILE
// ═══════════════════════════════════════════════════════
const SelectionMobile = ({ user, onSelect, onBack, onNavigate, tasklistTodoCount, hasHistoryAccess, onShowHistory }) => {
  const [pressedItem, setPressedItem] = useState(null);

  const handleTap = (id, callback) => {
    setPressedItem(id);
    setTimeout(() => {
      setPressedItem(null);
      callback();
    }, 150);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc", paddingBottom: "calc(70px + env(safe-area-inset-bottom))" }}>
      <MobileHeader user={user} onBack={onBack} title="Inspeksi 5R" />
      <div style={{ padding: 16, paddingTop: 70 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {AREA_OPTIONS.map((area) => (
            <button
              key={area.id}
              onClick={() => handleTap(area.id, () => onSelect(area.id))}
              style={{ 
                width: "100%", background: "white", borderRadius: 14, padding: "12px 16px", minHeight: 80, display: "flex", alignItems: "center", gap: 14, border: "none", 
                boxShadow: pressedItem === area.id ? "0 1px 4px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.07)", 
                textAlign: "left", cursor: "pointer",
                transform: pressedItem === area.id ? "scale(0.98)" : "scale(1)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ background: `${area.color}12`, width: 48, height: 48, borderRadius: 10, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {area.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{area.label}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{area.description}</div>
              </div>
              <div style={{ color: area.color, fontSize: 14, opacity: 0.6 }}>›</div>
            </button>
          ))}

          {hasHistoryAccess && (
            <button
              onClick={() => handleTap("history", onShowHistory)}
              style={{
                width: "100%", background: "white", borderRadius: 14, padding: "12px 16px", minHeight: 80, display: "flex", alignItems: "center", gap: 14, border: "none", 
                boxShadow: pressedItem === "history" ? "0 1px 4px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.07)", 
                textAlign: "left", cursor: "pointer",
                transform: pressedItem === "history" ? "scale(0.98)" : "scale(1)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ background: "#f59e0b12", width: 48, height: 48, borderRadius: 10, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                📂
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Riwayat Laporan</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>Pantau arsip dan hasil inspeksi site</div>
              </div>
              <div style={{ color: "#f59e0b", fontSize: 14, opacity: 0.6 }}>›</div>
            </button>
          )}
        </div>
      </div>
      <MobileBottomNavigation activeTab={null} tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => { if (tab === "home") onNavigate("dashboard"); else if (tab === "tasklist") onNavigate("tasklist"); else if (tab === "profile") onNavigate("profile"); }} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// FORM ─ DESKTOP
// ═══════════════════════════════════════════════════════
const Inspeksi5RDesktop = ({ user, onBack, areaType, onChangeArea, onNavigate }) => {
  const { kategori, catatan, setCatatan, photos, setPhoto, removePhoto, allNokHavePhoto, nokWithoutPhoto,
          tanggal, setTanggal, workArea, setWorkArea, leaderName, setLeaderName, inspectorName, setInspectorName,
          submitted, setSubmitted, answeredItems, totalItems, progress, setScore, getScore, resetForm } = use5RForm(areaType, user);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // --- Search Leader State (Desktop Inline Dropdown) ---
  const [leaderDropdownOpen, setLeaderDropdownOpen] = useState(false);
  const [leaderOptions, setLeaderOptions] = useState([]);
  const [leaderSearch, setLeaderSearch] = useState("");
  const leaderDropdownRef = useRef();

  useEffect(() => {
    async function fetchLeaders() {
      if (!user?.site) return;
      const { data, error } = await supabase.from("users").select("nama").eq("site", user.site);
      if (!error && data) {
        setLeaderOptions(data.map(u => u.nama).filter(Boolean).sort((a,b) => a.localeCompare(b)));
      }
    }
    fetchLeaders();
  }, [user?.site]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handler = (e) => {
      if (leaderDropdownRef.current && !leaderDropdownRef.current.contains(e.target)) {
        setLeaderDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const area = AREA_OPTIONS.find((a) => a.id === areaType);
  const identFields = [
    { id: "tanggal",       label: "Date",                            type: "date", val: tanggal,       set: setTanggal,       ph: "" },
    { id: "workArea",      label: "Work Area",                       type: "text", val: workArea,      set: setWorkArea,      ph: "Nama area kerja yang diinspeksi" },
    { 
      id: "leaderName",   
      label: "5S Leader",                       
      type: "select", 
      val: leaderName,    
      set: (val) => setLeaderName(val),    
      ph: "Ketik nama untuk mencari..." 
    },
    { id: "inspectorName",label: area?.inspectorLabel || "Inspector",type: "text", val: inspectorName, set: () => {}, ph: "", readOnly: true },
  ];

  const onFinalSubmit = () => {
    if (!workArea) { alert("Work Area wajib diisi."); return; }
    if (progress < 100) { alert("Harap isi semua item checklist."); return; }
    if (!allNokHavePhoto) { alert("Semua item NOK wajib dilampirkan foto temuan."); return; }
    
    submitInspeksi5R({
      user, areaType, photos,
      form: { kategori, catatan, tanggal, workArea, leaderName, inspectorName, getScore },
      setSubmitting, setSubmitError,
      onSuccess: () => setSubmitted(true)
    });
  };

  return (
    <div style={{ width: "100%", height: "100vh", background: "transparent", display: "flex", flexDirection: "column", padding: "24px 80px 0 24px", overflow: "hidden" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, width: "100%", textAlign: "center" }}>
        {/* Header */}
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: area?.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              {area?.icon}
            </div>
            <h2 style={{ margin: 0, color: "#60a5fa", fontWeight: 900, fontSize: 28 }}>
              Inspeksi 5R — <span style={{ color: area?.color }}>{area?.label}</span>
            </h2>
          </div>
          <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 14 }}>
            {user?.site || "Site"} · {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            <button onClick={onChangeArea} style={{ marginLeft: 12, background: "none", border: "none", color: area?.color, fontSize: 12, cursor: "pointer", fontWeight: 600, padding: 0 }}>
              Ganti area ↩
            </button>
          </p>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 6, background: "#374151", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: area?.color || "#60a5fa", borderRadius: 999, transition: "width 0.3s ease" }} />
            </div>
            <span style={{ color: "#9ca3af", fontSize: 13, whiteSpace: "nowrap", textAlign: "left" }}>{answeredItems}/{totalItems} • {progress}%</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, minHeight: 0, textAlign: "left" }}>
          {!submitted ? (
            <>
              {/* Identity fields */}
              <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#93c5fd" }}>📋 Identitas Inspeksi</div>
                  {area?.docRef && <span style={{ fontSize: 11, color: "#6b7280", background: "#374151", borderRadius: 6, padding: "2px 8px" }}>{area.docRef}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {identFields.map((f) => (
                    <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{f.label}</label>
                      {f.type === "select" ? (
                        <div ref={leaderDropdownRef} style={{ position: "relative" }}>
                          <input 
                            type="text"
                            value={leaderDropdownOpen ? leaderSearch : f.val}
                            onChange={(e) => {
                                setLeaderSearch(e.target.value);
                                setLeaderDropdownOpen(true);
                            }}
                            onFocus={() => {
                                setLeaderSearch(f.val || "");
                                setLeaderDropdownOpen(true);
                            }}
                            placeholder={f.ph}
                            style={{ 
                                width: "100%", padding: "8px 10px", border: "1px solid #374151", borderRadius: 8, background: "#111827", color: "#e5e7eb", fontSize: 13, boxSizing: "border-box", outline: "none" 
                            }}
                          />
                          {leaderDropdownOpen && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, maxHeight: 200, overflowY: "auto", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.3)", textAlign: "left" }}>
                                {leaderOptions
                                    .filter(opt => opt.toLowerCase().includes(leaderSearch.toLowerCase()))
                                    .map(opt => (
                                        <div key={opt} onClick={() => { f.set(opt); setLeaderDropdownOpen(false); setLeaderSearch(""); }}
                                            style={{ padding: "10px 12px", cursor: "pointer", color: "#e5e7eb", fontSize: 13, borderBottom: "1px solid #374151" }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#374151"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                            {opt}
                                        </div>
                                    ))}
                                {leaderOptions.filter(opt => opt.toLowerCase().includes(leaderSearch.toLowerCase())).length === 0 && (
                                    <div style={{ padding: 12, color: "#9ca3af", fontSize: 12 }}>Tidak ada hasil</div>
                                )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <input id={f.id} type={f.type || "text"} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} readOnly={f.readOnly}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #374151", borderRadius: 8, background: f.readOnly ? "#111827" : "#111827", color: "#e5e7eb", fontSize: 13, boxSizing: "border-box", outline: "none", colorScheme: "dark" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#1e3a5f", border: "1px solid #1e40af", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#93c5fd", marginBottom: 16, display: "flex", gap: 8 }}>
                <span>ℹ️</span>
                <span>Nilai setiap item: <strong>✅ OK</strong> = Memenuhi standar, <strong>❌ NOK</strong> = Tidak memenuhi, <strong>N/A</strong> = Tidak berlaku</span>
              </div>
              {kategori.map((k) => (
                <div key={k.kode} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
                  <div style={{ background: `${k.color}18`, borderLeft: `4px solid ${k.color}`, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>{k.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#f3f4f6" }}>{k.kode} — {k.nama}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{k.deskripsi}</div>
                    </div>
                  </div>
                  {k.items.map((item, idx) => {
                    const score = getScore(k.kode, idx);
                    return (
                      <div key={idx} style={{ padding: "12px 16px", borderBottom: idx < k.items.length - 1 ? "1px solid #374151" : "none" }}>
                        <div style={{ fontSize: 13, color: "#f3f4f6", fontWeight: 600, marginBottom: 2 }}>{idx + 1}. {item.id}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", marginBottom: 10, paddingLeft: 18 }}>{item.en}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {OPTIONS.map((opt) => (
                            <button key={opt.value} onClick={() => setScore(k.kode, idx, opt.value)}
                              style={{ padding: "5px 12px", borderRadius: 6, border: `1.5px solid ${score === opt.value ? opt.bg : "#4b5563"}`, background: score === opt.value ? opt.bg : "#374151", color: score === opt.value ? "white" : "#d1d5db", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {score === "nok" && (
                          <FotoNOK kode={k.kode} idx={idx} photos={photos} setPhoto={setPhoto} removePhoto={removePhoto} isDark />
                        )}
                      </div>
                    );
                  })}
                  <div style={{ padding: "8px 16px 14px" }}>
                    <textarea placeholder={`Catatan untuk ${k.nama} (opsional)...`}
                      value={catatan[k.kode] || ""} onChange={(e) => setCatatan((p) => ({ ...p, [k.kode]: e.target.value }))}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #374151", background: "#111827", color: "#e5e7eb", fontSize: 12, resize: "vertical", minHeight: 52, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                  </div>
                </div>
              ))}
              {/* NOK without photo warning */}
              {nokWithoutPhoto.length > 0 && progress === 100 && (
                <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fca5a5", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0 }}>⚠️</span>
                  <span><strong>{nokWithoutPhoto.length} item NOK</strong> belum dilampirkan foto temuan. Foto wajib sebelum laporan dapat dikirim.</span>
                </div>
              )}
              {submitError && (
                <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fca5a5", marginBottom: 12 }}>
                  ❌ {submitError}
                </div>
              )}
              <button onClick={onFinalSubmit} disabled={submitting || !tanggal}
                style={{ 
                  width: "100%", padding: "13px", 
                  background: progress === 100 && workArea && tanggal && allNokHavePhoto && !submitting ? (area?.gradient || "linear-gradient(135deg,#10b981,#059669)") : "#374151", 
                  border: "none", borderRadius: 10, color: progress === 100 && workArea && tanggal && allNokHavePhoto ? "white" : "#6b7280", 
                  fontSize: 14, fontWeight: 700, 
                  cursor: progress === 100 && workArea && tanggal && allNokHavePhoto && !submitting ? "pointer" : "not-allowed", 
                  marginBottom: 24, opacity: submitting ? 0.7 : 1 
                }}
              >
                {submitting ? "⏳ Mengirim Laporan..." : (progress === 100 ? (allNokHavePhoto ? (tanggal ? `✅ Kirim Laporan 5R — ${area?.label}` : "📅 Pilih Tanggal Dulu") : `⚠️ Lengkapi foto NOK (${nokWithoutPhoto.length} item)`) : `Lengkapi dulu (${progress}%)`)}
              </button>
            </>
          ) : (
            <div style={{ background: "#064e3b", border: "1px solid #10b981", borderRadius: 12, padding: 32, textAlign: "center", color: "#d1fae5" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Laporan Berhasil Dikirim!</div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>Inspeksi 5R {area?.label} telah dicatat.</div>
              <button onClick={onBack} style={{ marginTop: 16, padding: "10px 24px", background: "#10b981", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Kembali ke Inspeksi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// FORM ─ MOBILE
// ═══════════════════════════════════════════════════════
const Inspeksi5RMobile = ({ user, onBack, onNavigate, tasklistTodoCount, areaType, onChangeArea }) => {
  const { kategori, catatan, setCatatan, photos, setPhoto, removePhoto, allNokHavePhoto, nokWithoutPhoto,
          tanggal, setTanggal, workArea, setWorkArea, leaderName, setLeaderName, inspectorName, setInspectorName,
          submitted, setSubmitted, answeredItems, totalItems, progress, setScore, getScore, resetForm } = use5RForm(areaType, user);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // --- Search Leader State ---
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [leaderOptions, setLeaderOptions] = useState([]);
  const [leaderSearch, setLeaderSearch] = useState("");

  useEffect(() => {
    async function fetchLeaders() {
      if (!user?.site) return;
      const { data, error } = await supabase.from("users").select("nama").eq("site", user.site);
      if (!error && data) {
        setLeaderOptions(data.map(u => u.nama).filter(Boolean).sort((a,b) => a.localeCompare(b)));
      }
    }
    fetchLeaders();
  }, [user?.site]);
  
  const area = AREA_OPTIONS.find((a) => a.id === areaType);
  const identFields = [
    { id: "m-tanggal",       label: "Date",                               type: "date", val: tanggal,       set: setTanggal,       ph: "" },
    { id: "m-workArea",      label: "Work Area",                          type: "text", val: workArea,      set: setWorkArea,      ph: "Nama area kerja" },
    { id: "m-leaderName",    label: "5S Leader",                          type: "select", val: leaderName,  set: () => setShowLeaderModal(true), ph: "Pilih 5S Leader" },
    { id: "m-inspectorName", label: area?.inspectorLabel || "Inspector",  type: "text", val: inspectorName, set: setInspectorName, ph: "Nama inspektor", readOnly: true },
  ];

  const onFinalSubmit = () => {
    if (!workArea) { alert("Work Area wajib diisi."); return; }
    if (progress < 100) { alert("Harap isi semua item checklist."); return; }
    if (!allNokHavePhoto) { alert("Semua item NOK wajib dilampirkan foto temuan."); return; }
    
    submitInspeksi5R({
      user, areaType, photos,
      form: { kategori, catatan, tanggal, workArea, leaderName, inspectorName, getScore },
      setSubmitting, setSubmitError,
      onSuccess: () => setSubmitted(true)
    });
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc", paddingBottom: "calc(70px + env(safe-area-inset-bottom))" }}>
      <MobileHeader user={user} onBack={onChangeArea} title={`5R — ${area?.label}`} />
      <div style={{ padding: 16, paddingTop: 76 }}>
        {/* Area badge + progress */}
        <div style={{ background: "white", borderRadius: 12, padding: "12px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: area?.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{area?.icon}</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{area?.label}</span>
            <button onClick={onChangeArea} style={{ marginLeft: "auto", background: "none", border: "none", color: area?.color, fontSize: 12, cursor: "pointer", fontWeight: 600, padding: 0 }}>Ganti ↩</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
            <span>{answeredItems}/{totalItems} item dijawab</span><span>{progress}%</span>
          </div>
          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: area?.color || "#10b981", borderRadius: 999, transition: "width 0.3s ease" }} />
          </div>
        </div>

        {!submitted ? (
          <>
            {/* Identity fields */}
            <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>📋 Identitas Inspeksi</div>
                {area?.docRef && <span style={{ fontSize: 10, color: "#6b7280", background: "#f3f4f6", borderRadius: 4, padding: "1px 6px" }}>{area.docRef}</span>}
              </div>
              {identFields.map((f) => (
                <div key={f.id} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{f.label}</label>
                  {f.type === "select" ? (
                    <div 
                      onClick={f.set}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box", marginTop: 3, outline: "none", height: 38, display: "flex", alignItems: "center", color: f.val ? "#111827" : "#9ca3af", background: "white" }}
                    >
                      {f.val || f.ph}
                    </div>
                  ) : (
                    <input id={f.id} type={f.type || "text"} value={f.val} 
                      onChange={(e) => f.set && f.set(e.target.value)} 
                      placeholder={f.ph}
                      readOnly={f.readOnly}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box", marginTop: 3, outline: "none", background: f.readOnly ? "#f9fafb" : "white", color: f.readOnly ? "#6b7280" : "#111827" }} 
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#065f46", marginBottom: 12, display: "flex", gap: 8 }}>
              <span>ℹ️</span><span><strong>✅ OK</strong> = Memenuhi, <strong>❌ NOK</strong> = Tidak memenuhi, <strong>N/A</strong> = Tidak berlaku</span>
            </div>
            {kategori.map((k) => (
              <div key={k.kode} style={{ background: "white", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 12, overflow: "hidden" }}>
                <div style={{ background: `${k.color}12`, borderLeft: `4px solid ${k.color}`, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>{k.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{k.kode} — {k.nama}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{k.deskripsi}</div>
                  </div>
                </div>
                {k.items.map((item, idx) => {
                  const score = getScore(k.kode, idx);
                  return (
                    <div key={idx} style={{ padding: "12px 16px", borderBottom: idx < k.items.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <div style={{ fontSize: 13, color: "#374151", marginBottom: 8, lineHeight: 1.4 }}>
                        <div style={{ fontWeight: 600 }}>{idx + 1}. {item.id}</div>
                        <div style={{ fontSize: 11, color: "#1e3a8a", fontStyle: "italic", marginTop: 2 }}>{item.en}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {OPTIONS.map((opt) => (
                          <button key={opt.value} onClick={() => setScore(k.kode, idx, opt.value)}
                            style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${score === opt.value ? opt.bg : opt.border}`, background: score === opt.value ? opt.bg : opt.light, color: score === opt.value ? "white" : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {score === "nok" && (
                        <FotoNOK kode={k.kode} idx={idx} photos={photos} setPhoto={setPhoto} removePhoto={removePhoto} isDark={false} />
                      )}
                    </div>
                  );
                })}
                <div style={{ padding: "8px 16px 14px" }}>
                  <textarea placeholder={`Catatan ${k.nama} (opsional)...`}
                    value={catatan[k.kode] || ""} onChange={(e) => setCatatan((p) => ({ ...p, [k.kode]: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, resize: "vertical", minHeight: 52, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
            ))}
            {nokWithoutPhoto.length > 0 && progress === 100 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span><strong>{nokWithoutPhoto.length} item NOK</strong> belum dilampirkan foto temuan.</span>
              </div>
            )}
            {submitError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 12 }}>
                ❌ {submitError}
              </div>
            )}
            <button onClick={onFinalSubmit} disabled={submitting || !tanggal}
              style={{ 
                width: "100%", padding: "14px", 
                background: progress === 100 && workArea && tanggal && allNokHavePhoto && !submitting ? (area?.gradient || "linear-gradient(135deg,#10b981,#059669)") : "#d1d5db", 
                border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, 
                cursor: progress === 100 && workArea && tanggal && allNokHavePhoto && !submitting ? "pointer" : "not-allowed", 
                boxShadow: progress === 100 && workArea && tanggal && allNokHavePhoto ? `0 4px 14px ${area?.color}40` : "none", 
                opacity: submitting ? 0.7 : 1 
              }}
            >
              {submitting ? "⏳ Mengirim..." : (progress === 100 ? (allNokHavePhoto ? (tanggal ? `✅ Kirim Laporan 5R — ${area?.label}` : "📅 Pilih Tanggal Dulu") : `⚠️ Foto NOK (${nokWithoutPhoto.length})`) : `Lengkapi dulu (${progress}%)`)}
            </button>
          </>
        ) : (
          <div style={{ background: area?.gradient, borderRadius: 12, padding: 24, textAlign: "center", color: "white" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Laporan Berhasil Dikirim!</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Inspeksi 5R {area?.label} telah dicatat.</div>
            <button onClick={onBack} style={{ marginTop: 14, padding: "10px 24px", background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Kembali ke Inspeksi
            </button>
          </div>
        )}
      </div>
      <MobileBottomNavigation activeTab={null} tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => { if (tab === "home") onNavigate("dashboard"); else if (tab === "tasklist") onNavigate("tasklist"); else if (tab === "profile") onNavigate("profile"); }} />

      <SelectModalWithSearch 
        show={showLeaderModal}
        onClose={() => setShowLeaderModal(false)}
        title="Pilih 5S Leader"
        options={leaderOptions}
        searchQuery={leaderSearch}
        onSearchChange={setLeaderSearch}
        onSelect={(val) => {
          setLeaderName(val);
          setShowLeaderModal(false);
          setLeaderSearch("");
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// ROOT — mengelola state area selection
// ═══════════════════════════════════════════════════════
function Inspeksi5R({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [areaType, setAreaType] = useState(null); // null = selection screen
  const [showHistory, setShowHistory] = useState(false);

  const hasHistoryAccess = canAccessHistory(user);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const handleChangeArea = () => {
    setAreaType(null);
    setShowHistory(false);
  };

  if (!areaType && !showHistory) {
    if (isMobile) {
      return (
        <SelectionMobile 
          user={user} 
          onSelect={setAreaType} 
          onBack={onBack} 
          onNavigate={onNavigate} 
          tasklistTodoCount={tasklistTodoCount} 
          hasHistoryAccess={hasHistoryAccess} 
          onShowHistory={() => setShowHistory(true)} 
        />
      );
    }
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "transparent" }}>
        <SelectionDesktop user={user} onSelect={setAreaType} onBack={onBack} hasHistoryAccess={hasHistoryAccess} onShowHistory={() => setShowHistory(true)} />
      </div>
    );
  }

  if (showHistory) {
    if (isMobile) {
      return (
        <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc", paddingBottom: "calc(70px + env(safe-area-inset-bottom))" }}>
          <MobileHeader user={user} onBack={handleChangeArea} title="Riwayat Inspeksi 5R" />
          <div style={{ padding: 16, paddingTop: 70 }}>
             <Riwayat5R user={user} isMobile={isMobile} />
          </div>
          <MobileBottomNavigation activeTab={null} tasklistTodoCount={tasklistTodoCount} onNavigate={(tab) => { if (tab === "home") onNavigate("dashboard"); else if (tab === "tasklist") onNavigate("tasklist"); else if (tab === "profile") onNavigate("profile"); }} />
        </div>
      );
    }
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "transparent" }}>
         <div style={{ width: "100%", padding: "40px 80px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                  <div>
                    <h2 style={{ margin: 0, color: "#60a5fa", fontWeight: 900, fontSize: 32 }}>Riwayat Inspeksi 5R</h2>
                    <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 16 }}>Daftar seluruh laporan inspeksi site {user?.site}</p>
                  </div>
                  <button onClick={handleChangeArea} style={{ padding: "10px 24px", background: "#374151", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Kembali</button>
               </div>
               <Riwayat5R user={user} isMobile={isMobile} />
            </div>
         </div>
      </div>
    );
  }

  // Form screen
  return isMobile ? (
    <Inspeksi5RMobile user={user} onBack={onBack} onNavigate={onNavigate} tasklistTodoCount={tasklistTodoCount} areaType={areaType} onChangeArea={handleChangeArea} />
  ) : (
    <Inspeksi5RDesktop user={user} onBack={onBack} areaType={areaType} onChangeArea={handleChangeArea} onNavigate={onNavigate} />
  );
}

export default Inspeksi5R;

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import {
  getLocationOptions,
  allowsCustomInput,
  shouldUseLocationSelector,
} from "../../config/siteLocations";
import PendingReportsList from "./PendingReportsList";
import MobileSiteSelector from "../MobileSiteSelector";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import SelectModalWithSearch from "../SelectModalWithSearch";

const _lokasiOptions = [
  "Head Office",
  "Balikpapan",
  "ADRO",
  "AMMP",
  "BSIB",
  "GAMR",
  "HRSB",
  "HRSE",
  "PABB",
  "PBRB",
  "PKJA",
  "PPAB",
  "PSMM",
  "REBH",
  "RMTU",
  "PMTU",
];

function HazardFormMobile({ user, onBack, onNavigate }) {
  // Pemetaan sub ketidaksesuaian per kategori (disortir alfabetis)
  const SUB_OPTIONS = useMemo(
    () => ({
      APD: [
        "Cara Penggunaan APD",
        "Kesesuaian dan Kelayakan APD",
        "Pengawas Tidak Memastikan Kesesuaian dan Kelayakan APD Pekerja Saat Aktivitas Telah Berlangsung",
        "Tidak Menggunakan APD",
      ],
      "Area Parkir": [
        "Area Parkir tidak aman dari radius unit hauler",
        "Jarak parkir unit tidak standar",
        "Kendaraan/Unit Parkir di Area yang Tidak Rata",
        "Pengawas Tidak Memasang Rambu Parkir saat Aktivitas Telah Berlangsung",
        "Tidak Ada Area Parkir",
        "Tidak ada Perbaikan Area Parkir yang Tidak Rata",
        "Tidak ada Rambu Parkir",
        "Tidak ada Stopper",
        "Tidak tersedia pembatas antar unit",
      ],
      "Bahaya Peledakan": [
        "Akses Menuju lokasi peledakan/gudang handak tidak layak",
        "Area manuver MMU / Anfo Truck tidak memadai",
        "Area penyimpanan bahan peledak pada lokasi peledakan tidak di atur dengan baik",
        "Box unit pengangkut bahan peledak tidak digembok",
        "High/Low wall & crest area peledakan tidak aman",
        "Jarak lubang ledak terhadap jalan aktif terlalu dekat",
        "Jarak unit drilling terlalu dekat dengan MMU/ Anfo Truck",
        "Jumlah unit yang dikawal melebihi batas jumlah yang diperbolehkan",
        "Kemiringan jalan akses masuk area peledakan > 10%",
        "Kondisi permukaan jalan akses peledakan tidak Keras/Kering/bergelombang/rata",
        "Lebar jalan akses masuk area peledakan <8 meter",
        "Lokasi peledakan dan pengeboran tidak diberi jarak/batas",
        "Lokasi Teras Area Peledakan tidak memadai",
        "Lubang tidak di sounding sebelum melakukan pengisian",
        "Man Power yang bekerja pada area peledakan tidak memiliki lisensi/ lisensi expired",
        "Melakukan pemuatan dan pengangkutan bahan peledak tanpa Juru Ledak",
        "Melakukan pemuatan dan pengangkutan bahan peledak tanpa pengawalan",
        "Melakukan pemuatan dan pengangkutan bahan peledak tanpa pengamanan",
        "Pengisian Bahan peledak overcharge",
        "Tanggul lokasi peledakan tidak sesuai standar",
        "Terdapat lubang collapse/Lumpur/Miring",
        "Terdapat Lubang Panas/Reaktif pada Area Peledakan",
        "Terdapat Material Menggantung",
      ],
      "Bahaya Biologi": [
        "Bahaya hewan buas",
        "Pengawas gagal mengidentifikasi bahaya biologis",
        "Pohon kering",
        "Serangga",
        "Terdapat tanamanan merambat yang lebat diarea kerja yang berpotensi menjadi sarang ular",
        "Tidak melakukan pemeliharaan rumput liar di area kerja",
      ],
      "Bahaya Elektrikal": [
        "Instalasi listrik tidak layak",
        "Kabel tidak layak",
        "Pengamanan peralatan listrik",
        "Pengawas tidak melakukan pengamanan peralatan listrik",
        "Pengawas tidak memastikan kelayakan instalasi listrik saat aktivitas telah berlangsung",
        "Pengawas tidak mengidentifikasi potensi arus pendek saat aktivitas telah berlangsung",
        "Potensi arus pendek",
      ],
      "External Issue": ["External Issue"],
      "Fasilitas Mixing Plant": [
        "Filter rusak",
        "Generator Rusak",
        "Penerangan Tidak Standar",
        "Peralatan belum dilakukan kalibrasi",
        "Tidak ada penerangan",
        "Tidak dilakukan perawatan rutin peralatan",
      ],
      "Fasilitas Office": [
        "Area Merokok tidak bersih",
        "Pantry Tidak Bersih",
        "Peralatan listrik belum dilakukan inspeksi berkala",
        "Penerangan Tidak standar",
        "Tidak ada penerangan",
        "Toilet Rusak",
      ],
      "Fasilitas Workshop": [
        "Lifting gear tidak ditagging",
        "Pad workshop kotor",
        "Penerangan Tidak standar",
        "Saluran Air / Drainase tidak ada",
        "Saluran Air / Drainase untuk fasilitas workshop tersumbat",
        "Tidak ada Penerangan",
      ],
      "Izin Kerja": [
        "Izin Bekerja Ruang Terbatas Expired",
        "Izin Bekerja Ruang Terbatas Tidak Sesuai",
        "Izin Bekerja Ruang Terbatas Tidak Tersedia",
        "Izin Bekerja diketinggian Expired",
        "Izin Bekerja diketinggian Tidak Tersedia",
        "Izin Bekerja diketinggian tidak sesuai",
        "Izin Kerja Panas Expired",
        "Izin Kerja Panas Tidak Tersedia",
        "Izin Kerja panas Tidak Sesuai",
      ],
      "Kelayakan Bangunan": ["Bangunan Rusak", "Kelayakan Bangunan"],
      "Kelayakan Tools": [
        "Kelayakan Common Tools",
        "Kelayakan Lifting Gear",
        "Kelayakan Small Equipment / Power Tools",
        "Kelayakan Special Tools",
        "Kelayakan Supporting Tools",
        "Kesesuaian Penggunaan Common Tools",
        "Kesesuaian Penggunaan Lifting Gear",
        "Kesesuaian Penggunaan Small Equipment / Power Tools",
        "Kesesuaian Penggunaan Special Tools",
        "Kesesuaian Penggunaan Supporting Tools",
        "Pelabelan/Penandaan Lifting Gear",
        "Pelabelan/Penandaan Small Equipment / Power Tools",
        "Pelabelan/Penandaan Special Tools",
        "Pelabelan/Penandaan Supporting Tools",
      ],
      "Kelengkapan Tanggap Darurat": [
        "Alat Tanggap Darurat Belum Dilakukan Inspeksi",
        "Emergency Alarm Tidak Berfungsi",
        "Eye Wash",
        "Fire Apparatus",
        "Fire Suspression",
        "Jalur Evakuasi",
        "Kelengkapan P3K",
        "Pengawas Tidak Melakukan Inspeksi Alat Tanggap Darurat",
        "Pengawas Tidak Memeriksa Kelayakan Eyewash",
        "Refill APAR",
      ],
      "Kondisi Fisik Pekerja": [
        "Cidera atau sakit yang dialami sebelumnya",
        "Kekurangan Gula Darah",
        "Kelelahan karena Beban Kerja",
        "Kelelahan Karena Kurang Istirahat",
        "Sakit Akibat Mengkonsumsi Obat-obatan Terlarang atau minuman keras",
        "Unjuk Kerja menurun karena tingginya temperatur",
      ],
      "Kondisi Kendaraan/Unit": [
        "Kelayakan Kendaraan/Unit",
        "Mengoperasikan Kendaraan/Unit Yang Tidak Layak",
        "Tidak Melakukan P2H",
      ],
      "Lingkungan Kerja": [
        "Bahan Kimia yang Berbahaya",
        "Ceceran B3",
        "Getaran",
        "Kabut",
        "Kebisingan",
        "Lingkungan Berdebu",
        "Pencahayaan",
        "Pengawas Tidak Memastikan Pencahayaan yang Standard Sebelum Aktivitas Berlangsung",
        "Radiasi",
        "Suhu Panas/dingin",
        "Swabakar",
        "Ventilasi Tidak Memadai",
      ],
      Penandaan: [
        "Barikade/ Safety line",
        "Demarkasi",
        "Ketidaksesuaian LOTO",
        "Kode Warna",
        "Labeling Tidak Ada",
        "Labeling Tidak Standar / Sesuai",
        "Pengawas Tidak Membuat Demarkasi Saat Aktivitas Telah Berlangsung",
        "Pengawas Tidak Memasang Barikade / Safety Line saat Aktivitas Telah Berlangsung",
        "Pengawas Tidak Memberikan Kode Pewarnaan yang standar Saat Aktivitas Telah Berlangsung",
        "Pita Batas Radius Peledakan/ Sleepblast tidak ada",
        "Tidak Memasang LOTO",
      ],
      Rambu: [
        "Kelayakan Rambu",
        "Lampu Flip Flop Area Sleepblast belum Ada",
        "Pengawas Tidak Melakukan Perawatan rambu Sehingga Rambu Menjadi Tidak Layak",
        "Pengawas Tidak Memasang Rambu Yang Memadai Saat Aktivitas Telah Berlangsung",
        "Pengawas Tidak Memasang Rambu Yang Sesuai saat Aktivitas Telah Berlangsung",
        "Posisi Rambu Tidak Sesuai",
        "Rambu Aktivitas Peledakan Tidak Terpasang",
        "Rambu APD",
        "Tidak Ada Rambu",
        "Tidak Terdapat Rambu Atau Bendera Radius Aman Manusia",
        "Unit Breakdown Tanpa Alat Pengaman dan Rambu",
      ],
      "Tools Inspection": [
        "Tidak Ada Penjadwalan Tools Inspection untuk Suatu Area Pekerjaan",
        "Tools Belum Dilakukan Inspeksi",
      ],
    }),
    []
  );

  const getSubOptions = (kategori) => {
    const arr = SUB_OPTIONS[kategori] || [];
    return [...arr].sort((a, b) => a.localeCompare(b, "id"));
  };
  // Multi-page state
  const [page, setPage] = useState(1);
  // Form state
  const [form, setForm] = useState({
    lokasi: "",
    detailLokasi: "",
    keteranganLokasi: "",
    pic: "",
    ketidaksesuaian: "",
    subKetidaksesuaian: "",
    quickAction: "",
    deskripsiTemuan: "",
  });
  const [evidence, setEvidence] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const fileInputRef = useRef();
  const [, setTake5Pending] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [picOptions, setPicOptions] = useState([]);
  const [showPicModal, setShowPicModal] = useState(false);
  const [picSearchQuery, setPicSearchQuery] = useState("");
  const [showDetailLokasiModal, setShowDetailLokasiModal] = useState(false);
  const [detailLokasiSearchQuery, setDetailLokasiSearchQuery] = useState("");
  const [showKetidaksesuaianModal, setShowKetidaksesuaianModal] = useState(false);
  const [ketidaksesuaianSearchQuery, setKetidaksesuaianSearchQuery] = useState("");
  const [showSubKetidaksesuaianModal, setShowSubKetidaksesuaianModal] = useState(false);
  const [subKetidaksesuaianSearchQuery, setSubKetidaksesuaianSearchQuery] = useState("");
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [quickActionSearchQuery, setQuickActionSearchQuery] = useState("");
  const [, setLocationOptions] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [rawImage, setRawImage] = useState(null);

  // Evaluator state
  const [evaluatorOptions, setEvaluatorOptions] = useState([]);
  const [evaluatorNama, setEvaluatorNama] = useState("");
  const [submittedToMultipleEvaluators, setSubmittedToMultipleEvaluators] =
    useState(false);

  // Fetch Take 5 pending (Stop pekerjaan)
  useEffect(() => {
    supabase
      .from("take_5")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .then(({ data }) => setTake5Pending(data || []));
  }, [user.id]);

  // Prefill lokasi/dll jika report dipilih
  useEffect(() => {
    if (selectedReport) {
      console.log("Selected Report Data (Mobile):", selectedReport);
      console.log("Foto Temuan (Mobile):", selectedReport.foto_temuan);

      setForm((prev) => ({
        ...prev,
        lokasi: selectedReport.site || selectedReport.lokasi,
        detailLokasi: selectedReport.detail_lokasi,
        pic:
          selectedReport.sumber_laporan === "PTO"
            ? selectedReport.nrp_pic || ""
            : "", // Prefill PIC hanya dari PTO, bukan Take 5
        keteranganLokasi: "", // blank, isi manual
        ketidaksesuaian: "", // blank, isi manual
        subKetidaksesuaian: "", // blank, isi manual
        quickAction:
          selectedReport.sumber_laporan === "Take5"
            ? "STOP pekerjaan sesuai Take 5"
            : "Tindak lanjut PTO",
        deskripsiTemuan: selectedReport.deskripsi || "Temuan dari observasi",
      }));

      // Auto-fill evidence preview jika ada foto temuan dari PTO
      if (selectedReport.foto_temuan) {
        // URL should already be correct from database
        const fotoUrl = selectedReport.foto_temuan;
        setEvidencePreview(fotoUrl);
        console.log("Evidence preview set from PTO (Mobile):", fotoUrl);
      }
    }
  }, [selectedReport]);

  // Default lokasi dari site yang didaftarkan pekerja (masih dapat diubah)
  useEffect(() => {
    if (user?.site && !selectedReport) {
      setForm((prev) =>
        prev.lokasi === "" ? { ...prev, lokasi: user.site } : prev
      );
    }
  }, [user?.site, selectedReport]);

  // Fetch PIC options by lokasi
  useEffect(() => {
    async function fetchPIC() {
      if (!form.lokasi) {
        setPicOptions([]);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("nama")
        .eq("site", form.lokasi);
      if (!error && data) {
        // Filter out current user dari PIC options, urutkan abjad
        const filteredPIC = data
          .map((u) => u.nama)
          .filter(Boolean)
          .filter((nama) => nama !== user.nama) // Exclude current user
          .sort((a, b) => a.localeCompare(b, "id"));
        setPicOptions(filteredPIC);
      } else {
        setPicOptions([]);
      }
    }
    fetchPIC();
  }, [form.lokasi, user.nama]);

  // Update location options when lokasi changes
  useEffect(() => {
    if (form.lokasi) {
      const options = getLocationOptions(form.lokasi);
      setLocationOptions(options);
      // Reset detail lokasi when lokasi changes
      setForm((prev) => ({ ...prev, detailLokasi: "" }));
      setShowCustomInput(false);
    } else {
      setLocationOptions([]);
      setForm((prev) => ({ ...prev, detailLokasi: "" }));
      setShowCustomInput(false);
    }
  }, [form.lokasi]);

  // Handle detail lokasi change
  const handleDetailLokasiChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Show custom input if "Lainnya" is selected or if site allows custom input
    if (
      value === "Lainnya" ||
      (allowsCustomInput(form.lokasi) && value === "")
    ) {
      setShowCustomInput(true);
      setForm((prev) => ({ ...prev, detailLokasi: "" }));
    } else {
      setShowCustomInput(false);
    }
  };

  // Fetch Evaluator options by lokasi (tetap jalankan tapi tidak tampilkan di form)
  useEffect(() => {
    async function fetchEvaluator() {
      if (!form.lokasi) {
        setEvaluatorOptions([]);
        setEvaluatorNama("");
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("nama")
        .eq("site", form.lokasi)
        .eq("role", "evaluator");
      if (!error && data && data.length > 0) {
        setEvaluatorOptions(data.map((u) => u.nama).filter(Boolean));
        setEvaluatorNama(data[0].nama);
      } else {
        setEvaluatorOptions([]);
        setEvaluatorNama("");
      }
    }
    fetchEvaluator();
  }, [form.lokasi]);

  // Evidence preview
  useEffect(() => {
    if (evidence) {
      const url = URL.createObjectURL(evidence);
      setEvidencePreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (!selectedReport?.foto_temuan) {
      setEvidencePreview(null);
    }
  }, [evidence, selectedReport]);

  // Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset subKetidaksesuaian ketika kategori berubah
    if (name === "ketidaksesuaian") {
      setForm((prev) => ({
        ...prev,
        ketidaksesuaian: value,
        subKetidaksesuaian: "",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "lokasi") {
      setForm((prev) => ({ ...prev, pic: "" }));
      setEvaluatorNama("");
    }
  };

  const handleEvidence = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRawImage(URL.createObjectURL(file));
      setShowCrop(true);
    }
  };

  const handleClickCamera = () => {
    fileInputRef.current?.click();
  };

  const handleClickPreview = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => setPage((p) => p + 1);
  const handleBack = () => setPage((p) => p - 1);

  // Fungsi validasi untuk setiap halaman
  const isPage1Valid = () => {
    return (
      form.lokasi && form.detailLokasi && form.keteranganLokasi && form.pic
    );
  };

  const isPage2Valid = () => {
    return form.ketidaksesuaian && form.subKetidaksesuaian && form.quickAction;
  };

  const isPage3Valid = () => {
    return form.deskripsiTemuan && (evidence || selectedReport?.foto_temuan);
  };

  const _isFormValid = () => {
    return isPage1Valid() && isPage2Valid() && isPage3Valid();
  };

  // Kolom tampil normal tanpa border merah / pesan error
  const getFieldError = () => null;
  const getFieldBorderStyle = () => ({
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
  });

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(rawImage, croppedAreaPixels);
      const file = new File([croppedImage], "evidence.jpg", {
        type: "image/jpeg",
      });
      setEvidence(file);
      setShowCrop(false);
      setRawImage(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCropCancel = () => {
    setShowCrop(false);
    setRawImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function uploadEvidence() {
    if (!evidence) return null;
    const fileExt = evidence.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `hazard-evidence/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("img-test")
      .upload(filePath, evidence);

    if (uploadError) {
      throw new Error("Error uploading evidence");
    }

    const { data } = supabase.storage.from("img-test").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      let evidenceUrl = "";
      if (evidence) {
        evidenceUrl = await uploadEvidence();
      } else if (selectedReport?.foto_temuan) {
        evidenceUrl = selectedReport.foto_temuan;
      }

      // Jika ada multiple evaluator, buat hazard report untuk setiap evaluator
      if (evaluatorOptions.length > 1) {
        const hazardPromises = evaluatorOptions.map((evaluatorNama) =>
          supabase.from("hazard_report").insert({
            user_id: user.id,
            user_perusahaan: user.perusahaan,
            pelapor_nama: user.nama,
            pelapor_nrp: user.nrp,
            lokasi: form.lokasi,
            detail_lokasi: form.detailLokasi,
            keterangan_lokasi: form.keteranganLokasi,
            pic: form.pic,
            ketidaksesuaian: form.ketidaksesuaian,
            sub_ketidaksesuaian: form.subKetidaksesuaian,
            quick_action: form.quickAction,
            deskripsi_temuan: form.deskripsiTemuan,
            evidence: evidenceUrl,
            created_at: new Date().toISOString(),
            status: "Submit",
            action_plan: null,
            due_date: null,
            evaluator_nama: evaluatorNama,
            take_5_id:
              selectedReport?.sumber_laporan === "Take5"
                ? selectedReport?.id
                : null,
            pto_id:
              selectedReport?.sumber_laporan === "PTO"
                ? selectedReport?.id
                : null,
            sumber_laporan: selectedReport?.sumber_laporan || null,
            id_sumber_laporan: selectedReport?.id || null, // Keep for backward compatibility
          })
        );

        const results = await Promise.all(hazardPromises);
        const errors = results.filter((result) => result.error);

        if (errors.length > 0) {
          throw new Error(`Gagal membuat ${errors.length} hazard report`);
        }

        console.log(
          `Berhasil membuat ${evaluatorOptions.length} hazard report untuk evaluator:`,
          evaluatorOptions
        );
        setSubmittedToMultipleEvaluators(true);
      } else {
        // Jika hanya satu evaluator, buat hazard report seperti biasa
        const hazardData = {
          user_id: user.id,
          user_perusahaan: user.perusahaan || null,
          pelapor_nama: user.nama,
          pelapor_nrp: user.nrp || null,
          lokasi: form.lokasi,
          detail_lokasi: form.detailLokasi,
          keterangan_lokasi: form.keteranganLokasi,
          pic: form.pic,
          ketidaksesuaian: form.ketidaksesuaian,
          sub_ketidaksesuaian: form.subKetidaksesuaian,
          quick_action: form.quickAction,
          deskripsi_temuan: form.deskripsiTemuan,
          evidence: evidenceUrl,
          created_at: new Date().toISOString(),
          status: "Submit",
          action_plan: null,
          due_date: null,
          evaluator_nama: evaluatorNama,
          take_5_id:
            selectedReport?.sumber_laporan === "Take5"
              ? selectedReport?.id
              : null,
          pto_id:
            selectedReport?.sumber_laporan === "PTO"
              ? selectedReport?.id
              : null,
          sumber_laporan: selectedReport?.sumber_laporan || null,
          id_sumber_laporan: selectedReport?.id || null, // Keep for backward compatibility
        };

        console.log("Hazard data to insert:", hazardData);

        const { data: hazardDataResult, error } = await supabase
          .from("hazard_report")
          .insert(hazardData);

        console.log("Hazard Report insert result:", {
          hazardDataResult,
          error,
        });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }
        setSubmittedToMultipleEvaluators(false);
      }

      // Jika ada report yang dipilih, update status menjadi "done" (untuk Take 5)
      if (selectedReport?.sumber_laporan === "Take5" && selectedReport?.id) {
        const { error: updateError } = await supabase
          .from("take_5")
          .update({ status: "done" })
          .eq("id", selectedReport.id);

        if (updateError) {
          console.error("Error updating Take 5 status:", updateError);
        }
      }

      setSubmitSuccess(true);
      setForm({
        lokasi: "",
        detailLokasi: "",
        keteranganLokasi: "",
        pic: "",
        ketidaksesuaian: "",
        subKetidaksesuaian: "",
        quickAction: "",
        deskripsiTemuan: "",
      });
      setEvidence(null);
      setEvidencePreview(null);
      setSelectedReport(null);
      setSelectedReportId(null);
      setPage(1);
      setSubmittedToMultipleEvaluators(false);

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting hazard report:", error);
      setSubmitError("Gagal menyimpan hazard report. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  // Crop modal
  if (showCrop) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 280,
            height: 280,
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <Cropper
            image={rawImage}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { width: "100%", height: "100%" } }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <button
              onClick={handleCropCancel}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                fontSize: 18,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <button
              onClick={handleCropSave}
              style={{
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                fontSize: 18,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh", // gunakan full viewport height
        background: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0px",
        overflow: "hidden", // cegah scroll
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Mobile Header */}
      <MobileHeader
        user={user}
        onBack={onBack}
        title="Hazard Report"
        showBack={true}
      />
      <div
        style={{
          background: "#fff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          boxShadow: "0 2px 16px #0001",
          paddingTop: 6,
          paddingRight: 6,
          paddingBottom: 100, // space agar content tidak tertutup navbar
          paddingLeft: 6,
          width: "100%",
          maxWidth: 425, // fit untuk mobile 425px
          marginBottom: 0,
          height: "calc(100% - 60px)", // kurangi tinggi header
          marginTop: 60, // tambah margin top untuk header
          overflow: "auto", // allow scroll dalam card
        }}
      >
        {/* Progress indicator */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 8,
            gap: 6,
          }}
        >
          {[1, 2, 3].map((p) => (
            <div
              key={p}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: page >= p ? "#2563eb" : "#e5e7eb",
              }}
            />
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2, // lebih rapat
            flex: 1,
            overflow: "auto", // allow scroll
            paddingBottom: 20, // tambah padding bottom untuk space
          }}
        >
          {/* Pending Take 5 List - dipindah ke dalam form */}
          <div
            style={{
              width: "90%",
              maxWidth: 320,
              marginLeft: "auto",
              marginRight: "auto",
              marginTop: 8,
              boxSizing: "border-box",
            }}
          >
            <PendingReportsList
              user={user}
              onSelectReport={(report) => {
                setSelectedReport(report);
                setSelectedReportId(report?.id || null);
              }}
              selectedReportId={selectedReportId}
            />
          </div>

          {/* PAGE 1 */}
          {page === 1 && (
            <>
              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                  marginTop: 8,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Lokasi (Site)
                </label>
                <MobileSiteSelector
                  value={form.lokasi}
                  onChange={handleChange}
                  placeholder="Pilih Lokasi"
                  disabled={!!selectedReport}
                  style={getFieldBorderStyle("lokasi")}
                  required
                />
                {getFieldError("lokasi") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("lokasi")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Detail Lokasi
                </label>
                {shouldUseLocationSelector(form.lokasi) ? (
                  <>
                    <div
                      onClick={() => {
                        if (form.lokasi && !selectedReport) {
                          setDetailLokasiSearchQuery("");
                          setShowDetailLokasiModal(true);
                        }
                      }}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        borderRadius: 8,
                        padding: "12px 16px",
                        fontSize: 14,
                        border: "1px solid #d1d5db",
                        backgroundColor: !!selectedReport || !form.lokasi ? "#f3f4f6" : "#fff",
                        color: !!selectedReport || !form.lokasi ? "#9ca3af" : "#000",
                        cursor: !!selectedReport || !form.lokasi ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        ...getFieldBorderStyle("detailLokasi"),
                      }}
                    >
                      <span>
                        {form.detailLokasi ||
                          (!form.lokasi
                            ? "Pilih lokasi terlebih dahulu"
                            : !!selectedReport
                              ? "Diisi otomatis dari report"
                              : "Pilih Detail Lokasi")}
                      </span>
                      {form.lokasi && !selectedReport && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      )}
                    </div>
                    <SelectModalWithSearch
                      title="Pilih Detail Lokasi"
                      options={getLocationOptions(form.lokasi) || []}
                      value={form.detailLokasi}
                      onSelect={(val) => {
                        setShowDetailLokasiModal(false);
                        setDetailLokasiSearchQuery("");
                        if (val === "Lainnya") {
                          setShowCustomInput(true);
                          setForm((prev) => ({ ...prev, detailLokasi: "" }));
                        } else {
                          setShowCustomInput(false);
                          setForm((prev) => ({ ...prev, detailLokasi: val }));
                        }
                      }}
                      searchQuery={detailLokasiSearchQuery}
                      onSearchChange={setDetailLokasiSearchQuery}
                      show={showDetailLokasiModal}
                      onClose={() => setShowDetailLokasiModal(false)}
                    />
                    {showCustomInput && (
                      <input
                        type="text"
                        name="detailLokasi"
                        value={form.detailLokasi}
                        onChange={handleChange}
                        required
                        placeholder="Ketik detail lokasi lainnya..."
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          borderRadius: 8,
                          padding: "12px 16px",
                          fontSize: 13,
                          marginTop: 8,
                          ...getFieldBorderStyle("detailLokasi"),
                        }}
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    name="detailLokasi"
                    value={form.detailLokasi}
                    onChange={handleChange}
                    required
                    disabled={!!selectedReport}
                    placeholder="Ketik detail lokasi..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      borderRadius: 8,
                      padding: "12px 16px",
                      fontSize: 13,
                      backgroundColor: !!selectedReport ? "#f3f4f6" : "#fff",
                      color: !!selectedReport ? "#9ca3af" : "#000",
                      ...getFieldBorderStyle("detailLokasi"),
                    }}
                  />
                )}
                {getFieldError("detailLokasi") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("detailLokasi")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                  boxSizing: "border-box",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Keterangan Lokasi
                </label>
                <textarea
                  name="keteranganLokasi"
                  value={form.keteranganLokasi}
                  onChange={handleChange}
                  required
                  placeholder="Jelaskan detail lokasi temuan hazard"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 13,
                    resize: "vertical",
                    minHeight: 60,
                    ...getFieldBorderStyle("keteranganLokasi"),
                  }}
                />
                {getFieldError("keteranganLokasi") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("keteranganLokasi")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  PIC (Person In Charge)
                  {selectedReport?.sumber_laporan === "PTO" && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#10b981",
                        marginLeft: "4px",
                      }}
                    >
                      (Auto-filled dari PTO)
                    </span>
                  )}
                </label>
                <div
                  onClick={() => {
                    if (
                      form.lokasi &&
                      selectedReport?.sumber_laporan !== "PTO"
                    ) {
                      setPicSearchQuery("");
                      setShowPicModal(true);
                    }
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    border: "1px solid #d1d5db",
                    backgroundColor:
                      !form.lokasi || selectedReport?.sumber_laporan === "PTO"
                        ? "#f3f4f6"
                        : "#ffffff",
                    color:
                      !form.lokasi || selectedReport?.sumber_laporan === "PTO"
                        ? "#9ca3af"
                        : "#000000",
                    cursor:
                      !form.lokasi || selectedReport?.sumber_laporan === "PTO"
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    ...getFieldBorderStyle("pic"),
                  }}
                >
                  <span>
                    {form.pic || (!form.lokasi ? "Pilih lokasi terlebih dahulu" : "Pilih PIC")}
                  </span>
                  {form.lokasi && selectedReport?.sumber_laporan !== "PTO" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </div>
                {showPicModal && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 70,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      zIndex: 1100,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                    onClick={() => setShowPicModal(false)}
                  >
                    <div
                      style={{
                        backgroundColor: "#fff",
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        maxHeight: "70vh",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #e5e7eb",
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Pilih PIC</div>
                        <input
                          type="text"
                          value={picSearchQuery}
                          onChange={(e) => setPicSearchQuery(e.target.value)}
                          placeholder="Ketik nama untuk mencari..."
                          autoComplete="off"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            fontSize: 16,
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          flex: 1,
                          overflowY: "auto",
                          padding: "8px 0",
                        }}
                      >
                        {picOptions
                          .filter((opt) =>
                            opt
                              .toLowerCase()
                              .includes(picSearchQuery.toLowerCase())
                          )
                          .map((opt) => (
                            <div
                              key={opt}
                              onClick={() => {
                                setForm((prev) => ({ ...prev, pic: opt }));
                                setShowPicModal(false);
                                setPicSearchQuery("");
                              }}
                              style={{
                                padding: "14px 16px",
                                fontSize: 16,
                                color: "#1f2937",
                                cursor: "pointer",
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              {opt}
                            </div>
                          ))}
                        {picOptions.filter((opt) =>
                          opt.toLowerCase().includes(picSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div
                            style={{
                              padding: 24,
                              textAlign: "center",
                              color: "#6b7280",
                              fontSize: 14,
                            }}
                          >
                            Tidak ada nama yang sesuai
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {picOptions.length === 0 && form.lokasi && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#ef4444",
                      marginTop: 2,
                      textAlign: "center",
                    }}
                  >
                    Tidak ada PIC lain di lokasi ini
                  </div>
                )}
                {getFieldError("pic") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("pic")}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={!isPage1Valid()}
                style={{
                  background: isPage1Valid() ? "#2563eb" : "#9ca3af",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 0",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isPage1Valid() ? "pointer" : "not-allowed",
                  marginTop: 8,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                  display: "block",
                  opacity: isPage1Valid() ? 1 : 0.6,
                }}
              >
                Lanjutkan
              </button>
            </>
          )}

          {/* PAGE 2 */}
          {page === 2 && (
            <>
              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                  marginTop: 8,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Ketidaksesuaian
                </label>
                <div
                  onClick={() => {
                    setKetidaksesuaianSearchQuery("");
                    setShowKetidaksesuaianModal(true);
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#fff",
                    color: form.ketidaksesuaian ? "#000" : "#9ca3af",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    ...getFieldBorderStyle("ketidaksesuaian"),
                  }}
                >
                  <span>{form.ketidaksesuaian || "Pilih Ketidaksesuaian"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <SelectModalWithSearch
                  title="Pilih Ketidaksesuaian"
                  options={[
                    "APD", "Area Parkir", "Bahaya Peledakan", "Bahaya Biologi",
                    "Bahaya Elektrikal", "External Issue", "Fasilitas Mixing Plant",
                    "Fasilitas Office", "Fasilitas Workshop", "Izin Kerja",
                    "Kelayakan Bangunan", "Kelayakan Tools", "Kelengkapan Tanggap Darurat",
                    "Kondisi Fisik Pekerja", "Kondisi Kendaraan/Unit", "Lingkungan Kerja",
                    "Penandaan", "Rambu", "Tools Inspection",
                  ]}
                  value={form.ketidaksesuaian}
                  onSelect={(val) => {
                    setForm((prev) => ({ ...prev, ketidaksesuaian: val, subKetidaksesuaian: "" }));
                    setShowKetidaksesuaianModal(false);
                    setKetidaksesuaianSearchQuery("");
                  }}
                  searchQuery={ketidaksesuaianSearchQuery}
                  onSearchChange={setKetidaksesuaianSearchQuery}
                  show={showKetidaksesuaianModal}
                  onClose={() => setShowKetidaksesuaianModal(false)}
                />
                {getFieldError("ketidaksesuaian") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("ketidaksesuaian")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Sub Ketidaksesuaian
                </label>
                {/* Sub Ketidaksesuaian Dinamis */}
                {getSubOptions(form.ketidaksesuaian).length > 0 ? (
                  <>
                    <div
                      onClick={() => {
                        setSubKetidaksesuaianSearchQuery("");
                        setShowSubKetidaksesuaianModal(true);
                      }}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        borderRadius: 8,
                        padding: "12px 16px",
                        fontSize: 14,
                        border: "1px solid #d1d5db",
                        backgroundColor: "#fff",
                        color: form.subKetidaksesuaian ? "#000" : "#9ca3af",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        ...getFieldBorderStyle("subKetidaksesuaian"),
                      }}
                    >
                      <span>{form.subKetidaksesuaian || "Pilih Sub Ketidaksesuaian"}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    <SelectModalWithSearch
                      title="Pilih Sub Ketidaksesuaian"
                      options={getSubOptions(form.ketidaksesuaian)}
                      value={form.subKetidaksesuaian}
                      onSelect={(val) => {
                        setForm((prev) => ({ ...prev, subKetidaksesuaian: val }));
                        setShowSubKetidaksesuaianModal(false);
                        setSubKetidaksesuaianSearchQuery("");
                      }}
                      searchQuery={subKetidaksesuaianSearchQuery}
                      onSearchChange={setSubKetidaksesuaianSearchQuery}
                      show={showSubKetidaksesuaianModal}
                      onClose={() => setShowSubKetidaksesuaianModal(false)}
                    />
                  </>
                ) : (
                  <input
                    type="text"
                    name="subKetidaksesuaian"
                    value={form.subKetidaksesuaian}
                    onChange={handleChange}
                    required
                    placeholder="Isi sub ketidaksesuaian"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      borderRadius: 8,
                      padding: "12px 16px",
                      fontSize: 13,
                      ...getFieldBorderStyle("subKetidaksesuaian"),
                    }}
                  />
                )}
                {getFieldError("subKetidaksesuaian") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("subKetidaksesuaian")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Quick Action
                </label>
                <div
                  onClick={() => {
                    setQuickActionSearchQuery("");
                    setShowQuickActionModal(true);
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#fff",
                    color: form.quickAction ? "#000" : "#9ca3af",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    ...getFieldBorderStyle("quickAction"),
                  }}
                >
                  <span>{form.quickAction || "Pilih Quick Action"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <SelectModalWithSearch
                  title="Pilih Quick Action"
                  options={[
                    "Pekerjaan Dilakukan setelah Perbaikan Langsung",
                    "Stop Pekerjaan",
                    "Stop Pekerjaan Sampai Temuan Diperbaiki",
                  ]}
                  value={form.quickAction}
                  onSelect={(val) => {
                    setForm((prev) => ({ ...prev, quickAction: val }));
                    setShowQuickActionModal(false);
                    setQuickActionSearchQuery("");
                  }}
                  searchQuery={quickActionSearchQuery}
                  onSearchChange={setQuickActionSearchQuery}
                  show={showQuickActionModal}
                  onClose={() => setShowQuickActionModal(false)}
                />
                {getFieldError("quickAction") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("quickAction")}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  width: "90%",
                  maxWidth: 320,
                  margin: "8px auto 0 auto",
                }}
              >
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    background: "#6b7280",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isPage2Valid()}
                  style={{
                    background: isPage2Valid() ? "#2563eb" : "#9ca3af",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isPage2Valid() ? "pointer" : "not-allowed",
                    flex: 1,
                    opacity: isPage2Valid() ? 1 : 0.6,
                  }}
                >
                  Lanjutkan
                </button>
              </div>
            </>
          )}

          {/* PAGE 3 */}
          {page === 3 && (
            <>
              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                  marginTop: 8,
                  boxSizing: "border-box",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Deskripsi Temuan
                </label>
                <textarea
                  name="deskripsiTemuan"
                  value={form.deskripsiTemuan}
                  onChange={handleChange}
                  required
                  placeholder="Jelaskan detail temuan hazard"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 13,
                    resize: "vertical",
                    minHeight: 60,
                    ...getFieldBorderStyle("deskripsiTemuan"),
                  }}
                />
                {getFieldError("deskripsiTemuan") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("deskripsiTemuan")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                  boxSizing: "border-box",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Foto Evidence
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleEvidence}
                  name="evidence"
                  style={{ display: "none" }}
                />
                {evidencePreview ? (
                  <div style={{ textAlign: "center" }}>
                    {selectedReport?.foto_temuan && !evidence && (
                      <div
                        style={{
                          background: "#f0f9ff",
                          border: "1px solid #0ea5e9",
                          borderRadius: "8px",
                          padding: "6px",
                          marginBottom: "6px",
                          fontSize: "11px",
                          color: "#0369a1",
                        }}
                      >
                        📸 Foto dari Take 5 tersedia. Silakan upload foto baru
                        untuk Hazard Report.
                      </div>
                    )}
                    <img
                      src={evidencePreview}
                      alt="Preview"
                      onClick={handleClickPreview}
                      style={{
                        maxWidth: "100%",
                        maxHeight: 150,
                        borderRadius: 8,
                        border: "2px solid #e5e7eb",
                        cursor: "pointer",
                      }}
                      title="Klik untuk ganti foto"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleClickCamera}
                    style={{
                      width: "100%",
                      background: "#f3f4f6",
                      border: "2px dashed #d1d5db",
                      borderRadius: 8,
                      padding: "12px",
                      fontSize: 13,
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Klik untuk mengambil foto
                  </button>
                )}
              </div>

              {submitError && (
                <div
                  style={{
                    color: "#ef4444",
                    fontWeight: 500,
                    fontSize: 13,
                    textAlign: "center",
                    width: "90%",
                    margin: "0 auto",
                  }}
                >
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div
                  style={{
                    background: "#10b981",
                    color: "#fff",
                    padding: "8px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    textAlign: "center",
                    fontSize: 13,
                    width: "90%",
                    margin: "0 auto",
                  }}
                >
                  {submittedToMultipleEvaluators ? (
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                        Hazard Report berhasil dikirim!
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        Laporan telah dikirim ke {evaluatorOptions.length}{" "}
                        evaluator untuk mempercepat proses evaluasi.
                      </div>
                    </div>
                  ) : (
                    "Hazard Report berhasil dikirim!"
                  )}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  width: "90%",
                  maxWidth: 320,
                  margin: "8px auto 0 auto",
                }}
              >
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    background: "#6b7280",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isPage3Valid()}
                  style={{
                    background:
                      submitting || !isPage3Valid() ? "#9ca3af" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor:
                      submitting || !isPage3Valid() ? "not-allowed" : "pointer",
                    flex: 1,
                    opacity: submitting || !isPage3Valid() ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        activeTab=""
        onNavigate={(tab) => {
          if (tab === "home") {
            onBack && onBack();
          } else if (tab === "profile") {
            onNavigate && onNavigate("profile");
          } else if (tab === "tasklist") {
            onNavigate && onNavigate("tasklist");
          }
        }}
      />
    </div>
  );
}

export default HazardFormMobile;

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { getTodayWITA } from "../../utils/dateTimeHelpers";
import LocationDetailSelector from "../LocationDetailSelector";
import Cropper from "react-easy-crop";
import { fetchProsedur, fetchAlasanObservasi } from "../../utils/masterDataHelpers";

// Inject CSS for PTO navigation buttons with higher specificity
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    .pto-nav-button {
      padding: 8px 16px !important;
      border-radius: 6px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      min-width: 120px !important;
      border: none !important;
      cursor: pointer !important;
    }
    
    .pto-nav-button:hover {
      cursor: pointer !important;
    }
    
    .pto-nav-button:disabled {
      cursor: not-allowed !important;
    }
  `;
  document.head.appendChild(style);
}

const alasanObservasiFallback = [
  "Pekerja Baru", "Kinerja Pekerja Kurang Baik", "Tes Praktek", "Kinerja Pekerja Baik",
  "Observasi Rutin", "Baru Terjadi Insiden", "Pekerja Dengan Pengetahuan Terbatas",
];

const prosedurFallback = [
  "Prosedur Kerja Aman", "Prosedur Penggunaan APD", "Prosedur Operasi Mesin",
  "Prosedur Pekerjaan di Ketinggian", "Prosedur Pekerjaan Panas",
  "Prosedur Pengangkatan Manual", "Prosedur Pekerjaan di Ruang Terbatas",
];

function PTOFormDesktop({ user, onBack }) {
  const [formData, setFormData] = useState({
    tanggal: getTodayWITA(),
    site: user?.site || "",
    detailLokasi: "",
    alasanObservasi: "",
    observerTambahan: "",
    observee: "",
    pekerjaanYangDilakukan: "",
    prosedur: "",
    // Checklist
    langkahKerjaAman: null,
    apdSesuai: null,
    areaKerjaAman: null,
    peralatanAman: null,
    peduliKeselamatan: null,
    pahamResikoProsedur: null,
    // Tindakan Perbaikan
    tindakanPerbaikan: "",
    picTindakLanjut: "",
    fotoTemuan: null,
  });

  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [sites, setSites] = useState([]);
  const [observers, setObservers] = useState([]);
  const [observees, setObservees] = useState([]);
  const [pics, setPICs] = useState([]);
  const [alasanObservasiOptions, setAlasanObservasiOptions] = useState(alasanObservasiFallback);
  const [prosedurOptions, setProsedurOptions] = useState(prosedurFallback);

  // Photo crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fotoCameraRef = useRef();
  const fotoGalleryRef = useRef();

  useEffect(() => {
    fetchSites();
    if (formData.site) {
      fetchObservers();
      fetchObservees();
      fetchPICs();
    }
  }, [formData.site, formData.observerTambahan]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAlasanObservasi(), fetchProsedur()]).then(([alasan, prosedur]) => {
      if (cancelled) return;
      if (alasan?.length > 0) setAlasanObservasiOptions(alasan);
      if (prosedur?.length > 0) setProsedurOptions(prosedur);
    });
    return () => { cancelled = true; };
  }, []);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("site")
        .not("site", "is", null);

      if (error) throw error;

      const uniqueSites = [...new Set(data.map((user) => user.site))];
      setSites(uniqueSites);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, nama, jabatan")
        .eq("site", formData.site)
        .in("jabatan", [
          "Pengawas",
          "Technical Service",
          "SHERQ Officer",
          "Assisten Penanggung Jawab Operasional",
          "Penanggung Jawab Operasional",
        ])
        .neq("id", user.id);

      if (error) throw error;
      const sorted = (data || []).sort((a, b) => (a.nama || "").localeCompare(b.nama || "", "id"));
      setObservers(sorted);
    } catch (error) {
      console.error("Error fetching observers:", error);
    }
  };

  const fetchObservees = async () => {
    try {
      let query = supabase
        .from("users")
        .select("id, nama, jabatan")
        .eq("site", formData.site)
        .neq("id", user.id); // Exclude observer utama (user login)

      // Exclude observer tambahan if selected
      if (formData.observerTambahan) {
        query = query.neq("id", formData.observerTambahan);
      }

      const { data, error } = await query;

      if (error) throw error;
      const sorted = (data || []).sort((a, b) => (a.nama || "").localeCompare(b.nama || "", "id"));
      setObservees(sorted);
    } catch (error) {
      console.error("Error fetching observees:", error);
    }
  };

  const fetchPICs = async () => {
    try {
      let query = supabase
        .from("users")
        .select("id, nama, jabatan")
        .eq("site", formData.site)
        .neq("id", user.id); // Exclude observer utama (user login)

      // Exclude observer tambahan if selected
      if (formData.observerTambahan) {
        query = query.neq("id", formData.observerTambahan);
      }

      const { data, error } = await query;

      if (error) throw error;
      const sorted = (data || []).sort((a, b) => (a.nama || "").localeCompare(b.nama || "", "id"));
      setPICs(sorted);
    } catch (error) {
      console.error("Error fetching PICs:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChecklistChange = (question, value) => {
    setFormData((prev) => ({ ...prev, [question]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
      0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(photoPreview, croppedAreaPixels);
      const file = new File([croppedImage], "cropped-image.jpg", {
        type: "image/jpeg",
      });

      setFormData((prev) => ({
        ...prev,
        fotoTemuan: file,
      }));

      setShowCropper(false);
      setPhotoPreview(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setPhotoPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleReplacePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      fotoTemuan: null,
    }));
  };

  const nextPage = () => {
    if (page === 3) {
      // Jika semua jawaban Iya, langsung simpan tanpa ke halaman 4
      if (!hasNegativeAnswers()) {
        handleSubmit();
        return;
      }
    }

    if (page < 4) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const validatePage = () => {
    if (page === 1) {
      return (
        formData.tanggal &&
        formData.site &&
        formData.detailLokasi &&
        formData.alasanObservasi
      );
    }
    if (page === 2) {
      return (
        formData.observerTambahan !== undefined &&
        formData.observee &&
        formData.pekerjaanYangDilakukan
      );
    }
    if (page === 3) {
      return (
        formData.langkahKerjaAman !== null &&
        formData.apdSesuai !== null &&
        formData.areaKerjaAman !== null &&
        formData.peralatanAman !== null &&
        formData.peduliKeselamatan !== null &&
        formData.pahamResikoProsedur !== null
      );
    }
    return true;
  };

  const hasNegativeAnswers = () => {
    return (
      formData.langkahKerjaAman === false ||
      formData.apdSesuai === false ||
      formData.areaKerjaAman === false ||
      formData.peralatanAman === false ||
      formData.peduliKeselamatan === false ||
      formData.pahamResikoProsedur === false
    );
  };

  const shouldShowPage4 = () => {
    return hasNegativeAnswers();
  };

  // Helper function untuk validasi UUID
  const isValidUUID = (uuid) => {
    if (!uuid) return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const handleSubmit = async () => {
    if (!validatePage()) {
      setError("Mohon lengkapi semua field yang diperlukan");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload foto jika ada
      let fotoUrl = null;
      if (formData.fotoTemuan) {
        try {
          console.log("Uploading photo to pto-evidence bucket...");
          const fileName = `${Date.now()}_${formData.fotoTemuan.name}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("pto-evidence")
              .upload(fileName, formData.fotoTemuan);

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error(`Gagal upload foto: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from("pto-evidence")
            .getPublicUrl(fileName);

          fotoUrl = urlData.publicUrl;
          console.log("Photo uploaded successfully:", fotoUrl);
        } catch (uploadErr) {
          console.error("Photo upload failed:", uploadErr);
          // Jika upload foto gagal, lanjutkan tanpa foto
          fotoUrl = null;
        }
      }

      // Tentukan status berdasarkan checklist
      const hasNegativeAnswers = () => {
        return (
          formData.langkahKerjaAman === false ||
          formData.apdSesuai === false ||
          formData.areaKerjaAman === false ||
          formData.peralatanAman === false ||
          formData.peduliKeselamatan === false ||
          formData.pahamResikoProsedur === false
        );
      };

      const status = hasNegativeAnswers() ? "pending" : "closed";

      // Prepare data untuk insert dengan validasi UUID
      const ptoData = {
        tanggal: formData.tanggal,
        site: formData.site,
        detail_lokasi: formData.detailLokasi,
        alasan_observasi: formData.alasanObservasi,
        observer_id: user.id,
        observer_tambahan_id: isValidUUID(formData.observerTambahan)
          ? formData.observerTambahan
          : null,
        observee_id: isValidUUID(formData.observee) ? formData.observee : null,
        pekerjaan_yang_dilakukan: formData.pekerjaanYangDilakukan,
        prosedur_id: formData.prosedur || null,
        // Checklist
        langkah_kerja_aman: formData.langkahKerjaAman,
        apd_sesuai: formData.apdSesuai,
        area_kerja_aman: formData.areaKerjaAman,
        peralatan_aman: formData.peralatanAman,
        peduli_keselamatan: formData.peduliKeselamatan,
        paham_resiko_prosedur: formData.pahamResikoProsedur,
        // Tindakan Perbaikan
        tindakan_perbaikan: formData.tindakanPerbaikan || null,
        pic_tindak_lanjut_id: isValidUUID(formData.picTindakLanjut)
          ? formData.picTindakLanjut
          : null,
        foto_temuan: fotoUrl,
        status: status,
        created_by: user.id,
      };

      console.log("Submitting PTO data:", ptoData);
      console.log("UUID validation:", {
        observerTambahan: {
          value: formData.observerTambahan,
          isValid: isValidUUID(formData.observerTambahan),
        },
        observee: {
          value: formData.observee,
          isValid: isValidUUID(formData.observee),
        },
        prosedur: {
          value: formData.prosedur,
          isValid: formData.prosedur ? true : false,
        },
        picTindakLanjut: {
          value: formData.picTindakLanjut,
          isValid: isValidUUID(formData.picTindakLanjut),
        },
      });

      const { data, error } = await supabase
        .from("planned_task_observation")
        .insert([ptoData])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        if (error.message.includes("row-level security")) {
          throw new Error(
            "Akses ditolak oleh kebijakan keamanan. Silakan hubungi administrator."
          );
        }
        throw error;
      }

      // Jika ada temuan (status pending), buat hazard report otomatis
      if (
        status === "pending" &&
        formData.tindakanPerbaikan &&
        formData.picTindakLanjut
      ) {
        try {
          // Panggil function untuk membuat hazard report otomatis
          const { data: hazardData, error: hazardError } = await supabase.rpc(
            "create_hazard_report_from_pto",
            {
              pto_id: data[0].id,
            }
          );

          if (hazardError) {
            console.error("Error creating hazard report:", hazardError);
            // Tidak throw error karena PTO sudah tersimpan
          } else {
            console.log("Hazard report created automatically:", hazardData);
          }
        } catch (hazardError) {
          console.error("Error in hazard report creation:", hazardError);
          // Tidak throw error karena PTO sudah tersimpan
        }
      }

      setSuccess(true);
    } catch (error) {
      console.error("Error submitting PTO:", error);
      setError("Terjadi kesalahan saat menyimpan data PTO");
    } finally {
      setSubmitting(false);
    }
  };

  const renderPage1 = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Tanggal */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Tanggal *
          </label>
          <input
            type="date"
            name="tanggal"
            value={formData.tanggal}
            readOnly
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#1f2937",
              color: "#9ca3af",
              fontSize: "14px",
              cursor: "not-allowed",
            }}
          />
        </div>

        {/* Site */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Site *
          </label>
          <select
            name="site"
            value={formData.site}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            <option value="">Pilih Site</option>
            {sites.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </div>

        {/* Detail Lokasi */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Detail Lokasi *
          </label>
          <LocationDetailSelector
            site={formData.site}
            value={formData.detailLokasi}
            onChange={handleInputChange}
            placeholder="Pilih Detail Lokasi"
            required={true}
          />
        </div>

        {/* Alasan Observasi */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Alasan Observasi *
          </label>
          <select
            name="alasanObservasi"
            value={formData.alasanObservasi}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            <option value="">Pilih Alasan Observasi</option>
            {alasanObservasiOptions.map((alasan) => (
              <option key={alasan} value={alasan}>
                {alasan}
              </option>
            ))}
          </select>
        </div>

        {/* Pilih Prosedur */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Pilih Prosedur
          </label>
          <select
            name="prosedur"
            value={formData.prosedur}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            <option value="">Pilih Prosedur</option>
            {prosedurOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderPage2 = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Observer Tambahan */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Observer Tambahan (Opsional)
          </label>
          <select
            name="observerTambahan"
            value={formData.observerTambahan}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            <option value="">Pilih Observer Tambahan</option>
            {observers.map((observer) => (
              <option key={observer.id} value={observer.id}>
                {observer.nama} - {observer.jabatan}
              </option>
            ))}
          </select>
        </div>

        {/* Observee */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Observee *
          </label>
          <select
            name="observee"
            value={formData.observee}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            <option value="">Pilih Observee</option>
            {observees.map((observee) => (
              <option key={observee.id} value={observee.id}>
                {observee.nama} - {observee.jabatan}
              </option>
            ))}
          </select>
        </div>

        {/* Pekerjaan Yang Dilakukan */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Pekerjaan Yang Dilakukan *
          </label>
          <textarea
            name="pekerjaanYangDilakukan"
            value={formData.pekerjaanYangDilakukan}
            onChange={handleInputChange}
            rows={8}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e5e7eb",
              fontSize: "14px",
              resize: "vertical",
            }}
            placeholder="Jelaskan pekerjaan yang sedang dilakukan..."
          />
        </div>
      </div>
    </div>
  );

  const renderPage3 = () => {
    const checklistItems = [
      {
        key: "langkahKerjaAman",
        question: "Apakah langkah kerja aman dilakukan?",
        value: formData.langkahKerjaAman,
      },
      {
        key: "apdSesuai",
        question:
          "Apakah pekerja menggunakan APD yang sesuai dengan resiko kerja?",
        value: formData.apdSesuai,
      },
      {
        key: "areaKerjaAman",
        question: "Apakah area kerja aman?",
        value: formData.areaKerjaAman,
      },
      {
        key: "peralatanAman",
        question: "Apakah peralatan yang digunakan telah sesuai dan aman?",
        value: formData.peralatanAman,
      },
      {
        key: "peduliKeselamatan",
        question: "Apakah pekerja peduli dengan keselamatan rekan kerjanya?",
        value: formData.peduliKeselamatan,
      },
      {
        key: "pahamResikoProsedur",
        question:
          "Apakah pekerja memahami resiko pekerjaan dan prosedur kerjanya?",
        value: formData.pahamResikoProsedur,
      },
    ];

    // Reorganize items for proper alignment
    // Left column: items 0, 1, 2 (questions 1, 2, 3)
    // Right column: items 3, 4, 5 (questions 4, 5, 6)
    // This ensures: 1 aligns with 4, 2 with 5, 3 with 6
    const leftColumn = [
      checklistItems[0],
      checklistItems[1],
      checklistItems[2],
    ];
    const rightColumn = [
      checklistItems[3],
      checklistItems[4],
      checklistItems[5],
    ];

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: "800px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", gap: 24 }}>
          {/* Left Column */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {leftColumn.map((item, index) => (
              <div
                key={item.key}
                style={{
                  padding: 16,
                  minHeight: "120px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    marginBottom: 12,
                    color: "#e5e7eb",
                    fontWeight: 500,
                    fontSize: "14px",
                    textAlign: "center",
                  }}
                >
                  {index + 1}. {item.question}
                </div>
                <div
                  style={{ display: "flex", gap: 12, justifyContent: "center" }}
                >
                  <button
                    type="button"
                    onClick={() => handleChecklistChange(item.key, true)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #10b981",
                      backgroundColor:
                        item.value === true ? "#10b981" : "transparent",
                      color: item.value === true ? "#ffffff" : "#10b981",
                      cursor: "pointer",
                      fontSize: "14px",
                      minWidth: "80px",
                    }}
                  >
                    Iya
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChecklistChange(item.key, false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #ef4444",
                      backgroundColor:
                        item.value === false ? "#ef4444" : "transparent",
                      color: item.value === false ? "#ffffff" : "#ef4444",
                      cursor: "pointer",
                      fontSize: "14px",
                      minWidth: "80px",
                    }}
                  >
                    Tidak
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {rightColumn.map((item, index) => (
              <div
                key={item.key}
                style={{
                  padding: 16,
                  minHeight: "120px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    marginBottom: 12,
                    color: "#e5e7eb",
                    fontWeight: 500,
                    fontSize: "14px",
                    textAlign: "center",
                  }}
                >
                  {index + 4}. {item.question}
                </div>
                <div
                  style={{ display: "flex", gap: 12, justifyContent: "center" }}
                >
                  <button
                    type="button"
                    onClick={() => handleChecklistChange(item.key, true)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #10b981",
                      backgroundColor:
                        item.value === true ? "#10b981" : "transparent",
                      color: item.value === true ? "#ffffff" : "#10b981",
                      cursor: "pointer",
                      fontSize: "14px",
                      minWidth: "80px",
                    }}
                  >
                    Iya
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChecklistChange(item.key, false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #ef4444",
                      backgroundColor:
                        item.value === false ? "#ef4444" : "transparent",
                      color: item.value === false ? "#ffffff" : "#ef4444",
                      cursor: "pointer",
                      fontSize: "14px",
                      minWidth: "80px",
                    }}
                  >
                    Tidak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPage4 = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Tindakan Perbaikan */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Tindakan yang dilakukan untuk perbaikan *
          </label>
          <textarea
            name="tindakanPerbaikan"
            value={formData.tindakanPerbaikan}
            onChange={handleInputChange}
            rows={4}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e5e7eb",
              fontSize: "14px",
              resize: "vertical",
            }}
            placeholder="Jelaskan tindakan perbaikan yang dilakukan..."
          />
        </div>

        {/* PIC Tindak Lanjut */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            PIC Tindak Lanjut *
          </label>
          <select
            name="picTindakLanjut"
            value={formData.picTindakLanjut}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            <option value="">Pilih PIC Tindak Lanjut</option>
            {pics.map((pic) => (
              <option key={pic.id} value={pic.id}>
                {pic.nama} - {pic.jabatan}
              </option>
            ))}
          </select>
        </div>

        {/* Foto Temuan */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Foto Temuan
          </label>

          {!formData.fotoTemuan && !showCropper && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => fotoCameraRef.current?.click()}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  backgroundColor: "#0b1220",
                  color: "#e5e7eb",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                📷 Kamera
              </button>
              <button
                type="button"
                onClick={() => fotoGalleryRef.current?.click()}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  backgroundColor: "#0b1220",
                  color: "#e5e7eb",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                🖼️ Galeri
              </button>
            </div>
          )}
          <input
            ref={fotoCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <input
            ref={fotoGalleryRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {showCropper && (
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
                  width: 400,
                  height: 400,
                  background: "#fff",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <Cropper
                  image={photoPreview}
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
          )}

          {formData.fotoTemuan && !showCropper && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <img
                src={URL.createObjectURL(formData.fotoTemuan)}
                alt="Preview"
                onClick={handleReplacePhoto}
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = "0.8";
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = "1";
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (success) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px 0 24px",
        }}
      >
        <div
          style={{
            background: "#1f2937",
            padding: 32,
            borderRadius: 16,
            textAlign: "center",
            color: "#e5e7eb",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 16, color: "#10b981" }}>Berhasil!</h2>
          <p style={{ marginBottom: 24 }}>
            Data PTO berhasil disimpan.
            {hasNegativeAnswers() && (
              <span
                style={{
                  display: "block",
                  marginTop: 8,
                  fontSize: "14px",
                  color: "#fbbf24",
                }}
              >
                ⚠️ Hazard report telah dibuat otomatis untuk tindak lanjut
                temuan.
              </span>
            )}
          </p>
          <button
            onClick={onBack}
            style={{
              padding: "12px 24px",
              backgroundColor: "#60a5fa",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 80px 0 24px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "transparent",
          borderRadius: 18,
          boxShadow: "none",
          padding: 16,
          maxWidth: 1400,
          width: "100%",
          margin: "0 auto",
          height: "100vh",
        }}
      >
        <div
          style={{
            background: "transparent",
            border: "none",
            borderRadius: 16,
            padding: 24,
            color: "#e5e7eb",
            position: "relative",
            height: "720px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#60a5fa",
                fontWeight: 600,
                fontSize: "24px",
              }}
            >
              Planned Task Observation (PTO)
            </h2>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              {(() => {
                const totalPages = hasNegativeAnswers() ? 4 : 3;
                return [1, 2, 3, 4].map((pageNum) => {
                  if (pageNum > totalPages) return null;

                  return (
                    <div
                      key={pageNum}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor:
                            page >= pageNum ? "#60a5fa" : "#374151",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        {pageNum}
                      </div>
                      {pageNum < totalPages && (
                        <div
                          style={{
                            width: 40,
                            height: 2,
                            backgroundColor:
                              page > pageNum ? "#60a5fa" : "#374151",
                          }}
                        />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Page Title */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 24,
              color: "#9ca3af",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {page === 1 && "📋 Informasi Observasi"}
            {page === 2 && "👥 Personel & Pekerjaan"}
            {page === 3 && "✅ Checklist Observasi"}
            {page === 4 && "🔧 Tindakan Perbaikan"}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "#dc2626",
                color: "#ffffff",
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* Form Content */}
          <div
            style={{
              flex: 1,
              overflowY: "hidden",
              paddingRight: 8,
              marginBottom: 20,
            }}
          >
            {page === 1 && renderPage1()}
            {page === 2 && renderPage2()}
            {page === 3 && renderPage3()}
            {page === 4 && renderPage4()}
          </div>

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              padding: "12px 0",
              maxWidth: "800px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <button
              type="button"
              onClick={prevPage}
              disabled={page === 1}
              className="pto-nav-button"
              style={{
                background: page === 1 ? "#374151" : "#6b7280",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              ← Kembali
            </button>

            <div style={{ flex: 1, textAlign: "center" }}>
              <span
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  fontWeight: 500,
                }}
              >
                Halaman {page} dari {hasNegativeAnswers() ? 4 : 3}
              </span>
            </div>

            {page < 4 ? (
              <button
                type="button"
                onClick={nextPage}
                disabled={!validatePage()}
                className="pto-nav-button"
                style={{
                  background: validatePage() ? "#3b82f6" : "#374151",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {page === 3 && !hasNegativeAnswers()
                  ? "Simpan PTO"
                  : "Selanjutnya →"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !validatePage()}
                className="pto-nav-button"
                style={{
                  background:
                    submitting || !validatePage() ? "#374151" : "#3b82f6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {submitting ? "Menyimpan..." : "Simpan PTO"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PTOFormDesktop;

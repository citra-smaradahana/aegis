import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import "./UserForm.css";

const roleOptions = [
  { value: "user", label: "User" },
  { value: "evaluator", label: "Evaluator" },
  { value: "admin", label: "Admin" },
];

const jabatanOptions = [
  {
    value: "Penanggung Jawab Operasional",
    label: "Penanggung Jawab Operasional",
  },
  {
    value: "Asst. Penanggung Jawab Operasional",
    label: "Asst. Penanggung Jawab Operasional",
  },
  { value: "SHERQ Officer", label: "SHERQ Officer" },
  { value: "SHERQ Supervisor", label: "SHERQ Supervisor" },
  { value: "Technical Service", label: "Technical Service" },
  { value: "Field Leading Hand", label: "Field Leading Hand" },
  { value: "Plant Leading Hand", label: "Plant Leading Hand" },
  { value: "Operator MMU", label: "Operator MMU" },
  { value: "Operator Plant", label: "Operator Plant" },
  { value: "Mekanik", label: "Mekanik" },
  { value: "Crew", label: "Crew" },
  { value: "Admin", label: "Admin" },
  { value: "Blaster", label: "Blaster" },
  { value: "Quality Controller", label: "Quality Controller" },
];

const siteOptions = [
  { value: "Head Office", label: "Head Office" },
  { value: "Balikpapan", label: "Balikpapan" },
  { value: "ADRO", label: "ADRO" },
  { value: "AMMP", label: "AMMP" },
  { value: "BSIB", label: "BSIB" },
  { value: "GAMR", label: "GAMR" },
  { value: "HRSB", label: "HRSB" },
  { value: "HRSE", label: "HRSE" },
  { value: "PABB", label: "PABB" },
  { value: "PBRB", label: "PBRB" },
  { value: "PKJA", label: "PKJA" },
  { value: "PPAB", label: "PPAB" },
  { value: "PSMM", label: "PSMM" },
];

function UserForm({ user, onSubmit, onClose, loading }) {
  console.log("UserForm component rendered with props:", { user, loading });

  const [formData, setFormData] = useState({
    nama: "",
    nrp: "",
    email: "",
    password: "",
    jabatan: "",
    site: "",
    role: "user",
    foto: "",
    user: "", // Tambahkan field user yang required
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState({});
  const [componentError, setComponentError] = useState(null);

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState(null);

  const isEditing = !!user;

  useEffect(() => {
    try {
      console.log("UserForm useEffect triggered with user:", user);
      if (user) {
        const newFormData = {
          id: user.id,
          nama: user.nama || "",
          nrp: user.nrp || "",
          email: user.email || "",
          password: "", // Don't populate password for editing
          jabatan: user.jabatan || "",
          site: user.site || "",
          role: user.role || "user",
          foto: user.foto || "",
          user: user.user || "", // Tambahkan field user
        };
        console.log("Setting form data:", newFormData);
        setFormData(newFormData);
        setPhotoPreview(user.foto || "");
      }
    } catch (error) {
      console.error("Error in UserForm useEffect:", error);
      setComponentError("Terjadi kesalahan saat memuat data user");
    }
  }, [user]);

  // Cleanup URL object ketika komponen unmount
  useEffect(() => {
    return () => {
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }
    };
  }, [croppedPreviewUrl]);

  const handleInputChange = (field, value) => {
    try {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    } catch (error) {
      console.error("Error in handleInputChange:", error);
    }
  };

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
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.8
      );
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    // Store cropped area pixels for later use
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handlePhotoChange = (e) => {
    try {
      const file = e.target.files[0];
      if (file) {
        // Cleanup URL object sebelumnya jika ada
        if (croppedPreviewUrl) {
          URL.revokeObjectURL(croppedPreviewUrl);
          setCroppedPreviewUrl(null);
        }

        setOriginalImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoPreview(e.target.result);
          // Reset crop state untuk foto baru
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCroppedAreaPixels(null);
          setShowCropModal(true);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Error in handlePhotoChange:", error);
    }
  };

  const handleCropSave = async () => {
    try {
      if (!originalImage || !croppedAreaPixels) return;

      const croppedBlob = await getCroppedImg(photoPreview, croppedAreaPixels);

      const croppedFile = new File([croppedBlob], originalImage.name, {
        type: "image/jpeg",
      });

      // Update preview dengan hasil crop
      const newCroppedPreviewUrl = URL.createObjectURL(croppedBlob);

      // Cleanup URL object sebelumnya jika ada
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }

      setCroppedPreviewUrl(newCroppedPreviewUrl);
      setPhotoPreview(newCroppedPreviewUrl);
      setPhotoFile(croppedFile);
      setShowCropModal(false);
      // Tidak perlu reset crop state karena modal sudah ditutup
    } catch (error) {
      console.error("Error in handleCropSave:", error);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;

    try {
      setUploadingPhoto(true);
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `user-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("foto-karyawan")
        .upload(filePath, photoFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("foto-karyawan")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      throw new Error("Gagal mengupload foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateForm = () => {
    try {
      const newErrors = {};

      if (!formData.nama.trim()) {
        newErrors.nama = "Nama wajib diisi";
      }

      if (!formData.nrp.trim()) {
        newErrors.nrp = "NRP wajib diisi";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email wajib diisi";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Format email tidak valid";
      }

      if (!isEditing && !formData.password.trim()) {
        newErrors.password = "Password wajib diisi";
      }

      if (!formData.jabatan) {
        newErrors.jabatan = "Jabatan wajib dipilih";
      }

      if (!formData.site) {
        newErrors.site = "Site wajib dipilih";
      }

      if (!formData.user.trim()) {
        newErrors.user = "Username wajib diisi";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error("Error in validateForm:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("=== FORM SUBMIT DEBUG ===");
    console.log("Form submitted with data:", formData);
    console.log("Is editing:", isEditing);
    console.log("Original user:", user);

    try {
      if (!validateForm()) {
        console.log("Form validation failed");
        return;
      }

      let fotoUrl = formData.foto;

      if (photoFile) {
        fotoUrl = await uploadPhoto();
      }

      // Untuk edit, hanya kirim field yang berubah dan valid
      if (isEditing) {
        const originalUser = user;
        const changedFields = {};

        // Cek field mana yang berubah dan valid
        if (
          formData.nama &&
          formData.nama.trim() !== "" &&
          formData.nama !== originalUser.nama
        ) {
          changedFields.nama = formData.nama.trim();
        }

        if (
          formData.nrp &&
          formData.nrp.trim() !== "" &&
          formData.nrp !== originalUser.nrp
        ) {
          changedFields.nrp = formData.nrp.trim();
        }

        if (
          formData.email &&
          formData.email.trim() !== "" &&
          formData.email !== originalUser.email
        ) {
          changedFields.email = formData.email.trim();
        }

        if (
          formData.user &&
          formData.user.trim() !== "" &&
          formData.user !== originalUser.user
        ) {
          changedFields.user = formData.user.trim();
        }

        if (
          formData.jabatan &&
          formData.jabatan.trim() !== "" &&
          formData.jabatan !== originalUser.jabatan
        ) {
          changedFields.jabatan = formData.jabatan.trim();
        }

        if (
          formData.site &&
          formData.site.trim() !== "" &&
          formData.site !== originalUser.site
        ) {
          changedFields.site = formData.site.trim();
        }

        if (
          formData.role &&
          formData.role.trim() !== "" &&
          formData.role !== originalUser.role
        ) {
          changedFields.role = formData.role.trim();
        }

        if (fotoUrl !== originalUser.foto) {
          changedFields.foto = fotoUrl;
        }

        if (formData.password && formData.password.trim() !== "") {
          changedFields.password = formData.password.trim();
        }

        // Tambahkan id untuk identifikasi user
        changedFields.id = formData.id;

        console.log("Changed fields:", changedFields);

        // Pastikan ada field yang berubah (selain id)
        const fieldsToUpdate = Object.keys(changedFields).filter(
          (key) => key !== "id"
        );
        if (fieldsToUpdate.length === 0) {
          console.log("No fields changed, closing form");
          onClose();
          return;
        }

        console.log("Fields to update:", fieldsToUpdate);
        console.log("Changed fields data:", changedFields);

        await onSubmit(changedFields);
      } else {
        // Untuk add new user, kirim semua data
        const userData = {
          ...formData,
          foto: fotoUrl,
        };

        console.log("New user data:", userData);
        await onSubmit(userData);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setErrors({
        submit: error.message || "Terjadi kesalahan saat menyimpan user",
      });
    }
  };

  // Styles untuk card yang seragam dengan komponen lainnya
  const contentAreaStyle = {
    width: "100%",
    height: "100vh",
    background: "transparent",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "0 0 0 120px",
    overflow: "hidden",
  };

  const userFormCardStyle = {
    background: "transparent",
    borderRadius: 18,
    boxShadow: "none",
    padding: 16,
    maxWidth: 1100,
    width: "100%",
    margin: "0 auto",
    height: "auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    color: "#e5e7eb",
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: 16,
    marginTop: 0,
    padding: 0,
  };

  const titleStyle = {
    fontWeight: 900,
    fontSize: 28,
    color: "#60a5fa",
    margin: 0,
  };

  const fieldStyle = {
    width: "100%",
    marginBottom: 16,
  };

  const labelStyle = {
    fontWeight: 600,
    color: "#e5e7eb",
    marginBottom: 8,
    display: "block",
    fontSize: 16,
  };

  const inputStyle = {
    width: "100%",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
  };

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
  };

  const buttonStyle = {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginRight: 12,
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: "#6b7280",
  };

  const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    width: "100%",
    alignItems: "start",
  };

  const fullWidthRowStyle = { gridColumn: "1 / -1" };

  const columnStackStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const errorStyle = {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 4,
  };

  const photoPreviewStyle = {
    textAlign: "center",
    marginTop: 16,
  };

  const photoPreviewImageStyle = {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #60a5fa",
  };

  // Add CSS for hover effects
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .photo-container:hover .hover-text {
        opacity: 1 !important;
      }
      .photo-container:hover img {
        filter: brightness(0.7);
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Error boundary untuk mencegah crash
  if (componentError) {
    return (
      <div style={contentAreaStyle}>
        <div style={userFormCardStyle}>
          <div style={headerStyle}>
            <h2 style={titleStyle}>Error</h2>
          </div>
          <div style={{ padding: "20px", color: "#ef4444" }}>
            <p>{componentError}</p>
            <button style={buttonStyle} onClick={onClose}>
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={contentAreaStyle}>
      <div style={userFormCardStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            {isEditing ? "Edit User" : "Tambah User Baru"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <div style={formGridStyle}>
            {/* Kolom Kiri */}
            <div style={columnStackStyle}>
              {/* Nama */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Nama *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => handleInputChange("nama", e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                />
                {errors.nama && <div style={errorStyle}>{errors.nama}</div>}
              </div>

              {/* NRP */}
              <div style={fieldStyle}>
                <label style={labelStyle}>NRP *</label>
                <input
                  type="text"
                  value={formData.nrp}
                  onChange={(e) => handleInputChange("nrp", e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                />
                {errors.nrp && <div style={errorStyle}>{errors.nrp}</div>}
              </div>

              {/* Email */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                />
                {errors.email && <div style={errorStyle}>{errors.email}</div>}
              </div>

              {/* Username */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Username *</label>
                <input
                  type="text"
                  value={formData.user}
                  onChange={(e) => handleInputChange("user", e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                  placeholder="Masukkan username"
                />
                {errors.user && <div style={errorStyle}>{errors.user}</div>}
              </div>
            </div>

            {/* Kolom Kanan */}
            <div style={columnStackStyle}>
              {/* Password */}
              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Password {isEditing ? "" : "*"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  style={inputStyle}
                  disabled={loading}
                  placeholder={
                    isEditing ? "Kosongkan jika tidak ingin mengubah" : ""
                  }
                />
                {errors.password && (
                  <div style={errorStyle}>{errors.password}</div>
                )}
              </div>

              {/* Jabatan */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Jabatan *</label>
                <select
                  value={formData.jabatan}
                  onChange={(e) => handleInputChange("jabatan", e.target.value)}
                  style={selectStyle}
                  disabled={loading}
                >
                  <option value="">Pilih Jabatan</option>
                  {jabatanOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.jabatan && (
                  <div style={errorStyle}>{errors.jabatan}</div>
                )}
              </div>

              {/* Site */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Site *</label>
                <select
                  value={formData.site}
                  onChange={(e) => handleInputChange("site", e.target.value)}
                  style={selectStyle}
                  disabled={loading}
                >
                  <option value="">Pilih Site</option>
                  {siteOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.site && <div style={errorStyle}>{errors.site}</div>}
              </div>

              {/* Role */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  style={selectStyle}
                  disabled={loading}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Foto Profil - Full Width */}
            <div style={fullWidthRowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Foto Profil</label>
                <div style={{ textAlign: "center" }}>
                  <div
                    className="photo-container"
                    style={{
                      position: "relative",
                      display: "inline-block",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      // Trigger file input when photo is clicked
                      const fileInput = document.createElement("input");
                      fileInput.type = "file";
                      fileInput.accept = "image/*";
                      fileInput.onchange = (e) => handlePhotoChange(e);
                      fileInput.click();
                    }}
                  >
                    <img
                      src={
                        photoPreview ||
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iNjAiIGZpbGw9IiMzMzQxNTUiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI0MCIgeT0iNDAiPgo8cGF0aCBkPSJNMjAgMTBDMjIuNzYxNCAxMCAyNSAxMi4yMzg2IDI1IDE1QzI1IDE3Ljc2MTQgMjIuNzYxNCAyMCAyMCAyMEMxNy4yMzg2IDIwIDE1IDE3Ljc2MTQgMTUgMTVDMTUgMTIuMjM4NiAxNy4yMzg2IDEwIDIwIDEwWiIgZmlsbD0iIzljYTNhZiIvPgo8cGF0aCBkPSJNMzAgMzVIMTBDOC4zNDMxNSAzNSA3IDMzLjY1NjkgNyAzMlYyOEM3IDI2LjM0MzEgOC4zNDMxNSAyNSAxMCAyNUgxMEMxMS42NTY5IDI1IDEzIDI2LjM0MzEgMTMgMjhWMzJIMzBWMzVaIiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo8L3N2Zz4K"
                      }
                      alt="Foto Profil"
                      style={{
                        ...photoPreviewImageStyle,
                        border: "3px solid #60a5fa",
                        transition: "all 0.3s ease",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        opacity: 0,
                        transition: "opacity 0.3s ease",
                        pointerEvents: "none",
                      }}
                      className="hover-text"
                    >
                      Klik untuk ganti foto
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    Klik foto untuk mengganti gambar (JPG, PNG, GIF)
                  </div>
                </div>
              </div>
            </div>

            {/* Error / Success - Full Width */}
            {errors.submit && (
              <div
                style={{
                  ...fullWidthRowStyle,
                  color: "#ef4444",
                  fontWeight: 700,
                  marginTop: 8,
                  background: "#fee2e2",
                  borderRadius: 8,
                  padding: 8,
                  border: "1.5px solid #ef4444",
                  fontSize: 16,
                }}
              >
                {errors.submit}
              </div>
            )}

            {/* Tombol Submit - Full Width */}
            <div
              style={{
                ...fullWidthRowStyle,
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginTop: 24,
              }}
            >
              <button type="submit" disabled={loading} style={buttonStyle}>
                {loading
                  ? "Menyimpan..."
                  : isEditing
                    ? "Update User"
                    : "Simpan User"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={cancelButtonStyle}
              >
                Batal
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Crop Foto</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowCropModal(false)}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  position: "relative",
                  height: "400px",
                  background: "#333",
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
                />
              </div>
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleCropSave}
                  style={{
                    background: "#60a5fa",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  Simpan Crop
                </button>
                <button
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  style={{
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserForm;

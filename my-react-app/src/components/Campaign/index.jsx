import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_NAME = "campaign-images";

function Campaign({ user, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({ judul: "", deskripsi: "", image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setCampaigns(data || []);
    } catch (err) {
      setError(err?.message || "Gagal memuat kampanye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openAddForm = () => {
    setEditingCampaign(null);
    setFormData({ judul: "", deskripsi: "", image: null });
    setImagePreview(null);
    setShowForm(true);
    setError(null);
  };

  const openEditForm = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      judul: campaign.judul || "",
      deskripsi: campaign.deskripsi || "",
      image: null,
    });
    setImagePreview(campaign.image_url || null);
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCampaign(null);
    setFormData({ judul: "", deskripsi: "", image: null });
    setImagePreview(null);
    setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file) => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `campaign-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, { upsert: false });
    if (uploadErr) throw uploadErr;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.judul.trim()) {
      setError("Judul wajib diisi");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = editingCampaign?.image_url || null;
      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
      }
      const payload = {
        judul: formData.judul.trim(),
        deskripsi: formData.deskripsi.trim() || null,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };
      if (editingCampaign) {
        const { error: err } = await supabase
          .from("campaigns")
          .update(payload)
          .eq("id", editingCampaign.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("campaigns").insert(payload);
        if (err) throw err;
      }
      closeForm();
      fetchCampaigns();
    } catch (err) {
      setError(err?.message || "Gagal menyimpan kampanye");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus kampanye ini?")) return;
    try {
      const { error: err } = await supabase.from("campaigns").delete().eq("id", id);
      if (err) throw err;
      fetchCampaigns();
    } catch (err) {
      setError(err?.message || "Gagal menghapus");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
        Memuat kampanye...
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        width: "100%",
        padding: "40px 20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#60a5fa", margin: 0 }}>
          Campaign
        </h2>
        <button
          onClick={openAddForm}
          style={{
            padding: "10px 20px",
            background: "#60a5fa",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Tambah Kampanye
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: "#7f1d1d",
            color: "#fecaca",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {campaigns.length === 0 ? (
          <div
            style={{
              background: "#1f2937",
              border: "1px dashed #374151",
              borderRadius: 12,
              padding: 48,
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            Belum ada kampanye. Klik "Tambah Kampanye" untuk menambah.
          </div>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.id}
              style={{
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: 12,
                padding: 20,
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
              }}
            >
              {c.image_url && (
                <img
                  src={c.image_url}
                  alt={c.judul}
                  style={{
                    width: 120,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#e5e7eb", fontSize: 16, marginBottom: 6 }}>
                  {c.judul}
                </div>
                {c.deskripsi && (
                  <div style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.5 }}>
                    {c.deskripsi}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openEditForm(c)}
                  style={{
                    padding: "8px 14px",
                    background: "#374151",
                    color: "#e5e7eb",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{
                    padding: "8px 14px",
                    background: "#7f1d1d",
                    color: "#fecaca",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={closeForm}
        >
          <div
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb", fontSize: 18 }}>
              {editingCampaign ? "Edit Kampanye" : "Tambah Kampanye"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, color: "#9ca3af", fontSize: 14 }}>
                  Judul *
                </label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={(e) => setFormData((prev) => ({ ...prev, judul: e.target.value }))}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#e5e7eb",
                    fontSize: 14,
                  }}
                  placeholder="Judul kampanye"
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, color: "#9ca3af", fontSize: 14 }}>
                  Deskripsi
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deskripsi: e.target.value }))}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#e5e7eb",
                    fontSize: 14,
                    resize: "vertical",
                  }}
                  placeholder="Deskripsi kampanye"
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 6, color: "#9ca3af", fontSize: 14 }}>
                  Gambar
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ color: "#9ca3af", fontSize: 14 }}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      marginTop: 12,
                      maxWidth: 200,
                      maxHeight: 120,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                )}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    padding: "10px 20px",
                    background: "#374151",
                    color: "#e5e7eb",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    background: saving ? "#6b7280" : "#60a5fa",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Campaign;

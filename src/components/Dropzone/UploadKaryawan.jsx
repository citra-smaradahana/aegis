import React, { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImageUtil';
import './Dropzone.css';

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const roleOptions = [
  { value: 'user', label: 'user' },
  { value: 'evaluator', label: 'evaluator' },
  { value: 'admin', label: 'admin' },
];

const jabatanOptions = [
  {
    value: 'Penanggung Jawab Operasional',
    label: 'Penanggung Jawab Operasional',
  },
  {
    value: 'Asst. Penanggung Jawab Operasional',
    label: 'Asst. Penanggung Jawab Operasional',
  },
  { value: 'SHERQ Officer', label: 'SHERQ Officer' },
  { value: 'SHERQ System & Compliance Officer', label: 'SHERQ System & Compliance Officer' },
  { value: 'Technical Service', label: 'Technical Service' },
  { value: 'Field Leading Hand', label: 'Field Leading Hand' },
  { value: 'Plant Leading Hand', label: 'Plant Leading Hand' },
  { value: 'Operator MMU', label: 'Operator MMU' },
  { value: 'Operator Plant', label: 'Operator Plant' },
  { value: 'Operator WOPP', label: 'Operator WOPP' },
  { value: 'Mekanik', label: 'Mekanik' },
  { value: 'Crew', label: 'Crew' },
  { value: 'Administrator', label: 'Administrator' },
  { value: 'Admin Site Project', label: 'Admin Site Project' },
  { value: 'Blaster', label: 'Blaster' },
  { value: 'Quality Controller', label: 'Quality Controller' },
  { value: 'Training & Development Specialist', label: 'Training & Development Specialist' },
];

const siteOptions = [
  { value: 'Head Office', label: 'Head Office' },
  { value: 'Balikpapan', label: 'Balikpapan' },
  { value: 'ADRO', label: 'ADRO' },
  { value: 'AMMP', label: 'AMMP' },
  { value: 'BSIB', label: 'BSIB' },
  { value: 'GAMR', label: 'GAMR' },
  { value: 'HRSB', label: 'HRSB' },
  { value: 'HRSE', label: 'HRSE' },
  { value: 'PABB', label: 'PABB' },
  { value: 'PBRB', label: 'PBRB' },
  { value: 'PKJA', label: 'PKJA' },
  { value: 'PPAB', label: 'PPAB' },
  { value: 'PSMM', label: 'PSMM' },
  { value: 'REBH', label: 'REBH' },
  { value: 'RMTU', label: 'RMTU' },
  { value: 'PMTU', label: 'PMTU' },
];

function UploadKaryawan() {
  const [form, setForm] = useState({
    nama: '',
    nrp: '',
    user: '',
    email: '',
    password: '',
    jabatan: '',
    site: '',
    role: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const fileInputRef = React.useRef();
  const defaultAvatar =
    'https://ui-avatars.com/api/?name=Foto&background=ddd&color=555';

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    setUploadError(null);
    const file = e.target.files[0];
    if (file) {
      setRawImage(URL.createObjectURL(file));
      setShowCrop(true);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowCrop(false);
      setRawImage(null);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(rawImage, croppedAreaPixels);
      setSelectedFile(
        new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' })
      );
      setPreviewUrl(URL.createObjectURL(croppedBlob));
      setShowCrop(false);
      setRawImage(null);
    } catch {
      setUploadError('Gagal crop foto');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    setSubmitSuccess(false);
    let fotoUrl = '';
    try {
      // Validasi: pastikan hasil crop sudah ada
      if (!selectedFile) {
        setUploadError(
          'Foto belum dipilih atau belum di-crop. Silakan pilih file dan klik Simpan Crop.'
        );
        setUploading(false);
        return;
      }
      console.log(
        'selectedFile:',
        selectedFile,
        selectedFile.size,
        selectedFile.type
      );
      // Upload hasil crop (selectedFile) ke bucket foto-karyawan
      const cleanName = sanitizeFileName(selectedFile.name);
      const filePath = `${Date.now()}-${cleanName}`;
      const { error } = await supabase.storage
        .from('foto-karyawan')
        .upload(filePath, selectedFile);
      if (error) {
        setUploadError(error.message);
        console.error('Upload foto error:', error.message);
        setUploading(false);
        return;
      }
      const { data } = supabase.storage
        .from('foto-karyawan')
        .getPublicUrl(filePath);
      fotoUrl = data.publicUrl;
      await supabase.from('users').insert([
        {
          nama: form.nama,
          nrp: form.nrp,
          user: form.user,
          email: form.email,
          password: form.password,
          jabatan: form.jabatan,
          site: form.site,
          role: form.role,
          foto: fotoUrl,
        },
      ]);
      setSubmitSuccess(true);
      setForm({
        nama: '',
        nrp: '',
        user: '',
        email: '',
        password: '',
        jabatan: '',
        site: '',
        role: '',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setUploadError(err.message);
      console.error('Submit error:', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: 900,
          height: 650,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          padding: '32px 32px 48px 32px',
          position: 'relative',
        }}
      >
        <h2
          style={{
            fontSize: '2em',
            marginBottom: 24,
            fontWeight: 700,
            letterSpacing: '-1px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          Tambah Akun
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'grid',
              width: '100%',
              gridTemplateColumns: '1fr 1fr',
              gap: 32,
              marginBottom: 24,
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label
                style={{ width: '100%', marginBottom: 4, fontWeight: 500 }}
              >
                Nama Karyawan
                <input
                  type="text"
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  required
                  style={{
                    marginBottom: 0,
                    padding: '10px 14px',
                    minWidth: 300,
                    width: '100%',
                    flex: 1,
                    maxWidth: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#374151',
                  }}
                />
              </label>
              <label
                style={{ width: '100%', marginBottom: 4, fontWeight: 500 }}
              >
                NRP
                <input
                  type="text"
                  name="nrp"
                  value={form.nrp}
                  onChange={handleChange}
                  required
                  style={{
                    marginBottom: 0,
                    padding: '10px 14px',
                    minWidth: 300,
                    width: '100%',
                    flex: 1,
                    maxWidth: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#374151',
                  }}
                />
              </label>
              <label
                style={{ width: '100%', marginBottom: 4, fontWeight: 500 }}
              >
                User
                <input
                  type="text"
                  name="user"
                  value={form.user}
                  onChange={handleChange}
                  required
                  style={{
                    marginBottom: 0,
                    padding: '10px 14px',
                    minWidth: 300,
                    width: '100%',
                    flex: 1,
                    maxWidth: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#374151',
                  }}
                />
              </label>
              <label
                style={{ width: '100%', marginBottom: 4, fontWeight: 500 }}
              >
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{
                    marginBottom: 0,
                    padding: '10px 14px',
                    minWidth: 300,
                    width: '100%',
                    flex: 1,
                    maxWidth: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#374151',
                  }}
                />
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label
                style={{ width: '100%', marginBottom: 4, fontWeight: 500 }}
              >
                Password
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{
                    marginBottom: 0,
                    padding: '10px 14px',
                    minWidth: 300,
                    width: '100%',
                    flex: 1,
                    maxWidth: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#374151',
                  }}
                />
              </label>
              <label
                style={{ width: '100%', marginBottom: 4, fontWeight: 500 }}
              >
                Jabatan
                <select
                  name="jabatan"
                  value={form.jabatan}
                  onChange={handleChange}
                  required
                  style={{
                    marginBottom: 0,
                    padding: '10px 14px',
                    minWidth: 300,
                    width: '100%',
                    flex: 1,
                    maxWidth: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Pilih Jabatan</option>
                  {jabatanOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                style={{ width: '100%', marginBottom: 4, fontWeight: 500 }}
              >
                Site
                <select
                  name="site"
                  value={form.site}
                  onChange={handleChange}
                  required
                  style={{
                    marginBottom: 0,
                    padding: '10px 14px',
                    minWidth: 300,
                    width: '100%',
                    flex: 1,
                    maxWidth: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Pilih Site</option>
                  {siteOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                style={{ width: '100%', marginBottom: 4, fontWeight: 500 }}
              >
                Role
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                  style={{
                    marginBottom: 0,
                    padding: '10px 14px',
                    minWidth: 300,
                    width: '100%',
                    flex: 1,
                    maxWidth: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Pilih Role</option>
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div
            style={{
              gridColumn: '1/3',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              gap: 32,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 260,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 12,
              }}
            >
              <label
                style={{
                  width: 260,
                  marginBottom: 4,
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                Foto Karyawan
              </label>
              <div style={{ marginBottom: 8 }}>
                <img
                  src={previewUrl || defaultAvatar}
                  alt="Preview"
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    background: '#eee',
                  }}
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                  title="Klik untuk pilih/ganti foto"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={uploading}
            style={{
              width: '100%',
              margin: '0',
              alignSelf: 'stretch',
              marginTop: 'auto',
            }}
          >
            {uploading ? 'Uploading...' : 'Tambah Akun'}
          </button>
          {uploadError && (
            <p style={{ color: 'red', textAlign: 'center' }}>
              Error: {uploadError}
            </p>
          )}
          {submitSuccess && (
            <p style={{ color: 'green', textAlign: 'center' }}>
              Akun berhasil ditambahkan!
            </p>
          )}
        </form>
        {/* Modal Cropper di luar card agar selalu center viewport */}
        {showCrop && rawImage && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.5)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
              padding: 0,
            }}
          >
            <div
              style={{
                background: '#232946',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: 0,
              }}
            >
              <div
                style={{
                  width: 300,
                  height: 300,
                  background: '#222',
                  position: 'relative',
                  margin: 0,
                  padding: 0,
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
                />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCrop(false);
                    setRawImage(null);
                  }}
                  style={{
                    background: '#232946',
                    color: '#fff',
                    border: '1.5px solid #6366f1',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  style={{
                    background:
                      'linear-gradient(90deg, #6366f1 60%, #06b6d4 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Simpan Crop
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadKaryawan;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './UserForm.css';

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'evaluator', label: 'Evaluator' },
  { value: 'admin', label: 'Admin' },
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
  { value: 'SHERQ Supervisor', label: 'SHERQ Supervisor' },
  { value: 'Technical Service', label: 'Technical Service' },
  { value: 'Leading Hand', label: 'Leading Hand' },
  { value: 'Operator MMU', label: 'Operator MMU' },
  { value: 'Operator Plant', label: 'Operator Plant' },
  { value: 'Mekanik', label: 'Mekanik' },
  { value: 'Crew', label: 'Crew' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Blaster', label: 'Blaster' },
  { value: 'Quality Controller', label: 'Quality Controller' },
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
];

function UserForm({ user, onSubmit, onClose, loading }) {
  console.log('UserForm component rendered with props:', { user, loading });

  const [formData, setFormData] = useState({
    nama: '',
    nrp: '',
    email: '',
    password: '',
    jabatan: '',
    site: '',
    role: 'user',
    foto: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState({});
  const [componentError, setComponentError] = useState(null);

  const isEditing = !!user;

  useEffect(() => {
    try {
      console.log('UserForm useEffect triggered with user:', user);
      if (user) {
        const newFormData = {
          id: user.id,
          nama: user.nama || '',
          nrp: user.nrp || '',
          email: user.email || '',
          password: '', // Don't populate password for editing
          jabatan: user.jabatan || '',
          site: user.site || '',
          role: user.role || 'user',
          foto: user.foto || '',
        };
        console.log('Setting form data:', newFormData);
        setFormData(newFormData);
        setPhotoPreview(user.foto || '');
      }
    } catch (error) {
      console.error('Error in UserForm useEffect:', error);
      setComponentError('Terjadi kesalahan saat memuat data user');
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    try {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: '',
        }));
      }
    } catch (error) {
      console.error('Error in handleInputChange:', error);
    }
  };

  const handlePhotoChange = e => {
    try {
      const file = e.target.files[0];
      if (file) {
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = e => {
          setPhotoPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error in handlePhotoChange:', error);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;

    try {
      setUploadingPhoto(true);
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `user-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, photoFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Gagal mengupload foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateForm = () => {
    try {
      const newErrors = {};

      if (!formData.nama.trim()) {
        newErrors.nama = 'Nama wajib diisi';
      }

      if (!formData.nrp.trim()) {
        newErrors.nrp = 'NRP wajib diisi';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email wajib diisi';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Format email tidak valid';
      }

      if (!isEditing && !formData.password.trim()) {
        newErrors.password = 'Password wajib diisi';
      }

      if (!formData.jabatan) {
        newErrors.jabatan = 'Jabatan wajib dipilih';
      }

      if (!formData.site) {
        newErrors.site = 'Site wajib dipilih';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error('Error in validateForm:', error);
      return false;
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('Form submitted with data:', formData);
    console.log('Is editing:', isEditing);
    console.log('Original user:', user);

    try {
      if (!validateForm()) {
        console.log('Form validation failed');
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
          formData.nama.trim() !== '' &&
          formData.nama !== originalUser.nama
        ) {
          changedFields.nama = formData.nama.trim();
        }

        if (
          formData.nrp &&
          formData.nrp.trim() !== '' &&
          formData.nrp !== originalUser.nrp
        ) {
          changedFields.nrp = formData.nrp.trim();
        }

        if (
          formData.email &&
          formData.email.trim() !== '' &&
          formData.email !== originalUser.email
        ) {
          changedFields.email = formData.email.trim();
        }

        if (
          formData.jabatan &&
          formData.jabatan.trim() !== '' &&
          formData.jabatan !== originalUser.jabatan
        ) {
          changedFields.jabatan = formData.jabatan.trim();
        }

        if (
          formData.site &&
          formData.site.trim() !== '' &&
          formData.site !== originalUser.site
        ) {
          changedFields.site = formData.site.trim();
        }

        if (
          formData.role &&
          formData.role.trim() !== '' &&
          formData.role !== originalUser.role
        ) {
          changedFields.role = formData.role.trim();
        }

        if (fotoUrl !== originalUser.foto) {
          changedFields.foto = fotoUrl;
        }

        if (formData.password && formData.password.trim() !== '') {
          changedFields.password = formData.password.trim();
        }

        // Tambahkan id untuk identifikasi user
        changedFields.id = formData.id;

        console.log('Changed fields:', changedFields);

        // Pastikan ada field yang berubah (selain id)
        const fieldsToUpdate = Object.keys(changedFields).filter(
          key => key !== 'id'
        );
        if (fieldsToUpdate.length === 0) {
          console.log('No fields changed, closing form');
          onClose();
          return;
        }

        console.log('Fields to update:', fieldsToUpdate);
        console.log('Changed fields data:', changedFields);

        await onSubmit(changedFields);
      } else {
        // Untuk add new user, kirim semua data
        const userData = {
          ...formData,
          foto: fotoUrl,
        };

        console.log('New user data:', userData);
        await onSubmit(userData);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setErrors({
        submit: error.message || 'Terjadi kesalahan saat menyimpan user',
      });
    }
  };

  // Error boundary untuk mencegah crash
  if (componentError) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>Error</h2>
            <button type="button" className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div style={{ padding: '20px', color: 'red' }}>
            <p>{componentError}</p>
            <button onClick={onClose}>Tutup</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit User' : 'Tambah User Baru'}</h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nama">Nama *</label>
              <input
                type="text"
                id="nama"
                value={formData.nama}
                onChange={e => handleInputChange('nama', e.target.value)}
                className={errors.nama ? 'error' : ''}
                disabled={loading}
              />
              {errors.nama && <span className="error-text">{errors.nama}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="nrp">NRP *</label>
              <input
                type="text"
                id="nrp"
                value={formData.nrp}
                onChange={e => handleInputChange('nrp', e.target.value)}
                className={errors.nrp ? 'error' : ''}
                disabled={loading}
              />
              {errors.nrp && <span className="error-text">{errors.nrp}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
                disabled={loading}
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password {isEditing ? '' : '*'}</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                className={errors.password ? 'error' : ''}
                disabled={loading}
                placeholder={
                  isEditing ? 'Kosongkan jika tidak ingin mengubah' : ''
                }
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="jabatan">Jabatan *</label>
              <select
                id="jabatan"
                value={formData.jabatan}
                onChange={e => handleInputChange('jabatan', e.target.value)}
                className={errors.jabatan ? 'error' : ''}
                disabled={loading}
              >
                <option value="">Pilih Jabatan</option>
                {jabatanOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.jabatan && (
                <span className="error-text">{errors.jabatan}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="site">Site *</label>
              <select
                id="site"
                value={formData.site}
                onChange={e => handleInputChange('site', e.target.value)}
                className={errors.site ? 'error' : ''}
                disabled={loading}
              >
                <option value="">Pilih Site</option>
                {siteOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.site && <span className="error-text">{errors.site}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={formData.role}
                onChange={e => handleInputChange('role', e.target.value)}
                disabled={loading}
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Foto Profil Section */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="photo">Foto Profil</label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={loading || uploadingPhoto}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <small
                style={{
                  color: '#666',
                  fontSize: '12px',
                  marginTop: '5px',
                  display: 'block',
                }}
              >
                Pilih file gambar (JPG, PNG, GIF) untuk foto profil karyawan
              </small>
              {uploadingPhoto && (
                <span className="uploading-text">Mengupload foto...</span>
              )}
            </div>
          </div>

          {/* Photo Preview */}
          {photoPreview && (
            <div
              className="photo-preview"
              style={{
                margin: '15px 20px',
                textAlign: 'center',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                Preview Foto:
              </h4>
              <img
                src={photoPreview}
                alt="Preview"
                style={{
                  maxWidth: '150px',
                  maxHeight: '150px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              />
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || uploadingPhoto}
            >
              {loading
                ? 'Menyimpan...'
                : isEditing
                  ? 'Update User'
                  : 'Tambah User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserForm;

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../../supabaseClient';
import './Dropzone.css';

function DropzoneKaryawan() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const onDrop = async acceptedFiles => {
    setUploadError(null);
    setUploading(true);
    const uploaded = [];
    for (const file of acceptedFiles) {
      const filePath = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('foto-karyawan')
        .upload(filePath, file);
      if (error) {
        setUploadError(error.message);
      } else {
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('foto-karyawan')
          .getPublicUrl(filePath);
        uploaded.push({ name: file.name, url: publicUrlData.publicUrl });
      }
    }
    setUploadedFiles(prev => [...prev, ...uploaded]);
    setUploading(false);
  };

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({ onDrop, accept: { 'image/*': [] } });

  return (
    <div className="dropzone-container" {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop employee photos here ...</p>
      ) : (
        <p>
          Drag 'n' drop employee photos here, or click to select files (image
          only)
        </p>
      )}
      {uploading && <p>Uploading...</p>}
      {uploadError && <p style={{ color: 'red' }}>Error: {uploadError}</p>}
      <aside>
        <h4>Files to upload</h4>
        <ul>
          {acceptedFiles.map(file => (
            <li key={file.path || file.name}>
              {file.path || file.name} - {file.size} bytes
            </li>
          ))}
        </ul>
        <h4>Uploaded Photos</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {uploadedFiles.map((file, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <img
                src={file.url}
                alt={file.name}
                style={{
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                }}
              />
              <div style={{ fontSize: 12 }}>{file.name}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default DropzoneKaryawan;

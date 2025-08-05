import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import './Dropzone.css';

function Dropzone({ onFilesChange }) {
  const [previews, setPreviews] = useState([]);

  const onDrop = acceptedFiles => {
    setPreviews(
      acceptedFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }))
    );
    if (onFilesChange) onFilesChange(acceptedFiles);
  };

  useEffect(() => {
    // Clean up previews on unmount
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      className="dropzone-container"
      style={{ width: '100%', maxWidth: '100%' }}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
      {previews.length > 0 && (
        <div style={{ margin: '16px 0', display: 'flex', gap: 12 }}>
          {previews.map((file, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <img
                src={file.url}
                alt={file.name}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                }}
              />
              <div style={{ fontSize: 12 }}>{file.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dropzone;

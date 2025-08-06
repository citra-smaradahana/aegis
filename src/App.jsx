import React from 'react';
import './App.css';

function App() {
  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #181c2f 0%, #232946 100%)',
      }}
    >
      <h1 style={{ color: 'white', marginBottom: '20px' }}>
        AEGIS KMB - Safety Management System
      </h1>
      <p style={{ color: 'white' }}>Aplikasi berhasil di-deploy! 🎉</p>
      <p style={{ color: '#6366f1', fontSize: '14px', marginTop: '10px' }}>
        Timestamp: {new Date().toLocaleString()}
      </p>
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('user', user)
      .eq('password', password)
      .single();
    setLoading(false);
    if (queryError || !data) {
      setError('User atau Password salah!');
    } else {
      onLogin(data);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #254188 0%, #ff6b35 100%)',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #254188 0%, #ff6b35 100%)',
            borderRadius: '50%',
            opacity: 0.1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #254188 0%, #ff6b35 100%)',
            borderRadius: '50%',
            opacity: 0.1,
          }}
        />

        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontWeight: 700,
              fontSize: '32px',
              color: '#254188',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px',
            }}
          >
            aegis
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
            Safety Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                fontWeight: 600,
                color: '#374151',
                fontSize: '14px',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                value={user}
                onChange={e => setUser(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  background: '#f9fafb',
                  boxSizing: 'border-box',
                  height: '56px',
                }}
                placeholder="Masukkan Username"
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontWeight: 600,
                color: '#374151',
                fontSize: '14px',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  background: '#f9fafb',
                  boxSizing: 'border-box',
                  height: '56px',
                }}
                placeholder="Masukkan Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #254188 0%, #ff6b35 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              height: '56px',
              boxShadow: '0 4px 12px rgba(37, 65, 136, 0.3)',
            }}
          >
            {loading ? 'Loading...' : 'LOGIN'}
          </button>

          {error && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#bf1e24',
                textAlign: 'center',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #f3f4f6',
          }}
        >
          <p
            style={{
              color: '#9ca3af',
              fontSize: '12px',
              margin: '0 0 4px 0',
              fontWeight: 500,
            }}
          >
            Powered by PT Kemitraan MNK BME
          </p>
          <p
            style={{
              color: '#9ca3af',
              fontSize: '11px',
              margin: 0,
              fontWeight: 400,
            }}
          >
            AEGIS-v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

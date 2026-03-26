import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import API_BASE_URL from '../config';

const API_BASE = `${API_BASE_URL}/auth`;

const Login = ({ setIsAuthenticated }) => {
  const { role: routeRole } = useParams();
  const defaultRole = routeRole === 'patient' ? 'PATIENT' : 'DOCTOR';
  const isDoctor = defaultRole === 'DOCTOR';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const accent = isDoctor ? '#2a8c5a' : '#2a7d9c';
  const accentLight = isDoctor ? 'rgba(72,187,120,0.1)' : 'rgba(79,169,195,0.1)';
  const emoji = isDoctor ? '🩺' : '🧑‍🦽';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;

      if (isRegister) {
        response = await axios.post(`${API_BASE}/register`, {
          email: email.trim(),
          password: password.trim(),
          role: defaultRole,
          name: name.trim(),
        });
      } else {
        response = await axios.post(`${API_BASE}/login`, {
          email: email.trim(),
          password: password.trim(),
        });
      }

      console.log('FULL auth response:', response.data);

      const token =
        response.data?.token ||
        response.data?.jwt ||
        response.data?.accessToken ||
        response.data?.access_token ||
        '';

      const userId =
        response.data?.id ||
        response.data?.userId ||
        response.data?.doctorId ||
        response.data?.patientId ||
        '';

      const role = response.data?.role || defaultRole;
      const userName = response.data?.name || name.trim() || '';

      if (!token) {
        throw new Error('No token received from backend');
      }

      localStorage.clear();
      localStorage.setItem('token', token);
      localStorage.setItem('userId', String(userId));
      localStorage.setItem('role', role);
      localStorage.setItem('name', userName);
      localStorage.setItem('email', email.trim());

      console.log('Stored token:', localStorage.getItem('token'));
      console.log('Stored userId:', localStorage.getItem('userId'));
      console.log('Stored role:', localStorage.getItem('role'));

      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login/Register error:', err);
      console.error('Backend error body:', err.response?.data);

      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.';

      setError(errorMsg);
      localStorage.clear();
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f7f9 0%, #e8f4ee 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: 20,
    },
    card: {
      background: '#ffffff',
      borderRadius: 20,
      padding: '48px 40px',
      width: '100%',
      maxWidth: 420,
      boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      border: `1px solid ${accentLight}`,
    },
    header: { textAlign: 'center', marginBottom: 36 },
    emojiCircle: {
      width: 80,
      height: 80,
      borderRadius: '50%',
      background: accentLight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 36,
      margin: '0 auto 16px',
      border: `2px solid ${accent}30`,
    },
    title: { fontSize: 26, fontWeight: '700', color: '#1a3a4a', margin: '0 0 6px' },
    subtitle: { fontSize: 14, color: '#7a9aaa', margin: '0 0 12px' },
    badge: {
      display: 'inline-block',
      padding: '4px 14px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      background: accentLight,
      color: accent,
      border: `1px solid ${accent}40`,
    },
    fieldGroup: { marginBottom: 18 },
    label: {
      display: 'block',
      fontSize: 12,
      fontWeight: '600',
      color: '#4a6a7a',
      marginBottom: 6,
      letterSpacing: '0.3px',
    },
    input: {
      width: '100%',
      padding: '11px 14px',
      background: '#f8fbfc',
      border: '1.5px solid #dce8ed',
      borderRadius: 10,
      color: '#1a3a4a',
      fontSize: 15,
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease',
      fontFamily: 'inherit',
    },
    submitBtn: {
      width: '100%',
      padding: '13px',
      background: accent,
      color: '#fff',
      border: 'none',
      borderRadius: 10,
      fontSize: 15,
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.75 : 1,
      marginTop: 8,
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      letterSpacing: '0.3px',
    },
    switchBtn: {
      width: '100%',
      padding: '12px',
      background: 'transparent',
      color: accent,
      border: `1.5px solid ${accent}40`,
      borderRadius: 10,
      fontSize: 14,
      cursor: 'pointer',
      marginTop: 10,
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
    },
    backBtn: {
      width: '100%',
      padding: '11px',
      background: 'transparent',
      color: '#9ab5c0',
      border: '1.5px solid #dce8ed',
      borderRadius: 10,
      fontSize: 13,
      cursor: 'pointer',
      marginTop: 10,
      fontFamily: 'inherit',
    },
    error: {
      background: '#fff5f5',
      border: '1px solid #fcc',
      color: '#c0392b',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
      marginBottom: 16,
    },
    divider: { height: 1, background: '#eaf1f4', margin: '24px 0' },
    appName: {
      textAlign: 'center',
      fontSize: 13,
      color: '#9ab5c0',
      marginBottom: 24,
      fontWeight: '600',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
  };

  return (
    <>
      <style>{`
        input:focus { border-color: ${accent} !important; box-shadow: 0 0 0 3px ${accentLight}; }
        input::placeholder { color: #b0c8d4; }
      `}</style>

      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.appName}>🧠 Cerebro Connect</div>

          <div style={styles.header}>
            <div style={styles.emojiCircle}>{emoji}</div>
            <h1 style={styles.title}>
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p style={styles.subtitle}>
              {isRegister ? 'Register to get started' : 'Sign in to continue'}
            </p>
            <span style={styles.badge}>{defaultRole}</span>
          </div>

          {error && <div style={styles.error}>⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>

            <div style={styles.divider} />

            <button
              type="button"
              style={styles.switchBtn}
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account? Register"}
            </button>

            <button
              type="button"
              style={styles.backBtn}
              onClick={() => navigate('/')}
            >
              ← Back to home
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
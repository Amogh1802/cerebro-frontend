/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import EEGMonitor from './EEGMonitor';

const API_BASE = API_BASE_URL;

const Dashboard = () => {
  const navigate = useNavigate();

  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const isDoctor = role === 'DOCTOR';

  const [patients, setPatients] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [eegSessions, setEegSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEEGMonitor, setShowEEGMonitor] = useState(false);
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [eegMode, setEegMode] = useState('GENERAL');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const accent = isDoctor ? '#2a8c5a' : '#2a7d9c';

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }),
    [token]
  );

  const handleAuthError = (err, fallbackMessage) => {
    console.error(fallbackMessage, err);
    console.error('Response body:', err?.response?.data);

    if (err?.response?.status === 401 || err?.response?.status === 403) {
      setError('Session expired. Please login again.');
      setTimeout(() => {
        localStorage.clear();
        navigate('/');
      }, 1200);
      return;
    }

    setError(fallbackMessage);
  };

  useEffect(() => {
    if (!token || !userId || !role) {
      navigate('/');
      return;
    }

    if (isDoctor) {
      fetchPatients();
    } else {
      fetchMyEEGSessions();
    }
  }, []);

  useEffect(() => {
    if (patients.length > 0 && isDoctor) {
      fetchAllSessions(patients);
    }
  }, [patients, isDoctor]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_BASE}/patients/doctor/${userId}`, authHeaders);
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      handleAuthError(err, 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSessions = async (patientList) => {
    try {
      setError('');
      const list = patientList || patients;
      const sessionPromises = list.map((p) =>
        axios
          .get(`${API_BASE}/eeg/sessions/${p.id}`, authHeaders)
          .then((res) => res.data)
          .catch(() => [])
      );
      const results = await Promise.all(sessionPromises);
      setAllSessions(results.flat());
    } catch (err) {
      handleAuthError(err, 'Failed to fetch sessions.');
    }
  };

  const fetchMyEEGSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_BASE}/eeg/sessions/${userId}`, authHeaders);
      setEegSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      handleAuthError(err, 'Failed to load your sessions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedPatients = async () => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE}/users/patients`, authHeaders);
      const assignedIds = patients.map((p) => p.id);
      const unassigned = (Array.isArray(res.data) ? res.data : []).filter(
        (p) => !assignedIds.includes(p.id)
      );
      setUnassignedPatients(unassigned);
      setShowAssignModal(true);
    } catch (err) {
      handleAuthError(err, 'Failed to load patients list.');
    }
  };

  const handleAssignPatient = async (patientId) => {
    try {
      setError('');
      await axios.post(
        `${API_BASE}/patients/assign`,
        { patientId, doctorId: parseInt(userId, 10) },
        authHeaders
      );
      setShowAssignModal(false);
      setSuccessMsg('Patient assigned successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchPatients();
    } catch (err) {
      handleAuthError(err, 'Failed to assign patient.');
    }
  };

  // FIXED: Now refreshes session count after starting a session
  const handleStartSession = async () => {
    try {
      setError('');
      await axios.post(
        `${API_BASE}/eeg/session`,
        {
          patientId: selectedPatient.id,
          mode: eegMode,
          notes: `${eegMode} EEG session started by Dr. ${name}`,
        },
        authHeaders
      );

      setShowSessionModal(false);
      setShowEEGMonitor(true);

      // Refresh sessions and update counts immediately
      await fetchAllSessions();

      setSuccessMsg(`Session started in ${eegMode} mode!`);
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err) {
      handleAuthError(err, 'Failed to start EEG session.');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const todaySessionsCount = allSessions.filter((s) => {
    if (!s.startTime) return false;
    const today = new Date().toDateString();
    return new Date(s.startTime).toDateString() === today;
  }).length;

  const styles = {
    // ... your existing styles (kept unchanged)
    page: { minHeight: '100vh', background: '#f0f7f9', fontFamily: "'Segoe UI', sans-serif" },
    navbar: {
      background: '#fff', borderBottom: '1px solid #e2eef2', padding: '0 32px',
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    navBrand: { fontSize: 18, fontWeight: '700', color: accent, letterSpacing: '0.5px' },
    navRight: { display: 'flex', alignItems: 'center', gap: 16 },
    navBadge: {
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: '700',
      letterSpacing: '0.5px', textTransform: 'uppercase',
      background: isDoctor ? 'rgba(42,140,90,0.1)' : 'rgba(42,125,156,0.1)',
      color: accent, border: `1px solid ${accent}40`,
    },
    navName: { fontSize: 14, color: '#4a6a7a', fontWeight: '500' },
    logoutBtn: {
      padding: '8px 18px', background: 'transparent', color: '#ef4444',
      border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 13,
      cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600',
    },
    content: { padding: '32px', maxWidth: 1100, margin: '0 auto' },
    greetingTitle: { fontSize: 26, fontWeight: '700', color: '#1a3a4a', margin: '0 0 4px' },
    greetingSubtitle: { fontSize: 14, color: '#7a9aaa', margin: '0 0 28px' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
    statCard: (color) => ({
      background: '#fff', borderRadius: 14, padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)', borderLeft: `4px solid ${color}`,
    }),
    statNumber: (color) => ({ fontSize: 28, fontWeight: '700', color, margin: '0 0 4px' }),
    statLabel: { fontSize: 12, color: '#7a9aaa', margin: 0, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a3a4a', margin: 0 },
    assignBtn: {
      padding: '9px 20px', background: accent, color: '#fff',
      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: '600',
      cursor: 'pointer', fontFamily: 'inherit',
    },
    table: { background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' },
    tableHeader: (cols) => ({
      display: 'grid', gridTemplateColumns: cols,
      padding: '14px 24px', background: '#f8fbfc', borderBottom: '1px solid #e2eef2',
    }),
    tableHeaderCell: { fontSize: 11, fontWeight: '700', color: '#7a9aaa', textTransform: 'uppercase', letterSpacing: '0.5px' },
    tableRow: (hovered, cols) => ({
      display: 'grid', gridTemplateColumns: cols,
      padding: '16px 24px', borderBottom: '1px solid #f0f7f9', alignItems: 'center',
      background: hovered ? '#f8fbfc' : '#fff', transition: 'background 0.15s ease',
    }),
    patientName: { fontSize: 14, fontWeight: '600', color: '#1a3a4a', margin: '0 0 2px' },
    patientId: { fontSize: 11, color: '#9ab5c0' },
    tableCell: { fontSize: 14, color: '#4a6a7a' },
    actionBtn: {
      padding: '7px 16px', background: accent, color: '#fff',
      border: 'none', borderRadius: 8, fontSize: 12, fontWeight: '600',
      cursor: 'pointer', fontFamily: 'inherit',
    },
    emptyState: { padding: '48px', textAlign: 'center', color: '#7a9aaa', fontSize: 14 },
    errorBox: {
      background: '#fff5f5', border: '1px solid #fcc', color: '#c0392b',
      borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 20,
    },
    successBox: {
      background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a',
      borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 20,
    },
    infoCard: {
      background: '#fff', borderRadius: 16, padding: '28px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 24,
      borderLeft: `4px solid ${accent}`,
    },
    infoCardTitle: { fontSize: 14, fontWeight: '700', color: '#7a9aaa', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px' },
    infoRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
    infoLabel: { fontSize: 13, color: '#7a9aaa' },
    infoValue: { fontSize: 13, fontWeight: '600', color: '#1a3a4a' },
    sessionBadge: (mode) => ({
      display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: '600',
      background: mode === 'DEMENTIA' ? '#fff8e1' : mode === 'COMA' ? '#fef2f2' : '#f0fdf4',
      color: mode === 'DEMENTIA' ? '#f59e0b' : mode === 'COMA' ? '#ef4444' : '#22c55e',
      border: `1px solid ${mode === 'DEMENTIA' ? '#fde68a' : mode === 'COMA' ? '#fecaca' : '#bbf7d0'}`,
    }),
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    },
    modal: {
      background: '#fff', borderRadius: 20, padding: '40px',
      width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a3a4a', margin: '0 0 6px' },
    modalSubtitle: { fontSize: 13, color: '#7a9aaa', margin: '0 0 24px' },
    patientListItem: (hovered) => ({
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 16px', borderRadius: 10, marginBottom: 8,
      background: hovered ? '#f0fdf4' : '#f8fbfc',
      border: `1px solid ${hovered ? '#bbf7d0' : '#e2eef2'}`,
      transition: 'all 0.15s ease',
    }),
    patientListName: { fontSize: 14, fontWeight: '600', color: '#1a3a4a' },
    patientListEmail: { fontSize: 12, color: '#7a9aaa' },
    assignRowBtn: {
      padding: '6px 14px', background: '#2a8c5a', color: '#fff',
      border: 'none', borderRadius: 7, fontSize: 12, fontWeight: '600',
      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    },
    modeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 },
    modeCard: (mode) => ({
      padding: '16px 12px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
      border: eegMode === mode ? '2px solid #2a8c5a' : '2px solid #e2eef2',
      background: eegMode === mode ? '#f0fdf4' : '#f8fbfc',
      transition: 'all 0.2s ease',
    }),
    modeEmoji: { fontSize: 28, marginBottom: 6, display: 'block' },
    modeLabel: (mode) => ({
      fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
      color: eegMode === mode ? '#2a8c5a' : '#4a6a7a',
    }),
    modeDesc: { fontSize: 11, color: '#9ab5c0', marginTop: 2 },
    startBtn: {
      width: '100%', padding: '14px', background: '#2a8c5a',
      color: '#fff', border: 'none', borderRadius: 10, fontSize: 15,
      fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
      marginBottom: 10, transition: 'background 0.2s ease',
    },
    liveBtn: {
      width: '100%', padding: '14px', background: '#7c3aed',
      color: '#fff', border: 'none', borderRadius: 10, fontSize: 15,
      fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
      marginBottom: 10,
    },
    cancelBtn: {
      width: '100%', padding: '12px', background: 'transparent', color: '#9ab5c0',
      border: '1.5px solid #e2eef2', borderRadius: 10, fontSize: 14,
      cursor: 'pointer', fontFamily: 'inherit',
    },
  };

  // Patient View
  if (!isDoctor) {
    return (
      <>
        <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}*{box-sizing:border-box}`}</style>
        <div style={styles.page}>
          <div style={styles.navbar}>
            <div style={styles.navBrand}>🧠 Cerebro Connect</div>
            <div style={styles.navRight}>
              <span style={styles.navBadge}>Patient</span>
              <span style={styles.navName}>🧑‍🦽 {name || 'Patient'}</span>
              <button style={styles.logoutBtn} onClick={logout}>Logout</button>
            </div>
          </div>
          <div style={styles.content}>
            <h1 style={styles.greetingTitle}>Hello, {name || 'Patient'} 👋</h1>
            <p style={styles.greetingSubtitle}>Here's your EEG health summary</p>
            {error && <div style={styles.errorBox}>⚠ {error}</div>}
            <div style={styles.statsRow}>
              <div style={styles.statCard('#2a7d9c')}>
                <p style={styles.statNumber('#2a7d9c')}>{eegSessions.length}</p>
                <p style={styles.statLabel}>Total Sessions</p>
              </div>
              <div style={styles.statCard('#f59e0b')}>
                <p style={styles.statNumber('#f59e0b')}>{eegSessions.filter(s => s.mode === 'DEMENTIA').length}</p>
                <p style={styles.statLabel}>Dementia Scans</p>
              </div>
              <div style={styles.statCard('#ef4444')}>
                <p style={styles.statNumber('#ef4444')}>{eegSessions.filter(s => s.mode === 'COMA').length}</p>
                <p style={styles.statLabel}>Coma Scans</p>
              </div>
              <div style={styles.statCard('#22c55e')}>
                <p style={styles.statNumber('#22c55e')}>{eegSessions.filter(s => s.mode === 'GENERAL').length}</p>
                <p style={styles.statLabel}>General Scans</p>
              </div>
            </div>
            <div style={styles.infoCard}>
              <p style={styles.infoCardTitle}>My Information</p>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Name</span><span style={styles.infoValue}>{name || '—'}</span></div>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Email</span><span style={styles.infoValue}>{localStorage.getItem('email') || '—'}</span></div>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Patient ID</span><span style={styles.infoValue}>#{userId || '—'}</span></div>
            </div>
            <div style={styles.sectionHeader}>
              <p style={styles.sectionTitle}>My EEG Sessions</p>
            </div>
            <div style={styles.table}>
              <div style={styles.tableHeader('1fr 1.5fr 2fr 2fr')}>
                <span style={styles.tableHeaderCell}>Session</span>
                <span style={styles.tableHeaderCell}>Mode</span>
                <span style={styles.tableHeaderCell}>Date</span>
                <span style={styles.tableHeaderCell}>Notes</span>
              </div>
              {loading ? (
                <div style={styles.emptyState}>Loading sessions...</div>
              ) : eegSessions.length === 0 ? (
                <div style={styles.emptyState}>No EEG sessions yet. Your doctor will schedule one for you.</div>
              ) : (
                eegSessions.map((session) => (
                  <div key={session.id} style={styles.tableRow(hoveredRow === session.id, '1fr 1.5fr 2fr 2fr')}
                    onMouseEnter={() => setHoveredRow(session.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <div><p style={styles.patientName}>#{session.id}</p></div>
                    <span><span style={styles.sessionBadge(session.mode)}>{session.mode}</span></span>
                    <span style={styles.tableCell}>{session.startTime ? new Date(session.startTime).toLocaleString() : '—'}</span>
                    <span style={styles.tableCell}>{session.notes || '—'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Doctor View
  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}*{box-sizing:border-box}`}</style>
      <div style={styles.page}>
        <div style={styles.navbar}>
          <div style={styles.navBrand}>🧠 Cerebro Connect</div>
          <div style={styles.navRight}>
            <span style={styles.navBadge}>Doctor</span>
            <span style={styles.navName}>👨‍⚕️ Dr. {name || 'Doctor'}</span>
            <button style={styles.logoutBtn} onClick={logout}>Logout</button>
          </div>
        </div>
        <div style={styles.content}>
          <h1 style={styles.greetingTitle}>Good morning, Dr. {name || 'Doctor'} 👋</h1>
          <p style={styles.greetingSubtitle}>Here's your patient overview for today</p>
          {error && <div style={styles.errorBox}>⚠ {error}</div>}
          {successMsg && <div style={styles.successBox}>✓ {successMsg}</div>}

          <div style={styles.statsRow}>
            <div style={styles.statCard('#2a8c5a')}>
              <p style={styles.statNumber('#2a8c5a')}>{patients.length}</p>
              <p style={styles.statLabel}>My Patients</p>
            </div>
            <div style={styles.statCard('#f59e0b')}>
              <p style={styles.statNumber('#f59e0b')}>
                {allSessions.filter(s => s.mode === 'DEMENTIA').length}
              </p>
              <p style={styles.statLabel}>Dementia Sessions</p>
            </div>
            <div style={styles.statCard('#ef4444')}>
              <p style={styles.statNumber('#ef4444')}>
                {allSessions.filter(s => s.mode === 'COMA').length}
              </p>
              <p style={styles.statLabel}>Coma Sessions</p>
            </div>
            <div style={styles.statCard('#2a7d9c')}>
              <p style={styles.statNumber('#2a7d9c')}>{todaySessionsCount}</p>
              <p style={styles.statLabel}>Sessions Today</p>
            </div>
          </div>

          <div style={styles.sectionHeader}>
            <p style={styles.sectionTitle}>My Patients</p>
            <button style={styles.assignBtn} onClick={fetchUnassignedPatients}>
              + Assign Patient
            </button>
          </div>
          <div style={styles.table}>
            <div style={styles.tableHeader('2fr 2fr 1.5fr 1.5fr')}>
              <span style={styles.tableHeaderCell}>Patient</span>
              <span style={styles.tableHeaderCell}>Email</span>
              <span style={styles.tableHeaderCell}>Patient ID</span>
              <span style={styles.tableHeaderCell}>Action</span>
            </div>
            {loading ? (
              <div style={styles.emptyState}>Loading patients...</div>
            ) : patients.length === 0 ? (
              <div style={styles.emptyState}>No patients assigned yet. Click "Assign Patient" to add one.</div>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient.id}
                  style={styles.tableRow(hoveredRow === patient.id, '2fr 2fr 1.5fr 1.5fr')}
                  onMouseEnter={() => setHoveredRow(patient.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <div>
                    <p style={styles.patientName}>{patient.name}</p>
                    <p style={styles.patientId}>ID #{patient.id}</p>
                  </div>
                  <span style={styles.tableCell}>{patient.email}</span>
                  <span style={styles.tableCell}>#{patient.id}</span>
                  <button
                    style={styles.actionBtn}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setEegMode('GENERAL');
                      setShowSessionModal(true);
                    }}
                  >
                    Start EEG
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assign Patient Modal */}
      {showAssignModal && (
        <div style={styles.overlay} onClick={() => setShowAssignModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Assign Patient</h2>
            <p style={styles.modalSubtitle}>Select a patient to add to your list</p>
            {unassignedPatients.length === 0 ? (
              <div style={styles.emptyState}>No unassigned patients available.</div>
            ) : (
              unassignedPatients.map((p) => (
                <div
                  key={p.id}
                  style={styles.patientListItem(hoveredRow === `assign-${p.id}`)}
                  onMouseEnter={() => setHoveredRow(`assign-${p.id}`)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <div>
                    <p style={styles.patientListName}>{p.name}</p>
                    <p style={styles.patientListEmail}>{p.email}</p>
                  </div>
                  <button style={styles.assignRowBtn} onClick={() => handleAssignPatient(p.id)}>
                    Assign
                  </button>
                </div>
              ))
            )}
            <button style={{ ...styles.cancelBtn, marginTop: 16 }} onClick={() => setShowAssignModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* EEG Session Modal */}
      {showSessionModal && selectedPatient && (
        <div style={styles.overlay} onClick={() => setShowSessionModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>EEG Session</h2>
            <p style={styles.modalSubtitle}>Patient: <strong>{selectedPatient.name}</strong></p>
            <p style={{ fontSize: 13, fontWeight: '600', color: '#4a6a7a', marginBottom: 12 }}>Select EEG Mode:</p>
            <div style={styles.modeGrid}>
              {[
                { mode: 'DEMENTIA', emoji: '🧩', desc: 'Theta/Alpha analysis' },
                { mode: 'COMA', emoji: '💤', desc: 'Delta wave monitoring' },
                { mode: 'GENERAL', emoji: '🧠', desc: 'Full band analysis' },
              ].map(({ mode, emoji, desc }) => (
                <div
                  key={mode}
                  style={styles.modeCard(mode)}
                  onClick={() => setEegMode(mode)}
                >
                  <span style={styles.modeEmoji}>{emoji}</span>
                  <p style={styles.modeLabel(mode)}>{mode}</p>
                  <p style={styles.modeDesc}>{desc}</p>
                </div>
              ))}
            </div>

            <button style={styles.startBtn} onClick={handleStartSession}>
              ▶ Start Session (Save to DB)
            </button>

            <button
              style={styles.liveBtn}
              onClick={() => {
                setShowSessionModal(false);
                setShowEEGMonitor(true);
              }}
            >
              📡 Open Live EEG Monitor
            </button>

            <button style={styles.cancelBtn} onClick={() => setShowSessionModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* LIVE EEG MONITOR */}
      {showEEGMonitor && selectedPatient && (
        <EEGMonitor
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          eegMode={eegMode}
          onClose={() => {
            setShowEEGMonitor(false);
            fetchAllSessions();   // Refresh count when closing monitor
          }}
        />
      )}
    </>
  );
};

export default Dashboard;
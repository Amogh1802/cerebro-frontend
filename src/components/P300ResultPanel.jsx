import React from 'react';

/**
 * Displays the latest P300 ERP result instead of waveform graphs.
 * Shown only when activeMode === 'COMA'.
 */
const P300ResultPanel = ({ result, patientName }) => {
  const styles = {
    wrapper: {
      background: '#0a1628',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      padding: 32,
      textAlign: 'center',
      gridColumn: '1 / -1',
    },
    header: {
      fontSize: 13,
      letterSpacing: '1px',
      color: '#f59e0b',
      fontWeight: 700,
      marginBottom: 8,
    },
    patient: {
      fontSize: 20,
      color: '#fff',
      fontWeight: 700,
      marginBottom: 24,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
      marginBottom: 24,
    },
    card: {
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      padding: '20px 16px',
    },
    value: {
      fontSize: 28,
      fontWeight: 800,
      color: '#fff',
      margin: '0 0 4px',
    },
    label: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.45)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    resultBanner: (detected) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px 28px',
      borderRadius: 30,
      fontSize: 16,
      fontWeight: 700,
      background: detected ? 'rgba(0,255,136,0.12)' : 'rgba(239,68,68,0.12)',
      color: detected ? '#00ff88' : '#ff4466',
      border: `1px solid ${detected ? '#00ff8855' : '#ff446655'}`,
    }),
    waiting: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 14,
      padding: '40px 0',
    },
  };

  if (!result) {
    return (
      <div style={styles.wrapper}>
        <p style={styles.header}>COMA MODE — P300 ERP ANALYSIS</p>
        <p style={styles.waiting}>Waiting for P300 result from LabVIEW...</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <p style={styles.header}>COMA MODE — P300 ERP ANALYSIS</p>
      <p style={styles.patient}>Patient: {patientName}</p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <p style={styles.value}>{result.trialsAveraged ?? '—'}</p>
          <p style={styles.label}>Trials Averaged</p>
        </div>
        <div style={styles.card}>
          <p style={styles.value}>
            {Number.isFinite(Number(result.amplitude)) ? Number(result.amplitude).toFixed(2) : '—'}
          </p>
          <p style={styles.label}>P300 Amplitude (µV)</p>
        </div>
        <div style={styles.card}>
          <p style={styles.value}>{result.latencyMs ?? '—'} ms</p>
          <p style={styles.label}>P300 Latency</p>
        </div>
      </div>

      <div style={styles.resultBanner(result.detected)}>
        {result.detected ? '✓ P300 Response Detected' : '✕ No P300 Response Detected'}
      </div>
    </div>
  );
};

export default P300ResultPanel;
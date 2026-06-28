import React from 'react';

/**
 * Displays the latest dementia screening prediction.
 * Shown only when activeMode === 'DEMENTIA'.
 */
const DementiaResultPanel = ({ result, patientName }) => {

  const getPredictionColor = (prediction) => {
    if (!prediction) return '#888888';
    const p = prediction.toLowerCase();
    if (p.includes('healthy')) return '#00ff88';
    if (p.includes('mild')) return '#f59e0b';
    if (p.includes('dementia')) return '#ff4466';
    return '#888888';
  };

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
    predictionBanner: (color) => ({
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      padding: '24px 48px',
      borderRadius: 20,
      background: `${color}1f`,
      border: `1px solid ${color}55`,
      marginBottom: 20,
    }),
    predictionLabel: (color) => ({
      fontSize: 28,
      fontWeight: 800,
      color,
      margin: 0,
    }),
    probabilityRow: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
    },
    probabilityValue: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: 600,
    },
    barTrack: {
      width: 240,
      height: 8,
      borderRadius: 8,
      background: 'rgba(255,255,255,0.08)',
      marginTop: 8,
      overflow: 'hidden',
    },
    barFill: (color, pct) => ({
      width: `${pct}%`,
      height: '100%',
      background: color,
      borderRadius: 8,
      transition: 'width 0.4s ease',
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
        <p style={styles.header}>DEMENTIA MODE — COGNITIVE SCREENING</p>
        <p style={styles.waiting}>Waiting for prediction result from LabVIEW...</p>
      </div>
    );
  }

  const color = getPredictionColor(result.prediction);
  const probabilityPct = Number.isFinite(Number(result.probability))
    ? Math.min(100, Math.max(0, Number(result.probability)))
    : 0;

  return (
    <div style={styles.wrapper}>
      <p style={styles.header}>DEMENTIA MODE — COGNITIVE SCREENING</p>
      <p style={styles.patient}>Patient: {patientName}</p>

      <div style={styles.predictionBanner(color)}>
        <p style={styles.predictionLabel(color)}>{result.prediction ?? '—'}</p>

        <div style={styles.probabilityRow}>
          <span style={styles.probabilityValue}>
            Probablity: {probabilityPct.toFixed(1)}%
          </span>
          <div style={styles.barTrack}>
            <div style={styles.barFill(color, probabilityPct)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DementiaResultPanel;
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import API_BASE_URL from '../config';

const WS_URL = API_BASE_URL.replace('/api', '/ws');
const MAX_POINTS = 100; // show last 100 samples on graph

const EEGMonitor = ({ patientId, patientName, onClose }) => {
  const [connected, setConnected] = useState(false);
  const [eegData, setEegData] = useState({
    voltage: [], alpha: [], beta: [], theta: [], delta: [],
    timestamps: []
  });
  const [latestReading, setLatestReading] = useState(null);
  const clientRef = useRef(null);
  const canvasRefs = {
    voltage: useRef(null),
    alpha: useRef(null),
    beta: useRef(null),
    theta: useRef(null),
    delta: useRef(null),
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (clientRef.current) clientRef.current.deactivate();
    };
  }, []);

  useEffect(() => {
    drawAllGraphs();
  }, [eegData]);

  const connectWebSocket = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      onConnect: () => {
        setConnected(true);
        client.subscribe('/topic/eeg', (message) => {
          const data = JSON.parse(message.body);
          handleNewData(data);
        });
      },
      onDisconnect: () => setConnected(false),
      reconnectDelay: 3000,
    });
    client.activate();
    clientRef.current = client;
  };

  const handleNewData = (data) => {
    setLatestReading(data);
    setEegData(prev => {
      const addPoint = (arr, val) => {
        const next = [...arr, val || 0];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      };
      return {
        voltage: addPoint(prev.voltage, data.voltage),
        alpha: addPoint(prev.alpha, data.alpha),
        beta: addPoint(prev.beta, data.beta),
        theta: addPoint(prev.theta, data.theta),
        delta: addPoint(prev.delta, data.delta),
        timestamps: addPoint(prev.timestamps, data.timestamp),
      };
    });
  };

  const drawGraph = (canvasRef, data, color, label, minVal, maxVal) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Signal line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const range = maxVal - minVal || 1;
    data.forEach((val, i) => {
      const x = (i / (MAX_POINTS - 1)) * w;
      const y = h - ((val - minVal) / range) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Label
    ctx.fillStyle = color;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(label, 8, 16);
  };

  const drawAllGraphs = () => {
    drawGraph(canvasRefs.voltage, eegData.voltage, '#ffffff', 'RAW EEG', -0.5, 0.5);
    drawGraph(canvasRefs.alpha, eegData.alpha, '#00ff88', 'ALPHA (8-13Hz)', -0.2, 0.2);
    drawGraph(canvasRefs.beta, eegData.beta, '#ff4466', 'BETA (13-30Hz)', -0.2, 0.2);
    drawGraph(canvasRefs.theta, eegData.theta, '#ffcc00', 'THETA (4-8Hz)', -0.1, 0.1);
    drawGraph(canvasRefs.delta, eegData.delta, '#4488ff', 'DELTA (0.5-4Hz)', -0.1, 0.1);
  };

  const getStateColor = (state) => {
    const colors = {
      'RELAXED': '#00ff88',
      'DROWSY': '#ffcc00',
      'ACTIVE': '#ff8800',
      'ARTIFACT': '#ff4466',
      'UNKNOWN': '#888888'
    };
    return colors[state] || '#888888';
  };

  const styles = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 2000, display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', sans-serif", overflow: 'auto',
    },
    header: {
      background: '#0a1628', borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '16px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#fff', margin: 0 },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 },
    statusDot: {
      width: 10, height: 10, borderRadius: '50%',
      background: connected ? '#00ff88' : '#ff4466',
      animation: connected ? 'pulse 1.5s infinite' : 'none',
    },
    statusText: {
      fontSize: 12, color: connected ? '#00ff88' : '#ff4466', fontWeight: '600'
    },
    closeBtn: {
      padding: '8px 16px', background: 'transparent', color: '#ff4466',
      border: '1px solid #ff4466', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 13,
    },
    content: { padding: 24, flex: 1 },
    statsRow: {
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 12, marginBottom: 24,
    },
    statCard: (color) => ({
      background: '#0a1628', border: `1px solid ${color}40`,
      borderRadius: 10, padding: '12px 16px', textAlign: 'center',
    }),
    statValue: (color) => ({
      fontSize: 20, fontWeight: '700', color, margin: '0 0 4px'
    }),
    statLabel: {
      fontSize: 10, color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase', letterSpacing: '0.5px',
    },
    graphsGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 16,
    },
    graphCard: {
      background: '#0a1628', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
    },
    graphCardWide: {
      background: '#0a1628', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden', gridColumn: '1 / -1',
    },
    canvas: { display: 'block', width: '100%' },
  };

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>
      <div style={styles.overlay}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.statusDot} />
            <div>
              <h2 style={styles.title}>🧠 Live EEG Monitor — {patientName}</h2>
              <p style={styles.subtitle}>Real-time signal from LabVIEW</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={styles.statusText}>
              {connected ? '● LIVE' : '○ Connecting...'}
            </span>
            <button style={styles.closeBtn} onClick={onClose}>✕ Close</button>
          </div>
        </div>

        <div style={styles.content}>
          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statCard('#ffffff')}>
              <p style={styles.statValue('#ffffff')}>
                {latestReading?.voltage?.toFixed(3) || '—'}
              </p>
              <p style={styles.statLabel}>Voltage (V)</p>
            </div>
            <div style={styles.statCard('#00ff88')}>
              <p style={styles.statValue('#00ff88')}>
                {latestReading?.rmsAlpha?.toFixed(4) || '—'}
              </p>
              <p style={styles.statLabel}>RMS Alpha</p>
            </div>
            <div style={styles.statCard('#ff4466')}>
              <p style={styles.statValue('#ff4466')}>
                {latestReading?.rmsBeta?.toFixed(4) || '—'}
              </p>
              <p style={styles.statLabel}>RMS Beta</p>
            </div>
            <div style={styles.statCard('#ffcc00')}>
              <p style={styles.statValue('#ffcc00')}>
                {latestReading?.rmsTheta?.toFixed(4) || '—'}
              </p>
              <p style={styles.statLabel}>RMS Theta</p>
            </div>
            <div style={styles.statCard('#4488ff')}>
              <p style={styles.statValue('#4488ff')}>
                {latestReading?.rmsDelta?.toFixed(4) || '—'}
              </p>
              <p style={styles.statLabel}>RMS Delta</p>
            </div>
            <div style={styles.statCard(getStateColor(latestReading?.state))}>
              <p style={styles.statValue(getStateColor(latestReading?.state))}>
                {latestReading?.state || '—'}
              </p>
              <p style={styles.statLabel}>Brain State</p>
            </div>
          </div>

          {/* Graphs */}
          <div style={styles.graphsGrid}>
            <div style={styles.graphCardWide}>
              <canvas ref={canvasRefs.voltage}
                width={1200} height={120} style={styles.canvas} />
            </div>
            <div style={styles.graphCard}>
              <canvas ref={canvasRefs.alpha}
                width={600} height={120} style={styles.canvas} />
            </div>
            <div style={styles.graphCard}>
              <canvas ref={canvasRefs.beta}
                width={600} height={120} style={styles.canvas} />
            </div>
            <div style={styles.graphCard}>
              <canvas ref={canvasRefs.theta}
                width={600} height={120} style={styles.canvas} />
            </div>
            <div style={styles.graphCard}>
              <canvas ref={canvasRefs.delta}
                width={600} height={120} style={styles.canvas} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EEGMonitor;
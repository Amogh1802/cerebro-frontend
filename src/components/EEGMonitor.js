/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import API_BASE_URL from '../config';
import P300ResultPanel from './P300ResultPanel';
import DementiaResultPanel from './DementiaResultPanel';

const WS_URL = API_BASE_URL.replace('/api', '/ws');
const MAX_POINTS = 100;

const EEGMonitor = ({ patientId, patientName, eegMode, onClose }) => {
  const [connected, setConnected] = useState(false);
  const [activeMode, setActiveMode] = useState(eegMode || 'GENERAL');
  const [p300Result, setP300Result] = useState(null);
  const [dementiaResult, setDementiaResult] = useState(null);
  const [oddballRunning, setOddballRunning] = useState(false);
  const oddballRef = useRef(null);
  const [eegData, setEegData] = useState({
    voltage: [],
    alpha: [],
    beta: [],
    theta: [],
    delta: [],
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

  const toNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  // ── Oddball stimulus logic (COMA mode only) ──
  const sendStimulus = async () => {
    try {
      await axios.post(`${API_BASE_URL}/stimulus`, { stimulus: "ODDBALL" });
      console.log("ODDBALL SENT");
    } catch (err) {
      console.error("Stimulus Error", err);
    }
  };

  const playTone = (frequency, duration = 200) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  };

  const startOddball = () => {
    if (oddballRunning) return;
    setOddballRunning(true);

    oddballRef.current = setInterval(async () => {
      const randomValue = Math.random();
      if (randomValue < 0.8) {
        playTone(1000);
        console.log("STANDARD");
      } else {
        playTone(1500);
        console.log("ODDBALL");
        await sendStimulus();
      }
    }, 1500);
  };

  const stopOddball = () => {
    if (oddballRef.current) {
      clearInterval(oddballRef.current);
      oddballRef.current = null;
    }
    setOddballRunning(false);
  };

  useEffect(() => {
    return () => {
      if (oddballRef.current) clearInterval(oddballRef.current);
    };
  }, []);

  const connectWebSocket = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP:', str),
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,

      onConnect: () => {
        console.log('EEGMonitor connected to WebSocket:', WS_URL);
        setConnected(true);

        client.subscribe('/topic/eeg', (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log('EEG websocket message:', data);
            handleNewData(data);
          } catch (err) {
            console.error('Failed to parse EEG message:', err, message.body);
          }
        });

        // Listen for mode changes broadcast by backend when a session starts
        client.subscribe('/topic/mode', (message) => {
          try {
            const payload = JSON.parse(message.body);
            console.log('Mode received from backend:', payload.mode);
            if (payload.mode) setActiveMode(payload.mode);
          } catch (err) {
            console.error('Failed to parse mode message:', err);
          }
        });

        // Listen for P300 ERP results (COMA mode)
        client.subscribe('/topic/p300', (message) => {
          try {
            const result = JSON.parse(message.body);
            console.log('P300 result received:', result);
            setP300Result(result);
          } catch (err) {
            console.error('Failed to parse P300 message:', err);
          }
        });

        // Listen for Dementia screening results (DEMENTIA mode)
        client.subscribe('/topic/dementia', (message) => {
          try {
            const result = JSON.parse(message.body);
            console.log('Dementia result received:', result);
            setDementiaResult(result);
          } catch (err) {
            console.error('Failed to parse Dementia message:', err);
          }
        });
      },

      onDisconnect: () => {
        console.log('EEGMonitor disconnected');
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setConnected(false);
      },

      onWebSocketClose: (event) => {
        console.error('WebSocket closed:', event);
        setConnected(false);
      },

      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
        setConnected(false);
      }
    });

    client.activate();
    clientRef.current = client;
  };

  const handleNewData = (data) => {
    const normalized = {
      ...data,
      voltage: toNumber(data.voltage),
      alpha: toNumber(data.alpha ?? data.rmsAlpha),
      beta: toNumber(data.beta ?? data.rmsBeta),
      theta: toNumber(data.theta ?? data.rmsTheta),
      delta: toNumber(data.delta ?? data.rmsDelta),
      rmsAlpha: toNumber(data.rmsAlpha ?? data.alpha),
      rmsBeta: toNumber(data.rmsBeta ?? data.beta),
      rmsTheta: toNumber(data.rmsTheta ?? data.theta),
      rmsDelta: toNumber(data.rmsDelta ?? data.delta),
      timestamp: data.timestamp ?? data.Timestamp ?? new Date().toISOString(),
      state: data.state ?? 'UNKNOWN',
      stateCode: data.stateCode ?? data.statecode ?? 0,
    };

    console.log('Normalized EEG:', normalized);

    setLatestReading(normalized);

    setEegData(prev => {
      const addPoint = (arr, val) => {
        const next = [...arr, toNumber(val)];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      };

      const addTime = (arr, val) => {
        const next = [...arr, String(val)];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      };

      return {
        voltage: addPoint(prev.voltage, normalized.voltage),
        alpha: addPoint(prev.alpha, normalized.alpha),
        beta: addPoint(prev.beta, normalized.beta),
        theta: addPoint(prev.theta, normalized.theta),
        delta: addPoint(prev.delta, normalized.delta),
        timestamps: addTime(prev.timestamps, normalized.timestamp),
      };
    });
  };

  const getRange = (data, fallbackMin, fallbackMax) => {
    if (!data || data.length === 0) {
      return { minVal: fallbackMin, maxVal: fallbackMax };
    }

    const vals = data.map(v => toNumber(v)).filter(v => Number.isFinite(v));
    if (vals.length === 0) {
      return { minVal: fallbackMin, maxVal: fallbackMax };
    }

    let minVal = Math.min(...vals);
    let maxVal = Math.max(...vals);

    if (minVal === maxVal) {
      const pad = Math.abs(minVal || 1) * 0.2 || 0.1;
      minVal -= pad;
      maxVal += pad;
    } else {
      const pad = (maxVal - minVal) * 0.15;
      minVal -= pad;
      maxVal += pad;
    }

    return { minVal, maxVal };
  };

  const drawGraph = (canvasRef, data, color, label, fallbackMin, fallbackMax) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(label, 8, 16);

    if (!data || data.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '12px sans-serif';
      ctx.fillText('Waiting for data...', 8, 36);
      return;
    }

    if (data.length === 1) {
      const value = toNumber(data[0]);
      const { minVal, maxVal } = getRange(data, fallbackMin, fallbackMax);
      const range = maxVal - minVal || 1;
      const y = h - ((value - minVal) / range) * h;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(w / 2, y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '12px sans-serif';
      ctx.fillText('Receiving first samples...', 8, 36);
      return;
    }

    const { minVal, maxVal } = getRange(data, fallbackMin, fallbackMax);
    const range = maxVal - minVal || 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    data.forEach((val, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * w;
      const y = h - ((toNumber(val) - minVal) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px sans-serif';
    ctx.fillText(`max ${maxVal.toFixed(4)}`, w - 80, 14);
    ctx.fillText(`min ${minVal.toFixed(4)}`, w - 80, h - 6);
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
      RELAXED: '#00ff88',
      DROWSY: '#ffcc00',
      ACTIVE: '#ff8800',
      ARTIFACT: '#ff4466',
      UNKNOWN: '#888888'
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
      display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
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
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.statusDot} />
            <div>
              <h2 style={styles.title}>🧠 Live EEG Monitor — {patientName}</h2>
              <p style={styles.subtitle}>
                Real-time signal from LabVIEW • Patient ID: {patientId}
                <span style={{
                  marginLeft: 12,
                  padding: '2px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  background: activeMode === 'DEMENTIA' ? 'rgba(245,158,11,0.15)'
                            : activeMode === 'COMA'     ? 'rgba(239,68,68,0.15)'
                            :                            'rgba(0,255,136,0.12)',
                  color:      activeMode === 'DEMENTIA' ? '#f59e0b'
                            : activeMode === 'COMA'     ? '#ff4466'
                            :                            '#00ff88',
                  border: `1px solid ${
                            activeMode === 'DEMENTIA' ? '#f59e0b55'
                          : activeMode === 'COMA'     ? '#ff446655'
                          :                            '#00ff8855'}`,
                }}>
                  {activeMode}
                </span>
              </p>
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
          {activeMode !== 'COMA' && activeMode !== 'DEMENTIA' && (
            <div style={styles.statsRow}>
              <div style={styles.statCard('#ffffff')}>
                <p style={styles.statValue('#ffffff')}>
                  {Number.isFinite(Number(latestReading?.voltage))
                    ? Number(latestReading.voltage).toFixed(3)
                    : '—'}
                </p>
                <p style={styles.statLabel}>Voltage (V)</p>
              </div>
              <div style={styles.statCard('#00ff88')}>
                <p style={styles.statValue('#00ff88')}>
                  {Number.isFinite(Number(latestReading?.rmsAlpha ?? latestReading?.alpha))
                    ? Number(latestReading?.rmsAlpha ?? latestReading?.alpha).toFixed(4)
                    : '—'}
                </p>
                <p style={styles.statLabel}>RMS Alpha</p>
              </div>
              <div style={styles.statCard('#ff4466')}>
                <p style={styles.statValue('#ff4466')}>
                  {Number.isFinite(Number(latestReading?.rmsBeta ?? latestReading?.beta))
                    ? Number(latestReading?.rmsBeta ?? latestReading?.beta).toFixed(4)
                    : '—'}
                </p>
                <p style={styles.statLabel}>RMS Beta</p>
              </div>
              <div style={styles.statCard('#ffcc00')}>
                <p style={styles.statValue('#ffcc00')}>
                  {Number.isFinite(Number(latestReading?.rmsTheta ?? latestReading?.theta))
                    ? Number(latestReading?.rmsTheta ?? latestReading?.theta).toFixed(4)
                    : '—'}
                </p>
                <p style={styles.statLabel}>RMS Theta</p>
              </div>
              <div style={styles.statCard('#4488ff')}>
                <p style={styles.statValue('#4488ff')}>
                  {Number.isFinite(Number(latestReading?.rmsDelta ?? latestReading?.delta))
                    ? Number(latestReading?.rmsDelta ?? latestReading?.delta).toFixed(4)
                    : '—'}
                </p>
                <p style={styles.statLabel}>RMS Delta</p>
              </div>
              <div style={styles.statCard(getStateColor(latestReading?.state))}>
                <p style={styles.statValue(getStateColor(latestReading?.state))}>
                  {latestReading?.state || '—'}
                </p>
                <p style={styles.statLabel}>Brain State</p>
              </div>
              <div style={styles.statCard(
                activeMode === 'DEMENTIA' ? '#f59e0b' : '#00ff88'
              )}>
                <p style={styles.statValue(
                  activeMode === 'DEMENTIA' ? '#f59e0b' : '#00ff88'
                )}>
                  {activeMode}
                </p>
                <p style={styles.statLabel}>EEG Mode</p>
              </div>
            </div>
          )}

          {activeMode === 'COMA' ? (
            <div style={styles.graphsGrid}>
              <div style={{ gridColumn: '1 / -1', marginBottom: 16, textAlign: 'center' }}>
                <button
                  onClick={startOddball}
                  disabled={oddballRunning}
                  style={{
                    background: oddballRunning ? '#1a3a2e' : '#00ff88',
                    color: oddballRunning ? '#00ff8866' : '#06281c',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: oddballRunning ? 'not-allowed' : 'pointer',
                    marginRight: 12,
                  }}
                >
                  ▶ Start Oddball
                </button>
                <button
                  onClick={stopOddball}
                  disabled={!oddballRunning}
                  style={{
                    background: !oddballRunning ? '#3a1a1a' : '#ff4466',
                    color: !oddballRunning ? '#ff446666' : '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: !oddballRunning ? 'not-allowed' : 'pointer',
                  }}
                >
                  ■ Stop Oddball
                </button>
              </div>
              <P300ResultPanel result={p300Result} patientName={patientName} />
            </div>
          ) : activeMode === 'DEMENTIA' ? (
            <div style={styles.graphsGrid}>
              <DementiaResultPanel result={dementiaResult} patientName={patientName} />
            </div>
          ) : (
            <div style={styles.graphsGrid}>
              <div style={styles.graphCardWide}>
                <canvas ref={canvasRefs.voltage} width={1200} height={120} style={styles.canvas} />
              </div>
              <div style={styles.graphCard}>
                <canvas ref={canvasRefs.alpha} width={600} height={120} style={styles.canvas} />
              </div>
              <div style={styles.graphCard}>
                <canvas ref={canvasRefs.beta} width={600} height={120} style={styles.canvas} />
              </div>
              <div style={styles.graphCard}>
                <canvas ref={canvasRefs.theta} width={600} height={120} style={styles.canvas} />
              </div>
              <div style={styles.graphCard}>
                <canvas ref={canvasRefs.delta} width={600} height={120} style={styles.canvas} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EEGMonitor;
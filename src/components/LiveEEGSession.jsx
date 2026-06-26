import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import API_BASE_URL from '../config';
import { useEEGWebSocket } from '../hooks/useEEGWebSocket';

const WS_URL = API_BASE_URL.replace('/api', '/ws');

export const LiveEEGSession = ({ patientId, sessionId, mode }) => {

  const { eegData, isConnected } = useEEGWebSocket();

  const [oddballRunning, setOddballRunning] = useState(false);
  const [p300Result, setP300Result] = useState(null);
  const oddballRef = useRef(null);
  const p300ClientRef = useRef(null);

  // ── Subscribe to /topic/p300 for live P300 results from LabVIEW ──
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      onConnect: () => {
        client.subscribe('/topic/p300', (message) => {
          try {
            const result = JSON.parse(message.body);
            console.log('P300 result received:', result);
            setP300Result(result);
          } catch (err) {
            console.error('Failed to parse P300 message:', err);
          }
        });
      },
    });

    client.activate();
    p300ClientRef.current = client;

    return () => {
      if (p300ClientRef.current) p300ClientRef.current.deactivate();
    };
  }, []);

  // ── Stimulus / Oddball logic (unchanged) ──
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

  // ── Styles for the P300 result panel ──
  const styles = {
    wrapper: {
      background: '#0a1628',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      padding: 32,
      textAlign: 'center',
    },
    header: {
      fontSize: 13,
      letterSpacing: '1px',
      color: '#f59e0b',
      fontWeight: 700,
      marginBottom: 20,
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
    meta: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.35)',
      marginTop: 16,
    },
  };

  return (
    <div className="p-6">

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Live EEG Session</h2>

        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1 rounded ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>

          <span className="text-gray-600">Mode: {String(mode)}</span>
          <span className="text-gray-600">Patient ID: {patientId}</span>
        </div>
      </div>

      {/* Oddball Start/Stop controls — unchanged */}
      <div className="mb-6">
        <button
          onClick={startOddball}
          disabled={oddballRunning}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Start Oddball
        </button>

        <button
          onClick={stopOddball}
          disabled={!oddballRunning}
          className="bg-red-600 text-white px-4 py-2 rounded ml-3"
        >
          Stop Oddball
        </button>
      </div>

      {/* P300 result panel — replaces all alpha/beta/theta/delta graphs */}
      <div style={styles.wrapper}>
        <p style={styles.header}>COMA MODE — P300 ERP ANALYSIS</p>

        {!p300Result ? (
          <p style={styles.waiting}>Waiting for P300 result from LabVIEW...</p>
        ) : (
          <>
            <div style={styles.grid}>
              <div style={styles.card}>
                <p style={styles.value}>{p300Result.trialsAveraged ?? '—'}</p>
                <p style={styles.label}>Trials Averaged</p>
              </div>
              <div style={styles.card}>
                <p style={styles.value}>
                  {Number.isFinite(Number(p300Result.amplitude))
                    ? Number(p300Result.amplitude).toFixed(2)
                    : '—'}
                </p>
                <p style={styles.label}>P300 Amplitude (µV)</p>
              </div>
              <div style={styles.card}>
                <p style={styles.value}>{p300Result.latencyMs ?? '—'} ms</p>
                <p style={styles.label}>P300 Latency</p>
              </div>
            </div>

            <div style={styles.resultBanner(p300Result.detected)}>
              {p300Result.detected ? '✓ P300 Response Detected' : '✕ No P300 Response Detected'}
            </div>

            <p style={styles.meta}>
              Patient ID: {p300Result.patientId} • Session ID: {p300Result.sessionId} • Mode: {p300Result.mode}
            </p>
          </>
        )}
      </div>

    </div>
  );
};
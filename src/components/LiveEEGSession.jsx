```javascript
// src/components/LiveEEGSession.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

import { useEEGWebSocket } from '../hooks/useEEGWebSocket';
import { Line } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const LiveEEGSession = ({
  patientId,
  sessionId,
  mode
}) => {

  const { eegData, isConnected } =
    useEEGWebSocket();

  const [dataPoints, setDataPoints] =
    useState({
      alpha: [],
      beta: [],
      theta: [],
      delta: [],
      timestamps: []
    });

  const [oddballRunning,
    setOddballRunning] =
    useState(false);

  const oddballRef = useRef(null);

  useEffect(() => {

    if (eegData) {

      console.log(
        '📊 New EEG data:',
        eegData
      );

      setDataPoints(prev => {

        const maxPoints = 50;

        return {

          alpha: [
            ...prev.alpha,
            eegData.alpha || 0
          ].slice(-maxPoints),

          beta: [
            ...prev.beta,
            eegData.beta || 0
          ].slice(-maxPoints),

          theta: [
            ...prev.theta,
            eegData.theta || 0
          ].slice(-maxPoints),

          delta: [
            ...prev.delta,
            eegData.delta || 0
          ].slice(-maxPoints),

          timestamps: [
            ...prev.timestamps,
            new Date().toLocaleTimeString()
          ].slice(-maxPoints)

        };

      });

    }

  }, [eegData]);

  const sendStimulus = async () => {

    try {

      await axios.post(
        `${API_BASE_URL}/stimulus`,
        {
          stimulus: "ODDBALL"
        }
      );

      console.log(
        "ODDBALL SENT"
      );

    } catch (err) {

      console.error(
        "Stimulus Error",
        err
      );

    }

  };

  const playTone = (
    frequency,
    duration = 200
  ) => {

    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    const audioContext =
      new AudioContextClass();

    const oscillator =
      audioContext.createOscillator();

    const gainNode =
      audioContext.createGain();

    oscillator.connect(gainNode);

    gainNode.connect(
      audioContext.destination
    );

    oscillator.frequency.value =
      frequency;

    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(
      0.2,
      audioContext.currentTime
    );

    oscillator.start();

    oscillator.stop(
      audioContext.currentTime +
      duration / 1000
    );

  };

  const startOddball = () => {

    if (oddballRunning)
      return;

    setOddballRunning(true);

    oddballRef.current =
      setInterval(async () => {

        const randomValue =
          Math.random();

        if (randomValue < 0.8) {

          playTone(1000);

          console.log(
            "STANDARD"
          );

        } else {

          playTone(1500);

          console.log(
            "ODDBALL"
          );

          await sendStimulus();

        }

      }, 1500);

  };

  const stopOddball = () => {

    if (oddballRef.current) {

      clearInterval(
        oddballRef.current
      );

      oddballRef.current = null;

    }

    setOddballRunning(false);

  };

  useEffect(() => {

    return () => {

      if (oddballRef.current) {

        clearInterval(
          oddballRef.current
        );

      }

    };

  }, []);

  const chartData = {

    labels:
      dataPoints.timestamps,

    datasets: [

      {
        label:
          'Alpha (8-13 Hz)',

        data:
          dataPoints.alpha,

        borderColor:
          'rgb(59,130,246)',

        backgroundColor:
          'rgba(59,130,246,0.1)',

        tension: 0.4
      },

      {
        label:
          'Beta (13-30 Hz)',

        data:
          dataPoints.beta,

        borderColor:
          'rgb(147,51,234)',

        backgroundColor:
          'rgba(147,51,234,0.1)',

        tension: 0.4
      },

      {
        label:
          'Theta (4-8 Hz)',

        data:
          dataPoints.theta,

        borderColor:
          'rgb(34,197,94)',

        backgroundColor:
          'rgba(34,197,94,0.1)',

        tension: 0.4
      },

      {
        label:
          'Delta (0.5-4 Hz)',

        data:
          dataPoints.delta,

        borderColor:
          'rgb(249,115,22)',

        backgroundColor:
          'rgba(249,115,22,0.1)',

        tension: 0.4
      }

    ]
  };

  const chartOptions = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: {

      legend: {
        position: 'top'
      },

      title: {
        display: true,
        text:
          'Live EEG Brainwave Activity'
      }

    },

    scales: {

      y: {

        beginAtZero: true,

        title: {
          display: true,
          text:
            'Amplitude (μV)'
        }

      },

      x: {

        title: {
          display: true,
          text: 'Time'
        }

      }

    },

    animation: {
      duration: 0
    }

  };

  return (

    <div className="p-6">

      <div className="mb-6">

        <h2 className="text-2xl font-bold mb-2">
          Live EEG Session
        </h2>

        <div style={{
          background:"red",
          color:"white",
          padding:"10px",
          fontWeight:"bold"
        }}>
          TEST BUTTON AREA
        </div>

        <div className="flex items-center gap-4">

          <span
            className={`px-3 py-1 rounded ${
              isConnected
                ? 'bg-green-500'
                : 'bg-red-500'
            } text-white`}
          >
            {isConnected
              ? '🟢 Connected'
              : '🔴 Disconnected'}
          </span>

         <span className="text-gray-600">
           Mode: [{String(mode)}]
         </span>
         <div style={{background:"yellow", padding:"5px"}}>
           DEBUG MODE VALUE = [{String(mode)}]
         </div>

          <span className="text-gray-600">
            Patient ID: {patientId}
          </span>

        </div>

      </div>

      {true &&  && (

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

      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <div className="bg-blue-100 p-4 rounded-lg">
          <p>Alpha</p>
          <p>
            {eegData?.alpha?.toFixed(3) || '--'}
          </p>
        </div>

        <div className="bg-purple-100 p-4 rounded-lg">
          <p>Beta</p>
          <p>
            {eegData?.beta?.toFixed(3) || '--'}
          </p>
        </div>

        <div className="bg-green-100 p-4 rounded-lg">
          <p>Theta</p>
          <p>
            {eegData?.theta?.toFixed(3) || '--'}
          </p>
        </div>

        <div className="bg-orange-100 p-4 rounded-lg">
          <p>Delta</p>
          <p>
            {eegData?.delta?.toFixed(3) || '--'}
          </p>
        </div>

      </div>

      <div
        className="bg-white p-4 rounded-lg shadow"
        style={{ height: '400px' }}
      >

        <Line
          data={chartData}
          options={chartOptions}
        />

      </div>

      <div className="mt-4 text-sm text-gray-600">

        <p>
          Last update:
          {' '}
          {eegData?.timestamp ||
            'No data yet'}
        </p>

        <p>
          Data points collected:
          {' '}
          {dataPoints.alpha.length}
        </p>

      </div>

    </div>

  );

};
```

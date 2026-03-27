// src/components/LiveEEGSession.jsx
import React, { useState, useEffect } from 'react';
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const LiveEEGSession = ({ patientId, sessionId, mode }) => {
  const { eegData, isConnected } = useEEGWebSocket();
  const [dataPoints, setDataPoints] = useState({
    alpha: [],
    beta: [],
    theta: [],
    delta: [],
    timestamps: []
  });

  // Update data points when new EEG data arrives
  useEffect(() => {
    if (eegData) {
      console.log('📊 New EEG data for chart:', eegData);

      setDataPoints(prev => {
        const maxPoints = 50; // Keep last 50 data points

        return {
          alpha: [...prev.alpha, eegData.alpha || 0].slice(-maxPoints),
          beta: [...prev.beta, eegData.beta || 0].slice(-maxPoints),
          theta: [...prev.theta, eegData.theta || 0].slice(-maxPoints),
          delta: [...prev.delta, eegData.delta || 0].slice(-maxPoints),
          timestamps: [...prev.timestamps, new Date().toLocaleTimeString()].slice(-maxPoints)
        };
      });
    }
  }, [eegData]);

  // Chart configuration
  const chartData = {
    labels: dataPoints.timestamps,
    datasets: [
      {
        label: 'Alpha (8-13 Hz)',
        data: dataPoints.alpha,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Beta (13-30 Hz)',
        data: dataPoints.beta,
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4
      },
      {
        label: 'Theta (4-8 Hz)',
        data: dataPoints.theta,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      },
      {
        label: 'Delta (0.5-4 Hz)',
        data: dataPoints.delta,
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Live EEG Brainwave Activity'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amplitude (μV)'
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
      duration: 0 // Disable animation for real-time updates
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Live EEG Session</h2>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded ${isConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className="text-gray-600">Mode: {mode}</span>
          <span className="text-gray-600">Patient ID: {patientId}</span>
        </div>
      </div>

      {/* Current Values */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">Alpha</p>
          <p className="text-2xl font-bold text-blue-900">
            {eegData?.alpha?.toFixed(3) || '--'}
          </p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <p className="text-sm text-purple-800 font-medium">Beta</p>
          <p className="text-2xl font-bold text-purple-900">
            {eegData?.beta?.toFixed(3) || '--'}
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-sm text-green-800 font-medium">Theta</p>
          <p className="text-2xl font-bold text-green-900">
            {eegData?.theta?.toFixed(3) || '--'}
          </p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg">
          <p className="text-sm text-orange-800 font-medium">Delta</p>
          <p className="text-2xl font-bold text-orange-900">
            {eegData?.delta?.toFixed(3) || '--'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-lg shadow" style={{ height: '400px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Data Stream Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>Last update: {eegData?.timestamp || 'No data yet'}</p>
        <p>Data points collected: {dataPoints.alpha.length}</p>
      </div>
    </div>
  );
};
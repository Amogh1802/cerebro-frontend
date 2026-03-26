// src/components/EEGDashboard.jsx
import React from 'react';
import { useEEGWebSocket } from '../hooks/useEEGWebSocket';

export const EEGDashboard = () => {
  const { eegData, isConnected } = useEEGWebSocket();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">EEG Data Monitor</h1>

      {/* Connection Status */}
      <div className="mb-6">
        <span
          className={`px-4 py-2 rounded-full text-white font-semibold ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {isConnected ? '🟢 Connected to LabVIEW' : '🔴 Disconnected'}
        </span>
      </div>

      {/* EEG Data Display */}
      {eegData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DataCard label="Voltage" value={eegData.voltage?.toFixed(4)} unit="V" />
          <DataCard label="Alpha" value={eegData.alpha?.toFixed(4)} color="bg-blue-100 text-blue-800" />
          <DataCard label="Beta" value={eegData.beta?.toFixed(4)} color="bg-purple-100 text-purple-800" />
          <DataCard label="Theta" value={eegData.theta?.toFixed(4)} color="bg-green-100 text-green-800" />
          <DataCard label="Delta" value={eegData.delta?.toFixed(4)} color="bg-orange-100 text-orange-800" />
          <DataCard label="RMS Alpha" value={eegData.rmsAlpha?.toFixed(4)} />
          <DataCard label="RMS Beta" value={eegData.rmsBeta?.toFixed(4)} />
          <DataCard label="RMS Theta" value={eegData.rmsTheta?.toFixed(4)} />
          <DataCard label="RMS Delta" value={eegData.rmsDelta?.toFixed(4)} />
          <DataCard label="State Code" value={eegData.statecode} />
          <DataCard label="Timestamp" value={eegData.Timestamp} />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Waiting for EEG data from LabVIEW...</p>
        </div>
      )}
    </div>
  );
};

const DataCard = ({ label, value, unit = '', color = 'bg-gray-100 text-gray-800' }) => (
  <div className={`p-4 rounded-lg shadow-md ${color}`}>
    <p className="text-sm font-medium opacity-75 mb-1">{label}</p>
    <p className="text-2xl font-bold">
      {value ?? '--'} {unit}
    </p>
  </div>
);
9// src/hooks/useEEGWebSocket.js
import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useEEGWebSocket = () => {
  const [eegData, setEegData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:9090/ws'),
      debug: (str) => console.log('STOMP:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('✅ Connected to WebSocket');
        setIsConnected(true);

        client.subscribe('/topic/eeg', (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log('📊 EEG Data received:', data);
            setEegData(data);
          } catch (error) {
            console.error('Error parsing EEG data:', error);
          }
        });
      },

      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
        setIsConnected(false);
      },

      onDisconnect: () => {
        console.log('🔌 Disconnected from WebSocket');
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  return { eegData, isConnected };
};
import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import API_BASE_URL from '../config';

const WS_URL = API_BASE_URL.replace('/api', '/ws');

export const useEEGWebSocket = () => {
  const [eegData, setEegData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      debug: (str) => console.log('STOMP:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);

        client.subscribe('/topic/eeg', (message) => {
          try {
            const data = JSON.parse(message.body);
            setEegData(data);
          } catch (error) {
            console.error('Error parsing EEG data:', error);
          }
        });
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setIsConnected(false);
      },

      onDisconnect: () => {
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
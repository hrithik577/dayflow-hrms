import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) socket.close();
      setSocket(null);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('⚡ Connected to Dayflow Real-Time WebSocket server');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type) {
          console.log(`🔔 WebSocket Event Received [${payload.type}]:`, payload.data);
          setLastEvent(payload);
        }
      } catch (e) {
        // text ACK
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, lastEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: false, // Don't connect until we have a userId
  reconnection: true,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
});

export default socket;

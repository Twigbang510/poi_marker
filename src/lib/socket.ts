import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// Always use Render server for both development and production
const SOCKET_URL = "https://poi-marker-socket.onrender.com";

export function getSocket() {
  if (!socket) {
    console.log("Creating socket connection to:", SOCKET_URL);
    
    socket = io(SOCKET_URL, { 
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully to:', SOCKET_URL);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    console.log("Disconnecting socket");
    socket.disconnect();
    socket = null;
  }
} 
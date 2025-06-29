import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.MODE === "production" 
        ? "https://poi-marker-socket.onrender.com" 
        : "http://localhost:3001");
    
    socket = io(socketUrl, { 
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true
    });
  }
  console.log("socket connecting to:", socket);
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
} 
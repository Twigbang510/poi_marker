import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const socketUrl = "https://poi-marker-socket.onrender.com";
    
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
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Khi tài xế gửi tọa độ
  socket.on("location:update", (data) => {
    // data = { id, name, lat, lng, accuracy, lastUpdate, isOnline }
    io.emit("location:broadcast", data); // Broadcast đến tất cả admin
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Socket.IO server running on port 3001");
});

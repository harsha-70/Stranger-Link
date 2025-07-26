const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" })); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let waiting = null;

io.on("connection", (socket) => {
  socket.on("find_partner", () => {
    if (waiting && waiting !== socket) {
      const roomId = `${socket.id}#${waiting.id}`;
      socket.join(roomId);
      waiting.join(roomId);

      socket.emit("partner_found", { roomId });
      waiting.emit("partner_found", { roomId });

      // Save reference for messaging
      socket.roomId = roomId;
      waiting.roomId = roomId;
      waiting = null;
    } else {
      waiting = socket;
      socket.emit("waiting");
    }
  });

  // Receive and relay messages between partners
  socket.on("send_message", ({ roomId, message }) => {
    socket.to(roomId).emit("receive_message", message);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (waiting === socket) waiting = null;
    if (socket.roomId) {
      socket.to(socket.roomId).emit("partner_disconnected");
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

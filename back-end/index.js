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

let waitingQueue = []; // queue to store users waiting for a partner

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("find_partner", () => {
    if (waitingQueue.length > 0) {
      const partner = waitingQueue.shift(); // get the first user waiting
      const roomId = `${socket.id}#${partner.id}`;
      socket.join(roomId);
      partner.join(roomId);

      // Save room info
      socket.roomId = roomId;
      partner.roomId = roomId;

      // Notify both users
      socket.emit("partner_found", { roomId });
      partner.emit("partner_found", { roomId });
    } else {
      waitingQueue.push(socket); // add to waiting list
      socket.emit("waiting");
    }
  });

  // Handle message sending
  socket.on("send_message", ({ roomId, message }) => {
    socket.to(roomId).emit("receive_message", message);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove from waiting queue if still waiting
    waitingQueue = waitingQueue.filter((s) => s !== socket);

    // Notify partner if they had one
    if (socket.roomId) {
      socket.to(socket.roomId).emit("partner_disconnected");
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Backend running on http://localhost:${PORT}`);
});

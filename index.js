const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let waitingUser = null;
let activeUsers = [];

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Match users
  if (waitingUser) {
    socket.emit("match", waitingUser);
    io.to(waitingUser).emit("match", socket.id);
    waitingUser = null;
  } else {
    waitingUser = socket.id;
  }

  // Disconnect event
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    if (waitingUser === socket.id) {
      waitingUser = null; // Reset waiting user if they disconnect
    } else {
      const index = activeUsers.indexOf(socket.id);
      if (index !== -1) {
        activeUsers.splice(index, 1);
      }
    }
  });

  // Chat messages
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  // Next button (disconnect and connect to another stranger)
  socket.on("next", () => {
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
    socket.disconnect();
  });
});

// Server running
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

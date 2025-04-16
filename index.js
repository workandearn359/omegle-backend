const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let waitingUsers = [];
let activePairs = new Map(); // key = socket.id, value = partner's socket

// Matchmaking function
function pairUsers(socket1, socket2) {
  activePairs.set(socket1.id, socket2);
  activePairs.set(socket2.id, socket1);

  socket1.emit('stranger-connected');
  socket2.emit('stranger-connected');
}

// Disconnect both users in a pair
function disconnectPair(socket) {
  const partner = activePairs.get(socket.id);
  if (partner) {
    partner.emit('partner-disconnected');
    activePairs.delete(partner.id);
  }
  activePairs.delete(socket.id);
}

// Handle new connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Try to pair user
  if (waitingUsers.length > 0) {
    const partner = waitingUsers.shift();
    pairUsers(socket, partner);
  } else {
    waitingUsers.push(socket);
  }

  // Handle messages
  socket.on('message', (msg) => {
    const partner = activePairs.get(socket.id);
    if (partner) {
      partner.emit('message', msg);
    }
  });

  // Handle "next" button click
  socket.on('next', () => {
    disconnectPair(socket);

    // Put back in queue
    const index = waitingUsers.indexOf(socket);
    if (index === -1) waitingUsers.push(socket);

    if (waitingUsers.length >= 2) {
      const [s1, s2] = [waitingUsers.shift(), waitingUsers.shift()];
      pairUsers(s1, s2);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    disconnectPair(socket);

    // Remove from waiting queue
    waitingUsers = waitingUsers.filter((s) => s.id !== socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Keep a queue of unmatched users
let waitingUsers = [];

const pairs = new Map(); // socket.id -> partner socket

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Try to pair the user
  if (waitingUsers.length > 0) {
    const partner = waitingUsers.pop();

    // Save pairing both sides
    pairs.set(socket.id, partner);
    pairs.set(partner.id, socket);

    // Notify both users
    socket.emit('stranger-connected');
    partner.emit('stranger-connected');
  } else {
    waitingUsers.push(socket);
  }

  // Handle incoming message
  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      partner.emit('message', msg);
    }
  });

  // Handle "next" button
  socket.on('next', () => {
    const partner = pairs.get(socket.id);

    if (partner) {
      partner.emit('stranger-disconnected');
      pairs.delete(partner.id);
      waitingUsers.push(partner);
    }

    pairs.delete(socket.id);

    if (waitingUsers.length > 0) {
      const newPartner = waitingUsers.pop();
      pairs.set(socket.id, newPartner);
      pairs.set(newPartner.id, socket);
      socket.emit('stranger-connected');
      newPartner.emit('stranger-connected');
    } else {
      waitingUsers.push(socket);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove from waiting queue
    waitingUsers = waitingUsers.filter((s) => s.id !== socket.id);

    const partner = pairs.get(socket.id);
    if (partner) {
      partner.emit('stranger-disconnected');
      waitingUsers.push(partner);
      pairs.delete(partner.id);
    }

    pairs.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

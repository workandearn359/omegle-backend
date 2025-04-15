const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // To allow requests from frontend

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow any origin for now
    methods: ['GET', 'POST']
  }
});

let waitingUser = null; // Holds the user waiting for a match
const pairs = new Map(); // Store socket.id pairs

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  if (waitingUser) {
    const partner = waitingUser;
    pairs.set(socket.id, partner);
    pairs.set(partner.id, socket);

    socket.emit('stranger-connected');
    partner.emit('stranger-connected');

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      partner.emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    const partner = pairs.get(socket.id);
    if (partner) {
      partner.emit('message', 'Stranger disconnected');
      pairs.delete(partner.id);
    }

    pairs.delete(socket.id);

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

app.get('/', (req, res) => {
  res.send('Hello from backend');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

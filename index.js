const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello from backend');
});

const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for now
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('message', (data) => {
    console.log('Message received:', data);
    // Broadcast the message to all other users
    socket.broadcast.emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

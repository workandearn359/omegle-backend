const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

let users = {}; // Active users

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  users[socket.id] = null;

  socket.on('next', () => {
    let availableUser = Object.keys(users).find(
      (key) => users[key] === null && key !== socket.id
    );

    if (availableUser) {
      users[socket.id] = availableUser;
      users[availableUser] = socket.id;
      socket.emit('stranger', { id: availableUser });
      io.to(availableUser).emit('stranger', { id: socket.id });
    } else {
      socket.emit('stranger', { message: 'No one available for chat right now!' });
    }
  });

  socket.on('chat message', (data) => {
    let recipient = io.sockets.sockets.get(data.id);
    if (recipient) {
      recipient.emit('chat message', data.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (users[socket.id]) {
      let partner = users[socket.id];
      io.to(partner).emit('stranger', { message: 'Your partner has disconnected.' });
      users[partner] = null;
    }
    delete users[socket.id];
  });
});

app.get('/healthz', (req, res) => {
  res.send('OK');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

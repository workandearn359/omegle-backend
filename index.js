// server.js (or index.js)

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};  // Using an object to track active users by socket id

// Handling socket connections
io.on('connection', (socket) => {
  console.log('New user connected');
  
  // Add user to the list with socket id as key
  users[socket.id] = null;  // Null means not connected to a stranger yet

  // Handle "next" event (stranger matching)
  socket.on('next', () => {
    // Find the first available user that is not already paired
    let availableUser = Object.keys(users).find((key) => users[key] === null && key !== socket.id);
    
    if (availableUser) {
      users[socket.id] = availableUser;
      users[availableUser] = socket.id;
      socket.emit('stranger', { id: availableUser });
      io.to(availableUser).emit('stranger', { id: socket.id });
    } else {
      socket.emit('stranger', { message: "No one available for chat right now!" });
    }
  });

  // Handle chat messages between users
  socket.on('chat message', (data) => {
    let recipient = io.sockets.sockets.get(data.id);  // Find the other user
    if (recipient) {
      recipient.emit('chat message', data.message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Disconnecting user, reset their pair and notify the other user
    if (users[socket.id]) {
      let pairedUser = users[socket.id];
      io.to(pairedUser).emit('stranger', { message: 'Your partner has disconnected.' });
      users[pairedUser] = null;  // Reset paired user
    }
    delete users[socket.id];
    console.log('User disconnected');
  });
});

// Set up a basic health check route
app.get('/healthz', (req, res) => {
  res.send('OK');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

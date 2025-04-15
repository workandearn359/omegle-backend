const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let currentStranger = null; // Holds the current connected stranger

// Handle new connections
io.on('connection', (socket) => {
    console.log('New client connected');

    // Match with a stranger if one is available
    if (currentStranger) {
        // If there's an available stranger, connect the two clients
        currentStranger.emit('stranger-connected');
        socket.emit('stranger-connected');
        currentStranger = null; // Reset stranger after matching
    } else {
        // If no stranger, wait for the next connection
        currentStranger = socket;
    }

    // Listen for messages
    socket.on('message', (message) => {
        console.log('Received message:', message);
        if (currentStranger) {
            // Forward message to the other connected stranger
            currentStranger.emit('message', message);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        if (currentStranger === socket) {
            currentStranger = null; // Reset stranger if the matched client disconnects
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

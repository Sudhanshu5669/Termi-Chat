const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('Connected:', socket.id);
    
    socket.on('get_rooms', () => {
        socket.emit('rooms_list', Array.from(rooms.keys()));
    });
    
    socket.on('join_room', (roomId) => {
        roomId = roomId.trim();
        if (socket.currentRoom) {
            const oldRoom = socket.currentRoom;
            socket.leave(oldRoom);
            rooms.set(oldRoom, rooms.get(oldRoom) - 1);
            if (rooms.get(oldRoom) === 0) {
                rooms.delete(oldRoom);
                console.log(`Room ${oldRoom} deleted`);
            }
        }
        socket.join(roomId);
        socket.currentRoom = roomId;
        rooms.set(roomId, (rooms.get(roomId) || 0) + 1);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
        socket.emit('joined_room', roomId);
    });
    
    socket.on('room_message', (msg) => {
        if (!socket.currentRoom) return;
        socket.to(socket.currentRoom).emit('room_message', {
            sender: socket.id.slice(0, 4),
            text: msg
        });
    });
    
    socket.on('disconnect', () => {
        const roomId = socket.currentRoom;
        if (!roomId) return;
        rooms.set(roomId, rooms.get(roomId) - 1);
        if (rooms.get(roomId) === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted`);
        }
        console.log('Disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
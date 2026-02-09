const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const rooms = new Map(); // roomId -> user count

io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    // Send list of rooms
    socket.on('get_rooms', () => {
        socket.emit('rooms_list', Array.from(rooms.keys()));
    });

    // Join / create room
    socket.on('join_room', (roomId) => {
        roomId = roomId.trim();

        // Leave old room if exists
        if (socket.currentRoom) {
            const oldRoom = socket.currentRoom;
            socket.leave(oldRoom);

            rooms.set(oldRoom, rooms.get(oldRoom) - 1);
            if (rooms.get(oldRoom) === 0) {
                rooms.delete(oldRoom);
                console.log(`Room ${oldRoom} deleted`);
            }
        }

        // Join new room
        socket.join(roomId);
        socket.currentRoom = roomId;

        rooms.set(roomId, (rooms.get(roomId) || 0) + 1);

        console.log(`Socket ${socket.id} joined room ${roomId}`);
        socket.emit('joined_room', roomId);
    });

    // Message inside room (send to everyone INCLUDING sender)
    socket.on('room_message', (msg) => {
        if (!socket.currentRoom) return;

        io.to(socket.currentRoom).emit('room_message', {
            sender: socket.id.slice(0, 4),
            text: msg
        });
    });

    // Disconnect cleanup
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

httpServer.listen(3000, () => {
    console.log('Server running on port 3000');
});

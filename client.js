const { io } = require("socket.io-client");
const readline = require("readline");

const socket = io("http://localhost:3000");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let currentRoom = null;

socket.on("connect", () => {
    console.log("Connected to server");
    socket.emit("get_rooms");
});

socket.on("rooms_list", (rooms) => {
    console.log("\nAvailable rooms:");
    if (rooms.length === 0) {
        console.log("  (none)");
    } else {
        rooms.forEach(r => console.log(`  - ${r}`));
    }

    rl.question("\nEnter room number to join/create: ", (room) => {
        socket.emit("join_room", room);
    });
});

socket.on("joined_room", (room) => {
    currentRoom = room;
    console.log(`\nJoined room ${room}`);
    rl.setPrompt(`[Room ${room}] > `);
    rl.prompt();
});

socket.on("room_message", (data) => {
    console.log(`\n[${data.sender}]: ${data.text}`);
    rl.prompt();
});

rl.on("line", (line) => {
    if (!currentRoom) return;
    socket.emit("room_message", line);
    rl.prompt();
});

const express = require('express')
const { Server } = require('socket.io')
const { createServer } = require('http')

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { });

io.on('connection', (socket)=>{
    console.log("A client connected: ", socket.id)
})

httpServer.listen(3000, ()=>{
    console.log("Server started...")
})
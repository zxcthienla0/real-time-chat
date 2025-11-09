require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');
const { initializeDatabase} = require("./models");
const router = require("./users/user-router");
const conversationRouter = require("./Conversation/conversation-router");
const messageRouter = require("./Message/message-router");
const SocketHandler = require('./websocket/SocketHandler');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

initializeDatabase();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const projectRoot = path.join(__dirname, '../');
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));
app.use('/uploads/images', express.static(path.join(projectRoot, 'uploads/images')));
app.use('/uploads/audio', express.static(path.join(projectRoot, 'uploads/audio')));
app.use('/uploads/files', express.static(path.join(projectRoot, 'uploads/files')));

app.use("/api", router);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);

const server = http.createServer(app);

const socketHandler = new SocketHandler(server);

app.set('socketHandler', socketHandler);

const start = async () => {
    try {
        server.listen(port, () => {
            console.log(`Server started on port ${port}`);
            console.log(`WebSocket server ready`);
        });
    } catch(err) {
        console.log(err);
    }
}

start();
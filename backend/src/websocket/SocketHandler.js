const socketIO = require('socket.io');
const authSocket = require('./middleware/authSocket');
const messageHandler = require('./handlers/messageHandler');
const typingHandler = require('./handlers/typingHandler');
const onlineHandler = require('./handlers/onlineHandler');

class SocketHandler {
    constructor(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    setupMiddleware() {
        this.io.use(authSocket);
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {

            socket.join(`user_${socket.userId}`);

            messageHandler(socket, this.io);
            typingHandler(socket, this.io);
            onlineHandler(socket, this.io);

        });
    }

    sendToUser(userId, event, data) {
        this.io.to(`user_${userId}`).emit(event, data);
    }
}

module.exports = SocketHandler;
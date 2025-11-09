const connectedUsers = new Map();

const onlineHandler = (socket, io) => {
    if (!connectedUsers.has(socket.userId)) {
        connectedUsers.set(socket.userId, []);
    }
    connectedUsers.get(socket.userId).push(socket.id);


    if (connectedUsers.get(socket.userId).length === 1) {
        socket.broadcast.emit('user_online', { userId: socket.userId });

        const onlineUsers = Array.from(connectedUsers.keys());
        socket.emit('online_users', { users: onlineUsers });
    }

    socket.on('disconnect', (reason) => {

        if (connectedUsers.has(socket.userId)) {
            const userSockets = connectedUsers.get(socket.userId);
            const index = userSockets.indexOf(socket.id);

            if (index > -1) {
                userSockets.splice(index, 1);
            }

            if (userSockets.length === 0) {
                connectedUsers.delete(socket.userId);
                socket.broadcast.emit('user_offline', { userId: socket.userId });
            } else {
                console.log(`User ${socket.userId} still has ${userSockets.length} connections`);
            }
        }
    });

    socket.on('get_online_users', () => {
        const onlineUsers = Array.from(connectedUsers.keys());
        socket.emit('online_users', { users: onlineUsers });
    });
};

module.exports = onlineHandler;
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const authSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            console.log('No token provided');
            return next(new Error('Authentication error: No token'));
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const user = await User.findByPk(decoded.id);
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.id;
        socket.user = {
            id: user.id,
            email: user.email,
            nickname: user.nickname
        };

        console.log(`User ${user.id} authenticated for WebSocket`);
        next();

    } catch (error) {
        console.error('WebSocket auth error:', error.message);
        if (error.name === 'TokenExpiredError') {
            return next(new Error('Authentication error: Token expired'));
        }

        next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = authSocket;
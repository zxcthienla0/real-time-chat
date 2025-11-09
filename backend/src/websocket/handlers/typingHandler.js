const { Conversation } = require('../../models');

const typingHandler = (socket, io) => {

    socket.on('typing_start', async (data) => {
        try {
            const { conversationId } = data;

            const conversation = await Conversation.findByPk(conversationId);
            if (!conversation) return;

            const partnerId = conversation.user1Id === socket.userId
                ? conversation.user2Id
                : conversation.user1Id;

            socket.to(`user_${partnerId}`).emit('user_typing', {
                userId: socket.userId,
                conversationId
            });

        } catch (error) {
            console.error('Error in typing_start:', error);
        }
    });

    socket.on('typing_stop', async (data) => {
        try {
            const { conversationId } = data;

            const conversation = await Conversation.findByPk(conversationId);
            if (!conversation) return;

            const partnerId = conversation.user1Id === socket.userId
                ? conversation.user2Id
                : conversation.user1Id;

            socket.to(`user_${partnerId}`).emit('user_stop_typing', {
                userId: socket.userId,
                conversationId
            });

        } catch (error) {
            console.error('Error in typing_stop:', error);
        }
    });
};

module.exports = typingHandler;
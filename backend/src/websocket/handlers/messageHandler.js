const { Message, Conversation } = require('../../models');
const { Op } = require('sequelize');

const messageHandler = (socket, io) => {

    socket.on('send_message', async (data) => {
        try {
            const {
                conversationId,
                content,
                messageType = 'text',
                fileUrl,
                duration,
                fileSize,
                mimeType
            } = data;

            if (messageType === 'text' && (!content || content.trim() === '')) {
                socket.emit('error', { message: 'Текст сообщения не может быть пустым' });
                return;
            }

            if (messageType !== 'text' && !fileUrl) {
                socket.emit('error', { message: 'Для файлового сообщения обязателен fileUrl' });
                return;
            }

            const conversation = await Conversation.findOne({
                where: {
                    id: conversationId,
                    [Op.or]: [
                        { user1Id: socket.userId },
                        { user2Id: socket.userId }
                    ]
                },
                include: [
                    {
                        model: require('../../models').User,
                        as: 'user1',
                        attributes: ['id', 'nickname', 'avatar']
                    },
                    {
                        model: require('../../models').User,
                        as: 'user2',
                        attributes: ['id', 'nickname', 'avatar']
                    }
                ]
            });

            if (!conversation) {
                socket.emit('error', { message: 'Диалог не найден или доступ запрещен' });
                return;
            }

            const partnerId = conversation.user1Id === socket.userId
                ? conversation.user2Id
                : conversation.user1Id;

            const messageData = {
                messageType,
                senderId: socket.userId,
                conversationId,
                isEdited: false,
                isDeleted: false
            };

            if (messageType === 'text') {
                messageData.content = content.trim();
            } else {
                messageData.fileUrl = fileUrl;
                messageData.fileSize = fileSize;
                messageData.mimeType = mimeType;

                if (messageType === 'voice' && duration) {
                    messageData.duration = duration;
                }

                if (content && content.trim() !== '') {
                    messageData.content = content.trim();
                }
            }

            const message = await Message.create(messageData);

            const messageWithSender = await Message.findByPk(message.id, {
                include: [{
                    model: require('../../models').User,
                    as: 'sender',
                    attributes: ['id', 'nickname', 'avatar']
                }]
            });

            let lastMessageContent = '';

            switch (messageType) {
                case 'text':
                    lastMessageContent = content;
                    break;
                case 'image':
                    lastMessageContent = '📷 Фото';
                    break;
                case 'voice':
                    lastMessageContent = '🎤 Голосовое сообщение';
                    break;
                case 'file':
                    lastMessageContent = '📎 Файл';
                    break;
                default:
                    lastMessageContent = 'Новое сообщение';
            }

            if (messageType !== 'text' && content && content.trim() !== '') {
                lastMessageContent += `: ${content}`;
            }

            await Conversation.update(
                {
                    lastMessage: lastMessageContent,
                    lastMessageAt: new Date()
                },
                { where: { id: conversationId } }
            );

            socket.to(`user_${partnerId}`).emit('new_message', messageWithSender);

        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            socket.emit('error', {
                message: 'Ошибка при отправке сообщения',
                details: error.message
            });
        }
    });

    socket.on('edit_message', async (data) => {
        try {
            const { messageId, newContent } = data;

            if (!newContent || newContent.trim() === '') {
                socket.emit('error', { message: 'Текст сообщения не может быть пустым' });
                return;
            }

            const message = await Message.findOne({
                where: {
                    id: messageId,
                    senderId: socket.userId,
                    messageType: 'text'
                },
                include: [{
                    model: Conversation,
                    attributes: ['user1Id', 'user2Id']
                }]
            });

            if (!message) {
                socket.emit('error', {
                    message: 'Сообщение не найдено или недоступно для редактирования'
                });
                return;
            }

            await message.update({
                content: newContent.trim(),
                isEdited: true
            });

            const partnerId = message.Conversation.user1Id === socket.userId
                ? message.Conversation.user2Id
                : message.Conversation.user1Id;

            const lastMessage = await Message.findOne({
                where: { conversationId: message.conversationId },
                order: [['createdAt', 'DESC']]
            });

            if (lastMessage && lastMessage.id === messageId) {
                await Conversation.update(
                    {
                        lastMessage: newContent.trim()
                    },
                    { where: { id: message.conversationId } }
                );
            }

            const editData = {
                messageId,
                newContent: newContent.trim(),
                editedAt: new Date()
            };

            socket.emit('message_edited', editData);

            socket.to(`user_${partnerId}`).emit('message_edited', editData);


        } catch (error) {
            console.error('Ошибка редактирования сообщения:', error);
            socket.emit('error', {
                message: 'Ошибка при редактировании сообщения',
                details: error.message
            });
        }
    });

    socket.on('delete_message', async (data) => {
        try {
            const { messageId } = data;

            const message = await Message.findOne({
                where: {
                    id: messageId,
                    senderId: socket.userId
                },
                include: [{
                    model: Conversation,
                    attributes: ['user1Id', 'user2Id']
                }]
            });

            if (!message) {
                socket.emit('error', {
                    message: 'Сообщение не найдено или недоступно для удаления'
                });
                return;
            }

            await message.update({
                isDeleted: true,
                content: 'Сообщение удалено',
                fileUrl: null
            });

            const partnerId = message.Conversation.user1Id === socket.userId
                ? message.Conversation.user2Id
                : message.Conversation.user1Id;

            const deleteData = {
                messageId,
                deletedAt: new Date()
            };

            socket.to(`user_${partnerId}`).emit('message_deleted', deleteData);

            console.log(`🗑️ Сообщение удалено: Message ${messageId} by User ${socket.userId}`);

        } catch (error) {
            console.error('Ошибка удаления сообщения:', error);
            socket.emit('error', {
                message: 'Ошибка при удалении сообщения',
                details: error.message
            });
        }
    });

    socket.on('get_messages', async (data) => {
        try {
            const { conversationId, page = 1, limit = 50 } = data;

            const conversation = await Conversation.findOne({
                where: {
                    id: conversationId,
                    [Op.or]: [
                        { user1Id: socket.userId },
                        { user2Id: socket.userId }
                    ]
                }
            });

            if (!conversation) {
                socket.emit('error', { message: 'Диалог не найден или доступ запрещен' });
                return;
            }

            const offset = (page - 1) * limit;

            const messages = await Message.findAndCountAll({
                where: {
                    conversationId,
                    isDeleted: false
                },
                include: [{
                    model: require('../../models').User,
                    as: 'sender',
                    attributes: ['id', 'nickname', 'avatar']
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });

            socket.emit('messages_history', {
                conversationId,
                messages: messages.rows.reverse(),
                total: messages.count,
                page: parseInt(page),
                totalPages: Math.ceil(messages.count / limit)
            });

        } catch (error) {
            console.error('Ошибка получения истории сообщений:', error);
            socket.emit('error', {
                message: 'Ошибка при загрузке сообщений',
                details: error.message
            });
        }
    });
};

module.exports = messageHandler;
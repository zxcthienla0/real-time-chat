import { useState, useEffect, useRef } from 'react';
import type { Conversation, Message } from '../../types';
import { Sidebar } from '../layout/Sidebar';
import { ChatWindow } from './ChatWindow';
import { chatService } from '../../services/chatService';
import { Loader } from '../common/Loader';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../contexts/AuthContext';

export const ChatPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<number[]>([]);

    const processedMessageIds = useRef(new Set<string>());

    const { user } = useAuth();
    const {
        sendMessage,
        sendFileMessage,
        startTyping,
        stopTyping,
        onNewMessage,
        onUserTyping,
        onUserStopTyping,
        isConnected,
        onlineUsers,
        joinConversations
    } = useWebSocket();

    useEffect(() => {
        loadConversations();

        const handleNewMessage = (newMessage: Message) => {
            if (processedMessageIds.current.has(newMessage.id)) {
                return;
            }

            processedMessageIds.current.add(newMessage.id);

            setMessages(prev => {
                const alreadyExists = prev.some(msg => msg.id === newMessage.id);
                if (alreadyExists) {
                    return prev;
                }
                return [...prev, newMessage];
            });

            setConversations(prev => {
                const updated = prev.map(conv =>
                    conv.id === newMessage.conversationId
                        ? {
                            ...conv,
                            lastMessage: getLastMessagePreview(newMessage),
                            lastMessageAt: newMessage.createdAt
                        }
                        : conv
                ).sort((a, b) =>
                    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                );

                return updated;
            });
        };

        const handleUserTyping = (data: { userId: number, conversationId: string }) => {
            setTypingUsers(prev => {
                if (prev.includes(data.userId)) {
                    return prev;
                }
                return [...prev, data.userId];
            });
        };

        const handleUserStopTyping = (data: { userId: number, conversationId: string }) => {
            setTypingUsers(prev => prev.filter(id => id !== data.userId));
        };

        const unsubscribeNewMessage = onNewMessage(handleNewMessage);
        const unsubscribeUserTyping = onUserTyping(handleUserTyping);
        const unsubscribeUserStopTyping = onUserStopTyping(handleUserStopTyping);

        return () => {
            unsubscribeNewMessage();
            unsubscribeUserTyping();
            unsubscribeUserStopTyping();
            processedMessageIds.current.clear();
        };
    }, [selectedConversation, onNewMessage, onUserTyping, onUserStopTyping, user]);

    useEffect(() => {
        if (isConnected && conversations.length > 0) {
            const conversationIds = conversations.map(conv => conv.id);
            joinConversations(conversationIds);
        }
    }, [isConnected, conversations, joinConversations]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            processedMessageIds.current.clear();
        }
    }, [selectedConversation]);

    const getLastMessagePreview = (message: Message): string => {
        switch (message.messageType) {
            case 'text':
                return message.content || '';
            case 'image':
                return message.content
                    ? `Фото: ${message.content}`
                    : 'Фото';
            case 'voice':
                return message.content
                    ? `Голосовое: ${message.content}`
                    : 'Голосовое сообщение';
            case 'file':
                return message.content
                    ? `Файл: ${message.content}`
                    : 'Файл';
            default:
                return 'Новое сообщение';
        }
    };

    const loadConversations = async () => {
        try {
            const data = await chatService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Ошибка загрузки диалогов:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            const data = await chatService.getMessages(conversationId, 1, 50, 'ASC');
            setMessages(data.rows);
        } catch (error) {
            console.error('Ошибка загрузки сообщений:', error);
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!selectedConversation || !user) {
            return;
        }

        try {
            const tempId = `temp-${Date.now()}`;

            const optimisticMessage: Message = {
                id: tempId,
                content,
                messageType: 'text',
                senderId: user.id,
                conversationId: selectedConversation.id,
                isEdited: false,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                sender: {
                    id: user.id,
                    email: user.email,
                    nickname: user.nickname,
                    avatar: user.avatar
                }
            };

            setMessages(prev => {
                return [...prev, optimisticMessage];
            });

            setConversations(prev => {
                const updated = prev.map(conv =>
                    conv.id === selectedConversation.id
                        ? {
                            ...conv,
                            lastMessage: content,
                            lastMessageAt: new Date().toISOString()
                        }
                        : conv
                ).sort((a, b) =>
                    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                );

                return updated;
            });

            sendMessage(selectedConversation.id, content);

        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
        }
    };

    const handleSendFileMessage = (fileData: {
        fileUrl: string;
        messageType: 'image' | 'voice' | 'file';
        content?: string;
        duration?: number;
        fileSize: number;
        mimeType: string;
    }) => {
        if (!selectedConversation || !user) {
            return;
        }

        try {
            const tempId = `temp-${Date.now()}`;

            let lastMessageText = '';
            switch (fileData.messageType) {
                case 'image':
                    lastMessageText = '📷 Фото';
                    break;
                case 'voice':
                    lastMessageText = '🎤 Голосовое сообщение';
                    break;
                case 'file':
                    lastMessageText = '📎 Файл';
                    break;
            }

            if (fileData.content && fileData.content.trim() !== '') {
                lastMessageText += `: ${fileData.content}`;
            }

            const optimisticMessage: Message = {
                id: tempId,
                content: fileData.content,
                messageType: fileData.messageType,
                fileUrl: fileData.fileUrl,
                duration: fileData.duration,
                fileSize: fileData.fileSize,
                mimeType: fileData.mimeType,
                senderId: user.id,
                conversationId: selectedConversation.id,
                isEdited: false,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                sender: {
                    id: user.id,
                    email: user.email,
                    nickname: user.nickname,
                    avatar: user.avatar
                }
            };

            setMessages(prev => {
                return [...prev, optimisticMessage];
            });

            setConversations(prev => {
                const updated = prev.map(conv =>
                    conv.id === selectedConversation.id
                        ? {
                            ...conv,
                            lastMessage: lastMessageText,
                            lastMessageAt: new Date().toISOString()
                        }
                        : conv
                ).sort((a, b) =>
                    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                );

                return updated;
            });

            sendFileMessage(selectedConversation.id, fileData);

        } catch (error) {
            console.error('Ошибка отправки файлового сообщения:', error);
        }
    };

    const handleStartTyping = () => {
        if (selectedConversation) {
            startTyping(selectedConversation.id);
        }
    };

    const handleStopTyping = () => {
        if (selectedConversation) {
            stopTyping(selectedConversation.id);
        }
    };

    const handleNewConversation = (conversation: Conversation) => {
        setConversations(prev => [conversation, ...prev]);
        setSelectedConversation(conversation);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <>
            <Sidebar
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={setSelectedConversation}
                onNewConversation={handleNewConversation}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
                isConnected={isConnected}
            />

            {selectedConversation ? (
                <ChatWindow
                    conversation={selectedConversation}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onSendFileMessage={handleSendFileMessage}
                    onStartTyping={handleStartTyping}
                    onStopTyping={handleStopTyping}
                    typingUsers={typingUsers.filter(id => {
                        const partner = selectedConversation.user1Id === user?.id
                            ? selectedConversation.user2Id
                            : selectedConversation.user1Id;
                        return id === partner;
                    })}
                    onlineUsers={onlineUsers}
                    isConnected={isConnected}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-500 overflow-hidden">
                    <div className="text-center">
                        <h3 className="text-xl font-medium mb-2">Выберите диалог</h3>
                    </div>
                </div>
            )}
        </>
    );
};
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '../types';

export const useWebSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            return;
        }

        const socket = io('http://localhost:3000', {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);
        });

        socket.on('online_users', (data: { users: number[] }) => {
            setOnlineUsers(data.users);
        });

        socket.on('user_online', (data: { userId: number }) => {
            setOnlineUsers(prev => {
                if (prev.includes(data.userId)) {
                    return prev;
                }
                return [...prev, data.userId];
            });
        });

        socket.on('user_offline', (data: { userId: number }) => {
            setOnlineUsers(prev => prev.filter(id => id !== data.userId));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const sendMessage = useCallback((conversationId: string, content: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send_message', {
                conversationId,
                content,
                messageType: 'text'
            });
        } else {
            console.error('WebSocket not connected');
        }
    }, [isConnected]);

    const sendFileMessage = useCallback((conversationId: string, fileData: {
        fileUrl: string;
        messageType: 'image' | 'voice' | 'file';
        content?: string;
        duration?: number;
        fileSize: number;
        mimeType: string;
    }) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send_message', {
                conversationId,
                ...fileData
            });
        } else {
            console.error('WebSocket not connected');
        }
    }, [isConnected]);

    const startTyping = useCallback((conversationId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('typing_start', { conversationId });
        }
    }, [isConnected]);

    const stopTyping = useCallback((conversationId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('typing_stop', { conversationId });
        }
    }, [isConnected]);

    const getOnlineUsers = useCallback(() => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('get_online_users');
        }
    }, [isConnected]);

    const joinConversations = useCallback((conversationIds: string[]) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('join_conversations', conversationIds);
        }
    }, [isConnected]);

    const onNewMessage = useCallback((callback: (message: Message) => void) => {
        if (socketRef.current) {
            socketRef.current.on('new_message', callback);
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.off('new_message', callback);
            }
        };
    }, []);

    const onUserTyping = useCallback((callback: (data: { userId: number, conversationId: string }) => void) => {
        if (socketRef.current) {
            socketRef.current.on('user_typing', callback);
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.off('user_typing', callback);
            }
        };
    }, []);

    const onUserStopTyping = useCallback((callback: (data: { userId: number, conversationId: string }) => void) => {
        if (socketRef.current) {
            socketRef.current.on('user_stop_typing', callback);
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.off('user_stop_typing', callback);
            }
        };
    }, []);

    return {
        isConnected,
        onlineUsers,

        sendMessage,
        sendFileMessage,
        startTyping,
        stopTyping,
        getOnlineUsers,
        joinConversations,

        onNewMessage,
        onUserTyping,
        onUserStopTyping,
    };
};
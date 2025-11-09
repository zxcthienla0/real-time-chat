import api from './api';
import type { Conversation, Message } from '../types';

export const chatService = {
    getConversations: (): Promise<Conversation[]> =>
        api.get('/conversations').then(res => res.data),

    createConversation: (partnerNickname: string): Promise<Conversation> =>
        api.post('/conversations', { partnerNickname }).then(res => res.data),

    getMessages: (conversationId: string, page = 1, limit = 50, order = 'ASC'): Promise<{rows: Message[], count: number}> =>
        api.get(`/messages/${conversationId}?page=${page}&limit=${limit}&order=${order}`).then(res => res.data),

    sendMessage: (conversationId: string, content: string): Promise<Message> =>
        api.post('/messages', { conversationId, content }).then(res => res.data),

    getOnlineUsers: (): Promise<number[]> =>
        api.get('/users/online').then(res => res.data),
};
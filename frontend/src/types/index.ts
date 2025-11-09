export interface User {
    id: number;
    email: string;
    nickname: string;
    avatar?: string;
}

export interface Conversation {
    id: string;
    user1Id: number;
    user2Id: number;
    lastMessage?: string;
    lastMessageAt: string;
    user1: User;
    user2: User;
}

export interface Message {
    id: string;
    content?: string;
    messageType: 'text' | 'image' | 'voice' | 'file';
    fileUrl?: string;
    fileSize?: number;
    duration?: number;
    mimeType?: string;
    senderId: number;
    conversationId: string;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: string;
    sender: {
        id: number;
        email: string;
        nickname: string;
        avatar?: string;
    };
}

export interface UploadedFile {
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    url: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export type Timer = ReturnType<typeof setTimeout>;
import type { Conversation, Message } from '../../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface ChatWindowProps {
    conversation: Conversation;
    messages: Message[];
    onSendMessage: (content: string) => void;
    onSendFileMessage: (fileData: {
        fileUrl: string;
        messageType: 'image' | 'voice' | 'file';
        content?: string;
        duration?: number;
        fileSize: number;
        mimeType: string;
    }) => void;
    onStartTyping?: () => void;
    onStopTyping?: () => void;
    typingUsers: number[];
    onlineUsers: number[];
    isConnected: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
                                                          conversation,
                                                          messages,
                                                          onSendMessage,
                                                          onSendFileMessage,
                                                          onStartTyping,
                                                          onStopTyping,
                                                          typingUsers,
                                                          isConnected,
                                                          onlineUsers
                                                      }) => {
    const { user } = useAuth();

    const getPartner = (conv: Conversation) => {
        if (!user) return conv.user1;
        return conv.user1Id === user.id ? conv.user2 : conv.user1;
    };

    const partner = getPartner(conversation);
    const isPartnerTyping = typingUsers.includes(partner.id);
    const isPartnerOnline = onlineUsers.includes(partner.id);

    const getStatusText = () => {
        if (!isConnected) {
            return 'соединение...';
        }
        if (isPartnerTyping) {
            return 'печатает...';
        }
        return isPartnerOnline ? 'онлайн' : 'оффлайн';
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar src={partner.avatar} alt={partner.nickname} />
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {partner.nickname}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {getStatusText()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <MessageList messages={messages} />

            <MessageInput
                onSendMessage={onSendMessage}
                onSendFileMessage={onSendFileMessage}
                onStartTyping={onStartTyping}
                onStopTyping={onStopTyping}
                isConnected={isConnected}
                disabled={!isConnected}
            />
        </div>
    );
};
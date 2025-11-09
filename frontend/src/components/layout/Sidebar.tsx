import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { chatService } from '../../services/chatService';
import type { Conversation } from '../../types';
import { Avatar } from '../ui/Avatar';

interface SidebarProps {
    conversations: Conversation[];
    selectedConversation?: Conversation;
    onSelectConversation: (conversation: Conversation) => void;
    onNewConversation: (conversation: Conversation) => void;
    onlineUsers: number[];
    typingUsers: number[];
    isConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                    conversations,
                                                    selectedConversation,
                                                    onSelectConversation,
                                                    onNewConversation,
                                                    onlineUsers,
                                                    typingUsers,
                                                    isConnected
                                                }) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatNickname, setNewChatNickname] = useState('');
    const [loading, setLoading] = useState(false);

    const getPartner = (conversation: Conversation) => {
        if (!user) return conversation.user1;
        return conversation.user1Id === user.id ? conversation.user2 : conversation.user1;
    };

    const getPartnerStatus = (conversation: Conversation) => {
        const partner = getPartner(conversation);
        const isPartnerOnline = onlineUsers.includes(partner.id);
        const isPartnerTyping = typingUsers.includes(partner.id);

        return {
            isOnline: isPartnerOnline,
            isTyping: isPartnerTyping,
            statusColor: !isConnected ? 'bg-yellow-500' :
                isPartnerTyping ? 'bg-blue-500' :
                    isPartnerOnline ? 'bg-green-500' : 'bg-gray-400'
        };
    };

    const handleCreateChat = async () => {
        if (!newChatNickname.trim()) return;

        setLoading(true);
        try {
            const conversation = await chatService.createConversation(newChatNickname.trim());
            onNewConversation(conversation);
            setNewChatNickname('');
            setShowNewChat(false);
        } catch (error) {
            console.error('Failed to create chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const partner = getPartner(conv);
        return partner.nickname.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const formatLastMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit'
            });
        }
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Диалоги</h2>
                    <Button
                        size="sm"
                        onClick={() => setShowNewChat(true)}
                    >
                        Новый чат
                    </Button>
                </div>

                <Input
                    placeholder="Поиск диалогов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {showNewChat && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <Input
                            placeholder="Введите никнейм..."
                            value={newChatNickname}
                            onChange={(e) => setNewChatNickname(e.target.value)}
                            className="mb-2"
                        />
                        <div className="flex space-x-2">
                            <Button
                                size="sm"
                                onClick={handleCreateChat}
                                disabled={loading || !newChatNickname.trim()}
                            >
                                {loading ? 'Создание...' : 'Создать'}
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setShowNewChat(false);
                                    setNewChatNickname('');
                                }}
                            >
                                Отмена
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        {searchTerm ? 'Диалоги не найдены' : 'Нет диалогов'}
                    </div>
                ) : (
                    filteredConversations.map(conversation => {
                        const partner = getPartner(conversation);
                        const status = getPartnerStatus(conversation);

                        return (
                            <div
                                key={conversation.id}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                                }`}
                                onClick={() => onSelectConversation(conversation)}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="relative flex-shrink-0">
                                        <Avatar
                                            src={partner.avatar}
                                            alt={partner.nickname}
                                            size="md"
                                        />
                                        <div
                                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${status.statusColor}`}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {partner.nickname}
                                            </p>
                                            {conversation.lastMessageAt && (
                                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                    {formatLastMessageTime(conversation.lastMessageAt)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-500 truncate mt-1">
                                            {status.isTyping ? (
                                                <span className="text-blue-500 flex items-center space-x-1">
                                                    <span>печатает</span>
                                                    <div className="flex space-x-1">
                                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                    </div>
                                                </span>
                                            ) : (
                                                conversation.lastMessage || 'Нет сообщений'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
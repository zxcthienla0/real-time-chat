import type { Conversation } from '../../types';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
                                                                      conversation,
                                                                      isSelected,
                                                                      onClick
                                                                  }) => {
    const { userId } = useAuth();

    const getPartner = (conv: Conversation) => {
        if (!userId) return conv.user1;
        return conv.user1Id === userId ? conv.user2 : conv.user1;
    };

    const partner = getPartner(conversation);

    return (
        <div
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                isSelected ? 'bg-blue-50 border-blue-200' : ''
            }`}
            onClick={onClick}
        >
            <div className="flex items-center space-x-3">
                <Avatar src={partner.avatar} alt={partner.nickname} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {partner.nickname}
                    </p>
                    {conversation.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
import type{ Conversation } from '../../types';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
    conversations: Conversation[];
    selectedConversation?: Conversation;
    onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
                                                                      conversations,
                                                                      selectedConversation,
                                                                      onSelectConversation
                                                                  }) => {
    return (
        <div className="w-80 border-r border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Диалоги</h2>
            </div>
            <div className="overflow-y-auto h-full">
                {conversations.map(conversation => (
                    <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversation?.id === conversation.id}
                        onClick={() => onSelectConversation(conversation)}
                    />
                ))}
            </div>
        </div>
    );
};
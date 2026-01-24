import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';

interface Conversation {
  id: string;
  createdAt: Date;
}

interface ConversationListProps {
  conversations: Conversation[];
  currentSessionId?: string;
}

export default function ConversationList({ conversations, currentSessionId }: ConversationListProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Conversation History</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-4">
          {conversations.map((conversation) => (
            <Link href={`/${conversation.id}`} key={conversation.id}>
              <Card
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  conversation.id === currentSessionId ? 'bg-gray-50' : ''
                }`}
              >
                <CardContent className="py-0 px-4">
                  <div className="">
                    <p className="text-xs text-gray-400 font-mono truncate">{conversation.id}</p>
                    <div className="pt-1 flex justify-between items-center">
                      <p className="text-sm text-gray-600">{formatRelativeTime(conversation.createdAt)}</p>
                      <p className="text-xs text-gray-400">{conversation.createdAt.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

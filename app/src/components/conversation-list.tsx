'use client';

import { useSyncExternalStore } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn, formatSessionTitle } from '@/lib/utils';

interface Conversation {
  id: string;
  createdAt: Date;
}

interface ConversationItemsProps {
  conversations: Conversation[];
  currentSessionId?: string;
}

interface ConversationListProps extends ConversationItemsProps {
  className?: string;
}

const subscribe = () => () => {};

export function ConversationItems({ conversations, currentSessionId }: ConversationItemsProps) {
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  if (conversations.length === 0) {
    return <p className="text-sm text-gray-500">No conversations yet.</p>;
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Link href={`/${conversation.id}`} key={conversation.id} className="block">
          <Card
            className={`cursor-pointer py-3 hover:bg-gray-50 transition-colors ${
              conversation.id === currentSessionId ? 'bg-gray-50 border-[#1E5AA8]' : ''
            }`}
          >
            <CardContent className="px-4">
              <div className="flex justify-between items-center gap-2">
                <p className="text-sm text-gray-700">
                  {isHydrated ? formatSessionTitle(conversation.createdAt) : '\u00A0'}
                </p>
                <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function ConversationList({ conversations, currentSessionId, className }: ConversationListProps) {
  return (
    <div className={cn('w-80 bg-white border-r border-gray-200', className)}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Conversation History</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-4">
          <ConversationItems conversations={conversations} currentSessionId={currentSessionId} />
        </div>
      </ScrollArea>
    </div>
  );
}

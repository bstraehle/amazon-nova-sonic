'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn, formatSessionTitle } from '@/lib/utils';
import { useIsHydrated } from '@/lib/useIsHydrated';

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

export function ConversationItems({ conversations, currentSessionId }: ConversationItemsProps) {
  const isHydrated = useIsHydrated();

  if (conversations.length === 0) {
    return <p className="text-sm text-muted-foreground">No conversations yet.</p>;
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Link
          href={`/${conversation.id}`}
          key={conversation.id}
          className="block"
          aria-current={conversation.id === currentSessionId ? 'page' : undefined}
        >
          <Card
            className={`cursor-pointer py-3 hover:bg-accent transition-colors ${
              conversation.id === currentSessionId ? 'bg-accent border-primary' : ''
            }`}
          >
            <CardContent className="px-4">
              <div className="flex justify-between items-center gap-2">
                <p className="text-sm">{isHydrated ? formatSessionTitle(conversation.createdAt) : '\u00A0'}</p>
                <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
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
    <nav aria-label="Conversation history" className={cn('w-80 bg-card border-r', className)}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Conversation History</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-4">
          <ConversationItems conversations={conversations} currentSessionId={currentSessionId} />
        </div>
      </ScrollArea>
    </nav>
  );
}

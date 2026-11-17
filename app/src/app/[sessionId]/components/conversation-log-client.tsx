'use client';

import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { Message } from '@/common/messageRepository';
import { Session } from '@/common/sessionRepository';
import ConversationList from '@/components/conversation-list';
import Messages from '@/components/messages';
import ThemeToggle from '@/components/theme-toggle';
import TranscriptActions from '@/components/transcript-actions';
import { useIsHydrated } from '@/lib/useIsHydrated';

interface Conversation {
  id: string;
  createdAt: Date;
}

interface ConversationLogClientProps {
  session: Session;
  messages: Message[];
  userId: string;
  conversations: Conversation[];
}

export default function ConversationLogClient({ session, messages, conversations }: ConversationLogClientProps) {
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const isHydrated = useIsHydrated();

  const messagesWithoutSystemPrompt = useMemo(() => {
    return messages.filter((m) => m.role !== 'system');
  }, [messages]);

  const showingMessages = useMemo(() => {
    let baseMessages: Message[];
    if (showSystemPrompt && session.systemPrompt) {
      const systemMessage: Message = {
        role: 'system',
        content: session.systemPrompt,
        timestamp: session.createdAt,
      };
      baseMessages = [systemMessage, ...messagesWithoutSystemPrompt];
    } else {
      baseMessages = messagesWithoutSystemPrompt;
    }

    // Merge consecutive messages with the same role
    const mergedMessages: Message[] = [];
    for (const message of baseMessages) {
      const lastMessage = mergedMessages[mergedMessages.length - 1];
      if (lastMessage && lastMessage.role === message.role) {
        // Merge with the previous message
        lastMessage.content += ' ' + message.content;
        // Keep the latest timestamp
        lastMessage.timestamp = message.timestamp;
      } else {
        // Add as a new message
        mergedMessages.push({ ...message });
      }
    }

    return mergedMessages;
  }, [messages, messagesWithoutSystemPrompt, showSystemPrompt, session.systemPrompt, session.createdAt]);

  return (
    <div className="flex h-dvh bg-background">
      {/* Sidebar */}
      <ConversationList
        conversations={conversations}
        currentSessionId={session.sessionId}
        className="hidden md:block"
      />

      {/* Main Chat Panel */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <Link
                href="/history"
                className="md:hidden mb-1 flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
                History
              </Link>
              <h1 className="text-xl font-semibold">Conversation Log</h1>
              <p className="text-sm text-muted-foreground truncate">
                {isHydrated ? new Date(session.createdAt).toLocaleString() : ' '} - Session ID: {session.sessionId}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Session
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* System Prompt Toggle */}
        <div className="px-4 py-2 border-b bg-background flex items-center justify-between gap-2">
          {session.systemPrompt ? (
            <div className="flex items-center space-x-2">
              <Switch id="system-prompt" checked={showSystemPrompt} onCheckedChange={setShowSystemPrompt} />
              <label htmlFor="system-prompt" className="text-sm font-medium">
                Show System Prompt
              </label>
            </div>
          ) : (
            <span />
          )}
          <TranscriptActions messages={showingMessages} fileName="demobank-conversation.txt" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <Messages messages={showingMessages} />
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { SessionRepository } from '@/common/sessionRepository';
import { Button } from '@/components/ui/button';
import { ConversationItems } from '@/components/conversation-list';

export default async function HistoryPage() {
  const authSession = await getSession();
  const sessions = await new SessionRepository().getSessions(authSession.userId);

  const conversations = sessions.map((s) => ({
    id: s.sessionId,
    createdAt: new Date(s.createdAt),
  }));

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h1 className="text-xl font-semibold">Conversation History</h1>
        <Link href="/">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl">
          <ConversationItems conversations={conversations} />
        </div>
      </div>
    </div>
  );
}

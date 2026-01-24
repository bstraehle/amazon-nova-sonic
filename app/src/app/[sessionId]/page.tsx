import { getSession } from '@/lib/auth';
import { MessageRepository } from '@/common/messageRepository';
import { SessionRepository } from '@/common/sessionRepository';
import ConversationLogClient from './components/conversation-log-client';
import { notFound } from 'next/navigation';

interface ConversationLogPageProps {
  params: Promise<{ sessionId: string }>;
}

async function getConversationData(sessionId: string, userId: string) {
  const sessionRepository = new SessionRepository();
  const messageRepository = new MessageRepository();

  const session = await sessionRepository.getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  const messages = await messageRepository.getMessages(sessionId);
  const sessions = await sessionRepository.getSessions(userId);

  const conversations = sessions.map((s) => ({
    id: s.sessionId,
    createdAt: new Date(s.createdAt),
  }));

  return {
    session,
    messages,
    conversations,
  };
}

export default async function ConversationLogPage({ params }: ConversationLogPageProps) {
  const authSession = await getSession();
  const { sessionId } = await params;
  const data = await getConversationData(sessionId, authSession.userId);

  if (!data) {
    notFound();
  }

  return (
    <ConversationLogClient
      session={data.session}
      messages={data.messages}
      userId={authSession.userId}
      conversations={data.conversations}
    />
  );
}

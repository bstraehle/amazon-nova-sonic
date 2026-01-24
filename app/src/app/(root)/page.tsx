import { getSession } from '@/lib/auth';
import VoiceChatClient from './components/voice-chat-client';

export default async function VoiceChatPage() {
  const authSession = await getSession();

  return <VoiceChatClient userId={authSession.userId} />;
}

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSpeechToSpeech } from '../useSpeechToSpeech';
import { useMicrophonePermission } from '../useSpeechToSpeech/useMicrophonePermission';
import { useVoiceActivity } from '../useSpeechToSpeech/useVoiceActivity';
import { toast } from 'sonner';
import VoiceChatView, { type ConversationState } from './voice-chat-view';

const getConversationState = (state: {
  isAssistantAudible: boolean;
  isUserAudible: boolean;
  isAwaitingReply: boolean;
  isMuted: boolean;
}): ConversationState => {
  if (state.isAssistantAudible) return 'speaking';
  if (state.isUserAudible && !state.isMuted) return 'listening';
  if (state.isAwaitingReply) return 'thinking';
  return state.isMuted ? 'muted' : 'listening';
};

interface VoiceChatProps {
  userId: string;
}

export default function VoiceChatClient({ userId }: VoiceChatProps) {
  const {
    isActive,
    isLoading,
    startSession,
    closeSession,
    toggleMute,
    isMuted,
    errorMessages,
    messages,
    isAssistantSpeaking,
    sessionId,
    sessionEnd,
    getAnalyser,
  } = useSpeechToSpeech(userId);

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [voiceId, setVoiceId] = useState('matthew');
  const isActiveRef = useRef(isActive);
  const { input: isUserAudible, output: isAssistantAudible } = useVoiceActivity(getAnalyser, isActive);
  const microphonePermission = useMicrophonePermission();

  const transcript = useMemo(() => messages.filter((m) => m.role !== 'system'), [messages]);
  const lastRole = transcript[transcript.length - 1]?.role;
  const conversationState = getConversationState({
    isAssistantAudible,
    isUserAudible,
    isAwaitingReply: lastRole === 'user' || (lastRole === 'assistant' && isAssistantSpeaking),
    isMuted,
  });

  useEffect(() => {
    if (errorMessages.length > 0) {
      toast.error(errorMessages[errorMessages.length - 1]);
    }
  }, [errorMessages]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        closeSession();
      }
    };
  }, [closeSession]);

  useEffect(() => {
    if (isActive && !sessionStartTime) {
      setSessionStartTime(Date.now());
    } else if (!isActive && sessionStartTime) {
      setSessionStartTime(null);
    }
  }, [isActive, sessionStartTime]);

  const handleStartSession = () => {
    startSession(voiceId);
  };

  const handleCloseSession = () => {
    closeSession();
  };

  return (
    <VoiceChatView
      isActive={isActive}
      isLoading={isLoading}
      isMuted={isMuted}
      isAssistantSpeaking={isAssistantSpeaking}
      conversationState={conversationState}
      transcript={transcript}
      sessionId={sessionId}
      sessionEnd={sessionEnd}
      sessionStartTime={sessionStartTime}
      microphonePermission={microphonePermission}
      voiceId={voiceId}
      onVoiceChange={setVoiceId}
      onStart={handleStartSession}
      onStop={handleCloseSession}
      onToggleMute={toggleMute}
      getAnalyser={getAnalyser}
    />
  );
}

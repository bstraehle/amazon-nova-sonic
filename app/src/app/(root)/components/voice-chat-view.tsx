'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  Ear,
  History,
  Loader2,
  LogOut,
  Mic,
  MicOff,
  StopCircle,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BrandMark from '@/components/brand-mark';
import Messages from '@/components/messages';
import ThemeToggle from '@/components/theme-toggle';
import TranscriptActions from '@/components/transcript-actions';
import { englishVoices } from '@/lib/voices';
import { cn } from '@/lib/utils';
import type { AudioSource, SessionEndKind } from '../useSpeechToSpeech';
import type { MicrophonePermission } from '../useSpeechToSpeech/useMicrophonePermission';
import TimerDisplay from './timer-display';
import VoiceVisualizer from './voice-visualizer';

export type ConversationState = 'listening' | 'thinking' | 'speaking' | 'muted';

interface VoiceChatViewProps {
  isActive: boolean;
  isLoading: boolean;
  isMuted: boolean;
  isAssistantSpeaking: boolean;
  conversationState: ConversationState;
  transcript: { role: 'user' | 'assistant' | 'system'; content: string; timestamp?: number }[];
  sessionId: string | null;
  sessionEnd: SessionEndKind | null;
  sessionStartTime: number | null;
  microphonePermission: MicrophonePermission;
  voiceId: string;
  onVoiceChange: (voiceId: string) => void;
  onStart: () => void;
  onStop: () => void;
  onToggleMute: () => void;
  getAnalyser: (source: AudioSource) => AnalyserNode | null;
}

const conversationStates: Record<
  ConversationState,
  { label: string; hint: string; icon: LucideIcon; source: AudioSource | null }
> = {
  listening: { label: 'Listening...', hint: 'How can I help you?', icon: Ear, source: 'input' },
  thinking: { label: 'Thinking...', hint: 'Working on your answer', icon: Loader2, source: null },
  speaking: { label: 'Speaking', hint: 'Start talking to interrupt', icon: Volume2, source: 'output' },
  muted: { label: 'Microphone muted', hint: 'Unmute to continue', icon: MicOff, source: null },
};

const sessionEndMessages: Record<SessionEndKind, string> = {
  user: 'You ended the conversation.',
  timeLimit: 'The session reached its time limit.',
  server: 'The session has ended.',
  error: 'The session ended because of a problem on our side. Please try again.',
};

const exampleQuestions = [
  'How do I open an account?',
  'What are the features of your high yield savings account?',
  'When is interest paid?',
  'I need help signing in',
];

function ExampleQuestions() {
  return (
    <div className="text-center">
      <p className="mb-2 text-sm font-medium text-muted-foreground">Try asking</p>
      <ul className="space-y-1 text-sm">
        {exampleQuestions.map((question) => (
          <li key={question}>&ldquo;{question}&rdquo;</li>
        ))}
      </ul>
    </div>
  );
}

export default function VoiceChatView({
  isActive,
  isLoading,
  isMuted,
  isAssistantSpeaking,
  conversationState,
  transcript,
  sessionId,
  sessionEnd,
  sessionStartTime,
  microphonePermission,
  voiceId,
  onVoiceChange,
  onStart,
  onStop,
  onToggleMute,
  getAnalyser,
}: VoiceChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(true);

  const status = conversationStates[conversationState];
  const StatusIcon = status.icon;
  const endMessage = sessionEnd ? sessionEndMessages[sessionEnd] : null;
  const hasEndedTranscript = !isActive && !isLoading && endMessage !== null && transcript.length > 0;
  const muteLabel = isMuted ? 'Unmute microphone' : 'Mute microphone';

  let announcement = '';
  if (isLoading) {
    announcement = 'Connecting to the voice assistant.';
  } else if (isActive) {
    announcement = isMuted ? 'Microphone muted.' : 'Voice chat active. Microphone on.';
  } else if (hasEndedTranscript) {
    announcement = `Conversation ended. ${endMessage}`;
  }

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (isPinned && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, isPinned]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'm' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      onToggleMute();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onToggleMute]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) {
      setIsPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
    }
  };

  const handleStart = () => {
    setIsPinned(true);
    onStart();
  };

  const voiceSelect = (
    <Select value={voiceId} onValueChange={onVoiceChange}>
      <SelectTrigger className="w-auto min-w-48" aria-label="Voice">
        <SelectValue placeholder="Select voice" />
      </SelectTrigger>
      <SelectContent>
        {englishVoices.map((voice) => (
          <SelectItem key={voice.id} value={voice.id}>
            {voice.label} ({voice.language}, {voice.gender})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex h-dvh bg-background">
      {/* Main Chat Panel */}
      <main className="flex-1 flex flex-col min-w-0">
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>

        {/* Header */}
        <header className="p-4 border-b bg-card flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark />
            <h1 className="text-xl font-semibold text-primary truncate">Voice Assistant</h1>
            {isActive && <TimerDisplay isActive={isActive} sessionStartTime={sessionStartTime} />}
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {!isActive && !isLoading && (
              <Link
                href="/history"
                aria-label="History"
                className="flex items-center text-muted-foreground hover:text-foreground"
              >
                <History className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">History</span>
              </Link>
            )}
            <ThemeToggle />
            <Link
              href="/api/auth/sign-out"
              aria-label="Sign out"
              className="flex items-center text-muted-foreground hover:text-foreground"
              prefetch={false}
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div
                aria-hidden="true"
                className="w-32 h-32 border-8 border-muted border-t-primary rounded-full animate-spin mb-4"
              ></div>
              <p className="text-muted-foreground">Initializing voice chat...</p>
            </div>
          )}

          {/* Active or Ended State with Transcript */}
          {!isLoading && (isActive || hasEndedTranscript) && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {isActive ? (
                /* Status indicator */
                <div
                  className={cn(
                    'p-4 border-b flex flex-col items-center gap-2',
                    conversationState === 'muted' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                  )}
                >
                  <VoiceVisualizer
                    getAnalyser={getAnalyser}
                    source={status.source}
                    className={conversationState === 'thinking' ? 'animate-pulse' : undefined}
                  />
                  <div className="flex items-center gap-2 text-sm">
                    <StatusIcon className={cn('w-5 h-5', conversationState === 'thinking' && 'animate-spin')} />
                    <p>
                      <span className="font-medium">{status.label}</span> {status.hint}
                    </p>
                  </div>
                </div>
              ) : (
                /* Session end notice */
                <div
                  className={cn(
                    'px-4 py-2 border-b flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm',
                    sessionEnd === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted'
                  )}
                >
                  <p>
                    <span className="font-medium">Conversation ended.</span> {endMessage}
                  </p>
                  {sessionId && (
                    <Link href={`/${sessionId}`} className="underline">
                      View in history
                    </Link>
                  )}
                  <TranscriptActions messages={transcript} fileName="demobank-conversation.txt" />
                </div>
              )}
              {/* Transcript */}
              <div className="relative flex-1 min-h-0">
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  role="log"
                  aria-live="off"
                  aria-label="Conversation transcript"
                  tabIndex={0}
                  className="h-full overflow-y-auto p-4"
                >
                  {transcript.length > 0 ? (
                    <Messages messages={transcript} isAssistantSpeaking={isAssistantSpeaking} isActive={isActive} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ExampleQuestions />
                    </div>
                  )}
                </div>
                {!isPinned && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-md"
                    onClick={() => setIsPinned(true)}
                  >
                    <ArrowDown />
                    Latest
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Ready State */}
          {!isLoading && !isActive && !hasEndedTranscript && (
            <div className="flex-1 flex flex-col overflow-y-auto p-8">
              <div className="m-auto flex flex-col items-center">
                <div className="w-32 h-32 mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mic className="w-16 h-16 text-primary" />
                </div>
                <p className="text-muted-foreground mb-6">Ready to start a voice conversation</p>
                {endMessage && sessionEnd !== 'user' && (
                  <p className="text-sm text-muted-foreground mb-6 text-center">{endMessage}</p>
                )}

                {/* Voice Selection */}
                <div className="mb-6">{voiceSelect}</div>

                <ExampleQuestions />

                {microphonePermission === 'denied' ? (
                  <p className="mt-6 flex items-center gap-2 text-sm text-destructive">
                    <MicOff className="w-4 h-4 shrink-0" />
                    Microphone access is blocked. Allow it in your browser&apos;s site settings to start.
                  </p>
                ) : (
                  microphonePermission !== 'granted' && (
                    <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                      <Mic className="w-3.5 h-3.5 shrink-0" />
                      Your browser will ask for microphone access when you start.
                    </p>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Voice Controls */}
        <div className="p-6 border-t bg-card">
          <div className="flex flex-col items-center justify-center gap-2">
            {!isActive ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                {hasEndedTranscript && voiceSelect}
                <Button onClick={handleStart} disabled={isLoading} className="w-full max-w-xs h-12" size="lg">
                  {!isLoading ? (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      {hasEndedTranscript ? 'Start New Conversation' : 'Start Voice Chat'}
                    </>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
                    ></div>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={onToggleMute}
                    disabled={isLoading}
                    variant={isMuted ? 'secondary' : 'outline'}
                    size="lg"
                    className="h-12"
                    aria-label={muteLabel}
                    aria-pressed={isMuted}
                    aria-keyshortcuts="M"
                    title={`${muteLabel} (M)`}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button onClick={onStop} disabled={isLoading} variant="destructive" className="h-12" size="lg">
                    {!isLoading ? (
                      <>
                        <StopCircle className="mr-2 h-5 w-5" />
                        Stop Voice Chat
                      </>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
                      ></div>
                    )}
                  </Button>
                </div>
                <p className="hidden md:block text-xs text-muted-foreground">
                  Press <kbd className="rounded border bg-muted px-1 font-mono">M</kbd> to mute or unmute
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

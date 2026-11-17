import { useCallback, useRef, useState } from 'react';
import { events, EventsChannel } from 'aws-amplify/data';
import { AudioPlayer } from './lib/AudioPlayer';
import { AudioRecorder } from './lib/AudioRecorder';
import useChatHistory from './useChatHistory';
import { DispatchEventParams, END_REASON_TIME_LIMIT, SpeechToSpeechEventSchema } from '@/common/schemas';
import { Amplify } from 'aws-amplify';
import { decodeJWT } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { startNovaSonicSession } from '@/app/(root)/actions';
import { useAction } from 'next-safe-action/hooks';
import { AudioEventSequencer } from '@/common/events';

const NAMESPACE = process.env.NEXT_PUBLIC_EVENT_BUS_NAMESPACE!;
const MIN_AUDIO_CHUNKS_PER_BATCH = 3;
const MAX_AUDIO_CHUNKS_PER_BATCH = 20;
const READY_TIMEOUT_MS = 45 * 1000;

const tokenCache: { updatedAt: number; token: string } = { updatedAt: 0, token: '' };
let audioInputSequence = 0;

Amplify.configure(
  {
    API: {
      Events: {
        endpoint: `${process.env.NEXT_PUBLIC_EVENT_API_ENDPOINT}/event`,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        defaultAuthMode: 'userPool',
      },
    },
  },
  {
    Auth: {
      tokenProvider: {
        getTokens: async () => {
          // cache access token to prevent from too frequent fetch calls (e.g. one fetch per one publish)
          if (tokenCache.updatedAt > Date.now() - 1000 * 10) {
            return {
              accessToken: decodeJWT(tokenCache.token),
            };
          }
          const res = await fetch('/api/cognito-token');
          const { accessToken } = await res.json();
          tokenCache.updatedAt = Date.now();
          tokenCache.token = accessToken;
          return {
            accessToken: decodeJWT(accessToken),
          };
        },
      },
    },
  }
);

const arrayBufferToBase64 = (buffer: ArrayBufferLike) => {
  const binary = [];
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary.push(String.fromCharCode(bytes[i]));
  }
  return btoa(binary.join(''));
};

const base64ToFloat32Array = (base64String: string) => {
  try {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    return float32Array;
  } catch (error) {
    console.error('Error in base64ToFloat32Array:', error);
    throw error;
  }
};

export type SessionEndKind = 'user' | 'timeLimit' | 'server' | 'error';
export type AudioSource = 'input' | 'output';

export const useSpeechToSpeech = (userId: string) => {
  const {
    clear,
    messages,
    onTextStart,
    onTextOutput,
    onTextStop,
    isAssistantSpeaking: isAssistantSpeaking,
  } = useChatHistory();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionEnd, setSessionEnd] = useState<SessionEndKind | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const channelRef = useRef<EventsChannel | null>(null);
  const audioInputQueue = useRef<string[]>([]);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyHandledRef = useRef(false);
  const micErrorRef = useRef<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const router = useRouter();

  const { execute: executeSpeechToSpeech } = useAction(startNovaSonicSession, {
    onSuccess: async (res) => {
      try {
        setSessionId(res.data.sessionId);
        await connectToAppSync(res.data.sessionId);
        await initAudio();
        if (!readyHandledRef.current) {
          readyTimerRef.current = setTimeout(
            () => failStart('The voice assistant did not respond. Please try again.'),
            READY_TIMEOUT_MS
          );
        }
      } catch (e) {
        console.error('Failed to connect to the session:', e);
        failStart('Could not connect to the voice assistant. Please try again.');
      }
    },
    onError: (error) => {
      console.error('Failed to invoke speech-to-speech Lambda:', error);
      failStart('Could not start the voice chat. Please try again.');
    },
  });

  const dispatchEvent = async (channel: EventsChannel, params: DispatchEventParams) => {
    await channel.publish({
      direction: 'ctob',
      ...params,
    });
  };

  const clearReadyTimer = () => {
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }
  };

  const teardown = async () => {
    clearReadyTimer();
    const channel = channelRef.current;
    channelRef.current = null;
    await stopRecording();
    setIsLoading(false);
    setIsMuted(false);

    if (channel) {
      try {
        await dispatchEvent(channel, { event: 'terminateSession', data: {} });
      } catch (e) {
        console.error('Failed to send terminateSession:', e);
      }
      channel.close();
    }
  };

  const failStart = async (message: string) => {
    setErrorMessages((prev) => [...prev, message]);
    await teardown();
  };

  const initAudio = async () => {
    const audioPlayer = new AudioPlayer();
    audioPlayerRef.current = audioPlayer;
    audioInputQueue.current = [];
    audioInputSequence = 0;

    const audioRecorder = new AudioRecorder();
    audioRecorder.addEventListener('onAudioRecorded', (audioData: Int16Array) => {
      const base64Data = arrayBufferToBase64(audioData.buffer);
      audioInputQueue.current.push(base64Data);
    });

    // Add error listener to handle microphone permission issues
    audioRecorder.addEventListener('onError', (error: { type: string; message: string }) => {
      console.error('Audio recorder error:', error.type, error.message);
      // You can add UI notification here if needed
      if (error.type === 'NotAllowedError' || error.type === 'PermissionDeniedError') {
        // Handle microphone permission denied specifically
        micErrorRef.current = 'The microphone is not available. Please grant permission to use the microphone.';
      }
    });

    audioRecorderRef.current = audioRecorder;
  };

  const processAudioInput = async () => {
    const channel = channelRef.current;
    if (!channel) return;

    if (audioInputQueue.current.length > MIN_AUDIO_CHUNKS_PER_BATCH) {
      const chunksToProcess: string[] = [];

      let processedChunks = 0;

      while (audioInputQueue.current.length > 0 && processedChunks < MAX_AUDIO_CHUNKS_PER_BATCH) {
        const chunk = audioInputQueue.current.shift();

        if (chunk) {
          chunksToProcess.push(chunk);
          processedChunks += 1;
        }
      }

      await dispatchEvent(channel, {
        event: 'audioInput',
        data: { blobs: chunksToProcess, sequence: audioInputSequence },
      });
      audioInputSequence++;
    }

    setTimeout(() => processAudioInput(), 0);
  };

  const connectToAppSync = async (sessionId: string) => {
    const channel = await events.connect(`/${NAMESPACE}/user/${userId}/${sessionId}`);
    channelRef.current = channel;
    const sequencer = new AudioEventSequencer((chunks) => {
      while (chunks.length > 0) {
        const chunk = chunks.shift();

        if (chunk) {
          const audioData = base64ToFloat32Array(chunk);
          audioPlayerRef.current!.playAudio(audioData);
        }
      }
    });

    channel.subscribe({
      next: (data: { event: unknown; id: string }) => {
        const { data: event, error } = SpeechToSpeechEventSchema.safeParse(data.event);
        if (error) {
          console.log(error);
          return;
        }
        if (event.direction !== 'btoc') return;

        if (event.event === 'ready') {
          if (readyHandledRef.current) return;
          readyHandledRef.current = true;
          clearReadyTimer();

          startRecording()
            .then((started) => {
              if (!started) return;
              setIsActive(true);
              setIsLoading(false);
            })
            .catch((e) => {
              console.log(e);
              failStart(micErrorRef.current ?? 'Could not start audio. Please try again.');
            });
        } else if (event.event === 'end') {
          const reason = event.data.reason;
          if (reason === END_REASON_TIME_LIMIT) {
            closeSession('timeLimit');
          } else if (reason) {
            console.error('Session ended with an error:', reason);
            closeSession('error');
          } else {
            closeSession('server');
          }
        } else if (event.event === 'audioOutput' && audioPlayerRef.current) {
          sequencer.next(event.data.blobs, event.data.sequence);
        } else if (event.event === 'textStart') {
          onTextStart(event.data);
        } else if (event.event === 'textOutput') {
          onTextOutput(event.data);
        } else if (event.event === 'textStop') {
          onTextStop(event.data);

          if (event.data.stopReason && event.data.stopReason === 'INTERRUPTED') {
            audioPlayerRef.current?.bargeIn();
          }
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (e: any) => {
        console.error(e);
      },
    });
  };

  const startRecording = async () => {
    const audioPlayer = audioPlayerRef.current;
    const audioRecorder = audioRecorderRef.current;
    if (!audioPlayer || !audioRecorder) {
      throw new Error('ref not set!');
    }

    await audioPlayer.start();

    // Start recording using the AudioRecorder and check for success
    const success = await audioRecorder.start();

    if (!success) {
      throw new Error('audioRecorder failed to start!');
    }

    if (!channelRef.current) {
      audioRecorder.stop();
      audioPlayer.stop();
      return false;
    }

    processAudioInput();
    return true;
  };

  const stopRecording = async () => {
    setIsActive(false);

    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      audioPlayerRef.current = null;
    }
  };

  const startSession = async (voiceId: string) => {
    if (isActive || isLoading) {
      return;
    }
    clear();
    setSessionId(null);
    setSessionEnd(null);
    readyHandledRef.current = false;
    micErrorRef.current = null;
    setIsLoading(true);
    executeSpeechToSpeech({ voiceId });
  };

  const toggleMute = useCallback(() => {
    if (audioRecorderRef.current) {
      const newMuteState = audioRecorderRef.current.toggleMute();
      setIsMuted(newMuteState);
      return newMuteState;
    }
    return false;
  }, []);

  const getAnalyser = useCallback((source: AudioSource): AnalyserNode | null => {
    const node = source === 'input' ? audioRecorderRef.current?.analyser : audioPlayerRef.current?.analyser;
    return node ?? null;
  }, []);

  const closeSession = useCallback(
    async (kind: SessionEndKind = 'user') => {
      if (!channelRef.current) return;

      setSessionEnd(kind);
      await teardown();
      router.refresh();
    },
    [channelRef, setIsActive, setIsLoading]
  );

  return {
    messages,
    isActive,
    isLoading,
    isAssistantSpeaking,
    isMuted,
    sessionId,
    sessionEnd,
    startSession,
    closeSession,
    toggleMute,
    getAnalyser,
    errorMessages,
  };
};

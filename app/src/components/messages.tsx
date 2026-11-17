'use client';

import { useIsHydrated } from '@/lib/useIsHydrated';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date | number;
}

interface MessagesProps {
  messages: Message[];
  isAssistantSpeaking?: boolean;
  isActive?: boolean;
}

export default function Messages({ messages, isAssistantSpeaking, isActive }: MessagesProps) {
  const isHydrated = useIsHydrated();

  return (
    <div className="space-y-4">
      {messages.map((message, idx) => (
        <div key={idx}>
          {idx === 0 && <div className="w-full mb-4"></div>}
          <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-lg lg:max-w-2xl px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.role === 'system'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-900'
                    : 'bg-card text-card-foreground border'
              }`}
            >
              <div className="text-sm">
                {message.role === 'system' && <div className="font-semibold mb-1">System:</div>}
                <div className="whitespace-pre-wrap">{message.content.replaceAll('  ', ' ').trim()}</div>
              </div>
              {message.timestamp && (
                <div className="text-xs opacity-70 mt-1">
                  {isHydrated
                    ? new Date(message.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                    : '\u00A0'}
                </div>
              )}
              {message.role === 'assistant' && idx === messages.length - 1 && isAssistantSpeaking && isActive && (
                <div className="mt-2 flex h-3 items-center gap-1 opacity-70" role="img" aria-label="Speaking">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="size-1.5 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="w-full mt-4"></div>
        </div>
      ))}
    </div>
  );
}

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
  return (
    <div className="space-y-4">
      {messages.map((message, idx) => (
        <div key={idx}>
          {idx === 0 && <div className="w-full mb-4"></div>}
          <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-lg lg:max-w-2xl px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.role === 'system'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-200 text-gray-900'
              }`}
            >
              <div className="text-sm">
                {message.role === 'system' && <div className="font-semibold mb-1">System:</div>}
                <div className="whitespace-pre-wrap">{message.content.replaceAll('  ', ' ').trim()}</div>
              </div>
              {message.timestamp && (
                <div className="text-xs opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</div>
              )}
              {message.role === 'assistant' && idx === messages.length - 1 && isAssistantSpeaking && isActive && (
                <div className="mt-2 text-xs opacity-70">Speaking...</div>
              )}
            </div>
          </div>
          <div className="w-full mt-4"></div>
        </div>
      ))}
    </div>
  );
}

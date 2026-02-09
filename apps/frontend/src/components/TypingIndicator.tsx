interface TypingIndicatorProps {
  status: string;
}

const THINKING_PHRASES = [
  "Thinking...",
  "Analyzing your message...",
  "Looking up information...",
  "Searching records...",
  "Processing...",
];

export function TypingIndicator({ status }: TypingIndicatorProps) {
  const displayStatus = status || THINKING_PHRASES[0];

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Animated dots */}
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-xs text-gray-500">{displayStatus}</span>
        </div>
      </div>
    </div>
  );
}

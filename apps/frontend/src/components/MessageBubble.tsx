import type { ChatMessage } from "../hooks/useChat.js";

interface MessageBubbleProps {
  message: ChatMessage;
}

const AGENT_LABELS: Record<string, string> = {
  support: "Support Agent",
  order: "Order Agent",
  billing: "Billing Agent",
  router: "Router Agent",
};

const AGENT_COLORS: Record<string, string> = {
  support: "bg-green-50 border-green-200",
  order: "bg-orange-50 border-orange-200",
  billing: "bg-purple-50 border-purple-200",
  router: "bg-gray-50 border-gray-200",
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.senderType === "user";
  const agentType = message.agentType ?? "support";
  const metadata = message.metadata as any;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : `${AGENT_COLORS[agentType] ?? "bg-gray-50 border-gray-200"} border text-gray-900`
        }`}
      >
        {/* Agent badge */}
        {!isUser && message.agentType && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {AGENT_LABELS[message.agentType] ?? message.agentType}
            </span>
            {metadata?.intent && (
              <span className="text-xs bg-white/80 text-gray-600 px-1.5 py-0.5 rounded">
                {metadata.intent}
              </span>
            )}
          </div>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>

        {/* Tool calls indicator */}
        {metadata?.toolCalls && metadata.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200/50">
            <p className="text-xs text-gray-400">
              Used {metadata.toolCalls.length} tool
              {metadata.toolCalls.length > 1 ? "s" : ""}:{" "}
              {metadata.toolCalls.map((tc: any) => tc.toolName).join(", ")}
            </p>
          </div>
        )}

        {/* Reasoning (bonus) */}
        {metadata?.reasoning && (
          <details className="mt-2 pt-2 border-t border-gray-200/50">
            <summary className="text-xs text-gray-400 cursor-pointer">
              Reasoning
            </summary>
            <p className="text-xs text-gray-500 mt-1">{metadata.reasoning}</p>
          </details>
        )}
      </div>
    </div>
  );
}

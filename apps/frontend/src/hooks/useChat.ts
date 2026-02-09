import { useState, useCallback, useRef } from "react";
import { api } from "../lib/api.js";

export interface ChatMessage {
  id: string;
  content: string;
  senderType: "user" | "agent";
  agentType?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  typingStatus: string;
  error: string | null;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (convId: string) => Promise<void>;
  startNewConversation: () => void;
}

const USER_ID = "00000000-0000-0000-0000-000000000001"; // Will be set after seed

/**
 * Custom hook for chat functionality with SSE streaming.
 */
export function useChat(userId: string = USER_ID): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Add user message immediately
      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        content,
        senderType: "user",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // Abort any previous request
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const response = await api.sendMessage({
          userId,
          content,
          conversationId: conversationId ?? undefined,
        });

        // Parse SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? ""; // Keep incomplete event in buffer

          for (const eventStr of events) {
            if (!eventStr.trim()) continue;

            const lines = eventStr.split("\n");
            let eventType = "";
            let eventData = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7);
              } else if (line.startsWith("data: ")) {
                eventData = line.slice(6);
              }
            }

            if (!eventType || !eventData) continue;

            try {
              const data = JSON.parse(eventData);

              switch (eventType) {
                case "message_start":
                  if (data.conversationId) {
                    setConversationId(data.conversationId);
                  }
                  break;

                case "agent_typing":
                  setIsTyping(data.typing);
                  setTypingStatus(data.status ?? "");
                  break;

                case "message_complete": {
                  const agentMsg: ChatMessage = {
                    id: `agent-${Date.now()}`,
                    content: data.content,
                    senderType: "agent",
                    agentType: data.agentType,
                    metadata: data.metadata,
                    createdAt: new Date().toISOString(),
                  };
                  setMessages((prev) => [...prev, agentMsg]);
                  break;
                }

                case "error":
                  setError(data.message);
                  break;
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    },
    [userId, conversationId, isLoading]
  );

  const loadConversation = useCallback(async (convId: string) => {
    try {
      setIsLoading(true);
      const conv = await api.getConversation(convId);
      setConversationId(conv.id);
      setMessages(
        conv.messages.map((m: any) => ({
          id: m.id,
          content: m.content,
          senderType: m.senderType,
          agentType: m.agentType,
          metadata: m.metadata,
          createdAt: m.createdAt,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isTyping,
    typingStatus,
    error,
    conversationId,
    sendMessage,
    loadConversation,
    startNewConversation,
  };
}

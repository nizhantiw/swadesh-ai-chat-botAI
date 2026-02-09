import { conversationService } from "../services/conversation.service.js";

/**
 * Retrieves recent conversation messages for context.
 * Used by: Support Agent
 */
export async function getConversationHistory(params: {
  conversationId: string;
  limit?: number;
}): Promise<{
  conversationId: string;
  messages: Array<{
    content: string;
    senderType: string;
    agentType: string | null;
    createdAt: Date;
  }>;
}> {
  const messages = await conversationService.getRecentMessages(
    params.conversationId,
    params.limit ?? 10
  );

  return {
    conversationId: params.conversationId,
    messages: messages.reverse().map((m) => ({
      content: m.content,
      senderType: m.senderType,
      agentType: m.agentType,
      createdAt: m.createdAt,
    })),
  };
}

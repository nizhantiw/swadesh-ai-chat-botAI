import { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { conversationService } from "../services/conversation.service.js";
import { routerAgent } from "../agents/router.agent.js";
import type { AgentContext } from "../agents/base.agent.js";
import { ValidationError } from "../middleware/error-handler.js";
import { SendMessageRequest } from "@swadesh/shared";

/**
 * Chat Controller
 *
 * Orchestrates: message intake → context building → agent routing → response streaming
 */
export const chatController = {
  /**
   * POST /api/chat/messages
   * Send a new message and get AI response (SSE stream).
   */
  async sendMessage(c: Context) {
    const body = await c.req.json();
    const parsed = SendMessageRequest.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        `Invalid request: ${parsed.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    const { userId, content, conversationId: existingConvId } = parsed.data;

    // Step 1: Get or create conversation
    let conversationId = existingConvId;
    if (!conversationId) {
      const conv = await conversationService.create(
        userId,
        content.slice(0, 100)
      );
      conversationId = conv.id;
    }

    // Step 2: Persist user message
    await conversationService.addMessage({
      conversationId,
      content,
      senderType: "user",
    });

    // Step 3: Build conversation context (last N messages)
    const recentMessages = await conversationService.getRecentMessages(
      conversationId,
      10
    );
    const messageHistory: AgentContext["messageHistory"] = recentMessages
      .reverse()
      .filter((m) => m.content) // skip empty
      .map((m) => ({
        role: m.senderType === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

    const agentContext: AgentContext = {
      conversationId,
      userId,
      messageHistory,
    };

    // Step 4: Stream the response via SSE
    return streamSSE(c, async (stream) => {
      try {
        // Send conversation ID first (important for new conversations)
        await stream.writeSSE({
          event: "message_start",
          data: JSON.stringify({
            conversationId,
          }),
        });

        // Send typing indicator
        await stream.writeSSE({
          event: "agent_typing",
          data: JSON.stringify({ typing: true, status: "Analyzing your message..." }),
        });

        // Step 5: Route through agent system
        const response = await routerAgent.process(content, agentContext);

        // Send the complete response
        await stream.writeSSE({
          event: "message_complete",
          data: JSON.stringify({
            content: response.content,
            agentType: response.agentType,
            metadata: response.metadata,
          }),
        });

        // Step 6: Persist agent response
        await conversationService.addMessage({
          conversationId,
          content: response.content,
          senderType: "agent",
          agentType: response.agentType,
          metadata: response.metadata as any,
        });

        // Stop typing indicator
        await stream.writeSSE({
          event: "agent_typing",
          data: JSON.stringify({ typing: false }),
        });
      } catch (error) {
        console.error("[ChatController] Error processing message:", error);
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({
            message:
              error instanceof Error
                ? error.message
                : "An error occurred processing your message",
          }),
        });
      }
    });
  },

  /**
   * GET /api/chat/conversations/:id
   * Get full conversation with messages.
   */
  async getConversation(c: Context) {
    const id = c.req.param("id");
    const conversation = await conversationService.getById(id);
    return c.json({ data: conversation });
  },

  /**
   * GET /api/chat/conversations
   * List all conversations for a user.
   */
  async listConversations(c: Context) {
    const userId = c.req.query("userId");
    if (!userId) {
      throw new ValidationError("userId query parameter is required");
    }
    const conversations = await conversationService.listByUser(userId);
    return c.json({ data: conversations });
  },

  /**
   * DELETE /api/chat/conversations/:id
   * Delete a conversation.
   */
  async deleteConversation(c: Context) {
    const id = c.req.param("id");
    await conversationService.delete(id);
    return c.json({ message: "Conversation deleted" });
  },
};

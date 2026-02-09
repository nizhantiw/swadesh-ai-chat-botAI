import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { conversations, messages } from "../db/schema.js";
import { NotFoundError } from "../middleware/error-handler.js";

export const conversationService = {
  /**
   * Create a new conversation for a user.
   */
  async create(userId: string, title?: string) {
    const [conversation] = await db
      .insert(conversations)
      .values({ userId, title: title ?? null })
      .returning();
    return conversation;
  },

  /**
   * Get a conversation by ID with its messages.
   */
  async getById(conversationId: string) {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        messages: {
          orderBy: [messages.createdAt],
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation", conversationId);
    }

    return conversation;
  },

  /**
   * List all conversations for a user.
   */
  async listByUser(userId: string) {
    return db.query.conversations.findMany({
      where: eq(conversations.userId, userId),
      orderBy: [desc(conversations.updatedAt)],
    });
  },

  /**
   * Delete a conversation and all its messages (cascade).
   */
  async delete(conversationId: string) {
    const [deleted] = await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId))
      .returning();

    if (!deleted) {
      throw new NotFoundError("Conversation", conversationId);
    }

    return deleted;
  },

  /**
   * Add a message to a conversation.
   */
  async addMessage(params: {
    conversationId: string;
    content: string;
    senderType: "user" | "agent";
    agentType?: "router" | "support" | "order" | "billing" | null;
    metadata?: Record<string, unknown> | null;
  }) {
    const [message] = await db
      .insert(messages)
      .values({
        conversationId: params.conversationId,
        content: params.content,
        senderType: params.senderType,
        agentType: params.agentType ?? null,
        metadata: params.metadata as any,
      })
      .returning();

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, params.conversationId));

    return message;
  },

  /**
   * Get the last N messages from a conversation for context.
   */
  async getRecentMessages(conversationId: string, limit: number = 10) {
    return db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [desc(messages.createdAt)],
      limit,
    });
  },

  /**
   * Update conversation title.
   */
  async updateTitle(conversationId: string, title: string) {
    const [updated] = await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId))
      .returning();
    return updated;
  },
};

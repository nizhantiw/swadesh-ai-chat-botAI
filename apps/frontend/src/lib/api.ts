const API_BASE = "/api";

/**
 * API client for the Swadesh AI Chat backend.
 */
export const api = {
  /**
   * Send a message and return an SSE EventSource reader.
   */
  async sendMessage(params: {
    userId: string;
    content: string;
    conversationId?: string;
  }) {
    const response = await fetch(`${API_BASE}/chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message ?? `Request failed: ${response.status}`
      );
    }

    return response;
  },

  /**
   * List all conversations for a user.
   */
  async listConversations(userId: string) {
    const res = await fetch(
      `${API_BASE}/chat/conversations?userId=${encodeURIComponent(userId)}`
    );
    if (!res.ok) throw new Error("Failed to fetch conversations");
    const json = await res.json();
    return json.data;
  },

  /**
   * Get a conversation with its messages.
   */
  async getConversation(conversationId: string) {
    const res = await fetch(
      `${API_BASE}/chat/conversations/${conversationId}`
    );
    if (!res.ok) throw new Error("Failed to fetch conversation");
    const json = await res.json();
    return json.data;
  },

  /**
   * Delete a conversation.
   */
  async deleteConversation(conversationId: string) {
    const res = await fetch(
      `${API_BASE}/chat/conversations/${conversationId}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Failed to delete conversation");
    return true;
  },

  /**
   * List all agents.
   */
  async listAgents() {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) throw new Error("Failed to fetch agents");
    const json = await res.json();
    return json.data;
  },

  /**
   * Health check.
   */
  async healthCheck() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("Backend not healthy");
    return res.json();
  },
};

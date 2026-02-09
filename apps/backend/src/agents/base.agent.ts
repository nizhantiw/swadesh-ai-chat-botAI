/**
 * Base types and utilities shared by all agents.
 */

export interface AgentContext {
  conversationId: string;
  userId: string;
  /** Recent messages for context window */
  messageHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface AgentResponse {
  content: string;
  agentType: "router" | "support" | "order" | "billing";
  metadata: {
    reasoning?: string;
    toolCalls?: Array<{
      toolName: string;
      args: Record<string, unknown>;
      result: unknown;
    }>;
    routedFrom?: string;
    routedTo?: string;
    intent?: string;
  };
}

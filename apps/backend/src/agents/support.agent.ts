import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { AgentContext, AgentResponse } from "./base.agent.js";
import { getConversationHistory } from "../tools/get-conversation-history.js";

const SUPPORT_SYSTEM_PROMPT = `You are a friendly and helpful customer support agent for an e-commerce platform.

You handle:
- General support inquiries
- Frequently asked questions
- Troubleshooting
- General questions about the platform

You have access to conversation history to provide context-aware responses.

Guidelines:
- Be concise but thorough
- If the user's issue seems related to orders or billing, let them know you're a general support agent and suggest they ask specifically about their order or billing issue so we can route them to the right specialist
- Always be polite and professional`;

/**
 * Support Agent
 *
 * Handles: FAQs, troubleshooting, general questions
 * Tools: getConversationHistory
 */
export const supportAgent = {
  async process(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const toolCallRecords: AgentResponse["metadata"]["toolCalls"] = [];

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: SUPPORT_SYSTEM_PROMPT,
      messages: [
        ...context.messageHistory.slice(-10),
        { role: "user", content: message },
      ],
      tools: {
        getConversationHistory: tool({
          description:
            "Retrieve past conversation messages for this conversation to understand context",
          parameters: z.object({
            conversationId: z.string().describe("The conversation ID"),
            limit: z.number().optional().describe("Number of messages to retrieve (default 10)"),
          }),
          execute: async (params) => {
            const result = await getConversationHistory({
              conversationId: params.conversationId ?? context.conversationId,
              limit: params.limit,
            });
            toolCallRecords.push({
              toolName: "getConversationHistory",
              args: params,
              result,
            });
            return result;
          },
        }),
      },
      maxSteps: 3,
    });

    return {
      content: result.text,
      agentType: "support",
      metadata: {
        toolCalls: toolCallRecords.length > 0 ? toolCallRecords : undefined,
      },
    };
  },
};

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { AgentContext, AgentResponse } from "./base.agent.js";
import { supportAgent } from "./support.agent.js";
import { orderAgent } from "./order.agent.js";
import { billingAgent } from "./billing.agent.js";

const ROUTER_SYSTEM_PROMPT = `You are a router agent for an AI-powered customer support system.

Your ONLY job is to analyze the user's message and classify their intent into one of these categories:
- "support": General support inquiries, FAQs, troubleshooting, general questions
- "order": Order status, tracking, modifications, cancellations, delivery questions
- "billing": Payment issues, refunds, invoices, subscription queries
- "unknown": Cannot determine intent clearly

You must also provide a brief reasoning for your classification.

IMPORTANT: You never respond to the user directly. You only classify and route.`;

const ClassificationSchema = z.object({
  intent: z.enum(["support", "order", "billing", "unknown"]),
  reasoning: z.string().describe("Brief explanation of why this intent was chosen"),
  confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
});

/**
 * Router Agent (Parent Agent)
 *
 * Responsibilities:
 * - Analyze user message
 * - Classify intent
 * - Route to appropriate sub-agent
 * - Handle fallback if unclear
 *
 * This agent NEVER fetches data directly.
 */
export const routerAgent = {
  async process(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    // Step 1: Classify intent
    const classification = await classifyIntent(message, context);

    console.log(
      `[Router] Intent: ${classification.intent} (confidence: ${classification.confidence}) — ${classification.reasoning}`
    );

    // Step 2: Route to appropriate sub-agent
    const targetAgent = getTargetAgent(classification.intent);

    if (!targetAgent) {
      // Fallback: use support agent for unknown intents
      console.log("[Router] Unknown intent, falling back to support agent");
      const response = await supportAgent.process(message, context);
      return {
        ...response,
        metadata: {
          ...response.metadata,
          routedFrom: "router",
          routedTo: "support",
          intent: "unknown",
          reasoning: classification.reasoning,
        },
      };
    }

    // Step 3: Delegate to sub-agent
    const response = await targetAgent.process(message, context);

    return {
      ...response,
      metadata: {
        ...response.metadata,
        routedFrom: "router",
        routedTo: classification.intent,
        intent: classification.intent,
        reasoning: classification.reasoning,
      },
    };
  },
};

async function classifyIntent(message: string, context: AgentContext) {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: ClassificationSchema,
    system: ROUTER_SYSTEM_PROMPT,
    messages: [
      // Include recent conversation history for context
      ...context.messageHistory.slice(-6),
      { role: "user", content: message },
    ],
  });

  return object;
}

function getTargetAgent(intent: string) {
  switch (intent) {
    case "support":
      return supportAgent;
    case "order":
      return orderAgent;
    case "billing":
      return billingAgent;
    default:
      return null;
  }
}

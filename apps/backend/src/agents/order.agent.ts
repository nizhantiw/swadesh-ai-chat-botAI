import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { AgentContext, AgentResponse } from "./base.agent.js";
import { fetchOrderDetails } from "../tools/fetch-order-details.js";
import { checkDeliveryStatus } from "../tools/check-delivery-status.js";
import { getUserOrders } from "../tools/get-user-orders.js";

const ORDER_SYSTEM_PROMPT = `You are a specialized order management agent for an e-commerce platform.

You handle:
- Order status inquiries ("Where is my order?")
- Order tracking and delivery status
- Order modifications
- Order cancellations

You have access to these tools:
- getUserOrders: List all orders for the user
- fetchOrderDetails: Get detailed information about a specific order
- checkDeliveryStatus: Check shipment/delivery tracking for an order

Guidelines:
- Always look up real data using your tools before responding
- If the user mentions an order number, use fetchOrderDetails
- If the user asks generally about "my orders", use getUserOrders first
- For delivery questions, use checkDeliveryStatus after identifying the order
- Provide tracking numbers and carrier info when available
- Be specific with dates and statuses`;

/**
 * Order Agent
 *
 * Handles: Order status, tracking, modifications, cancellations
 * Tools: fetchOrderDetails, checkDeliveryStatus, getUserOrders
 */
export const orderAgent = {
  async process(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const toolCallRecords: AgentResponse["metadata"]["toolCalls"] = [];

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: ORDER_SYSTEM_PROMPT,
      messages: [
        ...context.messageHistory.slice(-10),
        { role: "user", content: message },
      ],
      tools: {
        getUserOrders: tool({
          description: "List all orders for the current user",
          parameters: z.object({
            userId: z.string().describe("The user ID"),
          }),
          execute: async (params) => {
            const result = await getUserOrders({
              userId: params.userId ?? context.userId,
            });
            toolCallRecords.push({
              toolName: "getUserOrders",
              args: params,
              result,
            });
            return result;
          },
        }),
        fetchOrderDetails: tool({
          description:
            "Get detailed information about a specific order by order number or ID",
          parameters: z.object({
            orderNumber: z.string().optional().describe("The order number (e.g. ORD-2024-001)"),
            orderId: z.string().optional().describe("The order UUID"),
          }),
          execute: async (params) => {
            const result = await fetchOrderDetails(params);
            toolCallRecords.push({
              toolName: "fetchOrderDetails",
              args: params,
              result,
            });
            return result;
          },
        }),
        checkDeliveryStatus: tool({
          description:
            "Check delivery/shipment status including tracking number and carrier",
          parameters: z.object({
            orderId: z.string().describe("The order UUID to check delivery for"),
          }),
          execute: async (params) => {
            const result = await checkDeliveryStatus(params);
            toolCallRecords.push({
              toolName: "checkDeliveryStatus",
              args: params,
              result,
            });
            return result;
          },
        }),
      },
      maxSteps: 5,
    });

    return {
      content: result.text,
      agentType: "order",
      metadata: {
        toolCalls: toolCallRecords.length > 0 ? toolCallRecords : undefined,
      },
    };
  },
};

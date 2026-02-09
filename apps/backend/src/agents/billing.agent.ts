import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { AgentContext, AgentResponse } from "./base.agent.js";
import { getInvoiceDetails } from "../tools/get-invoice-details.js";
import { checkRefundStatus } from "../tools/check-refund-status.js";
import { getUserInvoices } from "../tools/get-user-invoices.js";
import { getUserRefunds } from "../tools/get-user-refunds.js";

const BILLING_SYSTEM_PROMPT = `You are a specialized billing support agent for an e-commerce platform.

You handle:
- Payment issues and failures
- Refund requests and status checks
- Invoice inquiries
- Subscription queries

You have access to these tools:
- getUserInvoices: List all invoices for the user
- getInvoiceDetails: Get detailed information about a specific invoice
- getUserRefunds: List all refunds for the user
- checkRefundStatus: Check status of a specific refund

Guidelines:
- Always look up real data using your tools before responding
- For invoice questions, retrieve the actual invoice details
- For refund questions, check the actual refund status
- Provide specific amounts, dates, and statuses
- Be empathetic about payment issues
- Explain refund timelines clearly`;

/**
 * Billing Agent
 *
 * Handles: Payment issues, refunds, invoices, subscription queries
 * Tools: getInvoiceDetails, checkRefundStatus, getUserInvoices, getUserRefunds
 */
export const billingAgent = {
  async process(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const toolCallRecords: AgentResponse["metadata"]["toolCalls"] = [];

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: BILLING_SYSTEM_PROMPT,
      messages: [
        ...context.messageHistory.slice(-10),
        { role: "user", content: message },
      ],
      tools: {
        getUserInvoices: tool({
          description: "List all invoices for the current user",
          parameters: z.object({
            userId: z.string().describe("The user ID"),
          }),
          execute: async (params) => {
            const result = await getUserInvoices({
              userId: params.userId ?? context.userId,
            });
            toolCallRecords.push({
              toolName: "getUserInvoices",
              args: params,
              result,
            });
            return result;
          },
        }),
        getInvoiceDetails: tool({
          description:
            "Get detailed information about a specific invoice by number or order ID",
          parameters: z.object({
            invoiceNumber: z.string().optional().describe("The invoice number (e.g. INV-2024-001)"),
            orderId: z.string().optional().describe("The order UUID"),
          }),
          execute: async (params) => {
            const result = await getInvoiceDetails(params);
            toolCallRecords.push({
              toolName: "getInvoiceDetails",
              args: params,
              result,
            });
            return result;
          },
        }),
        getUserRefunds: tool({
          description: "List all refunds for the current user",
          parameters: z.object({
            userId: z.string().describe("The user ID"),
          }),
          execute: async (params) => {
            const result = await getUserRefunds({
              userId: params.userId ?? context.userId,
            });
            toolCallRecords.push({
              toolName: "getUserRefunds",
              args: params,
              result,
            });
            return result;
          },
        }),
        checkRefundStatus: tool({
          description: "Check status of a specific refund or all refunds for a user",
          parameters: z.object({
            userId: z.string().describe("The user ID"),
            refundId: z.string().optional().describe("Optional specific refund ID"),
          }),
          execute: async (params) => {
            const result = await checkRefundStatus({
              userId: params.userId ?? context.userId,
              refundId: params.refundId,
            });
            toolCallRecords.push({
              toolName: "checkRefundStatus",
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
      agentType: "billing",
      metadata: {
        toolCalls: toolCallRecords.length > 0 ? toolCallRecords : undefined,
      },
    };
  },
};

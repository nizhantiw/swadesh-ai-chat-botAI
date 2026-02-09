import { z } from "zod";

// ─── Agent Domain ────────────────────────────────────────────────────────────

export const AgentType = z.enum(["router", "support", "order", "billing"]);
export type AgentType = z.infer<typeof AgentType>;

export const SenderType = z.enum(["user", "agent"]);
export type SenderType = z.infer<typeof SenderType>;

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  capabilities: AgentCapability[];
}

export interface AgentCapability {
  id: string;
  agentType: AgentType;
  name: string;
  description: string;
}

// ─── Conversation Domain ─────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderType: SenderType;
  agentType: AgentType | null;
  metadata: MessageMetadata | null;
  createdAt: Date;
}

export interface MessageMetadata {
  reasoning?: string;
  toolCalls?: ToolCallRecord[];
  routedFrom?: AgentType;
  routedTo?: AgentType;
  intent?: string;
}

export interface ToolCallRecord {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

// ─── Order Domain ────────────────────────────────────────────────────────────

export const OrderStatus = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const ShipmentStatus = z.enum([
  "preparing",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
]);
export type ShipmentStatus = z.infer<typeof ShipmentStatus>;

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: ShipmentStatus;
  estimatedDelivery: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Billing Domain ──────────────────────────────────────────────────────────

export const PaymentStatus = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const RefundStatus = z.enum([
  "requested",
  "processing",
  "approved",
  "completed",
  "rejected",
]);
export type RefundStatus = z.infer<typeof RefundStatus>;

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  orderId: string;
  userId: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: string;
  issuedAt: Date;
  dueDate: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  userId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}

// ─── API / Transport Domain ─────────────────────────────────────────────────

/** Request to send a new message */
export const SendMessageRequest = z.object({
  conversationId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  content: z.string().min(1),
});
export type SendMessageRequest = z.infer<typeof SendMessageRequest>;

/** SSE event types for streaming */
export type StreamEventType =
  | "message_start"
  | "message_delta"
  | "message_complete"
  | "agent_typing"
  | "tool_call"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  data: unknown;
}

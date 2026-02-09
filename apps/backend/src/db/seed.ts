import "dotenv/config";
import { db } from "./index.js";
import {
  users,
  conversations,
  messages,
  agents,
  agentCapabilities,
  orders,
  shipments,
  payments,
  invoices,
  refunds,
} from "./schema.js";

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── Clean existing data ──────────────────────────────────────────────────

  await db.delete(refunds);
  await db.delete(invoices);
  await db.delete(payments);
  await db.delete(shipments);
  await db.delete(orders);
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(agentCapabilities);
  await db.delete(agents);
  await db.delete(users);

  console.log("  ✓ Cleaned existing data");

  // ─── Users ────────────────────────────────────────────────────────────────
  // Use fixed UUIDs that match the frontend's hardcoded user selector
  const FIXED_USER_IDS = {
    alice: "efdb5692-26bf-4f80-99ea-abec43c55864",
    bob: "f5736b96-f4bb-4647-90e0-4649dca71ff3",
    carol: "01c9d036-3a6d-4263-b12a-2a692e9049c0",
  };

  const [user1, user2, user3] = await db
    .insert(users)
    .values([
      { id: FIXED_USER_IDS.alice, email: "alice@example.com", name: "Alice Johnson" },
      { id: FIXED_USER_IDS.bob, email: "bob@example.com", name: "Bob Smith" },
      { id: FIXED_USER_IDS.carol, email: "carol@example.com", name: "Carol Williams" },
    ])
    .returning();

  console.log("  ✓ Created 3 users");

  // ─── Agents ───────────────────────────────────────────────────────────────

  await db.insert(agents).values([
    {
      type: "router",
      name: "Router Agent",
      description:
        "Analyzes incoming customer queries and routes them to the appropriate specialized agent.",
    },
    {
      type: "support",
      name: "Support Agent",
      description:
        "Handles general support inquiries, FAQs, and troubleshooting.",
    },
    {
      type: "order",
      name: "Order Agent",
      description:
        "Handles order status, tracking, modifications, and cancellations.",
    },
    {
      type: "billing",
      name: "Billing Agent",
      description:
        "Handles payment issues, refunds, invoices, and subscription queries.",
    },
  ]);

  await db.insert(agentCapabilities).values([
    // Router
    {
      agentType: "router",
      name: "Intent Classification",
      description: "Classifies user intent to route to the correct sub-agent",
    },
    {
      agentType: "router",
      name: "Fallback Handling",
      description: "Handles unclassified or ambiguous queries",
    },
    // Support
    {
      agentType: "support",
      name: "FAQ Handling",
      description: "Answers frequently asked questions",
    },
    {
      agentType: "support",
      name: "Troubleshooting",
      description: "Guides users through common troubleshooting steps",
    },
    {
      agentType: "support",
      name: "Conversation History",
      description: "Queries past conversation context for better responses",
    },
    // Order
    {
      agentType: "order",
      name: "Order Lookup",
      description: "Fetches order details and status",
    },
    {
      agentType: "order",
      name: "Delivery Tracking",
      description: "Checks delivery/shipment status",
    },
    {
      agentType: "order",
      name: "Order Modifications",
      description: "Handles order cancellations and modifications",
    },
    // Billing
    {
      agentType: "billing",
      name: "Invoice Lookup",
      description: "Retrieves invoice details",
    },
    {
      agentType: "billing",
      name: "Refund Status",
      description: "Checks refund request status",
    },
    {
      agentType: "billing",
      name: "Payment Issues",
      description: "Handles payment failures and disputes",
    },
  ]);

  console.log("  ✓ Created 4 agents with capabilities");

  // ─── Orders (10 orders across users) ──────────────────────────────────────

  const orderData = await db
    .insert(orders)
    .values([
      {
        userId: user1.id,
        orderNumber: "ORD-2024-001",
        status: "delivered",
        totalAmount: "129.99",
        items: [
          { name: "Wireless Headphones", quantity: 1, price: 89.99 },
          { name: "USB-C Cable", quantity: 2, price: 20.0 },
        ],
        shippingAddress: "123 Main St, New York, NY 10001",
      },
      {
        userId: user1.id,
        orderNumber: "ORD-2024-002",
        status: "shipped",
        totalAmount: "249.99",
        items: [{ name: "Mechanical Keyboard", quantity: 1, price: 249.99 }],
        shippingAddress: "123 Main St, New York, NY 10001",
      },
      {
        userId: user1.id,
        orderNumber: "ORD-2024-003",
        status: "processing",
        totalAmount: "59.99",
        items: [{ name: "Phone Case", quantity: 3, price: 19.99 }],
        shippingAddress: "123 Main St, New York, NY 10001",
      },
      {
        userId: user2.id,
        orderNumber: "ORD-2024-004",
        status: "delivered",
        totalAmount: "1299.99",
        items: [{ name: 'Monitor 27"', quantity: 1, price: 1299.99 }],
        shippingAddress: "456 Oak Ave, Los Angeles, CA 90001",
      },
      {
        userId: user2.id,
        orderNumber: "ORD-2024-005",
        status: "cancelled",
        totalAmount: "79.99",
        items: [{ name: "Desk Lamp", quantity: 1, price: 79.99 }],
        shippingAddress: "456 Oak Ave, Los Angeles, CA 90001",
      },
      {
        userId: user2.id,
        orderNumber: "ORD-2024-006",
        status: "shipped",
        totalAmount: "449.98",
        items: [{ name: "Office Chair", quantity: 1, price: 449.98 }],
        shippingAddress: "456 Oak Ave, Los Angeles, CA 90001",
      },
      {
        userId: user3.id,
        orderNumber: "ORD-2024-007",
        status: "pending",
        totalAmount: "34.99",
        items: [{ name: "Mouse Pad XL", quantity: 1, price: 34.99 }],
        shippingAddress: "789 Pine Rd, Chicago, IL 60601",
      },
      {
        userId: user3.id,
        orderNumber: "ORD-2024-008",
        status: "confirmed",
        totalAmount: "199.99",
        items: [{ name: "Webcam 4K", quantity: 1, price: 199.99 }],
        shippingAddress: "789 Pine Rd, Chicago, IL 60601",
      },
      {
        userId: user3.id,
        orderNumber: "ORD-2024-009",
        status: "delivered",
        totalAmount: "549.97",
        items: [
          { name: "Standing Desk Mat", quantity: 1, price: 49.99 },
          { name: "Ergonomic Mouse", quantity: 1, price: 99.99 },
          { name: "Laptop Stand", quantity: 1, price: 399.99 },
        ],
        shippingAddress: "789 Pine Rd, Chicago, IL 60601",
      },
      {
        userId: user1.id,
        orderNumber: "ORD-2024-010",
        status: "shipped",
        totalAmount: "89.99",
        items: [{ name: "Bluetooth Speaker", quantity: 1, price: 89.99 }],
        shippingAddress: "123 Main St, New York, NY 10001",
      },
    ])
    .returning();

  console.log("  ✓ Created 10 orders");

  // ─── Shipments ────────────────────────────────────────────────────────────

  await db.insert(shipments).values([
    {
      orderId: orderData[0].id, // ORD-001 delivered
      trackingNumber: "TRK-FX-100001",
      carrier: "FedEx",
      status: "delivered",
      estimatedDelivery: "2024-12-20",
      deliveredAt: new Date("2024-12-19T14:30:00Z"),
    },
    {
      orderId: orderData[1].id, // ORD-002 shipped
      trackingNumber: "TRK-UP-200002",
      carrier: "UPS",
      status: "in_transit",
      estimatedDelivery: "2025-02-15",
    },
    {
      orderId: orderData[3].id, // ORD-004 delivered
      trackingNumber: "TRK-FX-300003",
      carrier: "FedEx",
      status: "delivered",
      estimatedDelivery: "2025-01-10",
      deliveredAt: new Date("2025-01-09T11:00:00Z"),
    },
    {
      orderId: orderData[5].id, // ORD-006 shipped
      trackingNumber: "TRK-DH-400004",
      carrier: "DHL",
      status: "out_for_delivery",
      estimatedDelivery: "2025-02-10",
    },
    {
      orderId: orderData[8].id, // ORD-009 delivered
      trackingNumber: "TRK-UP-500005",
      carrier: "UPS",
      status: "delivered",
      estimatedDelivery: "2025-01-25",
      deliveredAt: new Date("2025-01-24T16:45:00Z"),
    },
    {
      orderId: orderData[9].id, // ORD-010 shipped
      trackingNumber: "TRK-FX-600006",
      carrier: "FedEx",
      status: "in_transit",
      estimatedDelivery: "2025-02-12",
    },
  ]);

  console.log("  ✓ Created 6 shipments");

  // ─── Payments ─────────────────────────────────────────────────────────────

  const paymentData = await db
    .insert(payments)
    .values([
      {
        orderId: orderData[0].id,
        userId: user1.id,
        amount: "129.99",
        status: "completed",
        method: "credit_card",
      },
      {
        orderId: orderData[1].id,
        userId: user1.id,
        amount: "249.99",
        status: "completed",
        method: "credit_card",
      },
      {
        orderId: orderData[2].id,
        userId: user1.id,
        amount: "59.99",
        status: "completed",
        method: "paypal",
      },
      {
        orderId: orderData[3].id,
        userId: user2.id,
        amount: "1299.99",
        status: "completed",
        method: "credit_card",
      },
      {
        orderId: orderData[4].id,
        userId: user2.id,
        amount: "79.99",
        status: "refunded",
        method: "debit_card",
      },
      {
        orderId: orderData[5].id,
        userId: user2.id,
        amount: "449.98",
        status: "completed",
        method: "credit_card",
      },
      {
        orderId: orderData[6].id,
        userId: user3.id,
        amount: "34.99",
        status: "pending",
        method: "credit_card",
      },
      {
        orderId: orderData[7].id,
        userId: user3.id,
        amount: "199.99",
        status: "completed",
        method: "paypal",
      },
      {
        orderId: orderData[8].id,
        userId: user3.id,
        amount: "549.97",
        status: "completed",
        method: "credit_card",
      },
      {
        orderId: orderData[9].id,
        userId: user1.id,
        amount: "89.99",
        status: "completed",
        method: "credit_card",
      },
    ])
    .returning();

  console.log("  ✓ Created 10 payments");

  // ─── Invoices (5 invoices) ────────────────────────────────────────────────

  await db.insert(invoices).values([
    {
      orderId: orderData[0].id,
      userId: user1.id,
      invoiceNumber: "INV-2024-001",
      amount: "117.27",
      tax: "12.72",
      totalAmount: "129.99",
      status: "paid",
      dueDate: "2025-01-20",
    },
    {
      orderId: orderData[1].id,
      userId: user1.id,
      invoiceNumber: "INV-2024-002",
      amount: "225.22",
      tax: "24.77",
      totalAmount: "249.99",
      status: "paid",
      dueDate: "2025-02-15",
    },
    {
      orderId: orderData[3].id,
      userId: user2.id,
      invoiceNumber: "INV-2024-003",
      amount: "1172.72",
      tax: "127.27",
      totalAmount: "1299.99",
      status: "paid",
      dueDate: "2025-02-10",
    },
    {
      orderId: orderData[5].id,
      userId: user2.id,
      invoiceNumber: "INV-2024-004",
      amount: "405.43",
      tax: "44.55",
      totalAmount: "449.98",
      status: "issued",
      dueDate: "2025-03-01",
    },
    {
      orderId: orderData[8].id,
      userId: user3.id,
      invoiceNumber: "INV-2024-005",
      amount: "495.43",
      tax: "54.54",
      totalAmount: "549.97",
      status: "paid",
      dueDate: "2025-02-25",
    },
  ]);

  console.log("  ✓ Created 5 invoices");

  // ─── Refunds (3 refunds) ──────────────────────────────────────────────────

  await db.insert(refunds).values([
    {
      paymentId: paymentData[4].id, // cancelled order
      userId: user2.id,
      amount: "79.99",
      reason: "Order cancelled by customer",
      status: "completed",
      resolvedAt: new Date("2025-01-20T10:00:00Z"),
    },
    {
      paymentId: paymentData[0].id,
      userId: user1.id,
      amount: "20.00",
      reason: "Defective USB-C cable received",
      status: "processing",
    },
    {
      paymentId: paymentData[3].id,
      userId: user2.id,
      amount: "1299.99",
      reason: "Monitor arrived with dead pixels",
      status: "requested",
    },
  ]);

  console.log("  ✓ Created 3 refunds");

  // ─── Conversations (2 existing) ───────────────────────────────────────────

  const [conv1, conv2] = await db
    .insert(conversations)
    .values([
      { userId: user1.id, title: "Order tracking question" },
      { userId: user2.id, title: "Refund request for monitor" },
    ])
    .returning();

  await db.insert(messages).values([
    // Conversation 1 - Alice asking about order
    {
      conversationId: conv1.id,
      content: "Hi, I placed an order last week. Can you tell me where it is?",
      senderType: "user",
    },
    {
      conversationId: conv1.id,
      content:
        "I'd be happy to help you track your order! Let me look up your recent orders. I can see you have order ORD-2024-002 (Mechanical Keyboard) which is currently shipped and in transit via UPS. The estimated delivery is February 15, 2025. Would you like more details?",
      senderType: "agent",
      agentType: "order",
      metadata: {
        routedFrom: "router",
        routedTo: "order",
        intent: "order_tracking",
        toolCalls: [
          {
            toolName: "fetchOrderDetails",
            args: { orderNumber: "ORD-2024-002" },
            result: { status: "shipped" },
          },
        ],
      },
    },
    {
      conversationId: conv1.id,
      content: "Great, thanks! What's the tracking number?",
      senderType: "user",
    },
    {
      conversationId: conv1.id,
      content:
        "The tracking number for your Mechanical Keyboard order is TRK-UP-200002, shipping via UPS. You can track it on the UPS website. Is there anything else I can help with?",
      senderType: "agent",
      agentType: "order",
      metadata: {
        intent: "order_tracking",
        toolCalls: [
          {
            toolName: "checkDeliveryStatus",
            args: { orderId: "ORD-2024-002" },
            result: {
              trackingNumber: "TRK-UP-200002",
              status: "in_transit",
            },
          },
        ],
      },
    },
    // Conversation 2 - Bob asking about refund
    {
      conversationId: conv2.id,
      content:
        "I received a monitor with dead pixels and I want a refund. Order number is ORD-2024-004.",
      senderType: "user",
    },
    {
      conversationId: conv2.id,
      content:
        "I'm sorry to hear about the defective monitor. I can see your order ORD-2024-004 for the 27\" Monitor ($1,299.99). I've initiated a refund request for the full amount. The refund is currently in 'requested' status. Our team will review it within 2-3 business days. Is there anything else I can help with?",
      senderType: "agent",
      agentType: "billing",
      metadata: {
        routedFrom: "router",
        routedTo: "billing",
        intent: "refund_request",
        toolCalls: [
          {
            toolName: "getInvoiceDetails",
            args: { orderId: "ORD-2024-004" },
            result: { invoiceNumber: "INV-2024-003", totalAmount: "1299.99" },
          },
        ],
      },
    },
  ]);

  console.log("  ✓ Created 2 conversations with messages");

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders, shipments } from "../db/schema.js";
import { NotFoundError } from "../middleware/error-handler.js";

export const orderService = {
  /**
   * Get order by ID with shipments.
   */
  async getById(orderId: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { shipments: true },
    });

    if (!order) throw new NotFoundError("Order", orderId);
    return order;
  },

  /**
   * Get order by order number.
   */
  async getByOrderNumber(orderNumber: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
      with: { shipments: true },
    });

    if (!order) throw new NotFoundError("Order", orderNumber);
    return order;
  },

  /**
   * List all orders for a user.
   */
  async listByUser(userId: string) {
    return db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: { shipments: true },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });
  },

  /**
   * Get delivery/shipment status for an order.
   */
  async getDeliveryStatus(orderId: string) {
    const shipmentList = await db.query.shipments.findMany({
      where: eq(shipments.orderId, orderId),
    });

    if (shipmentList.length === 0) {
      return { orderId, status: "no_shipment", shipments: [] };
    }

    return {
      orderId,
      status: shipmentList[0].status,
      shipments: shipmentList,
    };
  },
};

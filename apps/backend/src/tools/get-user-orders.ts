import { orderService } from "../services/order.service.js";

/**
 * Lists all orders for a user.
 * Used by: Order Agent (to find which order user is asking about)
 */
export async function getUserOrders(params: {
  userId: string;
}): Promise<{
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    createdAt: Date;
  }>;
}> {
  const orderList = await orderService.listByUser(params.userId);
  return {
    orders: orderList.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      items: o.items,
      createdAt: o.createdAt,
    })),
  };
}

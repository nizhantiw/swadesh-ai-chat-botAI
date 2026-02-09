import { orderService } from "../services/order.service.js";

/**
 * Fetches order details by order number or ID.
 * Used by: Order Agent
 */
export async function fetchOrderDetails(params: {
  orderNumber?: string;
  orderId?: string;
}): Promise<{
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  shippingAddress: string;
  createdAt: Date;
  hasShipment: boolean;
}> {
  const order = params.orderNumber
    ? await orderService.getByOrderNumber(params.orderNumber)
    : await orderService.getById(params.orderId!);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    items: order.items,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt,
    hasShipment: order.shipments.length > 0,
  };
}

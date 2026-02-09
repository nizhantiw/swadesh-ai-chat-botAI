import { orderService } from "../services/order.service.js";

/**
 * Checks delivery/shipment status for an order.
 * Used by: Order Agent
 */
export async function checkDeliveryStatus(params: {
  orderId: string;
}): Promise<{
  orderId: string;
  orderStatus: string;
  shipments: Array<{
    trackingNumber: string;
    carrier: string;
    status: string;
    estimatedDelivery: string | null;
    deliveredAt: Date | null;
  }>;
}> {
  const delivery = await orderService.getDeliveryStatus(params.orderId);

  return {
    orderId: delivery.orderId,
    orderStatus: delivery.status,
    shipments: delivery.shipments.map((s) => ({
      trackingNumber: s.trackingNumber,
      carrier: s.carrier,
      status: s.status,
      estimatedDelivery: s.estimatedDelivery,
      deliveredAt: s.deliveredAt,
    })),
  };
}

import { billingService } from "../services/billing.service.js";

/**
 * Checks refund status for a user.
 * Used by: Billing Agent
 */
export async function checkRefundStatus(params: {
  userId: string;
  refundId?: string;
}): Promise<{
  refunds: Array<{
    id: string;
    amount: string;
    reason: string;
    status: string;
    createdAt: Date;
    resolvedAt: Date | null;
  }>;
}> {
  if (params.refundId) {
    const refund = await billingService.getRefundById(params.refundId);
    return {
      refunds: [
        {
          id: refund.id,
          amount: refund.amount,
          reason: refund.reason,
          status: refund.status,
          createdAt: refund.createdAt,
          resolvedAt: refund.resolvedAt,
        },
      ],
    };
  }

  const refundList = await billingService.listRefundsByUser(params.userId);
  return {
    refunds: refundList.map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
    })),
  };
}

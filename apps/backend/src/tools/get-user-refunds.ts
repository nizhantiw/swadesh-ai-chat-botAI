import { billingService } from "../services/billing.service.js";

/**
 * Lists all refunds for a user.
 * Used by: Billing Agent
 */
export async function getUserRefunds(params: {
  userId: string;
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

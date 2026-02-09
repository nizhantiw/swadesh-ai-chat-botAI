import { billingService } from "../services/billing.service.js";

/**
 * Lists all invoices for a user.
 * Used by: Billing Agent
 */
export async function getUserInvoices(params: {
  userId: string;
}): Promise<{
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    status: string;
    issuedAt: Date;
    dueDate: string;
  }>;
}> {
  const invoiceList = await billingService.listInvoicesByUser(params.userId);
  return {
    invoices: invoiceList.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      totalAmount: i.totalAmount,
      status: i.status,
      issuedAt: i.issuedAt,
      dueDate: i.dueDate,
    })),
  };
}

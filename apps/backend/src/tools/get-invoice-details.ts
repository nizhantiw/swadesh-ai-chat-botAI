import { billingService } from "../services/billing.service.js";

/**
 * Retrieves invoice details by invoice number or order ID.
 * Used by: Billing Agent
 */
export async function getInvoiceDetails(params: {
  invoiceNumber?: string;
  orderId?: string;
}): Promise<{
  id: string;
  invoiceNumber: string;
  amount: string;
  tax: string;
  totalAmount: string;
  status: string;
  issuedAt: Date;
  dueDate: string;
} | null> {
  if (params.invoiceNumber) {
    const invoice = await billingService.getInvoiceByNumber(
      params.invoiceNumber
    );
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
    };
  }

  if (params.orderId) {
    const invoiceList = await billingService.getInvoicesByOrder(params.orderId);
    if (invoiceList.length === 0) return null;
    const invoice = invoiceList[0];
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
    };
  }

  return null;
}

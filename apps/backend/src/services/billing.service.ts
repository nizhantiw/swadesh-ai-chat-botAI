import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { payments, invoices, refunds } from "../db/schema.js";
import { NotFoundError } from "../middleware/error-handler.js";

export const billingService = {
  /**
   * Get invoice by ID.
   */
  async getInvoiceById(invoiceId: string) {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
    });

    if (!invoice) throw new NotFoundError("Invoice", invoiceId);
    return invoice;
  },

  /**
   * Get invoice by invoice number.
   */
  async getInvoiceByNumber(invoiceNumber: string) {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.invoiceNumber, invoiceNumber),
    });

    if (!invoice) throw new NotFoundError("Invoice", invoiceNumber);
    return invoice;
  },

  /**
   * List invoices for a user.
   */
  async listInvoicesByUser(userId: string) {
    return db.query.invoices.findMany({
      where: eq(invoices.userId, userId),
    });
  },

  /**
   * Get invoices for an order.
   */
  async getInvoicesByOrder(orderId: string) {
    return db.query.invoices.findMany({
      where: eq(invoices.orderId, orderId),
    });
  },

  /**
   * Get refund by ID.
   */
  async getRefundById(refundId: string) {
    const refund = await db.query.refunds.findFirst({
      where: eq(refunds.id, refundId),
    });

    if (!refund) throw new NotFoundError("Refund", refundId);
    return refund;
  },

  /**
   * Check refund status for a payment.
   */
  async getRefundsByPayment(paymentId: string) {
    return db.query.refunds.findMany({
      where: eq(refunds.paymentId, paymentId),
    });
  },

  /**
   * List all refunds for a user.
   */
  async listRefundsByUser(userId: string) {
    return db.query.refunds.findMany({
      where: eq(refunds.userId, userId),
    });
  },

  /**
   * Get payment for an order.
   */
  async getPaymentByOrder(orderId: string) {
    return db.query.payments.findFirst({
      where: eq(payments.orderId, orderId),
    });
  },

  /**
   * List all payments for a user.
   */
  async listPaymentsByUser(userId: string) {
    return db.query.payments.findMany({
      where: eq(payments.userId, userId),
    });
  },
};

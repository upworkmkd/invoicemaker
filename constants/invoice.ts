export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum TaxType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export const INVOICE_DEFAULTS = {
  currency: 'USD',
  taxRate: 0,
  discount: 0,
  status: InvoiceStatus.DRAFT,
} as const;

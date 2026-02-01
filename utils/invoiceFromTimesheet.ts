import { Invoice } from '@/types/invoice';
import { InvoiceStatus } from '@/constants/invoice';
import { parseTimesheet } from './timesheetParser';
import { getConfig } from './config';
import { calculateSubtotal, calculateTax, calculateTotal } from './invoiceCalculator';
import { getPreviousMonth } from './dateUtils';

export const createInvoiceFromTimesheet = async (
  timesheetPathOrBuffer: string | Buffer,
  month?: string,
  year?: string
): Promise<Invoice> => {
  const config = getConfig();
  
  // Parse timesheet
  const { items, totalHours, month: parsedMonth } = await parseTimesheet(
    timesheetPathOrBuffer,
    config.invoice.hourlyRate,
    config.timesheet.dateColumn,
    config.timesheet.hoursColumn,
    config.timesheet.descriptionColumn,
    config.timesheet.startRow,
    config.timesheet.sheetName
  );

  // Generate invoice number (use previous month by default)
  const now = new Date();
  const invoiceMonth = month || getPreviousMonth();
  const invoiceYear = year || now.getFullYear().toString();
  const invoiceNumber = `${config.invoice.prefix}${String(Date.now()).slice(-4)}-${invoiceMonth}`;

  // Calculate totals
  const subtotal = calculateSubtotal(items);
  const taxAmount = calculateTax(subtotal, config.invoice.taxRate);
  const total = calculateTotal(subtotal, taxAmount, config.invoice.discount);

  // Calculate dates
  const invoiceDate = new Date();
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + parseInt(config.invoice.paymentTerms.replace(/\D/g, '')) || 30);

  const invoice: Invoice = {
    invoiceNumber,
    date: invoiceDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    from: {
      name: config.company.name,
      address: config.company.address,
      email: config.company.email,
      phone: config.company.phone,
    },
    to: {
      name: config.client.name,
      address: config.client.address,
      email: config.client.email,
      phone: config.client.phone,
    },
    items,
    subtotal,
    taxRate: config.invoice.taxRate,
    taxAmount,
    discount: config.invoice.discount,
    total,
    notes: `Invoice for ${parsedMonth}. Total hours: ${totalHours.toFixed(2)}. Rate: ${config.invoice.currency} ${config.invoice.hourlyRate}/hour.`,
    status: InvoiceStatus.DRAFT,
  };

  return invoice;
};

import { InvoiceStatus, TaxType } from '@/constants/invoice';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  from: {
    name: string;
    address: string;
    email: string;
    phone: string;
	fax?: string;
  };
  to: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes: string;
  status: InvoiceStatus;
}

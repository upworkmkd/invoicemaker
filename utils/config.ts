export interface AppConfig {
  timesheet: {
    path: string;
    dateColumn: string;
    hoursColumn: string;
    descriptionColumn: string;
    startRow: number;
    sheetName?: string;
  };
  invoice: {
    hourlyRate: number;
    currency: string;
    prefix: string;
    taxRate: number;
    discount: number;
    paymentTerms: string;
  };
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  client: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
}

export const getConfig = (): AppConfig => {
  return {
    timesheet: {
      path: process.env.TIMESHEET_PATH || 'data/Timesheet Template.xlsx',
      dateColumn: process.env.TIMESHEET_DATE_COLUMN || 'A',
      hoursColumn: process.env.TIMESHEET_HOURS_COLUMN || 'B',
      descriptionColumn: process.env.TIMESHEET_DESCRIPTION_COLUMN || 'C',
      startRow: parseInt(process.env.TIMESHEET_START_ROW || '2', 10),
      sheetName: process.env.TIMESHEET_SHEET_NAME || undefined,
    },
    invoice: {
      hourlyRate: parseFloat(process.env.HOURLY_RATE || '900'),
      currency: process.env.CURRENCY || 'INR',
      prefix: process.env.INVOICE_PREFIX || 'INV',
      taxRate: parseFloat(process.env.TAX_RATE || '0'),
      discount: parseFloat(process.env.DISCOUNT || '0'),
      paymentTerms: process.env.PAYMENT_TERMS || 'Net 30',
    },
    company: {
      name: process.env.COMPANY_NAME || 'Your Company Name',
      address: process.env.COMPANY_ADDRESS || 'Your Company Address',
      email: process.env.COMPANY_EMAIL || 'your.email@example.com',
      phone: process.env.COMPANY_PHONE || '+91-1234567890',
    },
    client: {
      name: process.env.CLIENT_NAME || 'Client Company Name',
      address: process.env.CLIENT_ADDRESS || 'Client Company Address',
      email: process.env.CLIENT_EMAIL || 'client@example.com',
      phone: process.env.CLIENT_PHONE || '+91-9876543210',
    },
  };
};

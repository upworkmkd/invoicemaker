'use client';

import { useState } from 'react';
import { InvoiceForm } from '@/components/InvoiceForm';
import { TimesheetUpload } from '@/components/TimesheetUpload';
import { Invoice } from '@/types/invoice';
import { generatePDF } from '@/utils/pdfGenerator';
import { THEME } from '@/constants/theme';
import { translations } from '@/constants/translations';

const createStyle = () => ({
  container: {
    minHeight: '100vh',
    padding: THEME.spacing.xl,
    backgroundColor: THEME.colors.surface,
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto',
    marginBottom: THEME.spacing.xl,
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: '16px',
    color: THEME.colors.textSecondary,
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
});

export default function Home() {
  const styles = createStyle();
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | undefined>(undefined);

  const handleSave = (invoice: Invoice) => {
    const invoiceWithId = {
      ...invoice,
      id: invoice.id || Date.now().toString(),
    };
    setSavedInvoices(prev => {
      const existingIndex = prev.findIndex(inv => inv.id === invoiceWithId.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = invoiceWithId;
        return updated;
      }
      return [...prev, invoiceWithId];
    });
    alert('Invoice saved successfully!');
  };

  const handleGeneratePDF = (invoice: Invoice) => {
    generatePDF(invoice);
  };

  const handleInvoiceGenerated = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{translations.invoice.title} Maker</h1>
        <p style={styles.subtitle}>Create professional invoices from timesheets</p>
      </div>
      <div style={styles.content}>
        <TimesheetUpload onInvoiceGenerated={handleInvoiceGenerated} />
        <InvoiceForm
          invoice={currentInvoice}
          onSave={handleSave}
          onGeneratePDF={handleGeneratePDF}
        />
      </div>
    </div>
  );
}

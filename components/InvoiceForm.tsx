'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { translations } from '@/constants/translations';
import { THEME } from '@/constants/theme';
import { INVOICE_DEFAULTS, InvoiceStatus } from '@/constants/invoice';
import { calculateItemTotal, calculateSubtotal, calculateTax, calculateTotal } from '@/utils/invoiceCalculator';
import { getPreviousMonth } from '@/utils/dateUtils';

interface InvoiceFormProps {
  invoice?: Invoice;
  onSave: (invoice: Invoice) => void;
  onGeneratePDF: (invoice: Invoice) => void;
}

const createStyle = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: THEME.spacing.lg,
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.lg,
    border: `1px solid ${THEME.colors.border}`,
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: THEME.spacing.md,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: THEME.spacing.xs,
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: THEME.colors.textPrimary,
  },
  input: {
    padding: `${THEME.spacing.sm} ${THEME.spacing.md}`,
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.borderRadius.md,
    fontSize: '14px',
    color: THEME.colors.textPrimary,
    backgroundColor: THEME.colors.background,
  },
  textarea: {
    padding: `${THEME.spacing.sm} ${THEME.spacing.md}`,
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.borderRadius.md,
    fontSize: '14px',
    color: THEME.colors.textPrimary,
    backgroundColor: THEME.colors.background,
    minHeight: '80px',
    resize: 'vertical' as const,
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: THEME.spacing.md,
  },
  tableHeader: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    textAlign: 'left' as const,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    borderBottom: `2px solid ${THEME.colors.border}`,
  },
  tableCell: {
    padding: THEME.spacing.md,
    borderBottom: `1px solid ${THEME.colors.border}`,
  },
  inputSmall: {
    padding: THEME.spacing.sm,
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.borderRadius.md,
    fontSize: '14px',
    width: '100%',
  },
  button: {
    padding: `${THEME.spacing.sm} ${THEME.spacing.md}`,
    borderRadius: THEME.borderRadius.md,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  },
  buttonPrimary: {
    backgroundColor: THEME.colors.primary,
    color: '#FFFFFF',
  },
  buttonSecondary: {
    backgroundColor: THEME.colors.secondary,
    color: '#FFFFFF',
  },
  buttonDanger: {
    backgroundColor: THEME.colors.danger,
    color: '#FFFFFF',
  },
  buttonGroup: {
    display: 'flex',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
  },
  totalsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.lg,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '300px',
    fontSize: '14px',
    color: THEME.colors.textPrimary,
  },
  totalRowGrand: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '300px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    paddingTop: THEME.spacing.sm,
    borderTop: `2px solid ${THEME.colors.border}`,
    marginTop: THEME.spacing.xs,
  },
});

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onSave, onGeneratePDF }) => {
  const styles = createStyle();
  const [formData, setFormData] = useState<Invoice>(() => {
    if (invoice) {
      return invoice;
    }
    // Use stable initial values to avoid hydration mismatch
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);
    
    return {
      invoiceNumber: '', // Will be set in useEffect to avoid hydration error
      date: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      from: {
        name: '',
        address: '',
        email: '',
        phone: '',
      },
      to: {
        name: '',
        address: '',
        email: '',
        phone: '',
      },
      items: [],
      subtotal: 0,
      taxRate: INVOICE_DEFAULTS.taxRate,
      taxAmount: 0,
      discount: INVOICE_DEFAULTS.discount,
      total: 0,
      notes: '',
      status: InvoiceStatus.DRAFT,
    };
  });

  // Update formData when invoice prop changes (e.g., from timesheet generation)
  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    }
  }, [invoice]);

  // Load config and set invoice number only on client side to avoid hydration mismatch
  useEffect(() => {
    const initializeForm = async () => {
      if (!invoice) {
        // Load config from API
        try {
          const response = await fetch('/api/config');
          if (response.ok) {
            const config = await response.json();
            
            setFormData(prev => {
              // Only update if invoice number is not set yet
              const needsInvoiceNumber = !prev.invoiceNumber;
              const month = getPreviousMonth(); // Use previous month
              const prefix = config.invoice.prefix || 'INV';
              const invoiceNumber = needsInvoiceNumber 
                ? `${prefix}${String(Date.now()).slice(-4)}-${month}`
                : prev.invoiceNumber;
              
              return {
                ...prev,
                invoiceNumber,
                from: {
                  name: config.company.name || prev.from.name,
                  address: config.company.address || prev.from.address,
                  email: config.company.email || prev.from.email,
                  phone: config.company.phone || prev.from.phone,
                },
                to: {
                  name: config.client.name || prev.to.name,
                  address: config.client.address || prev.to.address,
                  email: config.client.email || prev.to.email,
                  phone: config.client.phone || prev.to.phone,
                },
                taxRate: config.invoice.taxRate ?? prev.taxRate,
                discount: config.invoice.discount ?? prev.discount,
              };
            });
          }
        } catch (error) {
          console.error('Failed to load config:', error);
          // Fallback: generate invoice number without config
          setFormData(prev => {
            if (!prev.invoiceNumber) {
              const month = getPreviousMonth(); // Use previous month
              const invoiceNumber = `INV${String(Date.now()).slice(-4)}-${month}`;
              return {
                ...prev,
                invoiceNumber,
              };
            }
            return prev;
          });
        }
      }
    };

    initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount when no invoice is provided

  useEffect(() => {
    const subtotal = calculateSubtotal(formData.items);
    const taxAmount = calculateTax(subtotal, formData.taxRate);
    const total = calculateTotal(subtotal, taxAmount, formData.discount);

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total,
    }));
  }, [formData.items, formData.taxRate, formData.discount]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (section: 'from' | 'to', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = calculateItemTotal(
        Number(updatedItems[index].quantity),
        Number(updatedItems[index].price)
      );
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleGeneratePDF = () => {
    onGeneratePDF(formData);
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{translations.invoice.invoiceNumber}: {formData.invoiceNumber}</h2>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.date}</label>
            <input
              type="date"
              style={styles.input}
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.dueDate}</label>
            <input
              type="date"
              style={styles.input}
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{translations.invoice.from}</h3>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.companyName}</label>
            <input
              type="text"
              style={styles.input}
              value={formData.from.name}
              onChange={(e) => handleNestedInputChange('from', 'name', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.companyEmail}</label>
            <input
              type="email"
              style={styles.input}
              value={formData.from.email}
              onChange={(e) => handleNestedInputChange('from', 'email', e.target.value)}
            />
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.companyAddress}</label>
            <input
              type="text"
              style={styles.input}
              value={formData.from.address}
              onChange={(e) => handleNestedInputChange('from', 'address', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.companyPhone}</label>
            <input
              type="tel"
              style={styles.input}
              value={formData.from.phone}
              onChange={(e) => handleNestedInputChange('from', 'phone', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{translations.invoice.to}</h3>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.clientName}</label>
            <input
              type="text"
              style={styles.input}
              value={formData.to.name}
              onChange={(e) => handleNestedInputChange('to', 'name', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.clientEmail}</label>
            <input
              type="email"
              style={styles.input}
              value={formData.to.email}
              onChange={(e) => handleNestedInputChange('to', 'email', e.target.value)}
            />
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.clientAddress}</label>
            <input
              type="text"
              style={styles.input}
              value={formData.to.address}
              onChange={(e) => handleNestedInputChange('to', 'address', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.clientPhone}</label>
            <input
              type="tel"
              style={styles.input}
              value={formData.to.phone}
              onChange={(e) => handleNestedInputChange('to', 'phone', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={styles.sectionTitle}>{translations.invoice.items}</h3>
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={addItem}
          >
            {translations.invoice.addItem}
          </button>
        </div>
        <table style={styles.itemsTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>{translations.invoice.description}</th>
              <th style={styles.tableHeader}>{translations.invoice.quantity}</th>
              <th style={styles.tableHeader}>{translations.invoice.price}</th>
              <th style={styles.tableHeader}>{translations.invoice.total}</th>
              <th style={styles.tableHeader}></th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={item.id}>
                <td style={styles.tableCell}>
                  <input
                    type="text"
                    style={styles.inputSmall}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder={translations.invoice.description}
                  />
                </td>
                <td style={styles.tableCell}>
                  <input
                    type="number"
                    style={styles.inputSmall}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    min="1"
                  />
                </td>
                <td style={styles.tableCell}>
                  <input
                    type="number"
                    style={styles.inputSmall}
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </td>
                <td style={styles.tableCell}>${item.total.toFixed(2)}</td>
                <td style={styles.tableCell}>
                  <button
                    style={{ ...styles.button, ...styles.buttonDanger }}
                    onClick={() => removeItem(index)}
                  >
                    {translations.invoice.removeItem}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.section}>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.tax} (%)</label>
            <input
              type="number"
              style={styles.input}
              value={formData.taxRate}
              onChange={(e) => handleInputChange('taxRate', Number(e.target.value))}
              min="0"
              step="0.01"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{translations.invoice.discount} ($)</label>
            <input
              type="number"
              style={styles.input}
              value={formData.discount}
              onChange={(e) => handleInputChange('discount', Number(e.target.value))}
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      <div style={styles.totalsSection}>
        <div style={styles.totalRow}>
          <span>{translations.invoice.subtotal}:</span>
          <span>${formData.subtotal.toFixed(2)}</span>
        </div>
        {formData.taxAmount > 0 && (
          <div style={styles.totalRow}>
            <span>{translations.invoice.tax}:</span>
            <span>${formData.taxAmount.toFixed(2)}</span>
          </div>
        )}
        {formData.discount > 0 && (
          <div style={styles.totalRow}>
            <span>{translations.invoice.discount}:</span>
            <span>-${formData.discount.toFixed(2)}</span>
          </div>
        )}
        <div style={styles.totalRowGrand}>
          <span>{translations.invoice.grandTotal}:</span>
          <span>${formData.total.toFixed(2)}</span>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.formGroup}>
          <label style={styles.label}>{translations.invoice.notes}</label>
          <textarea
            style={styles.textarea}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder={translations.invoice.notes}
          />
        </div>
      </div>

      <div style={styles.buttonGroup}>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={handleSave}
        >
          {translations.invoice.saveInvoice}
        </button>
        <button
          style={{ ...styles.button, ...styles.buttonSecondary }}
          onClick={handleGeneratePDF}
        >
          {translations.invoice.generatePdf}
        </button>
      </div>
    </div>
  );
};

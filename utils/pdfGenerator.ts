import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types/invoice';
import { getConfig } from './config';

export const generatePDF = (invoice: Invoice): void => {
  const config = getConfig();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10; // Reduced to half (from 20 to 10)
  
  // Red color #ef4523 = RGB(239, 69, 35)
  const redColor = [239, 69, 35];
  
  // Calculate column widths: 16% left (20% reduced by 20%), 84% right
  const leftColumnWidth = pageWidth * 0.16;
  const rightColumnWidth = pageWidth * 0.84;
  const leftColumnX = margin;
  const rightColumnX = leftColumnX + leftColumnWidth + 10; // 10px gap

  // ========== LEFT COLUMN (16%) ==========
  let yPos = 35;
  
  // Date at top (aligned with Invoice No position)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0); // BLACK
  doc.text(`Date: ${invoice.date}`, leftColumnX, yPos);
  
  // Black divider line (same as under Invoice No)
  yPos += 5; // Same spacing as Invoice No to divider
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);
  doc.setLineWidth(0);
  doc.rect(leftColumnX, yPos, leftColumnWidth, 7, 'F'); // 7px height black bar (same as right side)
  
  // "To" section - Label in BLACK, content in RED
  yPos += 12; // Same spacing as after divider on right side
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // BLACK for label
  doc.text('To:', leftColumnX, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(redColor[0], redColor[1], redColor[2]); // RED #ef4523 for content
  yPos += 6;
  doc.text(invoice.to.name, leftColumnX, yPos);
  
  const toAddressLines = invoice.to.address.split('\n');
  yPos += 5;
  toAddressLines.forEach((line: string) => {
    if (line.trim()) {
      doc.text(line.trim(), leftColumnX, yPos);
      yPos += 5;
    }
  });
  
  // Ship To section - Label in BLACK, content in RED
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // BLACK for label
  doc.text('Ship To:', leftColumnX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(redColor[0], redColor[1], redColor[2]); // RED #ef4523 for content
  doc.text('Same as Recipient', leftColumnX, yPos + 5);
  
  // Instructions section - Label in BLACK, content in RED
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // BLACK for label
  doc.text('Instructions:', leftColumnX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(redColor[0], redColor[1], redColor[2]); // RED #ef4523 for content
  if (invoice.notes) {
    const notesLines = doc.splitTextToSize(invoice.notes, leftColumnWidth - 5);
    doc.text(notesLines, leftColumnX, yPos + 5);
  }

  // ========== RIGHT COLUMN (84%) ==========
  yPos = 35;
  
  // Invoice Number at top - RED
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(redColor[0], redColor[1], redColor[2]); // RED #ef4523
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, rightColumnX, yPos);
  
  // Black divider line (height reduced to 50% = ~7px)
  yPos += 5; // Reduced space between Invoice No and divider
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);
  doc.setLineWidth(0);
  doc.rect(rightColumnX, yPos, rightColumnWidth - margin - 10, 7, 'F'); // 7px height black bar, accounting for right margin
  
  // Table starts below divider
  yPos += 12; // Reduced space after divider

  // Format currency - use "INR" text instead of ₹ symbol to avoid encoding issues
  const formatCurrency = (amount: number): string => {
    if (config.invoice.currency === 'INR') {
      return amount.toFixed(0);
    }
    return `${config.invoice.currency} ${amount.toFixed(2)}`;
  };

  // Calculate total hours from all items
  const totalHours = invoice.items.reduce((sum, item) => sum + item.quantity, 0);

  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toFixed(1), // Hours with 1 decimal place
    formatCurrency(item.price),
    formatCurrency(item.total),
  ]);

  // Add summary row with total
  tableData.push([
    'Total',
    totalHours.toFixed(1),
    '', // Empty for rate column
    formatCurrency(invoice.total),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [[
      'Description',
      'Hours',
      `Rate ${config.invoice.currency}`,
      'Total',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0],
      halign: 'left',
    },
    columnStyles: {
      0: { 
        cellWidth: (rightColumnWidth - 40) * 0.55, // Description takes 55% of available width
        halign: 'left',
        valign: 'top',
      },
      1: { 
        cellWidth: (rightColumnWidth - 40) * 0.15, // Hours takes 15%
        halign: 'center',
      },
      2: { 
        cellWidth: (rightColumnWidth - 40) * 0.15, // Rate takes 15%
        halign: 'right',
      },
      3: { 
        cellWidth: (rightColumnWidth - 40) * 0.15, // Total takes 15%
        halign: 'right',
      },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    didParseCell: function(data: any) {
      // Style the last row (Total row) with bold font
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        // Center align hours in total row
        if (data.column.index === 1) {
          data.cell.styles.halign = 'center';
        }
        // Right align total amount
        if (data.column.index === 3) {
          data.cell.styles.halign = 'right';
        }
      }
    },
    margin: { left: rightColumnX, right: margin },
    tableWidth: rightColumnWidth - margin - 10,
    showHead: 'everyPage',
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // ========== TOTALS SECTION (if needed) ==========
  if (invoice.items.length > 0 && (invoice.taxAmount > 0 || invoice.discount > 0)) {
    const totalsStartX = pageWidth - margin - 70;
    const totalsLabelX = totalsStartX;
    const totalsValueX = pageWidth - margin;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Format currency helper
    const formatCurrency = (amount: number): string => {
      if (config.invoice.currency === 'INR') {
        return `INR ${amount.toFixed(0)}`;
      }
      return `${config.invoice.currency} ${amount.toFixed(2)}`;
    };

    // Subtotal
    doc.text('Subtotal:', totalsLabelX, finalY, { align: 'right' });
    doc.text(formatCurrency(invoice.subtotal), totalsValueX, finalY, { align: 'right' });
    
    let currentY = finalY + 6;

    // Tax
    if (invoice.taxAmount > 0) {
      doc.text(`Tax (${invoice.taxRate}%):`, totalsLabelX, currentY, { align: 'right' });
      doc.text(formatCurrency(invoice.taxAmount), totalsValueX, currentY, { align: 'right' });
      currentY += 6;
    }

    // Discount
    if (invoice.discount > 0) {
      doc.text('Discount:', totalsLabelX, currentY, { align: 'right' });
      doc.text(`-${formatCurrency(invoice.discount)}`, totalsValueX, currentY, { align: 'right' });
      currentY += 6;
    }

    // Total line separator
    doc.setLineWidth(0.5);
    doc.line(totalsStartX, currentY + 2, pageWidth - margin, currentY + 2);

    // Grand Total
    currentY += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsLabelX, currentY, { align: 'right' });
    doc.text(formatCurrency(invoice.total), totalsValueX, currentY, { align: 'right' });
    
    finalY = currentY + 15;
  }

  // ========== FOOTER SECTION (50:50 split) ==========
  const footerY = pageHeight - 40;
  const footerLeftX = margin;
  const footerRightX = pageWidth / 2;
  const footerWidth = (pageWidth - margin * 2) / 2;

  // Left 50%: Company info - ALL in RED
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(redColor[0], redColor[1], redColor[2]); // RED #ef4523
  doc.text(invoice.from.name, footerLeftX, footerY);
  
  // Divider - RED
  doc.setDrawColor(redColor[0], redColor[1], redColor[2]);
  doc.setLineWidth(0.5);
  doc.line(footerLeftX, footerY + 3, footerLeftX + footerWidth - 10, footerY + 3);
  
  // Three columns (33:33:33) for contact info - ALL in RED
  const contactY = footerY + 10;
  const contactColWidth = footerWidth / 3;
  
  // Left column: Telephone
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(redColor[0], redColor[1], redColor[2]); // RED #ef4523
  doc.text('Tel:' + invoice.from.phone, footerLeftX, contactY);
  doc.text('Fax:' + (invoice.from.fax || ''), footerLeftX, contactY + 5);

  // Center column: Address
  const addressColX = footerLeftX + contactColWidth;
  doc.setTextColor(redColor[0], redColor[1], redColor[2]); // RED #ef4523
  const addressLines = invoice.from.address.split('\n');
  let addressY = contactY;
  addressLines.forEach((line: string, index: number) => {
    if (line.trim()) {
      doc.text(line.trim(), addressColX, addressY);
      addressY += 4;
    }
  });
  
  // Right column: Email
  const emailColX = footerLeftX + contactColWidth * 2;
  doc.setTextColor(redColor[0], redColor[1], redColor[2]); // RED #ef4523
  doc.text(invoice.from.email, emailColX, contactY);

  // Right 50%: Thank you message
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(
    'Thank you for your business!',
    footerRightX + footerWidth / 2,
    footerY + 15,
    { align: 'center' }
  );

  // ========== SAVE PDF ==========
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
};

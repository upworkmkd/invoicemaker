'use client';

import React, { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { translations } from '@/constants/translations';
import { THEME } from '@/constants/theme';

interface TimesheetUploadProps {
  onInvoiceGenerated: (invoice: Invoice) => void;
}

const createStyle = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: THEME.spacing.md,
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.lg,
    border: `1px solid ${THEME.colors.border}`,
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  uploadArea: {
    border: `2px dashed ${THEME.colors.border}`,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.xl,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: THEME.colors.surface,
  },
  uploadAreaHover: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#F0F7FF',
  },
  input: {
    display: 'none',
  },
  button: {
    padding: `${THEME.spacing.sm} ${THEME.spacing.md}`,
    borderRadius: THEME.borderRadius.md,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: THEME.colors.primary,
    color: '#FFFFFF',
    transition: 'all 0.2s',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    color: THEME.colors.textSecondary,
  },
  error: {
    padding: THEME.spacing.md,
    backgroundColor: '#FEE2E2',
    color: THEME.colors.danger,
    borderRadius: THEME.borderRadius.md,
    fontSize: '14px',
  },
  success: {
    padding: THEME.spacing.md,
    backgroundColor: '#D1FAE5',
    color: THEME.colors.success,
    borderRadius: THEME.borderRadius.md,
    fontSize: '14px',
  },
});

export const TimesheetUpload: React.FC<TimesheetUploadProps> = ({ onInvoiceGenerated }) => {
  const styles = createStyle();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setError(null);
    setSuccess(null);
    setSelectedFile(file);
    
    // Fetch sheet names
    setIsLoadingSheets(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/get-sheets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to read sheet names');
      }

      const data = await response.json();
      setSheetNames(data.sheetNames || []);
      
      if (data.sheetNames && data.sheetNames.length > 0) {
        setSelectedSheet(data.sheetNames[0]); // Default to first sheet
        setShowSheetModal(true);
      } else {
        setError('No sheets found in the Excel file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read sheet names');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleProcessWithSheet = async () => {
    if (!selectedFile || !selectedSheet) {
      setError('Please select a sheet');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setShowSheetModal(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sheetName', selectedSheet);

      const response = await fetch('/api/process-timesheet', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process timesheet');
      }

      const data = await response.json();
      onInvoiceGenerated(data.invoice);
      setSuccess('Invoice generated successfully!');
      setSelectedFile(null);
      setSelectedSheet('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process timesheet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleGenerateFromDefault = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/process-timesheet', {
        method: 'GET',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process timesheet');
      }

      const data = await response.json();
      onInvoiceGenerated(data.invoice);
      setSuccess('Invoice generated successfully from default timesheet!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process timesheet');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Generate Invoice from Timesheet</h3>
      
      <div
        style={{
          ...styles.uploadArea,
          ...(isDragging ? styles.uploadAreaHover : {}),
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          style={styles.input}
          onChange={handleFileInput}
          disabled={isProcessing}
        />
        {isProcessing ? (
          <div style={styles.loading}>
            <span>Processing timesheet...</span>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: THEME.spacing.sm }}>
              Drag and drop your timesheet Excel file here, or click to browse
            </p>
            <p style={{ fontSize: '12px', color: THEME.colors.textSecondary }}>
              Supported formats: .xlsx, .xls
            </p>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: THEME.spacing.md }}>
        <button
          style={{
            ...styles.button,
            ...(isProcessing ? styles.buttonDisabled : {}),
          }}
          onClick={handleGenerateFromDefault}
          disabled={isProcessing}
        >
          Generate from Default Timesheet
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.success}>
          {success}
        </div>
      )}

      {/* Sheet Selection Modal */}
      {showSheetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowSheetModal(false)}>
          <div style={{
            backgroundColor: THEME.colors.background,
            borderRadius: THEME.borderRadius.lg,
            padding: THEME.spacing.xl,
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: THEME.spacing.md,
              color: THEME.colors.textPrimary,
            }}>
              Select Sheet to Import
            </h3>
            
            {isLoadingSheets ? (
              <div style={styles.loading}>
                <span>Loading sheets...</span>
              </div>
            ) : (
              <>
                <p style={{
                  marginBottom: THEME.spacing.md,
                  color: THEME.colors.textSecondary,
                  fontSize: '14px',
                }}>
                  This Excel file contains {sheetNames.length} sheet{sheetNames.length !== 1 ? 's' : ''}. Please select which sheet to use for importing data.
                </p>
                
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: THEME.spacing.sm,
                    borderRadius: THEME.borderRadius.md,
                    border: `1px solid ${THEME.colors.border}`,
                    fontSize: '14px',
                    marginBottom: THEME.spacing.lg,
                    backgroundColor: THEME.colors.surface,
                    color: THEME.colors.textPrimary,
                  }}
                >
                  {sheetNames.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
                
                <div style={{
                  display: 'flex',
                  gap: THEME.spacing.md,
                  justifyContent: 'flex-end',
                }}>
                  <button
                    onClick={() => {
                      setShowSheetModal(false);
                      setSelectedFile(null);
                      setSelectedSheet('');
                    }}
                    style={{
                      ...styles.button,
                      backgroundColor: THEME.colors.textSecondary,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessWithSheet}
                    style={styles.button}
                    disabled={!selectedSheet}
                  >
                    Import Data
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { InvoiceItem } from '@/types/invoice';

export interface TimesheetRow {
  date: string;
  hours: number;
  description: string;
}

export interface TimesheetData {
  rows: TimesheetRow[];
  totalHours: number;
  month: string;
  year: string;
}

export const parseTimesheet = async (
  filePathOrBuffer: string | Buffer,
  hourlyRate: number,
  dateColumn: string = 'A',
  hoursColumn: string = 'B',
  descriptionColumn: string = 'C',
  startRow: number = 2,
  sheetName?: string
): Promise<{ items: InvoiceItem[]; totalHours: number; month: string }> => {
  try {
    let fileBuffer: Buffer;
    
    // Handle both file path (local) and buffer (serverless)
    if (typeof filePathOrBuffer === 'string') {
      // Verify file exists before reading
      if (!fs.existsSync(filePathOrBuffer)) {
        throw new Error(`Timesheet file not found: ${filePathOrBuffer}`);
      }
      
      // Verify file is readable
      try {
        fs.accessSync(filePathOrBuffer, fs.constants.R_OK);
      } catch (accessError) {
        // Try to fix permissions
        try {
          fs.chmodSync(filePathOrBuffer, 0o644);
          // Try accessing again
          fs.accessSync(filePathOrBuffer, fs.constants.R_OK);
        } catch (e) {
          // Ignore permission errors in serverless environments
        }
      }
      
      // Get file stats to verify it's not empty
      const stats = fs.statSync(filePathOrBuffer);
      if (stats.size === 0) {
        throw new Error(`Timesheet file is empty: ${filePathOrBuffer}`);
      }
      
      // Read the Excel file - use buffer approach for better compatibility
      fileBuffer = fs.readFileSync(filePathOrBuffer);
    } else {
      // Already a buffer (serverless environment)
      fileBuffer = filePathOrBuffer;
    }
    
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error(`Failed to read file or file is empty`);
    }
    
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      cellDates: true, // Convert Excel date serial numbers to Date objects
      cellNF: false,
      cellText: false,
      dateNF: 'mm/dd/yyyy' // Specify date format hint
    });
    
    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file has no sheets or is invalid');
    }
    
    // Use specified sheet name or default to first sheet
    let targetSheetName: string;
    if (sheetName && sheetName.trim()) {
      // Check if specified sheet exists
      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found in Excel file. Available sheets: ${workbook.SheetNames.join(', ')}`);
      }
      targetSheetName = sheetName;
    } else {
      // Use first sheet if no sheet name specified
      targetSheetName = workbook.SheetNames[0];
    }
    
    const worksheet = workbook.Sheets[targetSheetName];
    
    if (!worksheet) {
      throw new Error(`Sheet "${targetSheetName}" not found in Excel file`);
    }

    // Convert to JSON - use raw: false to get formatted values, but keep dates as Date objects
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '', 
      raw: false // Get formatted strings for dates
    });
    
    // Helper function to get column index - handles both letter (A, B, C) and column name
    const getColumnIndex = (columnSpec: string, headerRow: any[]): number => {
      // If it's a single letter (A-Z), use it as column index
      if (columnSpec.length === 1 && /^[A-Z]$/i.test(columnSpec)) {
        return columnSpec.toUpperCase().charCodeAt(0) - 65;
      }
      
      // Otherwise, treat it as a column name and find it in the header row
      const index = headerRow.findIndex((cell: any) => 
        String(cell).trim().toLowerCase() === columnSpec.trim().toLowerCase()
      );
      
      if (index === -1) {
        throw new Error(`Column "${columnSpec}" not found in header row. Available columns: ${headerRow.map((c: any, i: number) => `${i}: "${c}"`).join(', ')}`);
      }
      
      return index;
    };
    
    // Get header row (first row, index 0)
    const headerRow = jsonData.length > 0 ? (jsonData[0] as any[]) : [];
    
    // Get column indices - support both letter format (A, B, C) and column name format
    const dateColIdx = getColumnIndex(dateColumn, headerRow);
    const hoursColIdx = getColumnIndex(hoursColumn, headerRow);
    const descColIdx = getColumnIndex(descriptionColumn, headerRow);
    
    console.log(`Total rows in sheet: ${jsonData.length}`);
    console.log(`Column indices - Date: "${dateColumn}" (index ${dateColIdx}), Hours: "${hoursColumn}" (index ${hoursColIdx}), Description: "${descriptionColumn}" (index ${descColIdx})`);
    if (jsonData.length > 0) {
      console.log('Header row:', headerRow);
      if (jsonData.length > 1) {
        const secondRow = jsonData[1] as any[];
        console.log('Second row (data?):', secondRow);
        console.log(`Second row - Date: "${secondRow[dateColIdx]}" (${typeof secondRow[dateColIdx]}), Hours: "${secondRow[hoursColIdx]}" (${typeof secondRow[hoursColIdx]}), Description: "${secondRow[descColIdx]}"`);
      }
    }

    const items: InvoiceItem[] = [];
    let totalHours = 0;
    const dateMap = new Map<string, { hours: number; descriptions: string[] }>();

    // Helper function to check if a value is a valid date
    const isValidDate = (value: any): boolean => {
      if (!value) return false;
      
      if (value instanceof Date) {
        return !isNaN(value.getTime());
      }
      
      if (typeof value === 'number') {
        // Excel date serial numbers are typically between 1 and ~50000
        // But could also be small numbers if dates are stored as text that got converted
        // Check if it's a reasonable date serial number (between 1900 and 2100)
        if (value > 0 && value < 100000) {
          const excelEpoch = new Date(1899, 11, 30);
          let days = value;
          if (days > 59) days--; // Excel 1900 leap year bug
          const date = new Date(excelEpoch.getTime() + days * 86400000);
          const year = date.getFullYear();
          // Accept dates between 1900 and 2100
          if (year >= 1900 && year <= 2100) {
            return true;
          }
        }
        // Also check if it's a small number that might be a day/month (like 1, 3, etc.)
        // These are likely not dates, so return false
        return false;
      }
      
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return false;
        
        // Try to parse as date first (handles various formats)
        const parsedDate = new Date(trimmed);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          return year >= 1900 && year <= 2100;
        }
        
        // Check common date patterns (allow single or double digits, and 2-digit years)
        const datePatterns = [
          /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD or YYYY-M-D
          /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY or MM/DD/YYYY
          /^\d{1,2}\/\d{1,2}\/\d{2}$/, // M/D/YY or MM/DD/YY (2-digit year)
          /^\d{1,2}-\d{1,2}-\d{4}$/, // M-D-YYYY or MM-DD-YYYY
          /^\d{1,2}-\d{1,2}-\d{2}$/, // M-D-YY or MM-DD-YY (2-digit year)
        ];
        
        return datePatterns.some(pattern => pattern.test(trimmed));
      }
      
      return false;
    };

    // Parse rows starting from startRow
    let processedRows = 0;
    let skippedRows = 0;
    let debugSample: any[] = []; // Store first few rows for debugging
    
    for (let i = startRow - 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      
      // Use the column indices we already calculated
      const dateColIndex = dateColIdx;
      const hoursColIndex = hoursColIdx;
      const descColIndex = descColIdx;

      // Store sample data for debugging (first 5 rows)
      if (i < startRow + 4 && debugSample.length < 5) {
        debugSample.push({
          rowIndex: i + 1,
          dateValue: row[dateColIndex],
          dateType: typeof row[dateColIndex],
          dateValueStr: String(row[dateColIndex]),
          hoursValue: row[hoursColIndex],
          hoursType: typeof row[hoursColIndex],
          hoursValueStr: String(row[hoursColIndex]),
          descriptionValue: row[descColIndex],
          descriptionType: typeof row[descColIndex],
          fullRow: row.slice(0, 10), // First 10 columns for debugging
          isValidDateCheck: isValidDate(row[dateColIndex]),
        });
      }

      const dateValue = row[dateColIndex];
      const hoursValue = row[hoursColIndex];
      const descriptionValue = row[descColIndex] || '';

      // Skip rows without valid date - this filters out summary/total rows
      if (!isValidDate(dateValue)) {
        skippedRows++;
        continue;
      }

      // Skip rows without description - description is required
      if (!descriptionValue || (typeof descriptionValue === 'string' && descriptionValue.trim() === '')) {
        skippedRows++;
        continue;
      }

      // Parse date
      let dateStr = '';
      if (dateValue instanceof Date) {
        dateStr = dateValue.toISOString().split('T')[0];
      } else if (typeof dateValue === 'number') {
        // Excel date serial number (days since 1900-01-01)
        // Excel incorrectly treats 1900 as a leap year, so we adjust
        const excelEpoch = new Date(1899, 11, 30);
        let days = dateValue;
        if (days > 59) days--; // Excel 1900 leap year bug
        const date = new Date(excelEpoch.getTime() + days * 86400000);
        dateStr = date.toISOString().split('T')[0];
      } else if (typeof dateValue === 'string') {
        // Try to parse string date - handle MM/DD/YYYY format
        const trimmed = dateValue.trim();
        
        // Handle MM/DD/YYYY or M/D/YYYY format, and also M/D/YY (2-digit year)
        const dateMatch4 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        const dateMatch2 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        
        if (dateMatch4) {
          const month = parseInt(dateMatch4[1], 10) - 1; // JavaScript months are 0-indexed
          const day = parseInt(dateMatch4[2], 10);
          const year = parseInt(dateMatch4[3], 10);
          const parsedDate = new Date(year, month, day);
          if (!isNaN(parsedDate.getTime())) {
            dateStr = parsedDate.toISOString().split('T')[0];
          } else {
            continue;
          }
        } else if (dateMatch2) {
          // Handle 2-digit year (assume 2000-2099)
          const month = parseInt(dateMatch2[1], 10) - 1; // JavaScript months are 0-indexed
          const day = parseInt(dateMatch2[2], 10);
          const year2Digit = parseInt(dateMatch2[3], 10);
          const year = year2Digit < 50 ? 2000 + year2Digit : 1900 + year2Digit; // 00-49 = 2000-2049, 50-99 = 1950-1999
          const parsedDate = new Date(year, month, day);
          if (!isNaN(parsedDate.getTime())) {
            dateStr = parsedDate.toISOString().split('T')[0];
          } else {
            continue;
          }
        } else {
          // Try standard Date parsing for other formats
          const parsedDate = new Date(trimmed);
          if (!isNaN(parsedDate.getTime())) {
            dateStr = parsedDate.toISOString().split('T')[0];
          } else {
            // If parsing fails, skip this row
            continue;
          }
        }
      } else {
        // Invalid date format, skip row
        continue;
      }

      // Parse hours
      const hours = parseFloat(hoursValue) || 0;
      if (hours <= 0) {
        skippedRows++;
        continue;
      }

      processedRows++;
      totalHours += hours;

      // Group by date
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { hours: 0, descriptions: [] });
      }
      const dateData = dateMap.get(dateStr)!;
      dateData.hours += hours;
      if (descriptionValue && !dateData.descriptions.includes(descriptionValue)) {
        dateData.descriptions.push(descriptionValue);
      }
    }

    // Create invoice items grouped by date
    let month = '';
    const dates: Date[] = [];
    
    dateMap.forEach((data, dateStr) => {
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      }

      const description = data.descriptions.length > 0
        ? data.descriptions.join(', ')
        : `Work on ${dateStr}`;

      items.push({
        id: dateStr || Date.now().toString(),
        description: `${dateStr} - ${description}`,
        quantity: data.hours,
        price: hourlyRate,
        total: data.hours * hourlyRate,
      });
    });

    // Sort items by date
    items.sort((a, b) => {
      const dateA = a.id.split(' - ')[0] || '';
      const dateB = b.id.split(' - ')[0] || '';
      return dateA.localeCompare(dateB);
    });

    // Determine month from the latest date in the timesheet
    if (dates.length > 0) {
      // Sort dates to get the latest one
      dates.sort((a, b) => b.getTime() - a.getTime());
      const latestDate = dates[0];
      month = latestDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    } else {
      // Fallback to current month if no dates found
      month = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
    }

    // Log parsing results for debugging
    console.log(`Timesheet parsing complete: ${processedRows} rows processed, ${skippedRows} rows skipped, ${items.length} invoice items created`);
    console.log(`Column indices - Date: ${dateColumn.charCodeAt(0) - 65}, Hours: ${hoursColumn.charCodeAt(0) - 65}, Description: ${descriptionColumn.charCodeAt(0) - 65}`);
    
    if (items.length === 0 && debugSample.length > 0) {
      console.warn('No items were created from the timesheet. Sample rows:');
      debugSample.forEach((sample, idx) => {
        console.warn(`Row ${sample.rowIndex}:`, {
          date: `${sample.dateValue} (${sample.dateType})`,
          hours: `${sample.hoursValue} (${sample.hoursType})`,
          description: sample.descriptionValue,
          isValidDate: isValidDate(sample.dateValue),
        });
      });
      console.warn(`- Date column (${dateColumn}, index ${dateColumn.charCodeAt(0) - 65}): Ensure dates are in valid format (e.g., 1/3/2026, 01/03/2026)`);
      console.warn(`- Hours column (${hoursColumn}, index ${hoursColumn.charCodeAt(0) - 65}): Ensure hours are numeric values`);
      console.warn(`- Description column (${descriptionColumn}, index ${descriptionColumn.charCodeAt(0) - 65}): Ensure descriptions are not empty`);
      console.warn(`- Start row: ${startRow}`);
    }

    return {
      items,
      totalHours,
      month: month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    };
  } catch (error) {
    console.error('Error parsing timesheet:', error);
    throw new Error(`Failed to parse timesheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceFromTimesheet } from '@/utils/invoiceFromTimesheet';
import { getConfig } from '@/utils/config';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const customPath = formData.get('timesheetPath') as string | null;

    if (!file && !customPath) {
      return NextResponse.json(
        { error: 'No file or path provided' },
        { status: 400 }
      );
    }

    let timesheetPath: string;
    let shouldCleanup = false;

    if (file) {
      // Save uploaded file temporarily
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
      } else {
        // Ensure directory is readable/writable
        try {
          fs.chmodSync(uploadDir, 0o755);
        } catch (e) {
          // Ignore permission errors if we can't change them
        }
      }
      
      // Sanitize filename to avoid issues with special characters
      // Handle extension more carefully to avoid double extension
      let fileExtension = path.extname(file.name).toLowerCase();
      if (!fileExtension || !['.xlsx', '.xls'].includes(fileExtension)) {
        fileExtension = '.xlsx';
      }
      
      // Get base name - remove extension if it exists
      let baseName = file.name;
      if (file.name.toLowerCase().endsWith(fileExtension)) {
        baseName = file.name.slice(0, -fileExtension.length);
      }
      
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const tempFileName = `temp-${timestamp}-${sanitizedName}${fileExtension}`;
      timesheetPath = path.join(uploadDir, tempFileName);
      
      // Write file with proper permissions (readable by all)
      fs.writeFileSync(timesheetPath, buffer, { mode: 0o644 });
      
      // Small delay to ensure file is fully written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify file was written successfully
      if (!fs.existsSync(timesheetPath)) {
        return NextResponse.json(
          { error: 'Failed to save uploaded file' },
          { status: 500 }
        );
      }
      
      // Verify file is readable and has content
      try {
        fs.accessSync(timesheetPath, fs.constants.R_OK);
        const stats = fs.statSync(timesheetPath);
        if (stats.size === 0) {
          return NextResponse.json(
            { error: 'Uploaded file is empty' },
            { status: 400 }
          );
        }
      } catch (accessError) {
        // Try to fix permissions
        fs.chmodSync(timesheetPath, 0o644);
        // Verify again
        fs.accessSync(timesheetPath, fs.constants.R_OK);
      }
      
      console.log(`File saved successfully: ${timesheetPath}, size: ${fs.statSync(timesheetPath).size} bytes`);
      
      shouldCleanup = true;
    } else {
      timesheetPath = customPath || getConfig().timesheet.path;
      // Resolve relative paths
      if (!path.isAbsolute(timesheetPath)) {
        timesheetPath = path.join(process.cwd(), timesheetPath);
      }
    }

    // Verify file exists
    if (!fs.existsSync(timesheetPath)) {
      return NextResponse.json(
        { error: `Timesheet file not found: ${timesheetPath}` },
        { status: 404 }
      );
    }

    // Create invoice from timesheet
    const invoice = await createInvoiceFromTimesheet(timesheetPath);

    // Clean up uploaded file if it was uploaded
    if (shouldCleanup) {
      try {
        fs.unlinkSync(timesheetPath);
      } catch (error) {
        console.error('Error deleting temp file:', error);
      }
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error processing timesheet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process timesheet' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const config = getConfig();
    let timesheetPath = config.timesheet.path;
    
    // Resolve relative paths
    if (!path.isAbsolute(timesheetPath)) {
      timesheetPath = path.join(process.cwd(), timesheetPath);
    }

    // Verify file exists
    if (!fs.existsSync(timesheetPath)) {
      return NextResponse.json(
        { error: `Timesheet file not found: ${timesheetPath}. Please configure TIMESHEET_PATH in .env.local` },
        { status: 404 }
      );
    }

    const invoice = await createInvoiceFromTimesheet(timesheetPath);
    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error processing timesheet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process timesheet' },
      { status: 500 }
    );
  }
}

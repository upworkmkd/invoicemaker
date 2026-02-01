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

    let invoice;
    
    if (file) {
      // Process file directly from buffer (serverless-friendly)
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      if (buffer.length === 0) {
        return NextResponse.json(
          { error: 'Uploaded file is empty' },
          { status: 400 }
        );
      }
      
      console.log(`Processing uploaded file in memory, size: ${buffer.length} bytes`);
      
      // Create invoice from buffer (no file system writes needed)
      invoice = await createInvoiceFromTimesheet(buffer);
    } else {
      // Use file path (for default timesheet or custom path)
      timesheetPath = customPath || getConfig().timesheet.path;
      // Resolve relative paths
      if (!path.isAbsolute(timesheetPath)) {
        timesheetPath = path.join(process.cwd(), timesheetPath);
      }

      // Verify file exists
      if (!fs.existsSync(timesheetPath)) {
        return NextResponse.json(
          { error: `Timesheet file not found: ${timesheetPath}` },
          { status: 404 }
        );
      }

      // Create invoice from timesheet file path
      invoice = await createInvoiceFromTimesheet(timesheetPath);
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

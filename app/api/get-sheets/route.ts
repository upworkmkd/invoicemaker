import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file into buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'Uploaded file is empty' },
        { status: 400 }
      );
    }

    // Parse workbook to get sheet names
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
    });

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: 'Excel file has no sheets or is invalid' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      sheetNames: workbook.SheetNames 
    });
  } catch (error) {
    console.error('Error reading sheet names:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read sheet names' },
      { status: 500 }
    );
  }
}

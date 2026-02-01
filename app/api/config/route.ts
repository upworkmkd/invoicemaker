import { NextResponse } from 'next/server';
import { getConfig } from '@/utils/config';

export async function GET() {
  try {
    const config = getConfig();
    
    // Return only the fields needed for the form (excluding sensitive server-side paths)
    return NextResponse.json({
      company: config.company,
      client: config.client,
      invoice: {
        prefix: config.invoice.prefix,
        taxRate: config.invoice.taxRate,
        discount: config.invoice.discount,
        paymentTerms: config.invoice.paymentTerms,
        currency: config.invoice.currency,
        hourlyRate: config.invoice.hourlyRate,
      },
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

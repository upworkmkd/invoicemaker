# Invoice Maker - Timesheet to Invoice Generator

A Next.js application that automatically generates professional invoices from Excel timesheets.

## Features

- 📊 **Excel Timesheet Processing**: Automatically reads hours from Excel timesheet files
- 💰 **Automatic Calculation**: Calculates invoice totals based on hourly rate and hours worked
- 📄 **PDF Generation**: Generates professional PDF invoices matching your template format
- ⚙️ **Fully Configurable**: All settings configurable via environment variables
- 🎨 **Modern UI**: Clean, responsive interface for easy invoice management

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `env.template` to `.env.local` and update with your information:

```bash
cp env.template .env.local
```

Edit `.env.local` with your settings:

```env
# Timesheet Configuration
TIMESHEET_PATH=data/Timesheet Template.xlsx
HOURLY_RATE=900
CURRENCY=INR

# Company Information (From)
COMPANY_NAME=Your Company Name
COMPANY_ADDRESS=Your Company Address
COMPANY_EMAIL=your.email@example.com
COMPANY_PHONE=+91-1234567890

# Client Information (To)
CLIENT_NAME=Client Company Name
CLIENT_ADDRESS=Client Company Address
CLIENT_EMAIL=client@example.com
CLIENT_PHONE=+91-9876543210

# Invoice Settings
INVOICE_PREFIX=INV
TAX_RATE=0
DISCOUNT=0
PAYMENT_TERMS=Net 30

# Timesheet Column Mapping
TIMESHEET_DATE_COLUMN=A
TIMESHEET_HOURS_COLUMN=B
TIMESHEET_DESCRIPTION_COLUMN=C
TIMESHEET_START_ROW=2
```

### 3. Prepare Your Timesheet

Your Excel timesheet should have:
- **Column A**: Date (e.g., 2024-01-15)
- **Column B**: Hours worked (e.g., 8.5)
- **Column C**: Description (optional, e.g., "Development work")

The first row should be headers, and data starts from the row specified in `TIMESHEET_START_ROW` (default: row 2).

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Generate Invoice from Timesheet

1. **Upload Timesheet**: Drag and drop your Excel timesheet file, or click to browse
2. **Or Use Default**: Click "Generate from Default Timesheet" to use the file specified in `TIMESHEET_PATH`
3. **Review Invoice**: The invoice form will be populated with data from your timesheet
4. **Generate PDF**: Click "Generate PDF" to download the invoice

### Manual Invoice Creation

You can also manually create invoices by filling out the form directly.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TIMESHEET_PATH` | Path to default timesheet file | `data/Timesheet Template.xlsx` |
| `HOURLY_RATE` | Hourly rate in your currency | `900` |
| `CURRENCY` | Currency code (INR, USD, etc.) | `INR` |
| `COMPANY_NAME` | Your company name | - |
| `COMPANY_ADDRESS` | Your company address | - |
| `COMPANY_EMAIL` | Your company email | - |
| `COMPANY_PHONE` | Your company phone | - |
| `CLIENT_NAME` | Client company name | - |
| `CLIENT_ADDRESS` | Client company address | - |
| `CLIENT_EMAIL` | Client email | - |
| `CLIENT_PHONE` | Client phone | - |
| `INVOICE_PREFIX` | Prefix for invoice numbers | `INV` |
| `TAX_RATE` | Tax rate percentage | `0` |
| `DISCOUNT` | Discount amount | `0` |
| `PAYMENT_TERMS` | Payment terms | `Net 30` |
| `TIMESHEET_DATE_COLUMN` | Excel column for dates | `A` |
| `TIMESHEET_HOURS_COLUMN` | Excel column for hours | `B` |
| `TIMESHEET_DESCRIPTION_COLUMN` | Excel column for descriptions | `C` |
| `TIMESHEET_START_ROW` | First data row number | `2` |

## Project Structure

```
invoicemaker/
├── app/
│   ├── api/
│   │   └── process-timesheet/    # API route for timesheet processing
│   ├── page.tsx                  # Main page
│   └── layout.tsx                # App layout
├── components/
│   ├── InvoiceForm.tsx           # Invoice form component
│   └── TimesheetUpload.tsx       # Timesheet upload component
├── constants/
│   ├── invoice.ts                # Invoice constants
│   ├── theme.ts                  # Theme colors
│   └── translations.ts          # Translations
├── data/
│   ├── Timesheet Template.xlsx  # Example timesheet
│   └── invoicetemplate.docx     # Invoice template reference
├── utils/
│   ├── config.ts                 # Configuration loader
│   ├── invoiceCalculator.ts     # Calculation utilities
│   ├── invoiceFromTimesheet.ts  # Timesheet to invoice converter
│   ├── pdfGenerator.ts          # PDF generation
│   └── timesheetParser.ts        # Excel parser
└── types/
    └── invoice.ts                # TypeScript types
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Notes

- The timesheet parser groups hours by date and creates invoice line items accordingly
- Hours are calculated automatically from the timesheet
- The invoice number format is: `{PREFIX}{TIMESTAMP}-{MONTH}` (e.g., `INV1234-Jan`)
- PDF generation uses jsPDF and matches the template format
- All monetary values use the currency specified in `CURRENCY`

## License

MIT

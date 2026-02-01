# Quick Start Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

1. Copy the example environment file:
   ```bash
   cp env.template .env.local
   ```

2. Edit `.env.local` with your information:
   - Update `HOURLY_RATE` (default: 900)
   - Update company information (name, address, email, phone)
   - Update client information
   - Set `TIMESHEET_PATH` to your timesheet file location

## Step 3: Prepare Your Timesheet

Your Excel file should have this structure:

| Date       | Hours | Description        |
|------------|-------|-------------------|
| 2024-01-01 | 8     | Development work  |
| 2024-01-02 | 7.5   | Code review       |
| 2024-01-03 | 8     | Testing           |

- **Column A**: Date (can be Excel date or text format)
- **Column B**: Hours worked (numeric)
- **Column C**: Description (optional)

## Step 4: Run the Application

```bash
npm run dev
```

Visit http://localhost:3000

## Step 5: Generate Invoice

1. **Option A - Upload File**: Drag and drop your timesheet Excel file
2. **Option B - Use Default**: Click "Generate from Default Timesheet" (uses file from `TIMESHEET_PATH`)

The invoice will be automatically generated with:
- Hours calculated from timesheet
- Total amount = Hours × Hourly Rate
- Line items grouped by date
- Professional PDF format

## Step 6: Download PDF

Click "Generate PDF" to download your invoice.

## Troubleshooting

### Timesheet file not found
- Check that `TIMESHEET_PATH` in `.env.local` points to the correct file
- Use absolute path if relative path doesn't work
- Ensure the file exists in the `data/` folder

### Hours not reading correctly
- Check that `TIMESHEET_HOURS_COLUMN` matches your Excel column (default: B)
- Verify hours are numeric values
- Check `TIMESHEET_START_ROW` - it should be the first data row (default: 2)

### Dates not parsing
- Ensure dates are in a recognizable format (YYYY-MM-DD, MM/DD/YYYY, etc.)
- Excel date serial numbers are automatically converted

## Example Configuration

```env
TIMESHEET_PATH=data/Timesheet Template.xlsx
HOURLY_RATE=900
CURRENCY=INR
COMPANY_NAME=My Company
COMPANY_ADDRESS=123 Main St, City
COMPANY_EMAIL=contact@mycompany.com
COMPANY_PHONE=+91-1234567890
CLIENT_NAME=Client Corp
CLIENT_ADDRESS=456 Client Ave
CLIENT_EMAIL=billing@client.com
CLIENT_PHONE=+91-9876543210
```

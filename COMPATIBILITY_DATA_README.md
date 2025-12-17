# Compatibility Data Extraction and Import

This document explains how to extract compatibility data from Google Sheets and import it into the database.

## Overview

The compatibility data system extracts data from Google Sheets where compatibility values are organized in blocks. Each block contains:
- **ピーチコア** (Peach Core) values for Aさん and Bさん
- **ハイドコア** (Hard/Hide Core) values for Aさん and Bさん

The data blocks are arranged in a grid pattern with:
- 3 columns per block: Label column, Aさん column, Bさん column
- 2 rows per block: ピーチコア row, ハイドコア row
- 1 empty column between blocks horizontally
- 1 empty row between blocks vertically

## Prerequisites

1. **Google Sheets API Setup**
   - Service account credentials configured
   - Google Sheet shared with the service account email
   - See `GOOGLE_SHEETS_SETUP.md` for detailed setup instructions

2. **Database Setup**
   - PostgreSQL database configured
   - Database schema pushed to the database
   - See `DATABASE_SETUP.md` for database setup

3. **Environment Variables**
   - All required environment variables set in `.env.local`

## Environment Variables

Add the following to your `.env.local` file:

```env
# Google Sheets API Credentials
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"

# Google Sheet ID for Compatibility Data
GOOGLE_SHEET_COMP=your-spreadsheet-id-here

# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### Getting the Spreadsheet ID

The spreadsheet ID is found in the Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

Copy the `SPREADSHEET_ID` part and set it as `GOOGLE_SHEET_COMP`.

## Database Schema

The compatibility data is stored in the `compatibility_data` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `compatibility_type` | INTEGER | Compatibility type (1-36) |
| `sheet_name` | TEXT | Name of the sheet tab |
| `range` | TEXT | Cell range (e.g., "A2:AM31") |
| `a_peach` | TEXT | Aさんのピーチコア value |
| `a_hard` | TEXT | Aさんのハイドコア value |
| `b_peach` | TEXT | Bさんのピーチコア value |
| `b_hard` | TEXT | Bさんのハイドコア value |
| `row_index` | INTEGER | Absolute row index in the sheet (0-based) |
| `col_index` | INTEGER | Absolute column index in the sheet (0-based) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Update timestamp |

## Compatibility Types

The system extracts data from 36 compatibility types across multiple sheet tabs:

### Sheet: 相性①完成
- Type 1: `A2:AM31`

### Sheet: 相性②③完成
- Type 2: `A3:AM17`
- Type 3: `A19:AM33`

### Sheet: 相性④⑤完成
- Type 4: `A3:AM17`
- Type 5: `A19:AM33`

### Sheet: 相性⑥完成
- Type 6: `A3:AM17` + `A19:AM33` (combined)

### Sheet: 相性⑦⑬完成
- Type 7: `A3:AM17`
- Type 13: `A19:AM33`

### Sheet: 相性⑧⑮完成
- Type 8: `A3:S17`
- Type 15: `A19:S33`

### Sheet: 相性⑨⑭完成
- Type 9: `A3:S17`
- Type 14: `A19:S33`

### Sheet: 相性⑩⑰完成
- Type 10: `A3:S17`
- Type 17: `A19:S33`

### Sheet: 相性⑪⑯完成
- Type 11: `A3:S17`
- Type 16: `A19:S33`

### Sheet: 相性⑫⑱完成
- Type 12: `A3:AM17`
- Type 18: `A19:AM33`

### Sheet: 相性⑲㉕完成
- Type 19: `A3:AM17`
- Type 25: `A19:AM33`

### Sheet: 相性⑳㉗完成
- Type 20: `A3:S17`
- Type 27: `A19:S33`

### Sheet: 相性㉑㉖完成
- Type 21: `A3:S17`
- Type 26: `A19:S33`

### Sheet: 相性㉒㉙完成
- Type 22: `A3:S17`
- Type 29: `A19:S33`

### Sheet: 相性㉓㉘完成
- Type 23: `A3:S17`
- Type 28: `A19:S33`

### Sheet: 相性㉔㉚完成
- Type 24: `A3:AM17`
- Type 30: `A19:AM33`

### Sheet: 相性㉛完成
- Type 31: `A2:AM31`

### Sheet: 相性㉜㉝完成
- Type 32: `A3:AM17`
- Type 33: `A19:AM33`

### Sheet: 相性㉞㉟完成
- Type 34: `A3:AM17`
- Type 35: `A19:AM33`

### Sheet: 相性㊱完成
- Type 36: `A2:AM31`

## Usage

### Step 1: Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

### Step 2: Push Database Schema

Ensure the database schema is up to date:

```bash
npm run db:push
```

This will create the `compatibility_data` table if it doesn't exist.

### Step 3: Extract Data from Google Sheets

Run the extraction script to fetch data from Google Sheets and save it as JSON:

```bash
npm run compatibility:extract
```

This script will:
1. Connect to Google Sheets using the service account credentials
2. Extract data from all 36 compatibility types
3. Parse the data blocks and extract A/B values for peach and hard cores
4. Save the results to `compatibility-data.json`

**Output:**
- Creates `compatibility-data.json` in the project root
- Shows progress for each compatibility type
- Displays total number of pairs extracted

### Step 4: Import Data to Database

Run the import script to load the JSON data into the database:

```bash
npm run compatibility:import
```

This script will:
1. Read `compatibility-data.json`
2. Clear existing compatibility data (optional - can be modified in the script)
3. Import all data in batches of 100 records
4. Show progress for each compatibility type

**Note:** The import script clears all existing compatibility data before importing. If you want to keep existing data, modify `scripts/import-compatibility-data.ts` and comment out the `db.delete(compatibilityData)` line.

## Data Format

### JSON Structure

The `compatibility-data.json` file has the following structure:

```json
[
  {
    "compatibilityType": 1,
    "sheetName": "相性①完成",
    "range": "A2:AM31",
    "data": [
      {
        "A": {
          "peach": "T+",
          "hard": "T+"
        },
        "B": {
          "peach": "T+",
          "hard": "E+"
        },
        "rowIndex": 1,
        "colIndex": 0
      },
      ...
    ]
  },
  ...
]
```

### Data Values

The extracted values are typically alphanumeric codes like:
- `T+`, `T-` (T type with positive/negative)
- `F+`, `F-` (F type with positive/negative)
- `E+`, `E-` (E type with positive/negative)
- `M+`, `M-` (M type with positive/negative)
- `W+`, `W-` (W type with positive/negative)

Empty cells are stored as `null`.

## Troubleshooting

### Error: "Missing Google service account credentials"

**Solution:** Ensure `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` are set in `.env.local`.

### Error: "GOOGLE_SHEET_COMP environment variable is not set"

**Solution:** Add `GOOGLE_SHEET_COMP=your-spreadsheet-id` to `.env.local`.

### Error: "Cannot access spreadsheet"

**Possible causes:**
1. Wrong spreadsheet ID
2. Service account doesn't have access to the sheet
3. Sheet was deleted or renamed

**Solution:**
1. Verify the spreadsheet ID in the URL
2. Share the Google Sheet with the service account email (from `GOOGLE_CLIENT_EMAIL`)
3. Ensure the sheet tabs exist with the exact names listed above

### Error: "No data extracted"

**Possible causes:**
1. Sheet tab name doesn't match exactly (check for typos)
2. Range is incorrect or empty
3. Data format doesn't match expected pattern

**Solution:**
1. Verify sheet tab names match exactly (including Japanese characters)
2. Check that the ranges contain data
3. Ensure data blocks follow the pattern: 3 columns (label, A, B) with 1 empty column between blocks

### Error: "DATABASE_URL environment variable is not set"

**Solution:** Ensure `DATABASE_URL` is set in `.env.local` with your PostgreSQL connection string.

### Error: "compatibility-data.json not found"

**Solution:** Run `npm run compatibility:extract` first to generate the JSON file.

## Scripts Reference

### `scripts/extract-compatibility-data.ts`

Extracts compatibility data from Google Sheets and saves to JSON.

**Functions:**
- `fetchCompatibilityData()` - Fetches data from a specific sheet range
- `extractCompatibilityData()` - Parses rows and extracts data blocks

**Output:** `compatibility-data.json`

### `scripts/import-compatibility-data.ts`

Imports compatibility data from JSON into the database.

**Functions:**
- Reads `compatibility-data.json`
- Clears existing data (optional)
- Inserts data in batches

**Requirements:** `compatibility-data.json` must exist

## Files

- `lib/google-sheets-compatibility.ts` - Utility functions for Google Sheets operations
- `lib/db/schema.ts` - Database schema including `compatibilityData` table
- `scripts/extract-compatibility-data.ts` - Extraction script
- `scripts/import-compatibility-data.ts` - Import script
- `compatibility-data.json` - Generated JSON file (created by extraction script)

## Updating Data

To update compatibility data:

1. Make changes in Google Sheets
2. Run `npm run compatibility:extract` to regenerate JSON
3. Run `npm run compatibility:import` to update the database

The import script clears existing data before importing, so you'll always have the latest data from the sheets.

## Notes

- Row and column indices are stored as 0-based (absolute position in the sheet)
- Empty cells are stored as `null` in the database
- The extraction script automatically detects data blocks by looking for "ピーチコア" labels
- Type 6 combines two ranges from the same sheet into one dataset
- Data is imported in batches of 100 records to avoid overwhelming the database


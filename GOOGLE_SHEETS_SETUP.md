# Google Sheets API Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"
```

## Setup Steps

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google Sheets API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create a Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details
   - Click "Create and Continue"

4. **Download the JSON Key**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose "JSON" format
   - Download the file

5. **Extract Credentials**
   - Open the downloaded JSON file
   - Copy the `client_email` value to `GOOGLE_CLIENT_EMAIL`
   - Copy the `private_key` value to `GOOGLE_PRIVATE_KEY`

6. **Share Your Google Sheet**
   - Open your Google Sheet
   - Click "Share" button
   - Add the service account email (from step 4)
   - Give it "Viewer" permissions

## Troubleshooting

### Common Issues:

1. **404 "Requested entity was not found" Error**
   - **Cause**: Wrong spreadsheet ID, sheet name, or no access permissions
   - **Solution**: 
     - Verify the spreadsheet ID in the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
     - Check that the sheet name "分類表" exists in your spreadsheet
     - Ensure the service account email has been shared with the spreadsheet

2. **Authentication Errors**
   - **Cause**: Invalid credentials or missing environment variables
   - **Solution**:
     - Make sure the private key includes the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
     - Verify `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` are set in `.env.local`

3. **API Not Enabled**
   - **Cause**: Google Sheets API is not enabled in your project
   - **Solution**: Enable Google Sheets API in Google Cloud Console

### Testing Your Setup

1. **Test the connection**: Visit `/api/test-sheets` in your browser to see detailed connection information
2. **Check the logs**: Look at your server console for detailed error messages
3. **Verify permissions**: Make sure the service account email has "Viewer" access to your spreadsheet

### Debug Steps

1. Check if environment variables are loaded:
   ```bash
   # In your terminal
   echo $GOOGLE_CLIENT_EMAIL
   echo $GOOGLE_PRIVATE_KEY
   ```

2. Test the API endpoint:
   ```bash
   curl http://localhost:3000/api/test-sheets
   ```

3. Verify spreadsheet sharing:
   - Open your Google Sheet
   - Click "Share" button
   - Add the service account email (from your JSON key file)
   - Give it "Viewer" permissions

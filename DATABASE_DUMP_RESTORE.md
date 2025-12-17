# Database Dump and Restore Guide

This guide explains how to create database backups (dumps) and restore them.

## Overview

The database dump system allows you to:
- **Dump**: Export all database tables to a JSON file for backup
- **Restore**: Import data from a JSON dump file back into the database

## Prerequisites

- Database connection configured in `.env.local` with `DATABASE_URL`
- All dependencies installed (`npm install`)
- Database schema is up to date (`npm run db:push`)

## Database Dump

### What It Does

Creates a JSON backup file containing all data from all tables:
- `users`
- `payments`
- `memberships`
- `diagnosis_results`
- `compatibility_data`
- `compatibility_types`

### Usage

```bash
npm run db:dump
```

### Output

The script creates a timestamped JSON file in the project root:
```
database-dump-YYYY-MM-DDTHH-MM-SS-sssZ.json
```

Example: `database-dump-2025-12-17T20-06-30-649Z.json`

### Output Format

The dump file contains:
```json
{
  "timestamp": "2025-12-17T20:06:30.649Z",
  "tables": {
    "users": [...],
    "payments": [...],
    "memberships": [...],
    "diagnosisResults": [...],
    "compatibilityData": [...],
    "compatibilityTypes": [...]
  }
}
```

### When to Use

- Before making major changes to the database
- Before deploying to production
- Regular backups (daily/weekly)
- Before database migrations
- When transferring data between environments

## Database Restore

### What It Does

Imports data from a JSON dump file back into the database:
- Restores all tables from the dump file
- Handles duplicate records gracefully (skips existing records)
- Updates compatibility types if they already exist
- Shows progress for each table

### Usage

```bash
npm run db:restore <dump-file-path>
```

### Examples

**Restore from project root:**
```bash
npm run db:restore database-dump-2025-12-17T20-06-30-649Z.json
```

**Restore from relative path:**
```bash
npm run db:restore ../backups/database-dump-2025-12-17T20-06-30-649Z.json
```

**Restore from absolute path:**
```bash
npm run db:restore C:\Users\iida\Documents\backups\database-dump-2025-12-17T20-06-30-649Z.json
```

### Restore Behavior

- **Duplicate Handling**: The script skips records that already exist (based on primary keys/unique constraints)
- **Compatibility Types**: Updates existing types or inserts new ones
- **Batch Processing**: Compatibility data is restored in batches of 100 for performance
- **Error Handling**: Shows warnings for skipped duplicates, fails on other errors

### When to Use

- Restoring from a backup after data loss
- Migrating data to a new database
- Setting up a development environment with production data
- Reverting to a previous database state

## Complete Restore (Replace All Data)

If you want to completely replace all existing data with the dump file:

1. Open `scripts/restore-database.ts`
2. Uncomment the `db.delete()` lines for each table you want to clear:
   ```typescript
   // Change this:
   // await db.delete(schema.users)
   
   // To this:
   await db.delete(schema.users)
   ```
3. Run the restore script

**⚠️ Warning**: This will delete all existing data before restoring. Use with caution!

## Scripts Reference

### `scripts/dump-database.ts`

Exports all database tables to a JSON file.

**Features:**
- Exports all tables automatically
- Creates timestamped backup files
- Includes metadata (timestamp)
- Handles large datasets

**Output:** `database-dump-{timestamp}.json`

### `scripts/restore-database.ts`

Imports data from a JSON dump file.

**Features:**
- Restores all tables from dump file
- Handles duplicates gracefully
- Batch processing for large tables
- Progress reporting
- Error handling

**Input:** Path to dump JSON file

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"

**Solution:** Ensure `.env.local` exists and contains `DATABASE_URL`

### Error: "Dump file not found"

**Solution:** 
- Check the file path is correct
- Use absolute path if relative path doesn't work
- Verify the file exists in the specified location

### Error: "Duplicate key value violates unique constraint"

**Solution:** This is expected behavior - the script skips duplicates. If you want to replace data, uncomment the `db.delete()` lines in the restore script.

### Error: "Connection refused" or "Cannot connect to database"

**Solution:**
- Verify `DATABASE_URL` is correct
- Check database server is running
- Verify network connectivity
- Check firewall settings

### Restore is slow

**Solution:** 
- This is normal for large datasets
- Compatibility data is processed in batches
- Be patient, the script shows progress

## Best Practices

1. **Regular Backups**: Create dumps regularly (daily/weekly)
2. **Version Control**: Don't commit dump files to git (they're large and contain sensitive data)
3. **Secure Storage**: Store dump files securely, especially in production
4. **Test Restores**: Periodically test restoring from backups to ensure they work
5. **Multiple Backups**: Keep multiple backup files (daily, weekly, monthly)
6. **Before Major Changes**: Always create a dump before:
   - Database migrations
   - Major data updates
   - Schema changes
   - Production deployments

## File Locations

- **Dump Script**: `scripts/dump-database.ts`
- **Restore Script**: `scripts/restore-database.ts`
- **Dump Files**: Created in project root (can be moved to backup folder)
- **Environment Config**: `.env.local`

## Example Workflow

### Creating a Backup

```bash
# 1. Create a backup
npm run db:dump

# 2. Move to backup folder (optional)
mkdir -p backups
mv database-dump-*.json backups/
```

### Restoring from Backup

```bash
# 1. List available backups
ls backups/

# 2. Restore from a specific backup
npm run db:restore backups/database-dump-2025-12-17T20-06-30-649Z.json
```

### Complete Restore (Replace All)

```bash
# 1. Edit restore script to uncomment delete statements
# 2. Restore (this will delete existing data first)
npm run db:restore backups/database-dump-2025-12-17T20-06-30-649Z.json
```

## Notes

- Dump files are in JSON format for easy inspection and editing
- Large databases may produce large dump files
- Restore process may take time for large datasets
- The restore script preserves existing data by default (skips duplicates)
- Compatibility types are updated if they exist, inserted if new


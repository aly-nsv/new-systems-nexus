# Migration Scripts

## Airtable to Supabase Migration

This directory contains scripts to migrate data from Airtable to Supabase.

### Prerequisites

1. **Environment Variables**: Set up your environment variables in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Database Schema**: Ensure you've run the schema migration in Supabase:
   - Copy the contents of `supabase/schema.sql`
   - Paste and execute in your Supabase SQL Editor

3. **Pipeline Data**: Ensure `pipeline_output.json` is in the project root

### Running the Migration

```bash
# Run the migration script
npm run migrate:airtable
```

### What the Migration Script Does

1. **Data Validation**: 
   - Loads existing categories and users from Supabase
   - Creates missing categories and users from Airtable data

2. **Data Transformation**:
   - Maps Airtable field names to Supabase column names
   - Converts currency values to cents (avoiding floating point issues)
   - Transforms date fields to proper ISO format
   - Handles boolean conversions

3. **Relationship Management**:
   - Creates junction table entries for multiple select fields (SLR, Source, Deal Lead, Theme)
   - Links users for assignees and pass communicators
   - Preserves file attachments with Airtable URLs

4. **Error Handling**:
   - Provides detailed progress logging
   - Continues migration even if individual records fail
   - Reports summary statistics at completion

### Field Mappings

The script maps Airtable fields to Supabase columns:

| Airtable Field | Supabase Column | Notes |
|---|---|---|
| Company Name | company_name | Required field |
| Description (short) | description_short | |
| Status | status | Enum validation |
| Round Size | round_size | Converted to cents |
| SLR | pipeline_slr table | Junction table |
| Deal Lead | pipeline_deal_lead table | Junction table |
| Next Step Assignee | pipeline_assignees table | User junction |
| Deck (File) | pipeline_attachments | File metadata |

### Migration Output

The script provides real-time feedback:

```
🚀 Starting Airtable to Supabase migration...

Found 2006 records to migrate

Loading existing categories and users...
Loaded 27 SLR categories
Loaded 0 source categories
Loaded 6 deal lead categories
Loaded 4 theme categories
Loaded 3 users

Creating missing categories...
Created source category: Josh Lynn
Created source category: Climate Finance Partners
...

Migrating pipeline records...
✓ Migrated: Pioneer Energy (rec04n7W2QAMG4mU0)
✓ Migrated: Regli Energy Systems (rec071rvB9W7od6ay)
...

📊 Migration Summary:
Total processed: 2006
Successful: 2000
Errors: 6
Skipped: 0

✅ Migration completed successfully!
```

### Post-Migration Verification

After migration, verify your data in Supabase:

1. **Check Record Counts**:
   ```sql
   SELECT COUNT(*) FROM pipeline;
   SELECT COUNT(*) FROM pipeline_slr;
   SELECT COUNT(*) FROM pipeline_attachments;
   ```

2. **Verify Relationships**:
   ```sql
   SELECT p.company_name, array_agg(sc.name) as slr_categories
   FROM pipeline p
   LEFT JOIN pipeline_slr ps ON p.id = ps.pipeline_id
   LEFT JOIN slr_categories sc ON ps.slr_category_id = sc.id
   GROUP BY p.id, p.company_name
   LIMIT 10;
   ```

3. **Test Views**:
   ```sql
   SELECT * FROM new_companies LIMIT 5;
   SELECT * FROM investment_pipeline LIMIT 5;
   ```

### Troubleshooting

**Common Issues:**

1. **Missing Environment Variables**: 
   - Ensure both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

2. **Permission Errors**:
   - Verify the service role key has appropriate permissions
   - Check Supabase RLS policies if enabled

3. **Schema Mismatches**:
   - Ensure the database schema is up to date
   - Check for any manual modifications to enum values

4. **Data Validation Errors**:
   - Review the error messages for specific validation failures
   - Check for unexpected data formats in the Airtable export

**Re-running Migration:**

If you need to re-run the migration:

1. **Clear existing data** (⚠️ destructive):
   ```sql
   TRUNCATE pipeline CASCADE;
   ```

2. **Or use upsert logic** by modifying the script to check for existing `airtable_record_id`

### File Structure

```
scripts/
├── README.md                  # This file
├── migrate-airtable-data.js   # Main migration script
└── ...                        # Future migration scripts
```
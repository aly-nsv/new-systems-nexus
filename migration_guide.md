# Airtable to Supabase Migration Guide

## Overview
This guide helps you migrate your NSV Pipeline data from Airtable to Supabase (PostgreSQL). The migration involves schema creation, data extraction, transformation, and loading.

## Pre-Migration Checklist

### 1. Supabase Setup
- [ ] Create a new Supabase project
- [ ] Note your database URL and API keys
- [ ] Enable required extensions (uuid-ossp is included in the schema)

### 2. Schema Deployment
- [ ] Run the provided SQL schema in your Supabase SQL editor
- [ ] Verify all tables and relationships are created
- [ ] Check that enums and indexes are properly set

### 3. Data Export from Airtable
You'll need to export data from multiple tables:
- [ ] Pipeline table (main table)
- [ ] To-Do table
- [ ] Investor CRM table
- [ ] Co-Investors table (if needed)

## Migration Steps

### Step 1: Export Airtable Data

**Using Airtable API:**
```javascript
// Example script to export Pipeline data
const AIRTABLE_API_KEY = 'your_api_key';
const BASE_ID = 'appDBk60DIC9QQLVS';
const TABLE_ID = 'tbllzgePE8swXymyh';

async function exportPipelineData() {
    const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
        {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        }
    );
    const data = await response.json();
    return data.records;
}
```

**Alternative: CSV Export**
- Export each table as CSV from Airtable interface
- Manual but reliable for smaller datasets

### Step 2: Data Transformation Mapping

#### Field Mapping Pipeline Table
| Airtable Field | Supabase Column | Transformation |
|---|---|---|
| Company Name | company_name | Direct copy |
| Status | status | Map to enum |
| SLR | pipeline_slr table | Multiple select → junction table |
| Source | pipeline_source table | Multiple select → junction table |
| Deal Lead | pipeline_deal_lead table | Multiple select → junction table |
| Next Step Assignee | pipeline_assignees table | Collaborators → user junction |
| Round Size | round_size | Currency → bigint (cents) |
| Priority | priority | Map to enum |
| To Review | to_review | Boolean |

#### Currency Field Conversion
```sql
-- Convert Airtable currency to cents (avoid floating point)
-- Example: $1,500,000 → 150000000 cents
UPDATE pipeline 
SET round_size = CAST(airtable_round_size * 100 AS BIGINT)
WHERE airtable_round_size IS NOT NULL;
```

#### Multiple Select Fields
Multiple select fields become junction tables:
```sql
-- Insert SLR categories for a company
INSERT INTO pipeline_slr (pipeline_id, slr_category_id)
SELECT p.id, sc.id
FROM pipeline p, slr_categories sc
WHERE p.airtable_record_id = 'rec123' 
  AND sc.name IN ('Buildings', 'LDES'); -- from Airtable SLR field
```

### Step 3: File Attachment Migration

Airtable attachments need special handling:

1. **Download files from Airtable URLs**
2. **Upload to Supabase Storage**
3. **Update database with new URLs**

```javascript
// Example attachment migration
async function migrateAttachments(airtableRecord) {
    const attachments = airtableRecord.fields["Review Material (File)"];
    
    for (const attachment of attachments || []) {
        // Download from Airtable
        const response = await fetch(attachment.url);
        const blob = await response.blob();
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('pipeline-attachments')
            .upload(`${airtableRecord.id}/${attachment.filename}`, blob);
        
        if (!error) {
            // Insert attachment record
            await supabase.from('pipeline_attachments').insert({
                pipeline_id: pipelineId,
                file_type: 'review_material',
                file_name: attachment.filename,
                file_url: data.path,
                airtable_attachment_id: attachment.id
            });
        }
    }
}
```

### Step 4: User/Collaborator Migration

```sql
-- First, create users from collaborator data
INSERT INTO users (email, name, airtable_user_id)
VALUES 
    ('daniel@newsystemventures.com', 'Daniel', 'usrB6SVKx4MW28fqU'),
    ('max@newsystemventures.com', 'Max', 'usr9IvfzergFM5m1F')
ON CONFLICT (email) DO NOTHING;

-- Then link to pipeline records
INSERT INTO pipeline_assignees (pipeline_id, user_id)
SELECT p.id, u.id
FROM pipeline p, users u
WHERE p.airtable_record_id = 'rec123'
  AND u.airtable_user_id = 'usrB6SVKx4MW28fqU';
```

## Data Validation Queries

### Verify Migration Completeness
```sql
-- Check record counts
SELECT 'pipeline' as table_name, COUNT(*) as count FROM pipeline
UNION ALL
SELECT 'todos', COUNT(*) FROM todos
UNION ALL
SELECT 'investor_crm', COUNT(*) FROM investor_crm;

-- Check for missing required fields
SELECT id, company_name 
FROM pipeline 
WHERE company_name IS NULL OR company_name = '';

-- Verify junction table relationships
SELECT p.company_name, array_agg(sc.name) as slr_categories
FROM pipeline p
LEFT JOIN pipeline_slr ps ON p.id = ps.pipeline_id
LEFT JOIN slr_categories sc ON ps.slr_category_id = sc.id
GROUP BY p.id, p.company_name
LIMIT 10;
```

### Data Quality Checks
```sql
-- Check for duplicate companies (same name + round stage)
SELECT company_name, round_stage, COUNT(*)
FROM pipeline
GROUP BY company_name, round_stage
HAVING COUNT(*) > 1;

-- Verify enum values are valid
SELECT DISTINCT status FROM pipeline 
WHERE status NOT IN (SELECT unnest(enum_range(NULL::status_enum)));
```

## Migration Script Template

```python
import pandas as pd
import psycopg2
from pyairtable import Table
import os

class AirtableToSupabaseMigrator:
    def __init__(self, airtable_api_key, supabase_db_url):
        self.airtable = Table(airtable_api_key, 'appDBk60DIC9QQLVS', 'tbllzgePE8swXymyh')
        self.db_conn = psycopg2.connect(supabase_db_url)
    
    def migrate_pipeline_records(self):
        # Fetch all records from Airtable
        records = self.airtable.all()
        
        for record in records:
            # Transform and insert main record
            self.insert_pipeline_record(record)
            
            # Handle multiple selects
            self.insert_slr_categories(record)
            self.insert_assignees(record)
            
            # Handle attachments
            self.migrate_attachments(record)
    
    def insert_pipeline_record(self, record):
        # Implementation details...
        pass
```

## Post-Migration Tasks

### 1. Update Application Code
- [ ] Update database connection strings
- [ ] Modify queries for new schema structure
- [ ] Update file upload/download logic for Supabase Storage
- [ ] Test all CRUD operations

### 2. Set Up Views and Permissions
- [ ] Create RLS policies if needed
- [ ] Set up user permissions
- [ ] Test view performance

### 3. Data Sync Strategy
During transition period:
- [ ] Consider dual-write strategy
- [ ] Set up change logs
- [ ] Plan cutover timing

## Rollback Plan

If migration issues occur:
1. **Keep Airtable data intact** during migration
2. **Test thoroughly** in staging environment
3. **Have database backup** before going live
4. **Document any data transformations** for reverse migration

## Schema Differences to Note

### Advantages of Supabase Schema:
- **Better performance** with proper indexes
- **Referential integrity** with foreign keys
- **Type safety** with PostgreSQL types
- **Computed views** replace Airtable formulas
- **Flexible permissions** with RLS

### Considerations:
- **Formula fields** become computed views or application logic
- **Airtable's flexibility** vs PostgreSQL's structure
- **File storage** moves to Supabase Storage
- **Real-time updates** need to be reimplemented

## Testing Checklist

- [ ] All records migrated correctly
- [ ] Relationships preserved
- [ ] File attachments accessible
- [ ] Views return expected data
- [ ] Performance is acceptable
- [ ] User permissions work
- [ ] Application functions properly

This migration will give you a more robust, scalable database foundation for your pipeline management system while preserving all your existing data and relationships.
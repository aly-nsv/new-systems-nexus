#!/usr/bin/env node

/**
 * Airtable to Supabase Migration Script
 * 
 * This script transforms the pipeline_output.json data from Airtable
 * into Supabase database entries according to the new schema.
 * 
 * Usage: node scripts/migrate-airtable-data.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Field mapping from Airtable to Supabase
const FIELD_MAPPINGS = {
  'Company Name': 'company_name',
  'Description (short)': 'description_short',
  'Website': 'website',
  'Geography': 'geography',
  'Company Contact': 'company_contact',
  'Status': 'status',
  'Final Status': 'final_status',
  'Priority': 'priority',
  'To Review': 'to_review',
  'Round Stage': 'round_stage',
  'Round Timing': 'round_timing',
  'Round Size': 'round_size',
  'Pre-money Valuation': 'pre_money_valuation',
  'Total Raised': 'total_raised',
  'Check Size/Allocation': 'check_size_allocation',
  'Most Recent Valuation': 'most_recent_valuation',
  'Investment Date': 'investment_date',
  'Pass Date': 'pass_date',
  'Signed NDA': 'signed_nda',
  'Decision Overview': 'decision_overview',
  'Product Analysis': 'product_analysis',
  'Value Proposition': 'value_proposition',
  'Market Analysis': 'market_analysis',
  'Team Analysis': 'team_analysis',
  'What do we need to believe for this to be a quality investment?': 'what_to_believe',
  'Deal Team Next Step': 'deal_team_next_step',
  'Advisor Recommendation': 'advisor_recommendation',
  'Completed Tasks': 'completed_tasks',
  'Notes/Links': 'notes_links',
  'Review Material (Link)': 'review_material_link',
  'Deck': 'deck_url',
  'Investments Drive Folder': 'investments_drive_folder',
  'Data Room URL': 'data_room_url',
  'Notissia Deck Link': 'notissia_deck_link',
  '2-Pager Ready': 'two_pager_ready',
  'Fund Type': 'fund_type',
  'Advisor Priority': 'advisor_priority',
  'Investor CRM': 'investor_crm'
};

// User mapping (Airtable user ID to email for lookup)
const USER_MAPPINGS = {
  'usrB6SVKx4MW28fqU': 'daniel@newsystemventures.com',
  'usr9IvfzergFM5m1F': 'max@newsystemventures.com',
  'usr09ApKgtD187dni': 'aly@newsystemventures.com',
  'usrUDkpA0jEmVoqMe': 'max.levine@newlab.com'
};

class AirtableMigrator {
  constructor() {
    this.categories = {
      slr: new Map(),
      source: new Map(),
      dealLead: new Map(),
      theme: new Map()
    };
    this.users = new Map();
    this.stats = {
      processed: 0,
      successful: 0,
      errors: 0,
      skipped: 0
    };
    this.errorRecords = [];
    this.skippedRecords = [];
  }

  async loadExistingData() {
    console.log('Loading existing categories and users...');
    
    // Load categories
    const { data: slrCategories } = await supabase.from('slr_categories').select('*');
    const { data: sourceCategories } = await supabase.from('source_categories').select('*');
    const { data: dealLeadCategories } = await supabase.from('deal_lead_categories').select('*');
    const { data: themeCategories } = await supabase.from('theme_categories').select('*');
    const { data: users } = await supabase.from('users').select('*');

    // Map categories by name for quick lookup
    slrCategories?.forEach(cat => this.categories.slr.set(cat.name, cat.id));
    sourceCategories?.forEach(cat => this.categories.source.set(cat.name, cat.id));
    dealLeadCategories?.forEach(cat => this.categories.dealLead.set(cat.name, cat.id));
    themeCategories?.forEach(cat => this.categories.theme.set(cat.name, cat.id));

    // Map users by email for lookup
    users?.forEach(user => this.users.set(user.email, user.id));

    console.log(`Loaded ${slrCategories?.length || 0} SLR categories`);
    console.log(`Loaded ${sourceCategories?.length || 0} source categories`);
    console.log(`Loaded ${dealLeadCategories?.length || 0} deal lead categories`);
    console.log(`Loaded ${themeCategories?.length || 0} theme categories`);
    console.log(`Loaded ${users?.length || 0} users`);
  }

  async createMissingCategories(records) {
    console.log('Creating missing categories...');
    
    const allCategories = {
      slr: new Set(),
      source: new Set(),
      dealLead: new Set(),
      theme: new Set()
    };

    // Collect all unique category values
    records.forEach(record => {
      const fields = record.fields;
      
      // SLR categories
      if (fields.SLR) {
        fields.SLR.forEach(cat => allCategories.slr.add(cat));
      }
      if (fields['SLR Market Map']) {
        allCategories.slr.add(fields['SLR Market Map']);
      }
      if (fields.Sector) {
        fields.Sector.forEach(cat => allCategories.slr.add(cat));
      }

      // Source categories
      if (fields.Source) {
        fields.Source.forEach(cat => allCategories.source.add(cat));
      }

      // Deal Lead categories
      if (fields['Deal Lead']) {
        fields['Deal Lead'].forEach(cat => allCategories.dealLead.add(cat));
      }

      // Theme categories
      if (fields.Theme) {
        fields.Theme.forEach(cat => allCategories.theme.add(cat));
      }
    });

    // Create missing SLR categories
    for (const categoryName of allCategories.slr) {
      if (!this.categories.slr.has(categoryName)) {
        const { data, error } = await supabase
          .from('slr_categories')
          .insert({ name: categoryName, color: 'gray' })
          .select()
          .single();
        
        if (!error && data) {
          this.categories.slr.set(categoryName, data.id);
          console.log(`Created SLR category: ${categoryName}`);
        }
      }
    }

    // Create missing source categories
    for (const categoryName of allCategories.source) {
      if (!this.categories.source.has(categoryName)) {
        const { data, error } = await supabase
          .from('source_categories')
          .insert({ name: categoryName, color: 'gray' })
          .select()
          .single();
        
        if (!error && data) {
          this.categories.source.set(categoryName, data.id);
          console.log(`Created source category: ${categoryName}`);
        }
      }
    }

    // Create missing deal lead categories
    for (const categoryName of allCategories.dealLead) {
      if (!this.categories.dealLead.has(categoryName)) {
        const { data, error } = await supabase
          .from('deal_lead_categories')
          .insert({ name: categoryName, color: 'gray' })
          .select()
          .single();
        
        if (!error && data) {
          this.categories.dealLead.set(categoryName, data.id);
          console.log(`Created deal lead category: ${categoryName}`);
        }
      }
    }

    // Create missing theme categories
    for (const categoryName of allCategories.theme) {
      if (!this.categories.theme.has(categoryName)) {
        const { data, error } = await supabase
          .from('theme_categories')
          .insert({ name: categoryName, color: 'gray' })
          .select()
          .single();
        
        if (!error && data) {
          this.categories.theme.set(categoryName, data.id);
          console.log(`Created theme category: ${categoryName}`);
        }
      }
    }
  }

  async createMissingUsers(records) {
    console.log('Creating missing users...');
    
    const allUsers = new Set();

    // Collect all unique users
    records.forEach(record => {
      const fields = record.fields;
      
      // Created By
      if (fields['Created By']) {
        allUsers.add(fields['Created By']);
      }

      // Next Step Assignee
      if (fields['Next Step Assignee']) {
        fields['Next Step Assignee'].forEach(user => allUsers.add(user));
      }

      // Pass Communicator
      if (fields['Pass Communicator']) {
        allUsers.add(fields['Pass Communicator']);
      }
    });

    // Create missing users
    for (const userObj of allUsers) {
      if (userObj && userObj.email && !this.users.has(userObj.email)) {
        const { data, error } = await supabase
          .from('users')
          .insert({
            email: userObj.email,
            name: userObj.name,
            airtable_user_id: userObj.id
          })
          .select()
          .single();
        
        if (!error && data) {
          this.users.set(userObj.email, data.id);
          console.log(`Created user: ${userObj.name} (${userObj.email})`);
        }
      }
    }
  }

  transformRecord(record) {
    const fields = record.fields;
    const pipelineData = {
      airtable_record_id: record.id,
      created_at: record.createdTime
    };

    // Map basic fields
    Object.entries(FIELD_MAPPINGS).forEach(([airtableField, supabaseField]) => {
      if (fields[airtableField] !== undefined) {
        let value = fields[airtableField];

        // Handle special transformations
        if (supabaseField === 'round_size' && typeof value === 'number') {
          // Convert to cents
          value = value * 100;
        }
        
        if (supabaseField === 'pre_money_valuation' && typeof value === 'number') {
          // Convert to cents
          value = value * 100;
        }

        if (supabaseField === 'two_pager_ready') {
          value = Boolean(value);
        }

        if (supabaseField === 'to_review') {
          value = Boolean(value);
        }

        // Handle date fields
        if (supabaseField.includes('_date') && value) {
          if (typeof value === 'string') {
            value = new Date(value).toISOString().split('T')[0];
          }
        }

        pipelineData[supabaseField] = value;
      }
    });

    // Set created_by if available
    if (fields['Created By'] && fields['Created By'].email) {
      const userId = this.users.get(fields['Created By'].email);
      if (userId) {
        pipelineData.created_by = userId;
      }
    }

    return pipelineData;
  }

  async insertPipelineRecord(record) {
    try {
      const pipelineData = this.transformRecord(record);
      const fields = record.fields;

      // Insert main pipeline record
      const { data: pipeline, error: pipelineError } = await supabase
        .from('pipeline')
        .insert(pipelineData)
        .select()
        .single();

      if (pipelineError) {
        throw new Error(`Pipeline insert error: ${pipelineError.message}`);
      }

      const pipelineId = pipeline.id;

      // Insert SLR categories
      await this.insertCategories(pipelineId, fields, 'SLR', 'pipeline_slr', 'slr_category_id', 'slr');
      await this.insertCategories(pipelineId, fields, 'SLR Market Map', 'pipeline_slr', 'slr_category_id', 'slr', true);
      await this.insertCategories(pipelineId, fields, 'Sector', 'pipeline_slr', 'slr_category_id', 'slr');

      // Insert source categories
      await this.insertCategories(pipelineId, fields, 'Source', 'pipeline_source', 'source_category_id', 'source');

      // Insert deal lead categories
      await this.insertCategories(pipelineId, fields, 'Deal Lead', 'pipeline_deal_lead', 'deal_lead_category_id', 'dealLead');

      // Insert theme categories
      await this.insertCategories(pipelineId, fields, 'Theme', 'pipeline_theme', 'theme_category_id', 'theme');

      // Insert assignees
      await this.insertAssignees(pipelineId, fields);

      // Insert pass communicator
      await this.insertPassCommunicator(pipelineId, fields);

      // Insert attachments
      await this.insertAttachments(pipelineId, fields);

      this.stats.successful++;
      console.log(`✓ Migrated: ${fields['Company Name'] || 'Unknown'} (${record.id})`);

    } catch (error) {
      this.stats.errors++;
      this.errorRecords.push({
        id: record.id,
        companyName: fields['Company Name'] || 'Unknown',
        error: error.message,
        fields: fields
      });
      console.error(`✗ Error migrating ${fields['Company Name'] || 'Unknown'} (${record.id}):`, error.message);
    }
  }

  async insertCategories(pipelineId, fields, fieldName, tableName, columnName, categoryType, singleValue = false) {
    const values = singleValue ? [fields[fieldName]].filter(Boolean) : (fields[fieldName] || []);
    
    for (const value of values) {
      const categoryId = this.categories[categoryType].get(value);
      if (categoryId) {
        await supabase
          .from(tableName)
          .insert({
            pipeline_id: pipelineId,
            [columnName]: categoryId
          });
      }
    }
  }

  async insertAssignees(pipelineId, fields) {
    const assignees = fields['Next Step Assignee'] || [];
    
    for (const assignee of assignees) {
      if (assignee && assignee.email) {
        const userId = this.users.get(assignee.email);
        if (userId) {
          await supabase
            .from('pipeline_assignees')
            .insert({
              pipeline_id: pipelineId,
              user_id: userId
            });
        }
      }
    }
  }

  async insertPassCommunicator(pipelineId, fields) {
    const passCommunicator = fields['Pass Communicator'];
    
    if (passCommunicator && passCommunicator.email) {
      const userId = this.users.get(passCommunicator.email);
      if (userId) {
        await supabase
          .from('pipeline_pass_communicator')
          .insert({
            pipeline_id: pipelineId,
            user_id: userId
          });
      }
    }
  }

  async insertAttachments(pipelineId, fields) {
    // Deck files
    const deckFiles = fields['Deck (File)'] || [];
    for (const file of deckFiles) {
      await supabase
        .from('pipeline_attachments')
        .insert({
          pipeline_id: pipelineId,
          file_type: 'deck',
          file_name: file.filename,
          file_url: file.url,
          file_size: file.size,
          mime_type: file.type,
          airtable_attachment_id: file.id
        });
    }

    // Review material files
    const reviewFiles = fields['Review Material (File)'] || [];
    for (const file of reviewFiles) {
      await supabase
        .from('pipeline_attachments')
        .insert({
          pipeline_id: pipelineId,
          file_type: 'review_material',
          file_name: file.filename,
          file_url: file.url,
          file_size: file.size,
          mime_type: file.type,
          airtable_attachment_id: file.id
        });
    }
  }

  async migrate() {
    console.log('🚀 Starting Airtable to Supabase migration...\n');

    try {
      // Load data
      const dataPath = path.join(__dirname, '..', 'pipeline_output.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const records = JSON.parse(rawData);
      
      console.log(`Found ${records.length} records to migrate\n`);

      // Load existing data
      await this.loadExistingData();

      // Create missing categories and users
      await this.createMissingCategories(records);
      await this.createMissingUsers(records);

      // Migrate records
      console.log('\nMigrating pipeline records...');
      for (const record of records) {
        this.stats.processed++;
        
        // Skip records without company name
        if (!record.fields['Company Name']) {
          this.stats.skipped++;
          this.skippedRecords.push({
            id: record.id,
            reason: 'Missing company name',
            fields: record.fields
          });
          console.log(`⚠ Skipped record without company name: ${record.id}`);
          continue;
        }

        await this.insertPipelineRecord(record);
      }

      // Print summary
      console.log('\n📊 Migration Summary:');
      console.log(`Total processed: ${this.stats.processed}`);
      console.log(`Successful: ${this.stats.successful}`);
      console.log(`Errors: ${this.stats.errors}`);
      console.log(`Skipped: ${this.stats.skipped}`);

      // Print detailed error report
      if (this.stats.errors > 0) {
        console.log('\n❌ FAILED RECORDS:');
        console.log('-'.repeat(50));
        this.errorRecords.forEach((record, index) => {
          console.log(`${index + 1}. ${record.companyName} (${record.id})`);
          console.log(`   Error: ${record.error}`);
          console.log('');
        });
      }

      if (this.stats.skipped > 0) {
        console.log('\n⚠️ SKIPPED RECORDS:');
        console.log('-'.repeat(50));
        this.skippedRecords.forEach((record, index) => {
          console.log(`${index + 1}. Record ${record.id}`);
          console.log(`   Reason: ${record.reason}`);
          console.log('');
        });
      }

      if (this.stats.errors > 0) {
        console.log('\n⚠ Some records failed to migrate. See detailed errors above.');
      } else {
        console.log('\n✅ Migration completed successfully!');
      }

    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  }
}

// Run migration
if (require.main === module) {
  const migrator = new AirtableMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = AirtableMigrator;
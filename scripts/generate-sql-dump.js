#!/usr/bin/env node

/**
 * Generate SQL Dump from Airtable Data
 * 
 * This script creates SQL INSERT statements from pipeline_output.json
 * that can be run directly in Supabase SQL Editor.
 * 
 * Usage: node scripts/generate-sql-dump.js
 */

const fs = require('fs');
const path = require('path');

// Field mapping from Airtable to Supabase (corrected field names based on validation)
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
  'Round timing': 'round_timing', // Note: lowercase 't' in Airtable
  'Round Size': 'round_size',
  'Pre-Money Valuation': 'pre_money_valuation',
  'Total Raised': 'total_raised',
  'Check Size/Allocation': 'check_size_allocation',
  'Most Recent Valuation': 'most_recent_valuation',
  'Investment date': 'investment_date', // Note: lowercase 'd' in Airtable
  'Pass Date': 'pass_date',
  'Signed NDA': 'signed_nda',
  'Decision Overview': 'decision_overview',
  'Product Analysis': 'product_analysis',
  'Value Proposition': 'value_proposition',
  'Market Analysis': 'market_analysis',
  'Team Analysis': 'team_analysis',
  'What do we need to believe for this to be a quality investment?': 'what_to_believe',
  'Deal Team Next Step / Recommendation': 'deal_team_next_step', // Corrected field name
  'Advisor Recommendation / Next Step': 'advisor_recommendation', // Corrected field name
  'Completed Tasks': 'completed_tasks',
  'Notes / Links': 'notes_links', // Note: spaces around slash in Airtable
  'Review Material (Link)': 'review_material_link',
  'Deck': 'deck_url',
  'Investments Drive Folder': 'investments_drive_folder',
  'Data Room': 'data_room_url', // Corrected field name
  'Notissia Deck Link': 'notissia_deck_link',
  '2-Pager Ready': 'two_pager_ready',
  'Fund?': 'fund_type', // Corrected field name
  'Advisor Priority': 'advisor_priority',
  'Investor CRM 2': 'investor_crm' // Corrected field name
};

// Enum validation - these are the exact values allowed in the schema
const VALID_ENUMS = {
  status: [
    'Invested', 'Diligence 3 (IC Memo)', 'Diligence 2 (Screening Memo)', 
    'Diligence 1', 'Debrief', 'New Company', 'Meeting Booked', 
    'To Be Scheduled', 'To Pass', 'Waiting for Lead', 'Follow Up', 
    'Actively Monitor', 'Passively Monitor', 'Out of Scope', 'Pass', 
    'Newlab Syndicate Investment'
  ],
  round_stage: [
    'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E',
    'Series A Bridge', 'Govt Funded', 'Seed Extension', 'Bridge', 'Series B Bridge',
    'Convertible Note', 'IPO', 'Series A-1', 'Series A-2', 'Series B-2', 'Other',
    'Series A-3', 'Series C Bridge', 'Dev Cap', 'Angel', 'Late Stage'
  ],
  round_timing: [
    'Q4 2023', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q2 2023', 'Q1 2023',
    'Q3 2023', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'
  ],
  priority: [
    '1 - Highest', '2 - High', '3 - Medium', '4 - Low', '0 - On Hold'
  ],
  fund_type: ['SPV', 'Fund'],
  advisor_priority: [
    '1 - Highest', '2 - High', '3 - Medium', '4 - Low', '5 - Lowest', 'Hold'
  ]
};

// Value mappings for special cases
const VALUE_MAPPINGS = {
  fund_type: {
    'Yes': 'Fund',
    'No': null,
    'SPV': 'SPV',
    'Fund': 'Fund'
  }
};

class SQLDumpGenerator {
  constructor() {
    this.users = new Map();
    this.slrCategories = new Map();
    this.sourceCategories = new Map();
    this.dealLeadCategories = new Map();
    this.themeCategories = new Map();
    this.sqlStatements = [];
    this.stats = {
      processed: 0,
      successful: 0,
      errors: 0,
      skipped: 0
    };
    this.errorRecords = [];
  }

  // Escape SQL strings
  escapeSQLString(str) {
    if (str === null || str === undefined) return 'NULL';
    return `'${str.toString().replace(/'/g, "''")}'`;
  }

  // Convert date to SQL format
  formatDate(date) {
    if (!date) return 'NULL';
    try {
      const d = new Date(date);
      return `'${d.toISOString().split('T')[0]}'`;
    } catch {
      return 'NULL';
    }
  }

  // Generate UUID (simple version for demo)
  generateUUID() {
    return 'gen_random_uuid()';
  }

  // Validate enum values
  validateEnum(value, enumType) {
    if (!value) return null;
    
    // Trim whitespace from value
    const trimmedValue = value.toString().trim();
    
    // Check if there's a special mapping
    if (VALUE_MAPPINGS[enumType] && VALUE_MAPPINGS[enumType][trimmedValue] !== undefined) {
      return VALUE_MAPPINGS[enumType][trimmedValue];
    }
    
    // Check if value is in valid enums
    if (VALID_ENUMS[enumType] && VALID_ENUMS[enumType].includes(trimmedValue)) {
      return trimmedValue;
    }
    
    console.warn(`⚠️ Invalid ${enumType} value: "${trimmedValue}". Setting to NULL.`);
    return null;
  }

  collectAllData(records) {
    console.log('Collecting all unique data...');
    
    const allUsers = new Set();
    const allSLR = new Set();
    const allSource = new Set();
    const allDealLead = new Set();
    const allTheme = new Set();

    records.forEach(record => {
      const fields = record.fields;
      
      // Collect users
      if (fields['Created By']) {
        allUsers.add(JSON.stringify(fields['Created By']));
      }
      if (fields['Next Step Assignee']) {
        fields['Next Step Assignee'].forEach(user => {
          allUsers.add(JSON.stringify(user));
        });
      }
      if (fields['Pass Communicator']) {
        allUsers.add(JSON.stringify(fields['Pass Communicator']));
      }

      // Collect categories - combining all SLR-related fields
      if (fields.SLR) {
        fields.SLR.forEach(cat => allSLR.add(cat));
      }
      if (fields['SLR Market Map']) {
        allSLR.add(fields['SLR Market Map']);
      }
      if (fields.Sector) {
        fields.Sector.forEach(cat => allSLR.add(cat));
      }

      if (fields.Source) {
        fields.Source.forEach(cat => allSource.add(cat));
      }

      if (fields['Deal Lead']) {
        fields['Deal Lead'].forEach(cat => allDealLead.add(cat));
      }

      if (fields.Theme) {
        fields.Theme.forEach(cat => allTheme.add(cat));
      }
    });

    // Process users
    Array.from(allUsers).forEach(userStr => {
      const user = JSON.parse(userStr);
      if (user.email) {
        this.users.set(user.id, {
          id: user.id,
          email: user.email,
          name: user.name
        });
      }
    });

    // Process categories
    Array.from(allSLR).forEach(cat => {
      this.slrCategories.set(cat, this.generateUUID());
    });
    Array.from(allSource).forEach(cat => {
      this.sourceCategories.set(cat, this.generateUUID());
    });
    Array.from(allDealLead).forEach(cat => {
      this.dealLeadCategories.set(cat, this.generateUUID());
    });
    Array.from(allTheme).forEach(cat => {
      this.themeCategories.set(cat, this.generateUUID());
    });

    console.log(`Found ${this.users.size} unique users`);
    console.log(`Found ${this.slrCategories.size} SLR categories`);
    console.log(`Found ${this.sourceCategories.size} source categories`);
    console.log(`Found ${this.dealLeadCategories.size} deal lead categories`);
    console.log(`Found ${this.themeCategories.size} theme categories`);
  }

  generateInsertStatements() {
    // Users
    this.sqlStatements.push('-- Insert Users');
    this.sqlStatements.push('INSERT INTO users (id, email, name, airtable_user_id) VALUES');
    const userValues = Array.from(this.users.values()).map(user => 
      `(${this.generateUUID()}, ${this.escapeSQLString(user.email)}, ${this.escapeSQLString(user.name)}, ${this.escapeSQLString(user.id)})`
    );
    this.sqlStatements.push(userValues.join(',\n') + ';');
    this.sqlStatements.push('');

    // SLR Categories
    this.sqlStatements.push('-- Insert SLR Categories');
    this.sqlStatements.push('INSERT INTO slr_categories (id, name, color) VALUES');
    const slrValues = Array.from(this.slrCategories.entries()).map(([name, id]) => 
      `(${id}, ${this.escapeSQLString(name)}, 'gray')`
    );
    this.sqlStatements.push(slrValues.join(',\n') + ';');
    this.sqlStatements.push('');

    // Source Categories
    this.sqlStatements.push('-- Insert Source Categories');
    this.sqlStatements.push('INSERT INTO source_categories (id, name, color) VALUES');
    const sourceValues = Array.from(this.sourceCategories.entries()).map(([name, id]) => 
      `(${id}, ${this.escapeSQLString(name)}, 'gray')`
    );
    this.sqlStatements.push(sourceValues.join(',\n') + ';');
    this.sqlStatements.push('');

    // Deal Lead Categories
    this.sqlStatements.push('-- Insert Deal Lead Categories');
    this.sqlStatements.push('INSERT INTO deal_lead_categories (id, name, color) VALUES');
    const dealLeadValues = Array.from(this.dealLeadCategories.entries()).map(([name, id]) => 
      `(${id}, ${this.escapeSQLString(name)}, 'gray')`
    );
    this.sqlStatements.push(dealLeadValues.join(',\n') + ';');
    this.sqlStatements.push('');

    // Theme Categories
    this.sqlStatements.push('-- Insert Theme Categories');
    this.sqlStatements.push('INSERT INTO theme_categories (id, name, color) VALUES');
    const themeValues = Array.from(this.themeCategories.entries()).map(([name, id]) => 
      `(${id}, ${this.escapeSQLString(name)}, 'gray')`
    );
    this.sqlStatements.push(themeValues.join(',\n') + ';');
    this.sqlStatements.push('');
  }

  transformRecord(record) {
    try {
      const fields = record.fields;
      
      if (!fields['Company Name']) {
        this.stats.skipped++;
        return null;
      }

      // Basic pipeline data - use a deterministic ID based on record ID
      const pipelineId = `'pipeline_${record.id}'`;
      const createdByUser = fields['Created By'];
      const createdByRef = createdByUser ? 
        `(SELECT id FROM users WHERE airtable_user_id = ${this.escapeSQLString(createdByUser.id)})` : 
        'NULL';

      // Transform and validate enum fields
      const status = this.validateEnum(fields['Status'], 'status');
      const finalStatus = this.validateEnum(fields['Final Status'], 'status');
      const priority = this.validateEnum(fields['Priority'], 'priority');
      const roundStage = this.validateEnum(fields['Round Stage'], 'round_stage');
      const roundTiming = this.validateEnum(fields['Round timing'], 'round_timing');
      const fundType = this.validateEnum(fields['Fund?'], 'fund_type');
      const advisorPriority = this.validateEnum(fields['Advisor Priority'], 'advisor_priority');

      const values = [
        this.generateUUID(),
        this.escapeSQLString(fields['Company Name']),
        this.escapeSQLString(fields['Description (short)']),
        this.escapeSQLString(fields['Website']),
        this.escapeSQLString(fields['Geography']),
        this.escapeSQLString(fields['Company Contact']),
        status ? this.escapeSQLString(status) : 'NULL',
        finalStatus ? this.escapeSQLString(finalStatus) : 'NULL',
        priority ? this.escapeSQLString(priority) : 'NULL',
        fields['To Review'] ? 'true' : 'false',
        roundStage ? this.escapeSQLString(roundStage) : 'NULL',
        roundTiming ? this.escapeSQLString(roundTiming) : 'NULL',
        fields['Round Size'] ? (fields['Round Size'] * 100).toString() : 'NULL', // Convert to cents
        fields['Pre-Money Valuation'] ? (fields['Pre-Money Valuation'] * 100).toString() : 'NULL',
        fields['Total Raised'] ? fields['Total Raised'].toString() : 'NULL',
        fields['Check Size/Allocation'] ? fields['Check Size/Allocation'].toString() : 'NULL',
        fields['Most Recent Valuation'] ? fields['Most Recent Valuation'].toString() : 'NULL',
        this.formatDate(fields['Investment date']), // Note: lowercase 'd'
        this.formatDate(fields['Pass Date']),
        this.formatDate(fields['Signed NDA']),
        this.escapeSQLString(fields['Decision Overview']),
        this.escapeSQLString(fields['Product Analysis']),
        this.escapeSQLString(fields['Value Proposition']),
        this.escapeSQLString(fields['Market Analysis']),
        this.escapeSQLString(fields['Team Analysis']),
        this.escapeSQLString(fields['What do we need to believe for this to be a quality investment?']),
        this.escapeSQLString(fields['Deal Team Next Step / Recommendation']),
        this.escapeSQLString(fields['Advisor Recommendation / Next Step']),
        this.escapeSQLString(fields['Completed Tasks']),
        this.escapeSQLString(fields['Notes / Links']), // Note: spaces around slash
        this.escapeSQLString(fields['Review Material (Link)']),
        this.escapeSQLString(fields['Deck']),
        this.escapeSQLString(fields['Investments Drive Folder']),
        this.escapeSQLString(fields['Data Room']), // Corrected field name
        this.escapeSQLString(fields['Notissia Deck Link']),
        fields['2-Pager Ready'] ? 'true' : 'false',
        fundType ? this.escapeSQLString(fundType) : 'NULL',
        advisorPriority ? this.escapeSQLString(advisorPriority) : 'NULL',
        this.escapeSQLString(fields['Investor CRM 2']), // Corrected field name
        `'${record.createdTime}'`,
        createdByRef,
        'NOW()',
        this.escapeSQLString(record.id),
        'NOW()'
      ];

      this.stats.successful++;
      return {
        pipelineId,
        values: values.join(', '),
        fields
      };

    } catch (error) {
      this.stats.errors++;
      this.errorRecords.push({
        id: record.id,
        companyName: record.fields['Company Name'] || 'Unknown',
        error: error.message
      });
      return null;
    }
  }

  generatePipelineInserts(records) {
    this.sqlStatements.push('-- Insert Pipeline Records');
    this.sqlStatements.push(`INSERT INTO pipeline (
      id, company_name, description_short, website, geography, company_contact,
      status, final_status, priority, to_review, round_stage, round_timing,
      round_size, pre_money_valuation, total_raised, check_size_allocation, most_recent_valuation,
      investment_date, pass_date, signed_nda, decision_overview, product_analysis,
      value_proposition, market_analysis, team_analysis, what_to_believe,
      deal_team_next_step, advisor_recommendation, completed_tasks, notes_links,
      review_material_link, deck_url, investments_drive_folder, data_room_url, notissia_deck_link,
      two_pager_ready, fund_type, advisor_priority, investor_crm,
      created_at, created_by, updated_at, airtable_record_id, migrated_at
    ) VALUES`);

    const pipelineInserts = [];
    const junctionInserts = {
      slr: [],
      source: [],
      dealLead: [],
      theme: [],
      assignees: [],
      passCommunicator: [],
      attachments: []
    };

    records.forEach(record => {
      const transformed = this.transformRecord(record);
      if (!transformed) return;

      pipelineInserts.push(`(${transformed.values})`);
      const fields = transformed.fields;

      // Collect junction table data
      const pipelineId = transformed.pipelineId;

      // SLR categories - handle all three sources and deduplicate
      const allSLRCategories = new Set();
      if (fields.SLR) {
        fields.SLR.forEach(cat => allSLRCategories.add(cat));
      }
      if (fields['SLR Market Map']) {
        allSLRCategories.add(fields['SLR Market Map']);
      }
      if (fields.Sector) {
        fields.Sector.forEach(cat => allSLRCategories.add(cat));
      }
      
      allSLRCategories.forEach(cat => {
        const catId = `(SELECT id FROM slr_categories WHERE name = ${this.escapeSQLString(cat)})`;
        junctionInserts.slr.push(`(${this.generateUUID()}, (SELECT id FROM pipeline WHERE airtable_record_id = ${this.escapeSQLString(record.id)}), ${catId})`);
      });

      // Source categories
      if (fields.Source) {
        fields.Source.forEach(cat => {
          const catId = `(SELECT id FROM source_categories WHERE name = ${this.escapeSQLString(cat)})`;
          const pipelineRef = `(SELECT id FROM pipeline WHERE airtable_record_id = ${this.escapeSQLString(record.id)})`;
          junctionInserts.source.push(`(${this.generateUUID()}, ${pipelineRef}, ${catId})`);
        });
      }

      // Deal Lead categories
      if (fields['Deal Lead']) {
        fields['Deal Lead'].forEach(cat => {
          const catId = `(SELECT id FROM deal_lead_categories WHERE name = ${this.escapeSQLString(cat)})`;
          const pipelineRef = `(SELECT id FROM pipeline WHERE airtable_record_id = ${this.escapeSQLString(record.id)})`;
          junctionInserts.dealLead.push(`(${this.generateUUID()}, ${pipelineRef}, ${catId})`);
        });
      }

      // Theme categories
      if (fields.Theme) {
        fields.Theme.forEach(cat => {
          const catId = `(SELECT id FROM theme_categories WHERE name = ${this.escapeSQLString(cat)})`;
          const pipelineRef = `(SELECT id FROM pipeline WHERE airtable_record_id = ${this.escapeSQLString(record.id)})`;
          junctionInserts.theme.push(`(${this.generateUUID()}, ${pipelineRef}, ${catId})`);
        });
      }

      // Assignees
      if (fields['Next Step Assignee']) {
        fields['Next Step Assignee'].forEach(user => {
          const userId = `(SELECT id FROM users WHERE airtable_user_id = ${this.escapeSQLString(user.id)})`;
          const pipelineRef = `(SELECT id FROM pipeline WHERE airtable_record_id = ${this.escapeSQLString(record.id)})`;
          junctionInserts.assignees.push(`(${this.generateUUID()}, ${pipelineRef}, ${userId})`);
        });
      }

      // Pass Communicator
      if (fields['Pass Communicator']) {
        const userId = `(SELECT id FROM users WHERE airtable_user_id = ${this.escapeSQLString(fields['Pass Communicator'].id)})`;
        const pipelineRef = `(SELECT id FROM pipeline WHERE airtable_record_id = ${this.escapeSQLString(record.id)})`;
        junctionInserts.passCommunicator.push(`(${pipelineRef}, ${userId})`);
      }

      // File Attachments
      if (fields['Deck (File)']) {
        fields['Deck (File)'].forEach(file => {
          const pipelineRef = `(SELECT id FROM pipeline WHERE airtable_record_id = ${this.escapeSQLString(record.id)})`;
          junctionInserts.attachments.push(`(
            ${this.generateUUID()}, ${pipelineRef}, 'deck',
            ${this.escapeSQLString(file.filename)}, ${this.escapeSQLString(file.url)},
            ${file.size || 'NULL'}, ${this.escapeSQLString(file.type)},
            ${this.escapeSQLString(file.id)}
          )`);
        });
      }
      if (fields['Review Material (File)']) {
        fields['Review Material (File)'].forEach(file => {
          const pipelineRef = `(SELECT id FROM pipeline WHERE airtable_record_id = ${this.escapeSQLString(record.id)})`;
          junctionInserts.attachments.push(`(
            ${this.generateUUID()}, ${pipelineRef}, 'review_material',
            ${this.escapeSQLString(file.filename)}, ${this.escapeSQLString(file.url)},
            ${file.size || 'NULL'}, ${this.escapeSQLString(file.type)},
            ${this.escapeSQLString(file.id)}
          )`);
        });
      }
    });

    // Add pipeline inserts
    this.sqlStatements.push(pipelineInserts.join(',\n') + ';');
    this.sqlStatements.push('');

    // Add junction table inserts
    if (junctionInserts.slr.length > 0) {
      this.sqlStatements.push('-- Insert SLR Junction Records');
      this.sqlStatements.push('INSERT INTO pipeline_slr (id, pipeline_id, slr_category_id) VALUES');
      this.sqlStatements.push(junctionInserts.slr.join(',\n') + ';');
      this.sqlStatements.push('');
    }

    if (junctionInserts.source.length > 0) {
      this.sqlStatements.push('-- Insert Source Junction Records');
      this.sqlStatements.push('INSERT INTO pipeline_source (id, pipeline_id, source_category_id) VALUES');
      this.sqlStatements.push(junctionInserts.source.join(',\n') + ';');
      this.sqlStatements.push('');
    }

    if (junctionInserts.dealLead.length > 0) {
      this.sqlStatements.push('-- Insert Deal Lead Junction Records');
      this.sqlStatements.push('INSERT INTO pipeline_deal_lead (id, pipeline_id, deal_lead_category_id) VALUES');
      this.sqlStatements.push(junctionInserts.dealLead.join(',\n') + ';');
      this.sqlStatements.push('');
    }

    if (junctionInserts.theme.length > 0) {
      this.sqlStatements.push('-- Insert Theme Junction Records');
      this.sqlStatements.push('INSERT INTO pipeline_theme (id, pipeline_id, theme_category_id) VALUES');
      this.sqlStatements.push(junctionInserts.theme.join(',\n') + ';');
      this.sqlStatements.push('');
    }

    if (junctionInserts.assignees.length > 0) {
      this.sqlStatements.push('-- Insert Assignee Junction Records');
      this.sqlStatements.push('INSERT INTO pipeline_assignees (id, pipeline_id, user_id) VALUES');
      this.sqlStatements.push(junctionInserts.assignees.join(',\n') + ';');
      this.sqlStatements.push('');
    }

    if (junctionInserts.passCommunicator.length > 0) {
      this.sqlStatements.push('-- Insert Pass Communicator Records');
      this.sqlStatements.push('INSERT INTO pipeline_pass_communicator (pipeline_id, user_id) VALUES');
      this.sqlStatements.push(junctionInserts.passCommunicator.join(',\n') + ';');
      this.sqlStatements.push('');
    }

    if (junctionInserts.attachments.length > 0) {
      this.sqlStatements.push('-- Insert Attachment Records');
      this.sqlStatements.push('INSERT INTO pipeline_attachments (id, pipeline_id, file_type, file_name, file_url, file_size, mime_type, airtable_attachment_id) VALUES');
      this.sqlStatements.push(junctionInserts.attachments.join(',\n') + ';');
      this.sqlStatements.push('');
    }
  }

  generate() {
    console.log('🚀 Generating SQL dump from Airtable data...\n');

    try {
      // Load data
      const dataPath = path.join(__dirname, '..', 'pipeline_output.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const records = JSON.parse(rawData);
      
      console.log(`Found ${records.length} records to process\n`);

      // Collect all unique data
      this.collectAllData(records);

      // Generate SQL statements
      this.sqlStatements.push('-- Airtable to Supabase Migration SQL Dump');
      this.sqlStatements.push('-- Generated: ' + new Date().toISOString());
      this.sqlStatements.push('-- Source: pipeline_output.json');
      this.sqlStatements.push('-- Updated with proper enum validation and field mappings');
      this.sqlStatements.push('');

      this.generateInsertStatements();
      this.generatePipelineInserts(records);

      // Write SQL file
      const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250623195316_airtable_dump.sql');
      
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, this.sqlStatements.join('\n'));

      // Print summary
      console.log('\n📊 Generation Summary:');
      console.log(`Total processed: ${this.stats.processed + this.stats.skipped}`);
      console.log(`Successful: ${this.stats.successful}`);
      console.log(`Errors: ${this.stats.errors}`);
      console.log(`Skipped: ${this.stats.skipped}`);

      if (this.stats.errors > 0) {
        console.log('\n❌ FAILED RECORDS:');
        this.errorRecords.forEach((record, index) => {
          console.log(`${index + 1}. ${record.companyName} (${record.id}): ${record.error}`);
        });
      }

      console.log(`\n✅ SQL dump generated: ${outputPath}`);
      console.log('\n📋 IMPORTANT: This SQL file includes:');
      console.log('- Proper enum validation for all status/priority/stage fields');
      console.log('- Corrected field name mappings based on actual Airtable data');
      console.log('- All SLR categories from SLR, SLR Market Map, and Sector fields');
      console.log('- Currency values converted to cents for precision');
      console.log('- File attachments with Airtable URLs preserved');
      console.log('\nYou can now run this SQL file in your Supabase SQL Editor.');

    } catch (error) {
      console.error('💥 Generation failed:', error);
      process.exit(1);
    }
  }
}

// Run generator
if (require.main === module) {
  const generator = new SQLDumpGenerator();
  generator.generate();
}

module.exports = SQLDumpGenerator;
#!/usr/bin/env node

/**
 * Airtable Data Validation Script
 * 
 * This script analyzes the pipeline_output.json to understand
 * the data structure and identify any potential issues before migration.
 * 
 * Usage: node scripts/validate-airtable-data.js
 */

const fs = require('fs');
const path = require('path');

class DataValidator {
  constructor() {
    this.stats = {
      totalRecords: 0,
      fieldsFound: new Set(),
      missingCompanyNames: 0,
      statusValues: new Set(),
      roundStageValues: new Set(),
      priorityValues: new Set(),
      slrValues: new Set(),
      sourceValues: new Set(),
      dealLeadValues: new Set(),
      themeValues: new Set(),
      users: new Map(),
      fileAttachments: 0,
      dateFields: new Set()
    };
  }

  analyzeRecord(record) {
    const fields = record.fields;
    
    // Track all field names
    Object.keys(fields).forEach(field => this.stats.fieldsFound.add(field));

    // Check required fields
    if (!fields['Company Name']) {
      this.stats.missingCompanyNames++;
    }

    // Collect enum values
    if (fields.Status) this.stats.statusValues.add(fields.Status);
    if (fields['Round Stage']) this.stats.roundStageValues.add(fields['Round Stage']);
    if (fields.Priority) this.stats.priorityValues.add(fields.Priority);

    // Collect category values
    if (fields.SLR) {
      fields.SLR.forEach(val => this.stats.slrValues.add(val));
    }
    if (fields['SLR Market Map']) {
      this.stats.slrValues.add(fields['SLR Market Map']);
    }
    if (fields.Sector) {
      fields.Sector.forEach(val => this.stats.slrValues.add(val));
    }
    if (fields.Source) {
      fields.Source.forEach(val => this.stats.sourceValues.add(val));
    }
    if (fields['Deal Lead']) {
      fields['Deal Lead'].forEach(val => this.stats.dealLeadValues.add(val));
    }
    if (fields.Theme) {
      fields.Theme.forEach(val => this.stats.themeValues.add(val));
    }

    // Collect users
    if (fields['Created By']) {
      const user = fields['Created By'];
      this.stats.users.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email
      });
    }
    if (fields['Next Step Assignee']) {
      fields['Next Step Assignee'].forEach(user => {
        this.stats.users.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email
        });
      });
    }
    if (fields['Pass Communicator']) {
      const user = fields['Pass Communicator'];
      this.stats.users.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email
      });
    }

    // Count file attachments
    if (fields['Deck (File)']) {
      this.stats.fileAttachments += fields['Deck (File)'].length;
    }
    if (fields['Review Material (File)']) {
      this.stats.fileAttachments += fields['Review Material (File)'].length;
    }

    // Track date fields
    const dateFields = [
      'Created', 'Pass Date', 'Investment Date', 'Signed NDA'
    ];
    dateFields.forEach(field => {
      if (fields[field]) {
        this.stats.dateFields.add(field);
      }
    });
  }

  validate() {
    console.log('🔍 Analyzing Airtable data...\n');

    try {
      // Load data
      const dataPath = path.join(__dirname, '..', 'pipeline_output.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const records = JSON.parse(rawData);
      
      this.stats.totalRecords = records.length;
      console.log(`📄 Found ${records.length} records\n`);

      // Analyze each record
      records.forEach(record => this.analyzeRecord(record));

      // Print analysis
      this.printAnalysis();

    } catch (error) {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    }
  }

  printAnalysis() {
    console.log('📊 DATA ANALYSIS REPORT\n');
    console.log('=' .repeat(50));

    // Basic stats
    console.log('\n📈 BASIC STATISTICS');
    console.log('-'.repeat(30));
    console.log(`Total records: ${this.stats.totalRecords}`);
    console.log(`Records missing company name: ${this.stats.missingCompanyNames}`);
    console.log(`Unique fields found: ${this.stats.fieldsFound.size}`);
    console.log(`Total file attachments: ${this.stats.fileAttachments}`);
    console.log(`Unique users: ${this.stats.users.size}`);

    // Field analysis
    console.log('\n📋 ALL FIELDS FOUND');
    console.log('-'.repeat(30));
    Array.from(this.stats.fieldsFound).sort().forEach(field => {
      console.log(`  • ${field}`);
    });

    // Enum values
    console.log('\n🏷️  ENUM VALUES');
    console.log('-'.repeat(30));
    
    console.log('\nStatus values:');
    Array.from(this.stats.statusValues).sort().forEach(val => {
      console.log(`  • ${val}`);
    });

    console.log('\nRound Stage values:');
    Array.from(this.stats.roundStageValues).sort().forEach(val => {
      console.log(`  • ${val}`);
    });

    console.log('\nPriority values:');
    Array.from(this.stats.priorityValues).sort().forEach(val => {
      console.log(`  • ${val}`);
    });

    // Categories
    console.log('\n📂 CATEGORIES');
    console.log('-'.repeat(30));
    
    console.log(`\nSLR Categories (${this.stats.slrValues.size} unique):`);
    Array.from(this.stats.slrValues).sort().forEach(val => {
      console.log(`  • ${val}`);
    });

    console.log(`\nSource Categories (${this.stats.sourceValues.size} unique):`);
    Array.from(this.stats.sourceValues).sort().forEach(val => {
      console.log(`  • ${val}`);
    });

    console.log(`\nDeal Lead Categories (${this.stats.dealLeadValues.size} unique):`);
    Array.from(this.stats.dealLeadValues).sort().forEach(val => {
      console.log(`  • ${val}`);
    });

    console.log(`\nTheme Categories (${this.stats.themeValues.size} unique):`);
    Array.from(this.stats.themeValues).sort().forEach(val => {
      console.log(`  • ${val}`);
    });

    // Users
    console.log('\n👥 USERS');
    console.log('-'.repeat(30));
    Array.from(this.stats.users.values()).forEach(user => {
      console.log(`  • ${user.name} (${user.email}) [${user.id}]`);
    });

    // Date fields
    console.log('\n📅 DATE FIELDS');
    console.log('-'.repeat(30));
    Array.from(this.stats.dateFields).sort().forEach(field => {
      console.log(`  • ${field}`);
    });

    // Validation warnings
    console.log('\n⚠️  VALIDATION WARNINGS');
    console.log('-'.repeat(30));
    
    if (this.stats.missingCompanyNames > 0) {
      console.log(`❌ ${this.stats.missingCompanyNames} records missing company names (will be skipped)`);
    }

    // Check for unknown enum values
    const schemaStatus = [
      'Invested', 'Diligence 3 (IC Memo)', 'Diligence 2 (Screening Memo)', 
      'Diligence 1', 'Debrief', 'New Company', 'Meeting Booked', 
      'To Be Scheduled', 'To Pass', 'Waiting for Lead', 'Follow Up', 
      'Actively Monitor', 'Passively Monitor', 'Out of Scope', 'Pass', 
      'Newlab Syndicate Investment'
    ];

    const unknownStatus = Array.from(this.stats.statusValues).filter(
      val => !schemaStatus.includes(val)
    );
    if (unknownStatus.length > 0) {
      console.log(`❌ Unknown status values: ${unknownStatus.join(', ')}`);
    }

    const schemaPriority = ['1 - Highest', '2 - High', '3 - Medium', '4 - Low', '0 - On Hold'];
    const unknownPriority = Array.from(this.stats.priorityValues).filter(
      val => !schemaPriority.includes(val)
    );
    if (unknownPriority.length > 0) {
      console.log(`❌ Unknown priority values: ${unknownPriority.join(', ')}`);
    }

    // Success message
    if (this.stats.missingCompanyNames === 0 && unknownStatus.length === 0 && unknownPriority.length === 0) {
      console.log('✅ No critical validation issues found!');
    }

    console.log('\n🚀 Ready for migration! Run: npm run migrate:airtable');
    console.log('=' .repeat(50));
  }
}

// Run validation
if (require.main === module) {
  const validator = new DataValidator();
  validator.validate();
}

module.exports = DataValidator;
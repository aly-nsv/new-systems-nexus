const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'pipeline_output.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let skipped = 0;
let processed = 0;
const skippedRecords = [];

data.forEach(record => {
  if (!record.fields['Company Name']) {
    skipped++;
    skippedRecords.push({
      id: record.id,
      createdTime: record.createdTime,
      availableFields: Object.keys(record.fields)
    });
  } else {
    processed++;
  }
});

console.log('📊 ANALYSIS RESULTS:');
console.log(`Total records: ${data.length}`);
console.log(`Records with company names: ${processed}`);
console.log(`Records without company names (skipped): ${skipped}`);

if (skippedRecords.length > 0) {
  console.log('\n❌ SKIPPED RECORDS:');
  skippedRecords.forEach((record, index) => {
    console.log(`${index + 1}. Record ID: ${record.id}`);
    console.log(`   Created: ${record.createdTime}`);
    console.log(`   Available fields: ${record.availableFields.join(', ')}`);
    console.log('');
  });
}
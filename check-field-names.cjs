const Airtable = require('airtable');

const token = '***REMOVED***';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function checkFieldNames() {
  try {
    console.log('Checking Airtable field names...');
    
    const records = await table.select({
      maxRecords: 3
    }).firstPage();
    
    if (records.length > 0) {
      console.log('✅ Found records! Field names are:');
      console.log(Object.keys(records[0].fields));
      
      // Show sample of first record
      console.log('\nSample record data:');
      const fields = records[0].fields;
      Object.keys(fields).forEach(key => {
        console.log(`${key}: ${fields[key]}`);
      });
    } else {
      console.log('No records found in table');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkFieldNames();
const Airtable = require('airtable');

const token = '***REMOVED***';

async function testAirtableConnection() {
  try {
    console.log('Testing Airtable connection...');
    
    // Test with the base ID we've been using
    const base = new Airtable({
      apiKey: token
    }).base('app9eOTFWck1sZwTG');

    console.log('Attempting to list tables...');
    
    // Try to access the table
    const table = base('tblX8ZLilzQMN85VO');
    
    console.log('Attempting to fetch a small sample of records...');
    const records = await table.select({
      maxRecords: 3
    }).firstPage();
    
    console.log(`✅ Success! Found ${records.length} records`);
    console.log('Sample record fields:', Object.keys(records[0]?.fields || {}));
    
  } catch (error) {
    console.log('❌ Error connecting to Airtable:');
    console.log('Error type:', error.error);
    console.log('Message:', error.message);
    console.log('Status code:', error.statusCode);
    
    if (error.statusCode === 403) {
      console.log('\n🔍 This suggests either:');
      console.log('- The token needs permissions for this specific base');
      console.log('- The base ID might be different');
      console.log('- The table ID might be different');
    }
  }
}

testAirtableConnection();
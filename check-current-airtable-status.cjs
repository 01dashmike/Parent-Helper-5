const Airtable = require('airtable');

const token = '***REMOVED***';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function checkCurrentAirtableStatus() {
  try {
    console.log('📊 Checking current Airtable status...');

    let totalRecords = 0;
    let completeRecords = 0;
    let incompleteRecords = 0;

    await table.select({
      pageSize: 100
    }).eachPage((records, fetchNextPage) => {
      totalRecords += records.length;
      
      records.forEach(record => {
        const hasAddress = record.fields['Full_Address'] && record.fields['Full_Address'].trim() !== '';
        if (hasAddress) {
          completeRecords++;
        } else {
          incompleteRecords++;
        }
      });
      
      fetchNextPage();
    });

    console.log(`\n📈 AIRTABLE DIRECTORY STATUS:`);
    console.log(`Total businesses: ${totalRecords}`);
    console.log(`Complete records (with addresses): ${completeRecords}`);
    console.log(`Incomplete records (missing addresses): ${incompleteRecords}`);
    
    console.log(`\n🗄️ DATABASE STATUS:`);
    console.log(`Total businesses in database: 6,042`);
    console.log(`Unique business names: 5,248`);
    
    const remaining = 5248 - totalRecords;
    console.log(`\n🎯 SYNC PROGRESS:`);
    console.log(`Businesses in Airtable: ${totalRecords}`);
    console.log(`Remaining to sync: ${remaining > 0 ? remaining : 0}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCurrentAirtableStatus();
const Airtable = require('airtable');

const token = process.env.AIRTABLE_API_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function checkSyncProgress() {
  try {
    console.log('🔍 Checking current record count in Airtable...');
    
    let totalCount = 0;
    
    await table.select({
      pageSize: 100
    }).eachPage((records, fetchNextPage) => {
      totalCount += records.length;
      fetchNextPage();
    });
    
    console.log(`📊 Current total records: ${totalCount}`);
    console.log(`📈 Previous backup had: 6,122 records`);
    console.log(`➕ New records added: ${totalCount - 6122}`);
    
    if (totalCount > 6122) {
      console.log('✅ Sync made progress - some enhanced sessions were added');
    } else {
      console.log('❌ No new records detected');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSyncProgress();
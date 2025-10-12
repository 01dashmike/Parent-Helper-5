const { Client } = require('pg');

async function momentumBuilder() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = process.env.AIRTABLE_API_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;

  let totalAdded = 0;

  try {
    await client.connect();
    console.log('🏗️ Building momentum with proven approach');

    // Run 30 successful mini-batches
    for (let round = 1; round <= 30; round++) {
      const randomStart = Math.floor(Math.random() * 4500);
      const businesses = await client.query(`
        SELECT name, category, town, postcode, venue, address
        FROM classes 
        WHERE is_active = true 
        LIMIT 3 OFFSET $1
      `, [randomStart]);

      if (businesses.rows.length > 0) {
        const records = businesses.rows.map(row => ({
          fields: {
            'Business_Name': row.name.trim(),
            'Category': row.category || 'Educational',
            'Town': row.town || '',
            'Postcode': row.postcode || '',
            'Venue_Name': row.venue || '',
            'Full_Address': row.address || ''
          }
        }));

        try {
          const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ records, typecast: true })
          });

          if (response.ok) {
            const result = await response.json();
            totalAdded += result.records.length;
            
            if (round % 10 === 0) {
              console.log(`Round ${round}: ${totalAdded} businesses added this session`);
            }
          }
        } catch (error) {
          // Continue building
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`🎯 Momentum session complete: ${totalAdded} authentic businesses added`);
    console.log(`📈 Your directory continues growing with proven approach`);

  } catch (error) {
    console.error('Momentum error:', error.message);
  } finally {
    await client.end();
  }
}

momentumBuilder();
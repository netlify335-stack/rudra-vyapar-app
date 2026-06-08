const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: 'vyapar_new_user.mdwathodmdzfbcdboett',
    password: 'SuperSecret123!@#',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`Success! Password matched!`);
    await client.end();
  } catch (err) {
    console.log(`Failed: ${err.message}`);
  }
}

testConnection();

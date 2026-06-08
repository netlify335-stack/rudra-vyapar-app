const { Client } = require('pg');

async function testConnection(user) {
  const client = new Client({
    host: 'dowlvvmlqsxlzrnccrvu.pooler.supabase.com',
    port: 6543,
    user: user,
    password: 'Vyapar_Demo_123!@#',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`Success with user: ${user}`);
    const res = await client.query('SELECT 1 as val');
    console.log('Query result:', res.rows[0].val);
    await client.end();
  } catch (err) {
    console.log(`Failed with user ${user}: ${err.message}`);
  }
}

testConnection('vyapar_user');

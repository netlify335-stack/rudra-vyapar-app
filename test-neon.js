const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_grD4MudmbYla@ep-cool-salad-aqeojb8k-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
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

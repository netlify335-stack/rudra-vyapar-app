require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function generateKey() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();

  const licenseKey = "RUDRA-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  await client.query(`
    INSERT INTO licenses (id, key, name, is_revoked, is_paused, max_devices, valid_months, created_at, expires_at) 
    VALUES (gen_random_uuid(), $1, 'Super Admin Test', false, false, 5, 12, now(), now() + interval '1 year')
  `, [licenseKey]);
  
  console.log("SUCCESS_KEY:", licenseKey);
  
  await client.end();
}

generateKey().catch(console.error);

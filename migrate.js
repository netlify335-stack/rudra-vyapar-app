const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await pool.query(`
      ALTER TABLE licenses DROP COLUMN IF EXISTS device_id;
      ALTER TABLE licenses ADD COLUMN IF NOT EXISTS device_ids jsonb DEFAULT '[]' NOT NULL;
      ALTER TABLE licenses ADD COLUMN IF NOT EXISTS max_devices integer DEFAULT 1 NOT NULL;
      ALTER TABLE licenses ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false NOT NULL;
    `);
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}
main();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const pwd = "Vyapar_Demo_123%21%40%23";
const urlsToTest = [
  // Port 6543 Transaction pooler
  `postgresql://postgres.dowlvvmlqsxlzrnccrvu:${pwd}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  `postgresql://dowlvvmlqsxlzrnccrvu.postgres:${pwd}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${pwd}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  // Port 5432 Session pooler
  `postgresql://postgres.dowlvvmlqsxlzrnccrvu:${pwd}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  `postgresql://dowlvvmlqsxlzrnccrvu.postgres:${pwd}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres:${pwd}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`
];

async function run() {
  for (const url of urlsToTest) {
    console.log(`\nTesting URL: ${url}`);
    const client = postgres(url, { prepare: false, connect_timeout: 3 });
    try {
      await client`select 1`;
      console.log("Success with URL!");
      return;
    } catch (e: any) {
      console.log("Failed:", e.message);
    } finally {
      await client.end();
    }
  }
}
run();

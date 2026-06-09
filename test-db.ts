import { db } from "./src/db/index";
import { users } from "./src/db/neonSchema";

async function main() {
  const result = await db.select().from(users);
  console.log("Users:", result);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });

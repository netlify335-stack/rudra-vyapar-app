const postgres = require('postgres');
const sql = postgres('postgresql://neondb_owner:npg_grD4MudmbYla@ep-cool-salad-aqeojb8k-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require');
sql`select 1`.then(() => { console.log('OK'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });

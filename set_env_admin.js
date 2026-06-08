const { execSync } = require('child_process');

function setEnv(cwd) {
  console.log(`Setting env in ${cwd}`);
  try {
    execSync(`npx.cmd vercel env rm DATABASE_URL production -y`, { cwd, stdio: 'inherit' });
  } catch (e) { console.log('rm failed'); }
  
  execSync(`npx.cmd vercel env add DATABASE_URL production --value "postgresql://neondb_owner:npg_grD4MudmbY1a@ep-cool-salad-aqeojb6k-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require"`, { cwd, stdio: 'inherit' });
  console.log('Done');
}

setEnv('D:\\rudra-admin');

const { spawn } = require('child_process');

console.log('Starting vercel env add...');
const p = spawn('cmd.exe', ['/c', 'npx.cmd vercel env add DATABASE_URL production'], { cwd: __dirname });

p.stdout.on('data', (d) => {
  const output = d.toString();
  console.log(output);
  if (output.toLowerCase().includes('what’s the value') || output.toLowerCase().includes('value')) {
    console.log('Prompt detected, sending value...');
    p.stdin.write('postgresql://vyapar_user:Vyapar_Demo_123%21%40%23@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true\n');
    p.stdin.end();
  }
});

p.stderr.on('data', (d) => {
  console.log('stderr:', d.toString());
});

p.on('close', (code) => {
  console.log('Process exited with code:', code);
});

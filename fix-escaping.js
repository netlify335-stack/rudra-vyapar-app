const fs = require('fs');
const path = require('path');

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixFiles(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      // Replace literal \` with `
      content = content.replace(/\\`/g, '`');
      // Replace literal \$ with $
      content = content.replace(/\\\$/g, '$');
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed:', fullPath);
      }
    }
  }
}

fixFiles('C:/Users/Acer/.gemini/antigravity/scratch/rudra-vyapar-app-degit/src/app/dashboard');
console.log('Done');

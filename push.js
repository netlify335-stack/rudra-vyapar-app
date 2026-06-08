const { spawn } = require('child_process');
const fs = require('fs');

const payload = JSON.parse(fs.readFileSync('payload.json', 'utf8'));

const rpcRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "push_files",
    arguments: payload
  }
};

const serverPath = 'C:\\Users\\Acer\\.gemini\\config\\plugins\\github-mcp-server\\build\\index.js'; // Adjust path if needed
// Actually let's try the path from dir output earlier: C:\Users\Acer\.gemini\antigravity\mcp\github-mcp-server\build\index.js (wait, the dir output showed JSON files directly in the root)
// If there's no build folder, it might be an npx command. Let's just use the server configured in mcp_config.json if possible. 

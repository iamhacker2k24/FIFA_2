const fs = require('fs');

const code = fs.readFileSync('scripts/readable_player_logic.js', 'utf8');

// Find all function or async function declarations
const regex = /(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
let match;
while ((match = regex.exec(code)) !== null) {
  const name = match[1];
  const params = match[2];
  const start = match.index;
  // find matching closing brace or next 1500 chars
  console.log(`\n================ FUNCTION: ${name}(${params}) ================`);
  console.log(code.substring(start, start + 1200));
}

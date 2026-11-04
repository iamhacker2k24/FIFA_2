const fs = require('fs');

const html = fs.readFileSync('scripts/user_html.html', 'utf8');

// Find all <script> blocks
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let i = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  i++;
  const scriptContent = match[1];
  console.log(`\n=== Script Block ${i} (length: ${scriptContent.length}) ===`);
  console.log(scriptContent.slice(0, 300));
  fs.writeFileSync(`scripts/extracted_script_${i}.js`, scriptContent, 'utf8');
}

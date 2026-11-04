const fs = require('fs');

const html = fs.readFileSync('scripts/aioplayer_162.html', 'utf8');

// Find script tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let i = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  i++;
  console.log(`\n=== Script ${i} ===`);
  console.log(match[1].slice(0, 500));
}

// Also check external scripts
const srcRegex = /<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
while ((match = srcRegex.exec(html)) !== null) {
  console.log('External script:', match[1]);
}

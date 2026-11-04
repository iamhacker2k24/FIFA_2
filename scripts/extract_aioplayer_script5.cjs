const fs = require('fs');

const html = fs.readFileSync('scripts/aioplayer_162.html', 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let i = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  i++;
  if (i === 5) {
    fs.writeFileSync('scripts/aioplayer_script5.js', match[1], 'utf8');
    console.log('Saved script 5, length:', match[1].length);
    break;
  }
}

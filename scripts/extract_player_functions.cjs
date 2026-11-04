const fs = require('fs');

const code = fs.readFileSync('scripts/deobfuscated_logic.js', 'utf8');

// Find function definitions
const regex = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{([\s\S]*?)(?=\nfunction|\nasync function|\nlet|\nconst|\nvar|$)/g;

let match;
while ((match = regex.exec(code)) !== null) {
  const name = match[1];
  const params = match[2];
  const body = match[3];
  if (body.includes('fetch') || body.includes('videoPlayer') || body.includes('src') || body.includes('drm')) {
    console.log(`\n================ FUNCTION ${name}(${params}) ================`);
    console.log(body.slice(0, 1500));
  }
}

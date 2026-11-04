const fs = require('fs');

const fullPath = 'C:/Users/mrdeb/.gemini/antigravity/brain/3c49e543-3801-4800-bfd2-6c714c82cd1e/.system_generated/logs/transcript_full.jsonl';
const file = fs.readFileSync(fullPath, 'utf8');
const lines = file.split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i].trim()) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.source === 'USER_EXPLICIT' && obj.content && obj.content.includes('<!DOCTYPE html>')) {
      console.log('Found user prompt in line', i, 'step_index', obj.step_index);
      fs.writeFileSync('scripts/user_html.html', obj.content, 'utf8');
      console.log('Saved to scripts/user_html.html (length:', obj.content.length, ')');
      break;
    }
  } catch (e) {}
}

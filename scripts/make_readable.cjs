const fs = require('fs');

const popfb = JSON.parse(fs.readFileSync('scripts/popfb_all.json', 'utf8'));
const scriptContent = fs.readFileSync('scripts/extracted_script_13.js', 'utf8');

// Find after channelList
const idx = scriptContent.indexOf('];');
const code = scriptContent.substring(idx + 2);

// Replace all pOPfb calls
let readable = code;

// First replace method name calls like pOPfb[pOPfb.method(n)]()
// Note in popfb_all.json:
// pOPfb.AYKJ = () => 0
// pOPfb.cwNJ = () => 1
// pOPfb.wTFJ = () => 2
// pOPfb.YqIJ = () => 3

// Replace pOPfb.<func>(<num>)
readable = readable.replace(/pOPfb\.([a-zA-Z0-9_]+)\((\d+)\)/g, (m, f, n) => {
  const num = parseInt(n);
  if (popfb[f] && popfb[f][num] !== undefined) {
    return JSON.stringify(popfb[f][num]);
  }
  return m;
});

// Replace pOPfb[pOPfb.<func>(<num>)]
readable = readable.replace(/pOPfb\[pOPfb\.([a-zA-Z0-9_]+)\((\d+)\)\]/g, (m, f, n) => {
  const num = parseInt(n);
  if (popfb[f] && popfb[f][num] !== undefined) {
    const val = popfb[f][num];
    return `[${JSON.stringify(val)}]`;
  }
  return m;
});

fs.writeFileSync('scripts/readable_player_logic.js', readable, 'utf8');
console.log('Saved readable logic! Length:', readable.length);

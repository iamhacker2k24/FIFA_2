const fs = require('fs');

const popfb = JSON.parse(fs.readFileSync('scripts/popfb_all.json', 'utf8'));
let code = fs.readFileSync('scripts/extracted_script_13.js', 'utf8');

// Replace pOPfb[func](index) or pOPfb.func(index)
// Example: pOPfb.pGHdb(24) or pOPfb[pOPfb.djkbb(1)](24)
// Let's do regex replacements:
// Pattern: pOPfb\s*\[?\s*['"]?([a-zA-Z0-9_]+)['"]?\s*\]?\s*\(\s*([0-9]+)\s*\)

code = code.replace(/pOPfb(?:\.([a-zA-Z0-9_]+)|\[['"]([a-zA-Z0-9_]+)['"]\])\((\d+)\)/g, (match, f1, f2, idx) => {
  const func = f1 || f2;
  const i = parseInt(idx);
  if (popfb[func] && popfb[func][i] !== undefined) {
    return JSON.stringify(popfb[func][i]);
  }
  return match;
});

// Also replace pOPfb[pOPfb.func(i)]()
code = code.replace(/pOPfb\["([^"]+)"\]\(\)/g, (match, f) => {
  return `/* ${f}() */`;
});

fs.writeFileSync('scripts/deobfuscated_logic.js', code, 'utf8');
console.log('Saved deobfuscated code to scripts/deobfuscated_logic.js');

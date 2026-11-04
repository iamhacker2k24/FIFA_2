const fs = require('fs');

const content = fs.readFileSync('scripts/extracted_script_13.js', 'utf8');

// Find the IIFE:
const iifeStart = content.indexOf('let pOPfb;!function()');
const iifeEnd = content.indexOf('document[pOPfb.Zdfbb(92)]');

// In that IIFE, replace:
// "let nt6n=eval(T5do);return nt6n.apply(null,QS9C);"
// with:
// "fs.writeFileSync('scripts/decrypted_player_script.js', T5do, 'utf8'); console.log('WROTE T5do! Length:', T5do.length); let nt6n=eval(T5do); return nt6n.apply(null, QS9C);"

const patched = content.replace(
  'let nt6n=eval(T5do);return nt6n.apply(null,QS9C);',
  `const fs=require('fs'); fs.writeFileSync('scripts/decrypted_player_script.js', T5do, 'utf8'); console.log('WROTE T5do! Length:', T5do.length); let nt6n=eval(T5do); return nt6n.apply(null,QS9C);`
);

// Wait! Remember LV3n(Ii4v.toString()) hashes Ii4v.toString()!
// If we change inside Ii4v, LV3n will produce a different hash!
// How does LV3n work?
// LV3n(fjWn) takes fjWn which is Ii4v.toString()!
// So we must NOT change Ii4v itself.
// But we CAN intercept eval or call vDgo(rybo, LV3n(Ii4v.toString())) directly!

console.log('Let us run LV3n and vDgo outside!');

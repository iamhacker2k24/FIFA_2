const fs = require('fs');

const code = fs.readFileSync('scripts/aioplayer_script5.js', 'utf8');

// In javascript-obfuscator, there is a string array function and a lookup function.
// Let's find the string array function:
// Typically `function a0_0x3b5f() { ... return [ ... ]; }`
// and `function a0_0x45a0(_0x1adc95, _0x46992c) { ... }`

// Let's run the string table definition and decode all strings!
const tableEnd = code.indexOf('(function(_0x');
console.log('tableEnd:', tableEnd);

// Let's write a small harness to eval the decoder and replace all calls:
const harness = `
let decodedMap = {};
${code.slice(0, 3000)}

// Now let's test calling a0_0x45a0
console.log('Testing decoder:');
for (let i = 0x1b2; i < 0x250; i++) {
  try {
    const s = a0_0x45a0(i);
    decodedMap[i] = s;
  } catch (e) {}
}
console.log('Decoded strings:', decodedMap);
`;

fs.writeFileSync('scripts/test_decoder.cjs', harness, 'utf8');
console.log('Created test_decoder.cjs');

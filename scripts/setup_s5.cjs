const fs = require('fs');

const code = fs.readFileSync('scripts/aioplayer_script5.js', 'utf8');

// Isolate a0_0x3b5f and a0_0x45a0
const fn1 = code.indexOf('function a0_0x45a0');
const fn1End = code.indexOf('const a0_0x3c1b50=a0_0x45a0;');
const fn2 = code.indexOf('function a0_0x3b5f()');
const fn2End = code.indexOf('a0_0x1953b9();');

const harness = `
${code.substring(fn1, fn1End)}
${code.substring(fn2, fn2End)}

const decoded = {};
for (let i = 0x1b0; i <= 0x260; i++) {
  try {
    decoded[i] = a0_0x45a0(i);
  } catch(e) {}
}
const fs = require('fs');
fs.writeFileSync('scripts/script5_decoded.json', JSON.stringify(decoded, null, 2));
console.log('Successfully decoded', Object.keys(decoded).length, 'strings!');
`;

fs.writeFileSync('scripts/run_script5_decoder.cjs', harness, 'utf8');
console.log('Created run_script5_decoder.cjs');

const fs = require('fs');

const content = fs.readFileSync('scripts/extracted_script_13.js', 'utf8');

// Intercept eval before the script runs!
const wrapper = `
const fs = require('fs');
const originalEval = eval;
let captured = false;

// Mock DOM
global.window = {
  location: { search: '?id=1106', origin: 'https://i.mdtv.dpdns.org', pathname: '/sports.html', href: 'https://i.mdtv.dpdns.org/sports.html?id=1106' },
  addEventListener: () => {},
  fetch: async () => ({ json: async () => ({}) })
};
global.document = {
  getElementById: () => ({ src: '', classList: { add: ()=>{}, remove: ()=>{} }, style: {} }),
  createElement: () => ({ classList: { add: ()=>{}, remove: ()=>{} }, style: {} }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.navigator = { userAgent: 'Mozilla/5.0' };
global.location = global.window.location;
global.fetch = global.window.fetch;

eval = function(str) {
  if (typeof str === 'string' && str.length > 500 && !captured) {
    captured = true;
    fs.writeFileSync('scripts/decrypted_player_script.js', str, 'utf8');
    console.log('CAPTURED T5do! Length:', str.length);
  }
  return originalEval(str);
};

` + content;

fs.writeFileSync('scripts/run_capture.cjs', wrapper, 'utf8');
console.log('Saved run_capture.cjs');

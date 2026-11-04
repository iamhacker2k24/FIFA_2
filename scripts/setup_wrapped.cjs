const fs = require('fs');

const scriptContent = fs.readFileSync('scripts/extracted_script_13.js', 'utf8');

const prefix = `
const fs = require('fs');
const mockElem = {
  src: '',
  classList: { add: () => {}, remove: () => {} },
  appendChild: () => {},
  addEventListener: () => {},
  style: {},
  querySelector: () => ({ classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => []
};

global.window = {
  location: {
    search: '?id=1106',
    origin: 'https://i.mdtv.dpdns.org',
    pathname: '/sports.html',
    href: 'https://i.mdtv.dpdns.org/sports.html?id=1106',
    hostname: 'i.mdtv.dpdns.org',
    protocol: 'https:'
  },
  addEventListener: () => {},
  fetch: async (url, opts) => {
    console.log('[MOCK FETCH]', url, opts);
    return {
      json: async () => ({})
    };
  }
};
global.document = {
  getElementById: (id) => {
    console.log('[MOCK getElementById]', id);
    return mockElem;
  },
  createElement: (tag) => mockElem,
  querySelectorAll: () => [],
  addEventListener: (event, handler) => {
    console.log('[MOCK addEventListener]', event);
  }
};
global.navigator = {
  userAgent: 'Mozilla/5.0',
  clipboard: {
    writeText: async (t) => console.log('[CLIPBOARD]', t)
  }
};
global.location = global.window.location;
global.fetch = global.window.fetch;
global.alert = (msg) => console.log('[ALERT]', msg);
`;

const postfix = `
\n\n
console.log('After execution, pOPfb is:', typeof pOPfb);
if (typeof pOPfb !== 'undefined') {
  const methods = ['pGHdb', 'FYudb', 'hopbb', 'djkbb', 'Zdfbb', 'N0wbb', 'dlRbb', 'BNObb'];
  const allDict = {};
  for (let key of methods) {
    if (typeof pOPfb[key] === 'function') {
      allDict[key] = {};
      for (let i = 0; i < 150; i++) {
        try {
          const val = pOPfb[key](i);
          if (val !== undefined) {
            allDict[key][i] = val;
          }
        } catch(e) {}
      }
    }
  }
  fs.writeFileSync('scripts/popfb_all.json', JSON.stringify(allDict, null, 2));
  console.log('SUCCESS! Wrote scripts/popfb_all.json');
}
`;

fs.writeFileSync('scripts/wrapped_run.cjs', prefix + scriptContent + postfix, 'utf8');
console.log('Created wrapped_run.cjs with mock prefix!');

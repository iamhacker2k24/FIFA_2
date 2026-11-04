const fs = require('fs');
const html = fs.readFileSync('scripts/aioplayer_sample.html', 'utf8');
// Find what API_URL decodes to by checking test_token or evaluating the string array
console.log('Searching for API_URL in string table...');


const fs = require('fs');

const content = fs.readFileSync('scripts/extracted_script_13.js', 'utf8');
const channelListIndex = content.indexOf('const channelList =');
const afterChannelList = content.indexOf('];', channelListIndex);

const remaining = content.slice(afterChannelList + 2);

console.log('Length of remaining:', remaining.length);
// Find where the IIFE ends and what comes after
// Let's print the last 2000 characters of remaining
console.log('End of script:');
console.log(remaining.slice(-2000));

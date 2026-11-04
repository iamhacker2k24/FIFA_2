const fs = require('fs');

const content = fs.readFileSync('scripts/extracted_script_13.js', 'utf8');

// Let's find where channelList ends and the logic begins
const channelListIndex = content.indexOf('const channelList =');
const afterChannelList = content.indexOf('];', channelListIndex);

console.log('After channelList:');
console.log(content.slice(afterChannelList, afterChannelList + 2000));

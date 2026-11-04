const fs = require('fs');
const sports = JSON.parse(fs.readFileSync('server/data/sports.json', 'utf8'));
console.log('Total sports channels in server/data/sports.json:', sports.length);
sports.forEach((s, idx) => {
  console.log(`[${idx}] id: ${s.id}, title: ${s.title}, streamUrl: ${s.streamUrl}`);
});

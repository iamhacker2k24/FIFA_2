const fs = require('fs');

async function save() {
  const url = 'https://i.mdtv.dpdns.org/aioplayer?id=162';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const text = await res.text();
  fs.writeFileSync('scripts/aioplayer_162.html', text, 'utf8');
  console.log('Saved scripts/aioplayer_162.html (length:', text.length, ')');
}
save();

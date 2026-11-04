const fs = require('fs');

async function test() {
  const data = await fetch('https://sonujson-v5.pages.dev/Data/sports.json').then(r => r.json());
  const chs = Array.isArray(data) ? data : data.channels;
  const e1hd = chs.find(c => c.id === 'E1HD');
  const sep = e1hd.stream_url.includes('?') ? '&' : '?';
  const manifestUrl = e1hd.stream_url + sep + e1hd.cookie;
  const resp = await fetch(manifestUrl);
  const text = await resp.text();
  console.log(text.substring(0, 1500));
}

test().catch(e => console.error(e));

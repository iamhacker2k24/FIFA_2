const fs = require('fs');

async function test() {
  const data = await fetch('https://sonujson-v5.pages.dev/Data/sports.json').then(r => r.json());
  const chs = Array.isArray(data) ? data : data.channels;
  const e1hd = chs.find(c => c.id === 'E1HD');
  
  // Test segment fetch via node with Cookie header
  const manifestBase = e1hd.stream_url.substring(0, e1hd.stream_url.lastIndexOf('/') + 1);
  const segUrl = manifestBase + 'dash/Star_Sports_HD1_BTS-audio_98834_eng=98800.dash';
  console.log('Fetching segment via node with Cookie header...');
  const res = await fetch(segUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Cookie': e1hd.cookie
    }
  });
  console.log('Status:', res.status, 'Content-Length:', res.headers.get('content-length'), 'Content-Type:', res.headers.get('content-type'));
}

test().catch(e => console.error(e));

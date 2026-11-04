const fs = require('fs');

async function test() {
  const data = await fetch('https://sonujson-v5.pages.dev/Data/sports.json').then(r => r.json());
  const chs = Array.isArray(data) ? data : data.channels;
  const e1hd = chs.find(c => c.id === 'E1HD');
  console.log('cookie string:', e1hd.cookie ? e1hd.cookie.substring(0, 40) + '...' : 'none');
  const sep = e1hd.stream_url.includes('?') ? '&' : '?';
  const manifestUrl = e1hd.stream_url + sep + e1hd.cookie;
  const resp = await fetch(manifestUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  console.log('Manifest status:', resp.status);
  const text = await resp.text();
  const repMatches = [...text.matchAll(/<Representation[^>]+id="([^"]+)"/g)].map(m => m[1]);
  const initMatch = text.match(/initialization="([^"]+)"/);
  const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);
  const realId = repMatches[0];
  const rawFilename = initMatch[1].replace('$RepresentationID$', realId);
  
  // Try 1: with User-Agent & Referer
  const initUrl = baseUrl + rawFilename + (rawFilename.includes('?') ? '&' : '?') + e1hd.cookie;
  const r1 = await fetch(initUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://i.mdtv.dpdns.org/',
      'Origin': 'https://i.mdtv.dpdns.org'
    }
  });
  console.log('Try 1 (with headers) status:', r1.status, 'size:', r1.headers.get('content-length'));

  // Try 2: with Cookie header instead of query param
  const initUrlNoQuery = baseUrl + rawFilename;
  const r2 = await fetch(initUrlNoQuery, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Cookie': e1hd.cookie
    }
  });
  console.log('Try 2 (with Cookie header) status:', r2.status, 'size:', r2.headers.get('content-length'));
}

test().catch(e => console.error(e));

async function testJio() {
  const res = await fetch('https://sonujson-v5.pages.dev/Data/sports.json');
  const data = await res.json();
  const channels = Array.isArray(data) ? data : data.channels || [];
  const ch = channels.find(x => x.id === 'E1HD');
  console.log('Found channel:', ch.name);
  console.log('Stream URL:', ch.stream_url);
  console.log('Cookie:', ch.cookie);
  console.log('Keys:', ch.sonuxs);

  const manifestUrl = ch.stream_url + '?' + ch.cookie;
  const mRes = await fetch(manifestUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log('Manifest status:', mRes.status, mRes.statusText);
  const text = await mRes.text();
  console.log('Manifest length:', text.length);
  console.log('Manifest preview:\n', text.slice(0, 300));
}
testJio();

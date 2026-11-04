async function listAll() {
  const res = await fetch('https://sonujson-v5.pages.dev/Data/sports.json');
  const list = await res.json();
  const channels = Array.isArray(list) ? list : list.channels || [];
  console.log('Channels count:', channels.length);
  channels.forEach((ch, idx) => {
    console.log(`[${idx}] id: "${ch.id}", name: "${ch.name}", stream: "${ch.stream_url ? ch.stream_url.slice(0, 50) + '...' : 'none'}"`);
  });
}
listAll();

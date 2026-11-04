async function inspect() {
  const res = await fetch('https://sonujson-v5.pages.dev/Data/sports.json');
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.channels || [];
  console.log('Total channels in sonujson:', list.length);
  console.log('Sample channel item:', list[0]);
  console.log('Keys of first 10 items:');
  for (let i = 0; i < Math.min(10, list.length); i++) {
    console.log(`[${i}] id: "${list[i].id}", name: "${list[i].name}", channel_id: "${list[i].channel_id}"`);
  }
}
inspect();

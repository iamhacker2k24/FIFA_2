async function check() {
  const res = await fetch('https://sportlink-tv10.pages.dev/jtvplus.json');
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.channels || [];
  console.log('Total channels in jtvplus:', list.length);
  console.log('Sample channel item from jtvplus:');
  console.log(list[0]);
}
check();

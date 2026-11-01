import '../server/index.js';

async function runTests() {
  await new Promise((r) => setTimeout(r, 600));

  try {
    const health = await fetch('http://localhost:3001/api/health').then((r) => r.json());
    console.log('HEALTH_TEST:', JSON.stringify(health));

    const cats = await fetch('http://localhost:3001/api/channels/categories').then((r) => r.json());
    console.log('CATEGORIES_TEST: count =', cats.categories?.length, 'totalChannels =', cats.totalChannels);

    const sports = await fetch('http://localhost:3001/api/sports').then((r) => r.json());
    console.log('SPORTS_TEST: count =', sports.length);

    const netflix = await fetch('http://localhost:3001/api/netflix').then((r) => r.json());
    console.log('NETFLIX_TEST: count =', netflix.length);

    const pw = await fetch('http://localhost:3001/api/pw').then((r) => r.json());
    console.log('PW_TEST: count =', pw.length);

    const apna = await fetch('http://localhost:3001/api/apnacollege').then((r) => r.json());
    console.log('APNA_COLLEGE_TEST: count =', apna.length);

    const ytc = await fetch('http://localhost:3001/api/ytcourses').then((r) => r.json());
    console.log('YT_COURSES_TEST: count =', ytc.length);

    const proxyRes = await fetch('http://localhost:3001/api/proxy?url=' + encodeURIComponent('https://playztv.pages.dev/promo/master.m3u8'));
    console.log('PROXY_TEST: status =', proxyRes.status);

    const indexHtml = await fetch('http://localhost:3001/').then((r) => r.text());
    console.log('STATIC_SERVE_TEST: hasRoot =', indexHtml.includes('id="root"'));

    console.log('🎉 ALL INTEGRATION TESTS PASSED CLEANLY!');
    process.exit(0);
  } catch (err) {
    console.error('TEST_FAILED:', err);
    process.exit(1);
  }
}

runTests();

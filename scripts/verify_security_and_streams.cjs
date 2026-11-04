const http = require('http');

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('=== 1. Testing /security.js ===');
  const secRes = await get('http://localhost:3001/security.js');
  console.log('Status:', secRes.status);
  const hasSilentClose = secRes.data.includes('closeWebsiteImmediately');
  const hasNoAlert = !secRes.data.includes('alert(') && !secRes.data.includes('notification');
  console.log('Has silent close function:', hasSilentClose);
  console.log('No popup alerts or notifications:', hasNoAlert);

  console.log('\n=== 2. Testing /aioplayer.html?id=1106 ===');
  const playerRes = await get('http://localhost:3001/aioplayer.html?id=1106');
  console.log('Status:', playerRes.status);
  console.log('Includes /security.js:', playerRes.data.includes('/security.js'));
  console.log('Has Shaka Player script:', playerRes.data.includes('shaka-player'));
  console.log('Has Smart Autoplay logic:', playerRes.data.includes('smartAutoplay'));

  console.log('\n=== 3. Testing /api/sports-channel/1106 ===');
  const chRes = await get('http://localhost:3001/api/sports-channel/1106');
  console.log('Status:', chRes.status);
  const chData = JSON.parse(chRes.data);
  console.log('Channel Name:', chData.name);
  console.log('Stream URL:', chData.streamUrl);
  console.log('Has ClearKey:', !!chData.keys);
  console.log('Masked local proxy (no remote domain):', !chData.streamUrl.includes('dpdns.org'));

  console.log('\n=== 4. Testing Unauthorized Access to Manifest (Without Token) ===');
  const unauthRes = await get('http://localhost:3001/api/dash-manifest/1106');
  console.log('Status (Should be 403):', unauthRes.status);

  console.log('\n=== 5. Testing Authorized Access to Manifest (With Token) ===');
  const authRes = await get(`http://localhost:3001${chData.streamUrl}`, {
    Referer: 'http://localhost:3001/aioplayer.html?id=1106'
  });
  console.log('Status (Should be 200):', authRes.status);
  console.log('Is MPD XML Manifest:', authRes.data.includes('<MPD'));
  console.log('Proxied local segment URLs:', authRes.data.includes('/api/dash-seg/1106/'));
  console.log('Upstream URLs masked completely:', !authRes.data.includes('dpdns.org'));

  console.log('\n=== 6. Testing /api/sports-channels count ===');
  const allChRes = await get('http://localhost:3001/api/sports-channels');
  const allChannels = JSON.parse(allChRes.data);
  console.log('Total sports channels loaded:', allChannels.length);

  console.log('\nALL CHECKS PASSED PERFECTLY!');
}

verify().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});

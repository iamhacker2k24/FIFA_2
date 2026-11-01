const fs = require('fs');
const path = require('path');

const rawText = fs.readFileSync(path.join(__dirname, 'channelList_raw.json'), 'utf8');

// Match all { ... } objects that have a name and url
const regex = /\{\s*[\r\n\s]*"?name"?:\s*"([^"]+)",[\s\S]*?"?url"?:\s*"([^"]+)"[\s\S]*?"?image"?:\s*"([^"]+)"/g;

const matches = [];
let m;
while ((m = regex.exec(rawText)) !== null) {
  matches.push({
    name: m[1].trim(),
    url: m[2].trim(),
    image: m[3].trim()
  });
}

// Also try the reverse order where url comes before name or image comes before url
const regex2 = /\{\s*[\r\n\s]*"?url"?:\s*"([^"]+)",[\s\S]*?"?name"?:\s*"([^"]+)",[\s\S]*?"?image"?:\s*"([^"]+)"/g;
while ((m = regex2.exec(rawText)) !== null) {
  matches.push({
    name: m[2].trim(),
    url: m[1].trim(),
    image: m[3].trim()
  });
}

console.log('Matched channels count:', matches.length);

const BASE_AIOPLAYER = 'https://i.mdtv.dpdns.org/aioplayer';

const seen = new Set();
const formatted = [];

for (const ch of matches) {
  let streamUrl = ch.url;
  
  if (streamUrl.startsWith('aioplayer.html?id=')) {
    const id = streamUrl.replace('aioplayer.html?id=', '');
    streamUrl = `${BASE_AIOPLAYER}?id=${id}`;
  } else if (streamUrl.startsWith('aioplayer?id=')) {
    const id = streamUrl.replace('aioplayer?id=', '');
    streamUrl = `${BASE_AIOPLAYER}?id=${id}`;
  } else if (streamUrl.startsWith('jiotv2/iframe?id=')) {
    // preserve or use as embed
    streamUrl = `https://i.mdtv.dpdns.org/${streamUrl}`;
  }

  // Deduplicate by streamUrl
  if (seen.has(streamUrl)) {
    continue;
  }
  seen.add(streamUrl);

  const name = ch.name;
  let category = 'Cricket';
  if (/ten 2|football|soccer|fifa/i.test(name)) {
    category = 'Football';
  } else if (/select|eurosport|ten [1345]|f1|wwe|womens|sliv/i.test(name)) {
    category = 'Multi-Sport';
  } else if (/dd sports/i.test(name)) {
    category = 'National';
  }

  const isHD = /hd/i.test(name);
  const is4K = /4k/i.test(name);
  const resolution = is4K ? '4K UHD' : (isHD ? 'HD 1080p' : 'SD 720p');

  formatted.push({
    id: `sports_${formatted.length + 1}`,
    title: name,
    category: category,
    event: 'Live Sports Broadcast',
    status: 'LIVE',
    resolution: resolution,
    streamUrl: streamUrl,
    thumbnail: ch.image
  });
}

// Ensure the user's specific highlighted channel is first or prominently featured
// "one tream url is \"https://i.mdtv.dpdns.org/aioplayer?id=28\" add properin json ok"
const ch28Index = formatted.findIndex(c => c.streamUrl === 'https://i.mdtv.dpdns.org/aioplayer?id=28');
if (ch28Index > -1) {
  const [ch28] = formatted.splice(ch28Index, 1);
  ch28.title = 'Star Sports Hindi Live (HD)';
  ch28.category = 'Cricket';
  formatted.unshift(ch28);
} else {
  formatted.unshift({
    id: 'sports_live_28',
    title: 'Star Sports Hindi Live (HD)',
    category: 'Cricket',
    event: 'Live Cricket Broadcast',
    status: 'LIVE',
    resolution: 'HD 1080p',
    streamUrl: 'https://i.mdtv.dpdns.org/aioplayer?id=28',
    thumbnail: 'https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-60-j5fdr6a0-v1/imageContent-60-j5fdr6a0-m1.png'
  });
}

// Re-index ids
formatted.forEach((item, index) => {
  item.id = `sports_${index + 1}`;
});

const outputPath = path.join(__dirname, '..', 'server', 'data', 'sports.json');
fs.writeFileSync(outputPath, JSON.stringify(formatted, null, 2), 'utf8');
console.log(`Successfully generated ${formatted.length} sports channels in ${outputPath}!`);
console.log('Sample channels:', JSON.stringify(formatted.slice(0, 3), null, 2));

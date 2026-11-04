import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

const router = Router();

// Stream Secret for Signed URLs & Anti-Hotlinking
const STREAM_SECRET = process.env.STREAM_SECRET || 'devstream_secret_stream_token_2026';

// Generates an HMAC signed token valid for 30 minutes
function generateStreamToken(channelId) {
  const expires = Date.now() + 30 * 60 * 1000;
  const payload = `${channelId}:${expires}`;
  const sig = crypto.createHmac('sha256', STREAM_SECRET).update(payload).digest('hex').substring(0, 32);
  return Buffer.from(`${channelId}.${expires}.${sig}`).toString('base64url');
}

// Verifies the HMAC signed token
function verifyStreamToken(token, expectedId) {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const [cId, expStr, sig] = raw.split('.');
    if (!cId || !expStr || !sig) return false;
    if (expectedId && String(cId).toLowerCase() !== String(expectedId).toLowerCase()) return false;
    if (Date.now() > parseInt(expStr, 10)) return false;
    const expectedSig = crypto.createHmac('sha256', STREAM_SECRET).update(`${cId}:${expStr}`).digest('hex').substring(0, 32);
    return sig === expectedSig;
  } catch {
    return false;
  }
}

// Anti-scraping and anti-hotlinking access verification
function checkStreamAccess(req, channelId) {
  const referer = req.headers['referer'] || '';
  const origin = req.headers['origin'] || '';
  const host = req.headers['host'] || '';

  // 1. Valid signed token
  if (req.query.st && verifyStreamToken(req.query.st, channelId)) {
    return true;
  }

  // 2. Verified same host or local referer
  if (referer && (referer.includes(host) || referer.includes('localhost') || referer.includes('127.0.0.1'))) {
    return true;
  }
  if (origin && (origin.includes(host) || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return true;
  }

  // Reject unauthorized third-party hotlinking or raw scrapers
  return false;
}

// Helper to read JSON file
function readData(filename, fallback = []) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return fallback;
  }
}

// Helper to write JSON file
function writeData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Masks raw stream URLs before sending items to the client.
 * The client only receives local secure endpoints, keeping real stream URLs private.
 */
function maskItems(section, items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (section === 'sports') {
      const channelId =
        item.channelId ||
        (item.streamUrl && item.streamUrl.includes('id=')
          ? item.streamUrl.split('id=')[1].split('&')[0]
          : '') ||
        String(item.id).replace('sports_', '');
      return {
        ...item,
        streamUrl: `/aioplayer.html?id=${encodeURIComponent(channelId)}`,
        playerType: 'iframe',
      };
    }

    const rawUrl = item.streamUrl || item.videoUrl || item.url || '';
    if (!rawUrl) return item;

    // Direct YouTube embeds
    if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
      return {
        ...item,
        playerType: 'youtube',
      };
    }

    const clean = rawUrl.split('?')[0].toLowerCase();
    const isDirect =
      clean.endsWith('.m3u8') ||
      clean.endsWith('.mpd') ||
      clean.endsWith('.mp4') ||
      rawUrl.includes('.m3u8') ||
      rawUrl.includes('.mpd');

    const masked = { ...item };
    delete masked.rawUrl;
    delete masked.url;

    let queryParam = '';
    try {
      const parsed = new URL(rawUrl);
      if (parsed.searchParams.get('id')) {
        queryParam = `?id=${encodeURIComponent(parsed.searchParams.get('id'))}`;
      }
    } catch {}

    if (item.streamUrl || item.url) {
      masked.streamUrl = `/api/stream/${section}/${item.id}${queryParam}`;
    }
    if (item.videoUrl) {
      masked.videoUrl = `/api/stream/${section}/${item.id}${queryParam}`;
    }
    masked.playerType = isDirect ? 'hls' : 'iframe';

    return masked;
  });
}

// ----------------- SPORTS CONFIG & SERVICES -----------------
const SPORTS_SLUG_MAP = {
  '162': 'STEN1', '891': 'STEN2', '892': 'STEN3', '1773': 'STENTU', '3514': 'STENT', '3585': 'STENK', '155': 'STEN5',
  '1106': 'E1HD', '1108': 'H1HD', '362': 'H1SD', '1142': 'E1SD', '3277': 'TL1HD', '1124': 'TL1SD', '3278': 'TU1HD',
  '1651': 'TU1SD', '1650': 'KA1SD', '1109': 'E2HD', '1984': 'H2HD', '1985': 'H2SD', '1141': 'E2SD', '3273': 'TL2HD',
  '2853': 'TL2SD', '3274': 'TU2HD', '2852': 'TU2SD', '1122': 'KA2SD', '1389': 'SS3', '460': 'ST1HD', '1123': 'ST1SD',
  '461': 'ST2HD', '1114': 'ST2SD', '1998': 'SSK',
  // Slugs aliases
  'sten1': 'STEN1', 'sten2': 'STEN2', 'sten3': 'STEN3', 'stentu': 'STENTU', 'stent': 'STENT', 'stenk': 'STENK', 'sten5': 'STEN5',
  'e1hd': 'E1HD', 'h1hd': 'H1HD', 'h1sd': 'H1SD', 'e1sd': 'E1SD', 'tl1hd': 'TL1HD', 'tl1sd': 'TL1SD', 'tu1hd': 'TU1HD',
  'tu1sd': 'TU1SD', 'ka1sd': 'KA1SD', 'e2hd': 'E2HD', 'h2hd': 'H2HD', 'h2sd': 'H2SD', 'e2sd': 'E2SD', 'tl2hd': 'TL2HD',
  'tl2sd': 'TL2SD', 'tu2hd': 'TU2HD', 'tu2sd': 'TU2SD', 'ka2sd': 'KA2SD', 'ss3': 'SS3', 'st1hd': 'ST1HD', 'st1sd': 'ST1SD',
  'st2hd': 'ST2HD', 'st2sd': 'ST2SD', 'ssk': 'SSK'
};

let cachedSportsData = null;
let cachedSportsDataTime = 0;

async function getUpstreamSportsChannels() {
  const now = Date.now();
  if (cachedSportsData && now - cachedSportsDataTime < 60000) {
    return Array.isArray(cachedSportsData) ? cachedSportsData : cachedSportsData.channels || [];
  }
  try {
    const upstream = await fetch('https://sonujson-v5.pages.dev/Data/sports.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (upstream.ok) {
      cachedSportsData = await upstream.json();
      cachedSportsDataTime = now;
      return Array.isArray(cachedSportsData) ? cachedSportsData : cachedSportsData.channels || [];
    }
  } catch (err) {
    console.warn('Failed to fetch upstream sports data:', err.message);
  }
  return cachedSportsData ? (Array.isArray(cachedSportsData) ? cachedSportsData : cachedSportsData.channels || []) : [];
}

async function resolveSportsChannel(idOrSlug) {
  const raw = String(idOrSlug || '').toLowerCase().trim();
  const slug = (SPORTS_SLUG_MAP[raw] || raw).toUpperCase();
  const channels = await getUpstreamSportsChannels();
  return channels.find(c => String(c.id).toUpperCase() === slug) || null;
}

// Metadata endpoint for the local player
router.get('/sports-channel/:id', async (req, res) => {
  const id = req.params.id;
  const channel = await resolveSportsChannel(id);

  if (!channel) {
    // Check if it's DD Sports (204) or Eurosport (875 / 1294) from local channels.json
    if (id === '204' || id === '875' || id === '1294') {
      const isDD = id === '204';
      const name = isDD ? 'DD Sports' : 'Eurosport';
      const allChannels = readData('channels.json');
      const found = allChannels.find(c => (c.name || '').toLowerCase().includes(name.toLowerCase()));
      if (found) {
        return res.json({
          id,
          title: found.name,
          logo: found.logo || '',
          type: 'hls',
          streamUrl: `/api/stream/tv/${found.id}`,
          clearKeys: {}
        });
      }
    }
    return res.status(404).json({ error: 'Sports channel not found' });
  }

  // Parse ClearKeys map
  const clearKeys = {};
  if (channel.key_id && channel.key && channel.key_id !== 'null' && channel.key !== 'null') {
    const kid = channel.key_id.trim().replace(/-/g, '').toLowerCase();
    const k = channel.key.trim().replace(/-/g, '').toLowerCase();
    clearKeys[kid] = k;
  }
  const sonuxs = Array.isArray(channel.sonuxs) ? channel.sonuxs : (channel.sonuxs ? [channel.sonuxs] : []);
  sonuxs.forEach(entry => {
    if (typeof entry === 'string' && entry.includes(':')) {
      const [kid, k] = entry.split(':');
      if (kid && k) {
        clearKeys[kid.trim().replace(/-/g, '').toLowerCase()] = k.trim().replace(/-/g, '').toLowerCase();
      }
    }
  });

  res.setHeader('Access-Control-Allow-Origin', '*');
  const streamToken = generateStreamToken(id);
  res.json({
    id,
    title: channel.name,
    logo: channel.logo || 'https://img.media.jio.com/tvpimages/76/32/301981_1749665662917_p.jpg',
    type: 'dash',
    manifestUrl: `/api/dash-manifest/${encodeURIComponent(id)}?st=${streamToken}`,
    clearKeys
  });
});

// Rewritten DASH manifest endpoint with anti-scraping & anti-hotlinking
router.get('/dash-manifest/:id', async (req, res) => {
  if (!checkStreamAccess(req, req.params.id)) {
    return res.status(403).json({ error: 'Protected stream resource. Direct unauthorized access denied.' });
  }

  const channel = await resolveSportsChannel(req.params.id);
  if (!channel || !channel.stream_url) {
    return res.status(404).json({ error: 'Stream manifest not available' });
  }

  try {
    const sep = channel.stream_url.includes('?') ? '&' : '?';
    const upstreamUrl = channel.cookie ? `${channel.stream_url}${sep}${channel.cookie}` : channel.stream_url;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream manifest unreachable' });
    }

    let text = await upstream.text();
    // Rewrite BaseURL to point through local segment proxy
    const segProxyBase = `/api/dash-seg/${encodeURIComponent(req.params.id)}/`;
    if (text.includes('<BaseURL>')) {
      text = text.replace(/<BaseURL>[^<]*<\/BaseURL>/gi, `<BaseURL>${segProxyBase}</BaseURL>`);
    } else {
      text = text.replace(/<Period([^>]*)>/i, `<Period$1>\n    <BaseURL>${segProxyBase}</BaseURL>`);
    }

    res.setHeader('Content-Type', 'application/dash+xml; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: 'Manifest proxy error' });
  }
});

// DASH segment streaming endpoint with Cookie authentication & anti-hotlinking
router.use('/dash-seg/:id', async (req, res) => {
  if (!checkStreamAccess(req, req.params.id)) {
    return res.status(403).end();
  }

  const channel = await resolveSportsChannel(req.params.id);
  if (!channel || !channel.stream_url) {
    return res.status(404).end();
  }

  // Extract relative segment path
  const relPath = (req.path || '').replace(/^\//, '');
  if (!relPath) return res.status(400).end();

  const manifestBase = channel.stream_url.substring(0, channel.stream_url.lastIndexOf('/') + 1);
  let targetSegUrl;
  if (relPath.startsWith('dash/')) {
    targetSegUrl = manifestBase + relPath;
  } else {
    targetSegUrl = manifestBase + 'dash/' + relPath;
  }

  try {
    const forwardHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };
    if (channel.cookie) {
      forwardHeaders['Cookie'] = channel.cookie;
    }
    if (req.headers.range) {
      forwardHeaders['Range'] = req.headers.range;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const upstream = await fetch(targetSegUrl, {
      headers: forwardHeaders,
      signal: controller.signal
    });
    clearTimeout(timeout);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');

    const ct = upstream.headers.get('content-type') || (relPath.endsWith('.dash') || relPath.endsWith('.m4s') ? 'video/mp4' : 'application/octet-stream');
    res.setHeader('Content-Type', ct);

    const cl = upstream.headers.get('content-length');
    if (cl) res.setHeader('Content-Length', cl);
    const cr = upstream.headers.get('content-range');
    if (cr) res.setHeader('Content-Range', cr);

    res.status(upstream.status);

    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.pipe(res);
      nodeStream.on('error', () => {
        if (!res.headersSent) res.status(502).end();
      });
    } else {
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) res.status(502).end();
  }
});

router.get('/sports-data', async (req, res) => {
  const data = await getUpstreamSportsChannels();
  res.json(data);
});

router.get('/sports', (req, res) => {
  const data = readData('sports.json');
  res.json(maskItems('sports', data));
});

router.post('/sports', (req, res) => {
  try {
    const item = req.body;
    if (!item.title || !item.streamUrl) {
      return res.status(400).json({ error: 'Title and streamUrl are required' });
    }
    const list = readData('sports.json');
    const newItem = {
      id: `sports_${Date.now()}`,
      channelId: item.channelId || String(Date.now()),
      title: item.title,
      name: item.title,
      category: item.category || 'General',
      event: item.event || '',
      status: item.status || 'LIVE',
      resolution: item.resolution || '1080p',
      streamUrl: item.streamUrl,
      thumbnail: item.thumbnail || '',
    };
    list.unshift(newItem);
    writeData('sports.json', list);
    res.json({ message: 'Sports stream added successfully', item: maskItems('sports', [newItem])[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add sports stream' });
  }
});

// ----------------- NETFLIX -----------------
router.get('/netflix', (req, res) => {
  const data = readData('netflix.json');
  res.json(maskItems('netflix', data));
});

router.post('/netflix', (req, res) => {
  try {
    const item = req.body;
    if (!item.title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const list = readData('netflix.json');
    const newItem = {
      id: `net_${Date.now()}`,
      title: item.title,
      category: item.category || 'General',
      year: item.year || '',
      rating: item.rating || '',
      duration: item.duration || '',
      thumbnail: item.thumbnail || '',
      videoUrl: item.videoUrl || '',
      description: item.description || '',
    };
    list.unshift(newItem);
    writeData('netflix.json', list);
    res.json({ message: 'Movie added successfully', item: maskItems('netflix', [newItem])[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add movie' });
  }
});

// ----------------- PHYSICS WALLAH (PW) -----------------
router.get('/pw', (req, res) => {
  const data = readData('pw.json');
  res.json(maskItems('pw', data));
});

router.post('/pw', (req, res) => {
  try {
    const item = req.body;
    if (!item.title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const list = readData('pw.json');
    const newItem = {
      id: `pw_${Date.now()}`,
      batch: item.batch || 'General',
      subject: item.subject || '',
      title: item.title,
      teacher: item.teacher || '',
      duration: item.duration || '',
      thumbnail: item.thumbnail || '',
      videoUrl: item.videoUrl || '',
      notesUrl: item.notesUrl || '',
    };
    list.unshift(newItem);
    writeData('pw.json', list);
    res.json({ message: 'PW content added successfully', item: maskItems('pw', [newItem])[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add content' });
  }
});

// ----------------- APNA COLLEGE -----------------
router.get('/apnacollege', (req, res) => {
  const data = readData('apnacollege.json');
  res.json(maskItems('apnacollege', data));
});

router.post('/apnacollege', (req, res) => {
  try {
    const item = req.body;
    if (!item.title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const list = readData('apnacollege.json');
    const newItem = {
      id: `apna_${Date.now()}`,
      course: item.course || 'General',
      module: item.module || '',
      title: item.title,
      instructor: item.instructor || '',
      duration: item.duration || '',
      thumbnail: item.thumbnail || '',
      videoUrl: item.videoUrl || '',
      resources: item.resources || '',
    };
    list.unshift(newItem);
    writeData('apnacollege.json', list);
    res.json({ message: 'Apna College content added successfully', item: maskItems('apnacollege', [newItem])[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add content' });
  }
});

// ----------------- YT PAID COURSES -----------------
router.get('/ytcourses', (req, res) => {
  const data = readData('ytcourses.json');
  res.json(maskItems('ytcourses', data));
});

router.post('/ytcourses', (req, res) => {
  try {
    const item = req.body;
    if (!item.title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const list = readData('ytcourses.json');
    const newItem = {
      id: `ytc_${Date.now()}`,
      title: item.title,
      creator: item.creator || '',
      level: item.level || 'All Levels',
      rating: item.rating || '',
      lectures: item.lectures || '',
      duration: item.duration || '',
      thumbnail: item.thumbnail || '',
      videoUrl: item.videoUrl || '',
      category: item.category || 'General',
    };
    list.unshift(newItem);
    writeData('ytcourses.json', list);
    res.json({ message: 'Course added successfully', item: maskItems('ytcourses', [newItem])[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add course' });
  }
});

export default router;

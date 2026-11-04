import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

const router = Router();

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
 * The client only receives the server-side endpoint /api/stream/:section/:id
 * and playerType ('hls' | 'iframe' | 'youtube'), keeping real stream URLs private.
 */
function maskItems(section, items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
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

// ----------------- SPORTS -----------------
let cachedSportsData = null;
let cachedSportsDataTime = 0;

router.get('/sports-data', async (req, res) => {
  const now = Date.now();
  if (cachedSportsData && now - cachedSportsDataTime < 60000) {
    return res.json(cachedSportsData);
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
      return res.json(cachedSportsData);
    }
  } catch (err) {
    console.warn('Failed to fetch upstream sports data:', err.message);
  }
  if (cachedSportsData) return res.json(cachedSportsData);
  res.status(502).json({ error: 'Sports stream metadata temporarily unavailable' });
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
      title: item.title,
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
      badge: item.badge || '',
      description: item.description || '',
      poster: item.poster || '',
      banner: item.banner || item.poster || '',
      streamUrl: item.streamUrl || '',
    };
    list.unshift(newItem);
    writeData('netflix.json', list);
    res.json({ message: 'Title added successfully', item: maskItems('netflix', [newItem])[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add title' });
  }
});

// ----------------- PW (PHYSICS WALLAH) -----------------
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
      subject: item.subject || 'General',
      chapter: item.chapter || '',
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

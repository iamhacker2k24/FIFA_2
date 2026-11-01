import { Router } from 'express';
import {
  getChannels,
  getCategories,
  getChannelById,
  saveChannels,
  importRawM3U,
  parseM3U,
} from '../services/channelService.js';

const router = Router();

function maskChannel(ch) {
  if (!ch) return ch;
  const rawUrl = ch.streamUrl || ch.url || '';
  const clean = rawUrl.split('?')[0].toLowerCase();
  const isDirect = ch.streamType === 'hls' || clean.endsWith('.m3u8') || clean.endsWith('.mpd') || clean.endsWith('.mp4');

  const masked = { ...ch };
  delete masked.rawUrl;
  delete masked.url;
  masked.streamUrl = `/api/stream/tv/${ch.id}`;
  masked.playerType = isDirect ? 'hls' : 'iframe';
  return masked;
}

// GET /api/channels - List channels with optional filters & pagination
router.get('/', (req, res) => {
  try {
    const { category, search, onlyMovies, page, limit } = req.query;
    const result = getChannels({ category, search, onlyMovies, page, limit });
    if (result && Array.isArray(result.channels)) {
      result.channels = result.channels.map(maskChannel);
    } else if (Array.isArray(result)) {
      return res.json(result.map(maskChannel));
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve channels' });
  }
});

// GET /api/channels/categories - Category statistics and list
router.get('/categories', (req, res) => {
  try {
    const result = getCategories();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/channels/:id - Single channel detail
router.get('/:id', (req, res) => {
  try {
    const channel = getChannelById(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(maskChannel(channel));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve channel' });
  }
});

// POST /api/channels - Bulk update or replace channels
router.post('/', (req, res) => {
  try {
    const channels = req.body;
    if (!Array.isArray(channels)) {
      return res.status(400).json({ error: 'Body must be an array of channel objects' });
    }
    const saved = saveChannels(channels);
    res.json({ message: 'Channels saved successfully', count: saved.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/channels/import - Import and persist raw M3U playlist
router.post('/import', (req, res) => {
  try {
    const { m3uContent } = req.body;
    if (!m3uContent || typeof m3uContent !== 'string') {
      return res.status(400).json({ error: 'm3uContent string is required' });
    }
    const result = importRawM3U(m3uContent);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/channels/parse - Dry-run test parse M3U without saving
router.post('/parse', (req, res) => {
  try {
    const { m3uContent } = req.body;
    if (!m3uContent || typeof m3uContent !== 'string') {
      return res.status(400).json({ error: 'm3uContent string is required' });
    }
    const parsed = parseM3U(m3uContent);
    res.json({ count: parsed.length, channels: parsed });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;


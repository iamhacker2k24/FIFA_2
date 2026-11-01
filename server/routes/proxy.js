import { Router } from 'express';
import { handleProxyRequest, handleStreamById } from '../services/proxyService.js';

const router = Router();

// Handle preflight OPTIONS requests for HLS players without using '*' in Express 5
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.sendStatus(204);
  }
  next();
});

// GET /api/proxy?t=... or /api/proxy?url=...
router.get('/', handleProxyRequest);
router.head('/', handleProxyRequest);

// Dedicated private stream endpoint: /api/proxy/stream/:section/:id
router.get('/stream/:section/:id', handleStreamById);
router.head('/stream/:section/:id', handleStreamById);

export default router;

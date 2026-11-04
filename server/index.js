import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import channelsRouter from './routes/channels.js';
import proxyRouter from './routes/proxy.js';
import providersRouter from './routes/providers.js';
import { getCategories } from './services/channelService.js';
import { handleStreamById } from './services/proxyService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const stats = getCategories();
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    totalChannels: stats.totalChannels,
  });
});

// Mount API routes
app.use('/api/channels', channelsRouter);
app.use('/api/proxy', proxyRouter);
app.get('/api/stream/:section/:id', handleStreamById);
app.head('/api/stream/:section/:id', handleStreamById);
app.use('/api', providersRouter);

// Serve local aioplayer and sports portal
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const p = decodeURIComponent(req.path).toLowerCase();
  if (p === '/aioplayer' || p === '/aioplayer.html' || p.includes('aioplayer')) {
    return res.sendFile(path.resolve(__dirname, '../public/aioplayer.html'));
  }
  if (p === '/sports.html' || p === '/dtv.html' || p === '/sports-portal') {
    return res.sendFile(path.resolve(__dirname, '../public/sports.html'));
  }
  next();
});

// Serve static public assets
app.use(express.static(path.resolve(__dirname, '../public')));

// Serve static built frontend files if dist directory exists
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// For client-side routing: fallback to index.html for non-API routes
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({
        message: 'Frontend not built yet. Run "npm run build" to build client or use Vite dev server on port 5173.',
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 FIFA TV Server running at http://localhost:${PORT}`);
  console.log(`📡 Channels API: http://localhost:${PORT}/api/channels`);
  console.log(`🛡️ Stream Proxy: http://localhost:${PORT}/api/proxy?url=<streamUrl>`);
  console.log(`===============================================`);
});

export default app;


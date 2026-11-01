import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

/**
 * Encodes a URL into an obfuscated base64url token so it is not visible in plaintext
 */
function encodeToken(url) {
  return Buffer.from(url).toString('base64url');
}

/**
 * Decodes an obfuscated base64url token back into a URL
 */
function decodeToken(token) {
  try {
    return Buffer.from(token, 'base64url').toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Rewrites a single URI attribute inside an HLS tag (e.g. URI="...") using tokenized query
 */
function rewriteTagUri(tagLine, baseUrl) {
  return tagLine.replace(/URI=["']([^"']+)["']/gi, (match, uri) => {
    try {
      const resolved = new URL(uri, baseUrl).href;
      return `URI="/api/proxy?t=${encodeToken(resolved)}"`;
    } catch {
      return match;
    }
  });
}

/**
 * Rewrites an M3U8 playlist manifest so all internal URIs route through /api/proxy?t=... (tokenized)
 */
export function rewriteM3U8(manifestText, baseUrl) {
  const lines = manifestText.split(/\r?\n/);
  const rewrittenLines = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      rewrittenLines.push(rawLine);
      continue;
    }

    if (trimmed.startsWith('#')) {
      // Tags that contain URIs
      if (
        trimmed.startsWith('#EXT-X-KEY:') ||
        trimmed.startsWith('#EXT-X-MAP:') ||
        trimmed.startsWith('#EXT-X-MEDIA:') ||
        trimmed.startsWith('#EXT-X-PRELOAD-HINT:') ||
        trimmed.startsWith('#EXT-X-RENDITION-REPORT:')
      ) {
        rewrittenLines.push(rewriteTagUri(rawLine, baseUrl));
      } else {
        rewrittenLines.push(rawLine);
      }
    } else {
      // Stream segment or variant playlist URL
      try {
        const resolved = new URL(trimmed, baseUrl).href;
        rewrittenLines.push(`/api/proxy?t=${encodeToken(resolved)}`);
      } catch {
        rewrittenLines.push(rawLine);
      }
    }
  }

  return rewrittenLines.join('\n');
}

/**
 * Locates the private upstream stream URL for a given section and item ID
 */
export function findStreamUrl(section, id) {
  try {
    let filename = `${section}.json`;
    if (section === 'tv' || section === 'channels') {
      filename = 'channels.json';
    }

    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const list = Array.isArray(items) ? items : items.channels || [];
    const found = list.find((x) => String(x.id) === String(id));
    return found ? (found.streamUrl || found.videoUrl || found.url || null) : null;
  } catch (err) {
    console.error(`Error resolving internal stream for [${section}/${id}]:`, err.message);
    return null;
  }
}

/**
 * Handles incoming proxy request and streams back response with CORS & security protection
 * NEVER exposes raw stream URL in error outputs or console
 */
export async function handleProxyRequest(req, res) {
  let targetUrl = req.targetStreamUrl;

  // If not injected by internal route, extract from query
  if (!targetUrl) {
    if (req.query.t) {
      targetUrl = decodeToken(req.query.t);
    } else if (req.query.url) {
      targetUrl = req.query.url;
    }
  }

  if (!targetUrl) {
    return res.status(400).json({ error: 'Stream resource not specified' });
  }

  // Validate URL structure
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Unsupported stream protocol' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid stream request' });
  }

  // Forward incoming Range header if present
  const forwardHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: parsedUrl.origin + '/',
    Origin: parsedUrl.origin,
  };

  if (req.headers.range) {
    forwardHeaders.range = req.headers.range;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: forwardHeaders,
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    // Set CORS headers on outgoing response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');

    if (req.method === 'HEAD') {
      res.status(upstreamResponse.status);
      const ct = upstreamResponse.headers.get('content-type');
      if (ct) res.setHeader('Content-Type', ct);
      return res.end();
    }

    const contentType = (upstreamResponse.headers.get('content-type') || '').toLowerCase();
    const isM3U8Url = parsedUrl.pathname.toLowerCase().endsWith('.m3u8');
    const isM3U8Content =
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      contentType.includes('audio/x-mpegurl');

    // If it's an M3U8 manifest or ends in .m3u8, read text and rewrite with tokenized segments
    if (isM3U8Url || isM3U8Content) {
      const text = await upstreamResponse.text();

      // Check if text really is M3U playlist
      if (text.includes('#EXTM3U') || text.includes('#EXTINF') || isM3U8Url) {
        const rewritten = rewriteM3U8(text, upstreamResponse.url || targetUrl);
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(upstreamResponse.status).send(rewritten);
      }
    }

    // If it's an HTML page (such as aioplayer or external web players), proxy it and strip frame-ancestors/X-Frame-Options
    if (
      contentType.includes('text/html') ||
      parsedUrl.pathname.endsWith('.html') ||
      parsedUrl.pathname.includes('aioplayer') ||
      parsedUrl.pathname.endsWith('.php')
    ) {
      let html = await upstreamResponse.text();
      const origin = parsedUrl.origin;
      const baseTag = `<base href="${origin}/">`;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n  ${baseTag}`);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>\n  ${baseTag}`);
      } else {
        html = baseTag + html;
      }

      // Neutralize disable-devtool script if present so it doesn't close/freeze devtools
      html = html.replace(/<script[^>]*disable-devtool[^>]*>[\s\S]*?<\/script>/gi, '');

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(upstreamResponse.status).send(html);
    }

    // Binary media segments or other responses: stream directly
    res.status(upstreamResponse.status);

    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'etag',
      'last-modified',
    ];

    headersToForward.forEach((h) => {
      const val = upstreamResponse.headers.get(h);
      if (val) res.setHeader(h, val);
    });

    // Fallback content type for .ts files if missing
    if (!res.getHeader('content-type')) {
      if (parsedUrl.pathname.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/mp2t');
      } else if (parsedUrl.pathname.endsWith('.m4s') || parsedUrl.pathname.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      }
    }

    // Convert Web ReadableStream to Node Readable and pipe
    if (upstreamResponse.body) {
      const nodeStream = Readable.fromWeb(upstreamResponse.body);
      nodeStream.pipe(res);
      nodeStream.on('error', (err) => {
        console.warn('Media stream pipe interrupted:', err.message);
        if (!res.headersSent) res.status(502).end();
      });
    } else {
      res.end();
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Stream connection timed out' });
    }
    // NEVER log or expose raw targetUrl
    console.error('Stream delivery error:', err.message);
    if (!res.headersSent) {
      return res.status(502).json({ error: 'Stream playback temporarily unavailable' });
    }
  }
}

/**
 * Express handler for /api/stream/:section/:id
 * Obscures the real upstream stream URL completely from the client
 */
export async function handleStreamById(req, res) {
  const { section, id } = req.params;
  const targetUrl = findStreamUrl(section, id);

  if (!targetUrl) {
    return res.status(404).json({ error: 'Channel stream not found' });
  }

  req.targetStreamUrl = targetUrl;
  return handleProxyRequest(req, res);
}

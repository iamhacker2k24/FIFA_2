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

// Channel alias map to resolve numeric IDs into exact upstream channel slugs/names
const CHANNEL_ALIAS_MAP = {
  '162': { slug: 'sten1', altSlug: 'STEN1', name: 'Sony Sports Ten 1 HD' },
  '891': { slug: 'sten2', altSlug: 'STEN2', name: 'Sony Sports Ten 2 HD' },
  '892': { slug: 'sten3', altSlug: 'STEN3', name: 'Sony Sports Ten 3 Hindi HD' },
  '1773': { slug: 'stentu', altSlug: 'STENTU', name: 'Sony Sports Ten 4 Telugu' },
  '3514': { slug: 'stent', altSlug: 'STENT', name: 'Sony Sports Ten 4 Tamil' },
  '3585': { slug: 'stenk', altSlug: 'STENK', name: 'Sony Sports Ten 4 Kannada' },
  '155': { slug: 'sten5', altSlug: 'STEN5', name: 'Sony Sports Ten 5 HD' },
  '1106': { slug: 'e1hd', altSlug: 'E1HD', name: 'Star Sports 1 HD' },
  '1108': { slug: 'h1hd', altSlug: 'H1HD', name: 'Star Sports 1 Hindi HD' },
  '362': { slug: 'h1sd', altSlug: 'H1SD', name: 'Star Sports 1 Hindi' },
  '1142': { slug: 'e1sd', altSlug: 'E1SD', name: 'Star Sports 1' },
  '3277': { slug: 'tl1hd', altSlug: 'TL1HD', name: 'Star Sports 1 Tamil HD' },
  '1124': { slug: 'tl1sd', altSlug: 'TL1SD', name: 'Star Sports 1 Tamil' },
  '3278': { slug: 'tu1hd', altSlug: 'TU1HD', name: 'Star Sports 1 Telugu HD' },
  '1651': { slug: 'tu1sd', altSlug: 'TU1SD', name: 'Star Sports 1 Telugu' },
  '1650': { slug: 'ka1sd', altSlug: 'KA1SD', name: 'Star Sports 1 Kannada' },
  '1109': { slug: 'e2hd', altSlug: 'E2HD', name: 'Star Sports 2 HD' },
  '1984': { slug: 'h2hd', altSlug: 'H2HD', name: 'Star Sports 2 Hindi HD' },
  '1985': { slug: 'h2sd', altSlug: 'H2SD', name: 'Star Sports 2 Hindi' },
  '1141': { slug: 'e2sd', altSlug: 'E2SD', name: 'Star Sports 2' },
  '3273': { slug: 'tl2hd', altSlug: 'TL2HD', name: 'Star Sports 2 Tamil HD' },
  '2853': { slug: 'tl2sd', altSlug: 'TL2SD', name: 'Star Sports 2 Tamil' },
  '3274': { slug: 'tu2hd', altSlug: 'TU2HD', name: 'Star Sports 2 Telugu HD' },
  '2852': { slug: 'tu2sd', altSlug: 'TU2SD', name: 'Star Sports 2 Telugu' },
  '1122': { slug: 'ka2sd', altSlug: 'KA2SD', name: 'Star Sports 2 Kannada' },
  '1389': { slug: 'ss3', altSlug: 'SS3', name: 'Star Sports 3' },
  '460': { slug: 'st1hd', altSlug: 'ST1HD', name: 'Star Sports Select 1 HD' },
  '1123': { slug: 'st1sd', altSlug: 'ST1SD', name: 'Star Sports Select 1' },
  '461': { slug: 'st2hd', altSlug: 'ST2HD', name: 'Star Sports Select 2 HD' },
  '1114': { slug: 'st2sd', altSlug: 'ST2SD', name: 'Star Sports Select 2' },
  '1998': { slug: 'ssk', altSlug: 'SSK', name: 'Star Sports Khel' },
  '875': { slug: 'eurosport', altSlug: 'eurosport', name: 'Eurosport HD' },
  '204': { slug: 'ddsports', altSlug: 'ddsports', name: 'DD Sports' },
  '1294': { slug: 'eurosport', altSlug: 'eurosport', name: 'Eurosport' },
};

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

      // Extract specific channel parameters so player scripts running inside the iframe read the correct channel
      const channelId = parsedUrl.searchParams.get('id') || req.query.id || '';
      const fullSearch = parsedUrl.search || (channelId ? `?id=${encodeURIComponent(channelId)}` : '');

      const idInjectionScript = `
  <script>
    (function() {
      var targetId = ${JSON.stringify(channelId)};
      var targetSearch = ${JSON.stringify(fullSearch)};
      var channelMap = ${JSON.stringify(CHANNEL_ALIAS_MAP)};

      if (targetId) {
        try {
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + targetSearch);
          }
        } catch (e) {}

        try {
          var origGet = URLSearchParams.prototype.get;
          URLSearchParams.prototype.get = function(name) {
            if (name === 'id' || name === 'channel' || name === 'ch') {
              var val = origGet.call(this, name);
              return val || targetId;
            }
            return origGet.call(this, name);
          };
        } catch (e) {}
      }

      // CRITICAL: Hook window.fetch to redirect broken jtvplus.json (empty cookies) to sonujson-v5 or local sports-data
      try {
        var origFetch = window.fetch;
        window.fetch = async function(resource, init) {
          var url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
          if (url && (url.includes('jtvplus.json') || url.includes('sportlink-tv10'))) {
            try {
              var resp = await origFetch.call(this, 'https://sonujson-v5.pages.dev/Data/sports.json', init);
              if (resp.ok) return resp;
            } catch (err) {}
            return origFetch.call(this, '/api/sports-data', init);
          }
          return origFetch.apply(this, arguments);
        };
      } catch (e) {}

      // Intercept Response.prototype.json to guarantee distinct channel playback with active token
      try {
        var origJson = Response.prototype.json;
        Response.prototype.json = function() {
          return origJson.apply(this, arguments).then(function(data) {
            try {
              if (!data) return data;
              var channels = Array.isArray(data) ? data : (data.channels && Array.isArray(data.channels) ? data.channels : null);
              if (channels && channels.length > 0 && targetId) {
                var targetStr = String(targetId).toLowerCase().trim();
                var mapping = channelMap[targetStr] || channelMap[targetId] || null;
                var slug = mapping ? mapping.slug.toLowerCase() : '';
                var altSlug = mapping ? mapping.altSlug.toLowerCase() : '';
                var mappedName = mapping ? mapping.name.toLowerCase().replace(/\\s+/g, '') : '';

                var foundIndex = -1;
                for (var i = 0; i < channels.length; i++) {
                  var item = channels[i];
                  var chId = String(item.id || '').toLowerCase().trim();
                  var chName = String(item.name || '').toLowerCase().replace(/\\s+/g, '');
                  if (
                    chId === targetStr ||
                    chId === slug ||
                    chId === altSlug ||
                    (mappedName && (chName === mappedName || chName.indexOf(mappedName) !== -1 || mappedName.indexOf(chName) !== -1))
                  ) {
                    foundIndex = i;
                    break;
                  }
                }

                if (foundIndex !== -1) {
                  var targetCh = channels[foundIndex];
                  // Set channel_id and numeric_id on the target so find() matches directly
                  targetCh.channel_id = targetStr;
                  targetCh.numeric_id = targetStr;
                  if (targetCh.sportlink && !targetCh.sonuxs) {
                    targetCh.sonuxs = targetCh.sportlink;
                  }
                  // Crucial: Move target channel to index 0 so even fallback find() plays the exact target channel!
                  channels.splice(foundIndex, 1);
                  channels.unshift(targetCh);
                }
              }
            } catch (err) {
              console.warn('Channel matching interception notice:', err);
            }
            return data;
          });
        };
      } catch (e) {}

      // Autostart patch for JWPlayer so stream plays immediately upon loading
      try {
        var checkJw = setInterval(function() {
          if (window.jwplayer && window.jwplayer.prototype && window.jwplayer.prototype.setup) {
            clearInterval(checkJw);
            var origSetup = window.jwplayer.prototype.setup;
            window.jwplayer.prototype.setup = function(options) {
              if (options) {
                options.autostart = true;
              }
              var inst = origSetup.apply(this, arguments);
              if (inst && inst.on) {
                inst.on('ready', function() {
                  try {
                    inst.play();
                  } catch (e) {
                    inst.setMute(true);
                    inst.play();
                  }
                });
              }
              return inst;
            };
          }
        }, 50);
        setTimeout(function() { clearInterval(checkJw); }, 10000);
      } catch (e) {}
    })();
  </script>`;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n${idInjectionScript}`);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>\n${idInjectionScript}`);
      } else {
        html = idInjectionScript + html;
      }

      // Neutralize disable-devtool script if present
      html = html.replace(/<script[^>]*disable-devtool[^>]*>[\s\S]*?<\/script>/gi, '');
      // Neutralize anti-debugger statements
      html = html.replace(/'constructor'\s*\(\s*['"]debugger['"]\s*\)/g, "'constructor'('')");

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

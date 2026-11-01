/**
 * Stream Helper Utility
 * Routes video streams through the server-side CORS & privacy protection endpoints
 */

export function isDirectStream(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.m3u8') || clean.endsWith('.mpd') || clean.endsWith('.mp4');
}

export function isEmbedUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (isDirectStream(url)) return false;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('aioplayer') ||
    url.includes('ok.ru') ||
    url.includes('pages.dev') ||
    url.includes('iframe') ||
    url.includes('.php') ||
    url.includes('.html') ||
    url.includes('twitch.tv') ||
    url.includes('dailymotion.com')
  );
}

export function getStreamUrl(originalUrl, useProxy = true) {
  if (!originalUrl || typeof originalUrl !== 'string') return '';

  // If already pointing to an internal server endpoint (/api/stream or /api/proxy), return as-is
  if (originalUrl.startsWith('/api/') || originalUrl.includes('/api/')) {
    return originalUrl;
  }

  // Web embeds / iframes
  if (isEmbedUrl(originalUrl)) {
    return originalUrl;
  }

  if (useProxy) {
    return `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
  }

  return originalUrl;
}

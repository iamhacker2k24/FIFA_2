/**
 * M3U / EXTINF Parser Utility
 * Converts raw M3U text content into clean structured TV channels JSON
 */

export function parseM3U(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return [];

  const lines = rawContent.split(/\r?\n/);
  const channels = [];
  const seenUrls = new Set();

  let currentInfo = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Remove any accidental leading/trailing quotes or brackets
    const cleanLine = rawLine.replace(/^["']+|["']+$/g, '');

    // Check if line is an EXTINF definition
    if (cleanLine.includes('EXTINF:')) {
      // Extract tvg-name
      const nameMatch = cleanLine.match(/tvg-name="([^"]+)"/i);
      // Extract tvg-logo
      const logoMatch = cleanLine.match(/tvg-logo="([^"]+)"/i);
      // Extract group-title
      const groupMatch = cleanLine.match(/group-title="([^"]+)"/i);
      
      // Fallback display name after comma:
      const commaIdx = cleanLine.lastIndexOf(',');
      const displayName = commaIdx !== -1 ? cleanLine.substring(commaIdx + 1).trim() : '';

      let name = (nameMatch ? nameMatch[1] : displayName) || displayName || 'Live Channel';
      // Clean up common URL encoded or special tag glitches in channel names
      name = name.replace(/%E|%C|%8|%9/g, '').replace(/%[0-9A-Fa-f]{2}/g, '').trim();

      const logo = logoMatch ? logoMatch[1].trim() : '';
      let rawGroup = groupMatch ? groupMatch[1].trim() : '';

      // Normalize category / group
      let group = 'Entertainment';
      const lowerName = name.toLowerCase();
      const lowerGroup = rawGroup.toLowerCase();

      const isMovie = 
        lowerGroup.includes('movie') || 
        lowerGroup.includes('cinema') ||
        lowerName.includes('movie') || 
        lowerName.includes('cinema') || 
        lowerName.includes('film') ||
        lowerName.includes('hollywood') ||
        lowerName.includes('bollywood') ||
        lowerName.includes('jalsha movies') ||
        lowerName.includes('goldmines') ||
        lowerName.includes('cowboy movie');

      if (isMovie) {
        group = 'Movies';
      } else if (
        lowerGroup.includes('sport') ||
        lowerName.includes('sport') ||
        lowerName.includes('cricket') ||
        lowerName.includes('football') ||
        lowerName.includes('espn') ||
        lowerName.includes('ufc') ||
        lowerName.includes('bein') ||
        lowerName.includes('laliga') ||
        lowerName.includes('fifa') ||
        lowerName.includes('wwe') ||
        lowerName.includes('fighter')
      ) {
        group = 'Sports';
      } else if (
        lowerGroup.includes('news') ||
        lowerName.includes('news') ||
        lowerName.includes('cnn') ||
        lowerName.includes('bbc') ||
        lowerName.includes('ndtv') ||
        lowerName.includes('wion') ||
        lowerName.includes('al jazeera') ||
        lowerName.includes('khabar') ||
        lowerName.includes('24x7')
      ) {
        group = 'News';
      } else if (
        lowerGroup.includes('bangla') ||
        lowerGroup.includes('bangladesh') ||
        lowerName.includes('bangla') ||
        lowerName.includes('rtv') ||
        lowerName.includes('boishakhi') ||
        lowerName.includes('maasranga') ||
        lowerName.includes('ntv') ||
        lowerName.includes('ananda')
      ) {
        group = 'Bangla';
      } else if (
        lowerGroup.includes('kid') ||
        lowerGroup.includes('cartoon') ||
        lowerName.includes('cartoon') ||
        lowerName.includes('disney') ||
        lowerName.includes('nick') ||
        lowerName.includes('motu patlu') ||
        lowerName.includes('doraemon') ||
        lowerName.includes('gopal bhar')
      ) {
        group = 'Kids';
      } else if (
        lowerGroup.includes('music') ||
        lowerName.includes('music') ||
        lowerName.includes('sangeet') ||
        lowerName.includes('yrf') ||
        lowerName.includes('hits')
      ) {
        group = 'Music';
      } else if (
        lowerGroup.includes('documentary') ||
        lowerGroup.includes('infotainment') ||
        lowerName.includes('discovery') ||
        lowerName.includes('nat geo') ||
        lowerName.includes('earth') ||
        lowerName.includes('animal planet') ||
        lowerName.includes('wild')
      ) {
        group = 'Documentary';
      } else if (
        lowerGroup.includes('religio') ||
        lowerName.includes('deen') ||
        lowerName.includes('madani') ||
        lowerName.includes('eman')
      ) {
        group = 'Religious';
      } else if (
        lowerGroup.includes('weather') ||
        lowerName.includes('weather')
      ) {
        group = 'Weather';
      } else if (
        ['albania', 'argentina', 'austria', 'imported'].includes(lowerGroup)
      ) {
        group = 'International';
      } else if (lowerGroup.includes('hindi') || lowerGroup.includes('india')) {
        group = 'Hindi & India';
      } else if (lowerGroup.includes('english')) {
        group = 'English';
      } else {
        group = rawGroup && rawGroup !== 'Unknown' && rawGroup !== 'Other' ? rawGroup : 'Entertainment';
      }

      // Detect resolution
      let resolution = 'HD';
      if (/1080p|fhd/i.test(name)) resolution = '1080p';
      else if (/720p/i.test(name)) resolution = '720p';
      else if (/4k/i.test(name)) resolution = '4K';
      else if (/sd|576p|480p/i.test(name)) resolution = 'SD';

      currentInfo = {
        name,
        logo,
        group,
        resolution,
        isMovie,
      };
    } else if (/^https?:\/\//i.test(cleanLine)) {
      const url = cleanLine;

      // Filter out social/telegram channel promotional links
      if (url.includes('t.me/') || url.includes('telegram.me')) {
        currentInfo = null;
        continue;
      }

      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        const channelId = `ch_${channels.length + 1}`;
        
        // Detect stream type
        let streamType = 'hls';
        if (url.includes('.ts') && !url.includes('.m3u8')) streamType = 'ts';
        else if (url.includes('youtube.com') || url.includes('youtu.be')) streamType = 'youtube';

        channels.push({
          id: channelId,
          name: currentInfo?.name || `Live Stream ${channels.length + 1}`,
          logo: currentInfo?.logo || '',
          group: currentInfo?.group || 'Entertainment',
          resolution: currentInfo?.resolution || 'HD',
          isMovie: !!currentInfo?.isMovie,
          streamUrl: url,
          streamType,
        });
      }
      currentInfo = null;
    }
  }

  return channels;
}

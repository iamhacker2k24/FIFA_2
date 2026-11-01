import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const CHANNELS_FILE = path.join(DATA_DIR, 'channels.json');
const RAW_M3U_FILE = path.join(DATA_DIR, 'raw_playlist.m3u');
const CLIENT_CHANNELS_FILE = path.resolve(__dirname, '../../src/Data/channels.json');

// In-memory channel cache
let channelsCache = null;

export function loadChannels() {
  if (channelsCache) return channelsCache;

  try {
    if (fs.existsSync(CHANNELS_FILE)) {
      const raw = fs.readFileSync(CHANNELS_FILE, 'utf-8');
      channelsCache = JSON.parse(raw);
    } else if (fs.existsSync(CLIENT_CHANNELS_FILE)) {
      const raw = fs.readFileSync(CLIENT_CHANNELS_FILE, 'utf-8');
      channelsCache = JSON.parse(raw);
      fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channelsCache, null, 2), 'utf-8');
    } else {
      channelsCache = [];
    }
  } catch (err) {
    console.error('Error loading channels file:', err.message);
    channelsCache = [];
  }

  return channelsCache;
}

export function saveChannels(channels) {
  channelsCache = channels;
  const jsonContent = JSON.stringify(channels, null, 2);

  // Write to server data directory
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CHANNELS_FILE, jsonContent, 'utf-8');

  // Keep client-side fallback synced with masked stream URLs (never raw upstream URLs)
  try {
    const clientDataDir = path.dirname(CLIENT_CHANNELS_FILE);
    if (fs.existsSync(clientDataDir)) {
      const maskedClientData = channels.map((ch) => ({
        ...ch,
        streamUrl: `/api/stream/tv/${ch.id}`,
        playerType: ch.streamType === 'hls' || (ch.streamUrl && ch.streamUrl.includes('.m3u8')) ? 'hls' : 'iframe',
      }));
      fs.writeFileSync(CLIENT_CHANNELS_FILE, JSON.stringify(maskedClientData, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Could not sync to client channels file:', err.message);
  }

  return channelsCache;
}

export function getCategories() {
  const channels = loadChannels();
  const counts = {};
  let movies = 0;

  channels.forEach((ch) => {
    const grp = ch.group || 'Other';
    counts[grp] = (counts[grp] || 0) + 1;
    if (ch.isMovie) movies++;
  });

  counts['All'] = channels.length;
  counts['Movies'] = movies;

  const baseOrder = [
    'All',
    'Movies',
    'Sports',
    'News',
    'Bangla',
    'Kids',
    'Music',
    'Hindi & India',
    'English',
    'Documentary',
    'Favorites',
  ];

  // Append other categories not in base order
  const allGroups = Object.keys(counts).filter(
    (k) => !baseOrder.includes(k) && k !== 'All' && k !== 'Movies'
  );

  const categories = [...baseOrder, ...allGroups.sort()];

  return {
    categories,
    categoryCounts: counts,
    movieCount: movies,
    totalChannels: channels.length,
  };
}

export function getChannels({ category, search, onlyMovies, page, limit }) {
  let list = loadChannels();

  // 1. Filter by category
  if (category && category !== 'All' && category !== 'Favorites') {
    if (category === 'Movies') {
      list = list.filter((ch) => ch.isMovie);
    } else {
      list = list.filter((ch) => ch.group === category);
    }
  }

  // 2. Movie filter
  if (onlyMovies === true || onlyMovies === 'true') {
    list = list.filter((ch) => ch.isMovie);
  }

  // 3. Search filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((ch) => {
      const name = (ch.name || '').toLowerCase();
      const group = (ch.group || '').toLowerCase();
      const matchesName = name.includes(q);
      const matchesGroup = group.includes(q);
      const matchesMovie = q === 'movie' && ch.isMovie;
      return matchesName || matchesGroup || matchesMovie;
    });
  }

  const total = list.length;

  // 4. Pagination (if requested)
  if (page || limit) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 50);
    const startIndex = (p - 1) * l;
    const paginatedChannels = list.slice(startIndex, startIndex + l);

    return {
      channels: paginatedChannels,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    };
  }

  return {
    channels: list,
    total,
  };
}

export function getChannelById(id) {
  const channels = loadChannels();
  return channels.find((ch) => ch.id === id) || null;
}

/**
 * Parses raw M3U playlist text into structured channel list
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

    const cleanLine = rawLine.replace(/^["']+|["']+$/g, '');

    if (cleanLine.includes('EXTINF:')) {
      const nameMatch = cleanLine.match(/tvg-name="([^"]+)"/i);
      const logoMatch = cleanLine.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = cleanLine.match(/group-title="([^"]+)"/i);
      const commaIdx = cleanLine.lastIndexOf(',');
      const displayName = commaIdx !== -1 ? cleanLine.substring(commaIdx + 1).trim() : '';

      let name = (nameMatch ? nameMatch[1] : displayName) || displayName || 'Live Channel';
      name = name.replace(/%E|%C|%8|%9/g, '').replace(/%[0-9A-Fa-f]{2}/g, '').trim();

      const logo = logoMatch ? logoMatch[1].trim() : '';
      let rawGroup = groupMatch ? groupMatch[1].trim() : '';

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
        lowerGroup.includes('animation') ||
        lowerName.includes('kid') ||
        lowerName.includes('cartoon') ||
        lowerName.includes('pogo') ||
        lowerName.includes('nickelodeon') ||
        lowerName.includes('disney') ||
        lowerName.includes('sonic')
      ) {
        group = 'Kids';
      } else if (
        lowerGroup.includes('music') ||
        lowerGroup.includes('song') ||
        lowerName.includes('music') ||
        lowerName.includes('vh1') ||
        lowerName.includes('mtv') ||
        lowerName.includes('9xm') ||
        lowerName.includes('zoom') ||
        lowerName.includes('sangeet')
      ) {
        group = 'Music';
      } else if (
        lowerGroup.includes('hindi') ||
        lowerGroup.includes('india') ||
        lowerName.includes('zee') ||
        lowerName.includes('star plus') ||
        lowerName.includes('colors') ||
        lowerName.includes('sony') ||
        lowerName.includes('sab tv') ||
        lowerName.includes('dangall') ||
        lowerName.includes('shemaroo')
      ) {
        group = 'Hindi & India';
      } else if (
        lowerGroup.includes('doc') ||
        lowerName.includes('discovery') ||
        lowerName.includes('nat geo') ||
        lowerName.includes('history') ||
        lowerName.includes('animal planet') ||
        lowerName.includes('science')
      ) {
        group = 'Documentary';
      } else if (
        lowerGroup.includes('english') ||
        lowerGroup.includes('usa') ||
        lowerGroup.includes('uk') ||
        lowerName.includes('hbo') ||
        lowerName.includes('cbs') ||
        lowerName.includes('nbc') ||
        lowerName.includes('fox') ||
        lowerName.includes('abc')
      ) {
        group = 'English';
      }

      currentInfo = {
        name,
        logo,
        group,
        isMovie,
      };
    } else if (
      cleanLine.startsWith('http://') ||
      cleanLine.startsWith('https://') ||
      cleanLine.endsWith('.m3u8') ||
      cleanLine.endsWith('.mpd')
    ) {
      const streamUrl = cleanLine;

      if (!seenUrls.has(streamUrl)) {
        seenUrls.add(streamUrl);

        let resolution = 'HD';
        if (streamUrl.includes('1080') || (currentInfo && currentInfo.name.includes('1080'))) {
          resolution = '1080p';
        } else if (streamUrl.includes('720') || (currentInfo && currentInfo.name.includes('720'))) {
          resolution = '720p';
        } else if (streamUrl.includes('480') || (currentInfo && currentInfo.name.includes('480'))) {
          resolution = '480p';
        } else if (streamUrl.includes('4k') || (currentInfo && currentInfo.name.includes('4K'))) {
          resolution = '4K';
        }

        const channelObj = {
          id: `ch_${channels.length + 1}`,
          name: currentInfo ? currentInfo.name : `Live Channel ${channels.length + 1}`,
          logo: currentInfo ? currentInfo.logo : '',
          group: currentInfo ? currentInfo.group : 'Entertainment',
          resolution,
          isMovie: currentInfo ? currentInfo.isMovie : false,
          streamUrl,
          streamType: streamUrl.includes('.mpd') ? 'dash' : 'hls',
        };

        channels.push(channelObj);
      }

      currentInfo = null;
    }
  }

  return channels;
}

export function importRawM3U(rawContent) {
  const parsed = parseM3U(rawContent);
  if (parsed.length === 0) {
    throw new Error('No valid streams or EXTINF entries were detected.');
  }

  // Save parsed channels
  saveChannels(parsed);

  // Also save raw M3U backup
  try {
    fs.writeFileSync(RAW_M3U_FILE, rawContent, 'utf-8');
  } catch (err) {
    console.warn('Could not save raw M3U file:', err.message);
  }

  return {
    importedCount: parsed.length,
    stats: getCategories(),
  };
}


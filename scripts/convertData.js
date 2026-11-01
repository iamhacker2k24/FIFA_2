import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseM3U } from '../src/utils/m3uParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawM3uPath = path.resolve(__dirname, '../src/Data/raw_playlist.m3u');
const dataJsonPath = path.resolve(__dirname, '../src/Data/Data.json');
const channelsJsonPath = path.resolve(__dirname, '../src/Data/channels.json');

console.log('Reading raw M3U from:', rawM3uPath);
const rawData = fs.readFileSync(rawM3uPath, 'utf-8');

// Parse
const parsedChannels = parseM3U(rawData);
console.log(`Successfully parsed ${parsedChannels.length} clean channels!`);

// Print categories distribution
const categoryCounts = {};
let movieCount = 0;
parsedChannels.forEach(ch => {
  categoryCounts[ch.group] = (categoryCounts[ch.group] || 0) + 1;
  if (ch.isMovie) movieCount++;
});

console.log('Categories:', categoryCounts);
console.log('Movie channels identified:', movieCount);

// Write to channels.json and Data.json
const formattedJson = JSON.stringify(parsedChannels, null, 2);
fs.writeFileSync(channelsJsonPath, formattedJson, 'utf-8');
fs.writeFileSync(dataJsonPath, formattedJson, 'utf-8');

console.log('Done writing updated files.');

import React, { useRef } from 'react';
import { Search, X, Film, Volume2, VolumeX, Sparkles, Filter, Clapperboard } from 'lucide-react';

export default function SearchBar({
  searchTerm,
  onSearchChange,
  onlyMovies,
  onToggleOnlyMovies,
  globalMuted,
  onToggleGlobalMute,
  totalResults,
  totalChannels,
  activeCategory,
  onCategorySelect,
}) {
  const inputRef = useRef(null);

  const quickMovieTags = [
    { label: 'All Movies', query: 'movie' },
    { label: 'HBO', query: 'hbo' },
    { label: 'Cinema', query: 'cinema' },
    { label: 'Bollywood', query: 'bollywood' },
    { label: 'Hollywood', query: 'hollywood' },
    { label: 'Goldmines', query: 'goldmines' },
  ];

  return (
    <div className="w-full flex flex-col gap-3.5 mb-6">
      {/* Main Search Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
            <Search size={18} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 489+ TV channels, movies, sports, news, HBO..."
            className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm font-medium outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 backdrop-blur-xl transition-all shadow-inner"
          />

          {/* Quick Clear or Shortcut Pill */}
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-1.5">
            {searchTerm ? (
              <button
                onClick={() => {
                  onSearchChange('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Clear Search"
              >
                <X size={16} />
              </button>
            ) : (
              <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                /
              </span>
            )}
          </div>
        </div>

        {/* Dedicated Highlighted "Movie Channels" Toggle Button */}
        <button
          onClick={onToggleOnlyMovies}
          className={`px-5 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
            onlyMovies
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400 scale-[1.02]'
              : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-200 hover:text-amber-400'
          }`}
          title="Filter only Movie & Cinema Channels"
        >
          <Clapperboard size={16} className={onlyMovies ? 'text-black' : 'text-amber-400'} />
          <span>Movie Channels</span>
          {onlyMovies && (
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse ml-0.5" />
          )}
        </button>

        {/* Hover Audio Toggle */}
        <button
          onClick={onToggleGlobalMute}
          className={`px-4 py-3.5 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            !globalMuted
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/30'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={!globalMuted ? 'Hover sound is active (move mouse over any screen)' : 'Click to enable hover sound'}
        >
          {!globalMuted ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} />}
          <span className="hidden md:inline">
            {!globalMuted ? 'Hover Sound: ON' : 'Hover Sound: OFF'}
          </span>
        </button>
      </div>

      {/* Movie Quick Filters & Result Counter Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Quick Movie Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
            <Film size={12} className="text-amber-400" />
            Quick Movie Searches:
          </span>
          {quickMovieTags.map(tag => (
            <button
              key={tag.label}
              onClick={() => onSearchChange(tag.query)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                searchTerm.toLowerCase() === tag.query
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Live Channel Counter Badge */}
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-cyan-400 font-bold">{totalResults}</span> of{' '}
          <span className="text-slate-200">{totalChannels}</span> Live Channels
        </div>
      </div>
    </div>
  );
}

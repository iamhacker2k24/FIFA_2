import React from 'react';
import { Tv, Film, PlusCircle, Home } from 'lucide-react';

export default function Header({ onOpenImporter, totalChannels, movieCount, activeSection = 'home', onGoHome }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-3 cursor-pointer group"
          title="Return to Home Portal"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Tv size={22} className="text-white drop-shadow" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-950 animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                Dev<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Stream</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 hidden sm:inline-block">
                Server Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multi-Section Live Streaming Portal
            </p>
          </div>
        </div>

        {/* Live Status Indicators & Actions */}
        <div className="flex items-center gap-3">
          {activeSection !== 'home' && onGoHome && (
            <button
              onClick={onGoHome}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Home size={14} className="text-cyan-400" />
              <span>All Sections</span>
            </button>
          )}

          {/* Active Feeds Badge */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">{totalChannels}</span>
            <span className="text-slate-500">Channels</span>
            <span className="text-slate-700">|</span>
            <Film size={12} className="text-amber-400" />
            <span className="text-amber-400 font-semibold">{movieCount}</span>
            <span className="text-slate-500">Movies</span>
          </div>

          {/* Import / Parse M3U Button (for TV Provider) */}
          <button
            onClick={onOpenImporter}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 border border-slate-800 hover:border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Import or parse new M3U playlist"
          >
            <PlusCircle size={15} />
            <span className="hidden sm:inline">Import Playlist</span>
          </button>
        </div>
      </div>
    </header>
  );
}

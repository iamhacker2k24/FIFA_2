import React from 'react';
import {
  Tv,
  Trophy,
  Film,
  Sparkles,
  GraduationCap,
  PlaySquare,
  Radio,
  Zap,
} from 'lucide-react';

export const PROVIDERS = [
  {
    id: 'tv',
    name: 'TV Provider',
    subtitle: 'Live Cable & Satellite',
    icon: Tv,
    badge: '489+ Live',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    activeColor: 'from-cyan-500/20 to-blue-600/20 border-cyan-400 text-white shadow-cyan-500/20',
    activeIndicator: 'bg-cyan-400',
  },
  {
    id: 'sports',
    name: 'Sports Only',
    subtitle: 'FIFA & Live Matches',
    icon: Trophy,
    badge: 'LIVE 60FPS',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    activeColor: 'from-emerald-500/20 to-teal-600/20 border-emerald-400 text-white shadow-emerald-500/20',
    activeIndicator: 'bg-emerald-400',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    subtitle: 'Movies & Series OTT',
    icon: Film,
    badge: '4K Cinema',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    activeColor: 'from-red-500/20 to-rose-600/20 border-red-500 text-white shadow-red-500/20',
    activeIndicator: 'bg-red-500',
  },
  {
    id: 'pw',
    name: 'PW (Physics Wallah)',
    subtitle: 'JEE, NEET & Batches',
    icon: Sparkles,
    badge: 'Batches',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    activeColor: 'from-amber-500/20 to-orange-600/20 border-amber-400 text-white shadow-amber-500/20',
    activeIndicator: 'bg-amber-400',
  },
  {
    id: 'apnacollege',
    name: 'Apna College',
    subtitle: 'Delta & Sigma Courses',
    icon: GraduationCap,
    badge: 'Coding Tracks',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    activeColor: 'from-blue-500/20 to-indigo-600/20 border-blue-400 text-white shadow-blue-500/20',
    activeIndicator: 'bg-blue-400',
  },
  {
    id: 'ytcourses',
    name: 'YT Paid Courses',
    subtitle: 'Curated Masterclasses',
    icon: PlaySquare,
    badge: 'Premium',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    activeColor: 'from-rose-500/20 to-pink-600/20 border-rose-400 text-white shadow-rose-500/20',
    activeIndicator: 'bg-rose-400',
  },
];

export default function ProviderNav({ activeProvider, onSelectProvider, counts = {} }) {
  return (
    <div className="w-full bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md sticky top-20 z-30 py-3">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-7">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {PROVIDERS.map((prov) => {
            const Icon = prov.icon;
            const isActive = activeProvider === prov.id;

            return (
              <button
                key={prov.id}
                onClick={() => onSelectProvider(prov.id)}
                className={`relative group flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? `bg-gradient-to-r ${prov.activeColor} shadow-lg`
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-100 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                {/* Active bottom glow bar */}
                {isActive && (
                  <span
                    className={`absolute -bottom-1 left-3 right-3 h-0.5 rounded-full ${prov.activeIndicator} shadow-[0_0_8px_currentColor]`}
                  />
                )}

                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} />
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm font-bold tracking-tight ${
                        isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {prov.name}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border ${prov.badgeColor}`}
                    >
                      {counts[prov.id] !== undefined ? `${counts[prov.id]}` : prov.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400/80 hidden md:block">
                    {prov.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


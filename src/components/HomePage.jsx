import React from 'react';
import {
  Tv,
  Trophy,
  Film,
  Sparkles,
  GraduationCap,
  PlaySquare,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Server,
} from 'lucide-react';

export const SECTIONS = [
  {
    id: 'tv',
    title: 'TV Provider',
    subtitle: 'Live TV Channels, Movies, Sports, News & Categories',
    tag: 'Full Live Feeds',
    icon: Tv,
    color: 'from-cyan-500/20 via-blue-600/10 to-transparent',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    btnBg: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
    countKey: 'tv',
    countLabel: 'Channels',
  },
  {
    id: 'sports',
    title: 'Sports Only',
    subtitle: 'Dedicated Live Sports Streams & Match Center',
    tag: 'Live Sports',
    icon: Trophy,
    color: 'from-emerald-500/20 via-teal-600/10 to-transparent',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    countKey: 'sports',
    countLabel: 'Streams',
  },
  {
    id: 'netflix',
    title: 'Netflix',
    subtitle: 'Cinema, Movies & Web Series Streaming Hub',
    tag: 'Cinema OTT',
    icon: Film,
    color: 'from-red-500/20 via-rose-600/10 to-transparent',
    borderColor: 'border-red-500/30 hover:border-red-400',
    iconBg: 'bg-red-500/20 text-red-400',
    btnBg: 'bg-red-600 hover:bg-red-500 text-white',
    countKey: 'netflix',
    countLabel: 'Titles',
  },
  {
    id: 'pw',
    title: 'PW',
    subtitle: 'Physics Wallah Batches, Lectures & Study Material',
    tag: 'EdTech Portal',
    icon: Sparkles,
    color: 'from-amber-500/20 via-orange-600/10 to-transparent',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    iconBg: 'bg-amber-500/20 text-amber-400',
    btnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    countKey: 'pw',
    countLabel: 'Lectures',
  },
  {
    id: 'apnacollege',
    title: 'Apna College',
    subtitle: 'Delta Web Dev, Sigma DSA & Placement Coding Courses',
    tag: 'Coding Hub',
    icon: GraduationCap,
    color: 'from-blue-500/20 via-indigo-600/10 to-transparent',
    borderColor: 'border-blue-500/30 hover:border-blue-400',
    iconBg: 'bg-blue-500/20 text-blue-400',
    btnBg: 'bg-blue-600 hover:bg-blue-500 text-white',
    countKey: 'apnacollege',
    countLabel: 'Courses',
  },
  {
    id: 'ytcourses',
    title: 'YT Paid Course',
    subtitle: 'Curated Premium YouTube Masterclasses & Tutorials',
    tag: 'Premium Hub',
    icon: PlaySquare,
    color: 'from-rose-500/20 via-pink-600/10 to-transparent',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    iconBg: 'bg-rose-500/20 text-rose-400',
    btnBg: 'bg-rose-600 hover:bg-rose-500 text-white',
    countKey: 'ytcourses',
    countLabel: 'Courses',
  },
];

export default function HomePage({ onOpenSection, counts = {} }) {
  const handleOpenNewWindow = (e, sectionId) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?section=${sectionId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8 py-4">
      {/* Home Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <Server size={13} />
              Server Side Hub Active
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck size={13} />
              Stream Proxy Online
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Select A Section To Open
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Click on any section card below to open its dedicated window. All live streaming, channel grids, and content are organized under each provider.
          </p>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const count = counts[section.countKey] || 0;

          return (
            <div
              key={section.id}
              onClick={() => onOpenSection(section.id)}
              className={`group relative bg-slate-900/90 hover:bg-slate-900 border ${section.borderColor} rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] cursor-pointer`}
            >
              <div className="space-y-4">
                {/* Header of Card */}
                <div className="flex items-center justify-between">
                  <div className={`p-3.5 rounded-2xl ${section.iconBg} border border-white/5 shadow-inner`}>
                    <Icon size={26} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-950/80 text-slate-300 border border-slate-800">
                      {count} {section.countLabel}
                    </span>
                    <button
                      onClick={(e) => handleOpenNewWindow(e, section.id)}
                      title="Open in new browser tab / window"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                    >
                      <ExternalLink size={15} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                      {section.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                      {section.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    {section.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">
                  Click to open window
                </span>
                <button
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${section.btnBg}`}
                >
                  <span>Open</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


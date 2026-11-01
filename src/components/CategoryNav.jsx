import React from 'react';
import {
  Film,
  Tv,
  Radio,
  Flame,
  Globe,
  Heart,
  Music,
  Smile,
  Compass,
  Sparkles,
  CloudSun,
  Shield,
  Layers,
} from 'lucide-react';

export default function CategoryNav({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  favoriteCount,
}) {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'All':
        return <Layers size={14} />;
      case 'Movies':
        return <Film size={14} className="text-amber-400" />;
      case 'Sports':
        return <Flame size={14} className="text-rose-400" />;
      case 'News':
        return <Radio size={14} className="text-blue-400" />;
      case 'Bangla':
        return <Tv size={14} className="text-emerald-400" />;
      case 'Kids':
        return <Smile size={14} className="text-yellow-400" />;
      case 'Music':
        return <Music size={14} className="text-purple-400" />;
      case 'Documentary':
        return <Compass size={14} className="text-teal-400" />;
      case 'Weather':
        return <CloudSun size={14} className="text-sky-400" />;
      case 'Favorites':
        return <Heart size={14} className="text-pink-400" fill="currentColor" />;
      default:
        return <Globe size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-3 mb-6">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((cat) => {
          const count = cat === 'Favorites' ? favoriteCount : categoryCounts[cat] || 0;
          const isSelected = selectedCategory === cat;
          const isMovieCategory = cat === 'Movies';

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? isMovieCategory
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
            >
              {getCategoryIcon(cat)}
              <span>{cat}</span>
              {count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-black/20 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

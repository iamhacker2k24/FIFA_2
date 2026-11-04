import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Play,
  Plus,
  Radio,
  ArrowLeft,
  X,
  Search,
  ExternalLink,
} from 'lucide-react';

export default function SportsHub({ onSelectStream, onBackToHome }) {
  const [sportsStreams, setSportsStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for adding new stream
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Cricket');
  const [event, setEvent] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [resolution, setResolution] = useState('1080p');
  const [thumbnail, setThumbnail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sports');
      if (res.ok) {
        const data = await res.json();
        setSportsStreams(data);
      }
    } catch (err) {
      console.warn('Could not load sports streams:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !streamUrl.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/sports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          event: event.trim(),
          streamUrl: streamUrl.trim(),
          resolution: resolution.trim(),
          thumbnail: thumbnail.trim(),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setSportsStreams((prev) => [result.item, ...prev]);
        setIsAddModalOpen(false);
        setTitle('');
        setEvent('');
        setStreamUrl('');
        setThumbnail('');
      }
    } catch (err) {
      console.error('Failed to add sports stream:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Derive unique categories from active streams
  const categories = useMemo(() => {
    const set = new Set(['All']);
    sportsStreams.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [sportsStreams]);

  // Filtered streams by category and search term
  const filtered = useMemo(() => {
    return sportsStreams.filter((item) => {
      const matchCat = selectedSport === 'All' || item.category === selectedSport;
      const matchSearch =
        !searchTerm.trim() ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.event?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [sportsStreams, selectedSport, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar with Back to Home */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Sports Stream</span>
        </button>
      </div>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Trophy size={26} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sports Only
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Live Cricket, Football & Multi-Sport Broadcast Channels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              {sportsStreams.length} Live Channels Available
            </span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      {sportsStreams.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedSport(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                  selectedSport === cat
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Streams Grid or Clean Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
          <span>Loading sports streams...</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectStream(item, filtered)}
              className="group relative bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col"
            >
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center p-2">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/40 to-slate-900 text-emerald-400">
                    <Trophy size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent pointer-events-none" />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-600 text-white flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {item.status || 'LIVE'}
                  </span>
                  {item.resolution && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-emerald-400 border border-emerald-500/40">
                      {item.resolution}
                    </span>
                  )}
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play size={22} className="ml-0.5 fill-slate-950" />
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  {item.event && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {item.event}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Radio size={12} />
                    <span>Watch Stream</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px]">{item.category}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.streamUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Open in new window"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
            <Trophy size={28} />
          </div>
          <h4 className="text-base font-bold text-slate-200">No Channels Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {searchTerm ? `No results matching "${searchTerm}". Try another search term.` : 'No sports streams available.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Trophy size={18} />
                </div>
                <h3 className="text-sm font-bold text-white">Add Sports Stream</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stream / Match Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Cricket">Cricket</option>
                    <option value="Football">Football</option>
                    <option value="Multi-Sport">Multi-Sport</option>
                    <option value="National">National</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="HD 1080p">HD 1080p</option>
                    <option value="SD 720p">SD 720p</option>
                    <option value="4K UHD">4K UHD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event / League (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Tournament name"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stream URL (.m3u8 or web stream link) *</label>
                <input
                  type="text"
                  required
                  placeholder="Paste stream link"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Add Stream'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Film,
  Play,
  Plus,
  Star,
  ArrowLeft,
  X,
} from 'lucide-react';

export default function NetflixHub({ onSelectMovie, onBackToHome }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');
  const [rating, setRating] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/netflix');
      if (res.ok) {
        const data = await res.json();
        setMovies(data);
      }
    } catch (err) {
      console.warn('Could not load netflix items:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/netflix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          year: year.trim(),
          rating: rating.trim(),
          duration: duration.trim(),
          description: description.trim(),
          poster: poster.trim(),
          streamUrl: streamUrl.trim(),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setMovies((prev) => [result.item, ...prev]);
        setIsAddModalOpen(false);
        setTitle('');
        setCategory('');
        setYear('');
        setRating('');
        setDuration('');
        setDescription('');
        setPoster('');
        setStreamUrl('');
      }
    } catch (err) {
      console.error('Failed to add movie:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Nav with Back to Home */}
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
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Movie / Show</span>
        </button>
      </div>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-950 border border-red-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30">
            <Film size={26} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Netflix
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Movies, web series and cinema entertainment
            </p>
          </div>
        </div>
      </div>

      {/* Movies Grid or Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
          <span>Loading titles...</span>
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {movies.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectMovie(item)}
              className="group relative bg-slate-900 border border-slate-800/80 hover:border-red-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[2/3] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-950/40 to-slate-900 text-red-400">
                    <Film size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {item.rating && (
                  <div className="absolute top-2 right-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      {item.rating}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play size={22} className="ml-0.5 fill-white" />
                  </div>
                </div>
              </div>

              <div className="p-3">
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                  {item.year && <span>{item.year}</span>}
                  {item.duration && <span>• {item.duration}</span>}
                  {item.category && <span>• {item.category}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 text-red-500 border border-red-500/20 flex items-center justify-center mb-3">
            <Film size={28} />
          </div>
          <h4 className="text-base font-bold text-slate-200">No Titles Added Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            This section is ready. Click the button below to add your movies or series.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Movie / Show</span>
          </button>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                  <Film size={18} />
                </div>
                <h3 className="text-sm font-bold text-white">Add Movie / Series</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rating</label>
                  <input
                    type="text"
                    placeholder="e.g. 8.5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 2h"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category / Genre</label>
                <input
                  type="text"
                  placeholder="e.g. Action, Drama, Sci-Fi"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Short description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Poster Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={poster}
                  onChange={(e) => setPoster(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stream URL (.m3u8, direct video, or YouTube)</label>
                <input
                  type="text"
                  placeholder="Enter video link"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  {submitting ? 'Saving...' : 'Add Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

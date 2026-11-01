import React, { useState, useEffect } from 'react';
import {
  PlaySquare,
  Play,
  Plus,
  ArrowLeft,
  X,
  BookOpen,
} from 'lucide-react';

export default function YTPaidCoursesHub({ onSelectCourse, onBackToHome }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('All Levels');
  const [duration, setDuration] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ytcourses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.warn('Could not load YT courses:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/ytcourses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          creator: creator.trim(),
          category: category.trim(),
          level: level.trim(),
          duration: duration.trim(),
          thumbnail: thumbnail.trim(),
          videoUrl: videoUrl.trim(),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setCourses((prev) => [result.item, ...prev]);
        setIsAddModalOpen(false);
        setTitle('');
        setCreator('');
        setCategory('');
        setDuration('');
        setVideoUrl('');
        setThumbnail('');
      }
    } catch (err) {
      console.error('Failed to add course:', err);
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
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Course</span>
        </button>
      </div>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border border-rose-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
            <PlaySquare size={26} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              YT Paid Course
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Curated YouTube masterclasses and video tutorials
            </p>
          </div>
        </div>
      </div>

      {/* Grid or Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-rose-400/30 border-t-rose-400 animate-spin" />
          <span>Loading courses...</span>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {courses.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectCourse(item)}
              className="group relative bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col"
            >
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-950/40 to-slate-900 text-rose-400">
                    <PlaySquare size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  {item.level && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-md">
                      {item.level}
                    </span>
                  )}
                  {item.duration && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-slate-300 border border-slate-700">
                      {item.duration}
                    </span>
                  )}
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play size={22} className="ml-0.5 fill-white" />
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {item.category && (
                    <span className="text-[11px] font-semibold text-rose-400">
                      {item.category}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-2 mt-0.5">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-300 truncate">{item.creator || 'Course'}</span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1 shrink-0">
                    <Play size={12} /> Watch
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-3">
            <PlaySquare size={28} />
          </div>
          <h4 className="text-base font-bold text-slate-200">No Courses Added Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            This section is ready. Click the button below to add your courses or tutorial playlists.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Course</span>
          </button>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
                  <PlaySquare size={18} />
                </div>
                <h3 className="text-sm font-bold text-white">Add Course</h3>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Web Dev, System Design"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Creator / Channel</label>
                  <input
                    type="text"
                    placeholder="Channel name"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 5h"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Video URL (YouTube or HLS/MP4) *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter video link"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  {submitting ? 'Saving...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

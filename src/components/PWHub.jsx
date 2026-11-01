import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Plus,
  ArrowLeft,
  X,
  BookOpen,
} from 'lucide-react';

export default function PWHub({ onSelectLecture, onBackToHome }) {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [batch, setBatch] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [title, setTitle] = useState('');
  const [teacher, setTeacher] = useState('');
  const [duration, setDuration] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [notesUrl, setNotesUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pw');
      if (res.ok) {
        const data = await res.json();
        setLectures(data);
      }
    } catch (err) {
      console.warn('Could not load PW content:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/pw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch: batch.trim(),
          subject: subject.trim(),
          chapter: chapter.trim(),
          title: title.trim(),
          teacher: teacher.trim(),
          duration: duration.trim(),
          thumbnail: thumbnail.trim(),
          videoUrl: videoUrl.trim(),
          notesUrl: notesUrl.trim(),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setLectures((prev) => [result.item, ...prev]);
        setIsAddModalOpen(false);
        setTitle('');
        setBatch('');
        setSubject('');
        setChapter('');
        setTeacher('');
        setDuration('');
        setVideoUrl('');
        setThumbnail('');
        setNotesUrl('');
      }
    } catch (err) {
      console.error('Failed to add PW content:', err);
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
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add PW Content</span>
        </button>
      </div>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles size={26} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              PW
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Physics Wallah batches, lectures and courses
            </p>
          </div>
        </div>
      </div>

      {/* Grid or Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
          <span>Loading PW content...</span>
        </div>
      ) : lectures.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lectures.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectLecture(item)}
              className="group relative bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col"
            >
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950/40 to-slate-900 text-amber-400">
                    <Sparkles size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  {item.subject && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950">
                      {item.subject}
                    </span>
                  )}
                  {item.duration && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-slate-300 border border-slate-700">
                      {item.duration}
                    </span>
                  )}
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play size={22} className="ml-0.5 fill-slate-950" />
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {item.chapter && (
                    <span className="text-[11px] font-semibold text-amber-400">
                      {item.chapter}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 mt-0.5">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-300 truncate">{item.batch || item.teacher || 'PW Lecture'}</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1 shrink-0">
                    <Play size={12} /> Watch
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3">
            <Sparkles size={28} />
          </div>
          <h4 className="text-base font-bold text-slate-200">No PW Content Added Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            This section is ready. Click the button below to add your lectures or batches.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add PW Content</span>
          </button>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-sm font-bold text-white">Add PW Content</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Batch / Class</label>
                  <input
                    type="text"
                    placeholder="e.g. Lakshya, Arjuna"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Maths"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chapter / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter name"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter lecture title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teacher / Faculty</label>
                  <input
                    type="text"
                    placeholder="Faculty name"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 1h 30m"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {submitting ? 'Saving...' : 'Add Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

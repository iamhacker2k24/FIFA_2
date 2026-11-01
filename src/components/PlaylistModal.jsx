import React, { useState } from 'react';
import { X, Code, Check, Upload, Play, Download, RefreshCw, FileText } from 'lucide-react';
import { parseM3U } from '../utils/m3uParser';

export default function PlaylistModal({ isOpen, onClose, onApplyChannels, currentCount }) {
  const [inputText, setInputText] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTestParse = () => {
    setError('');
    try {
      if (!inputText.trim()) {
        setError('Please paste raw M3U / EXTINF text to convert.');
        return;
      }
      const results = parseM3U(inputText);
      if (results.length === 0) {
        setError('No valid streams or EXTINF entries were detected in the input.');
        return;
      }
      setParsedPreview(results);
    } catch (err) {
      setError(`Parsing error: ${err.message}`);
    }
  };

  const handleApply = () => {
    if (parsedPreview && parsedPreview.length > 0) {
      onApplyChannels(parsedPreview);
      onClose();
    }
  };

  const handleDownloadJSON = () => {
    if (!parsedPreview) return;
    const blob = new Blob([JSON.stringify(parsedPreview, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'channels.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Code size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dynamic M3U-to-JSON Converter</h3>
              <p className="text-xs text-slate-400">
                Paste any M3U playlist — the parser function converts it into structured JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Paste Raw M3U / EXTINF lines:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`#EXTINF:-1 tvg-name="Sample Movie TV" group-title="Movies",Sample Movie TV\nhttps://example.com/stream.m3u8`}
              className="w-full h-36 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs placeholder-slate-600 outline-none focus:border-cyan-500 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Action to trigger parse function */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestParse}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
            >
              <Play size={14} fill="currentColor" /> Run Parser Function
            </button>
            <span className="text-xs text-slate-500">
              Current Active Channels: <strong className="text-slate-300">{currentCount}</strong>
            </span>
          </div>

          {/* Parsed Preview */}
          {parsedPreview && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check size={14} /> Successfully parsed {parsedPreview.length} channels
                </span>
                <button
                  onClick={handleDownloadJSON}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <Download size={12} /> Save as channels.json
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto rounded-xl bg-slate-900/60 p-2 text-[11px] font-mono text-slate-300 border border-slate-800/80">
                <pre>{JSON.stringify(parsedPreview.slice(0, 3), null, 2)}</pre>
                {parsedPreview.length > 3 && (
                  <p className="text-slate-500 mt-2 text-center">
                    ...and {parsedPreview.length - 3} more channels
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!parsedPreview || parsedPreview.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Load into TV Player
          </button>
        </div>
      </div>
    </div>
  );
}

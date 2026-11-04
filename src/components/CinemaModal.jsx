import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Film,
  Tv,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { getStreamUrl, isEmbedUrl } from '../utils/streamHelper';

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : null;
}

export default function CinemaModal({
  channel,
  onClose,
  onNextChannel,
  onPrevChannel,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const rawUrl = channel?.streamUrl || channel?.videoUrl || '';
  const ytEmbed = getYouTubeEmbedUrl(rawUrl);
  const isIframe = channel?.playerType === 'iframe' || (!ytEmbed && isEmbedUrl(rawUrl));
  const embedUrl = ytEmbed || (isIframe ? rawUrl : null);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation (ESC to close, Left/Right for channel switch)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNextChannel) onNextChannel();
      if (e.key === 'ArrowLeft' && onPrevChannel) onPrevChannel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onNextChannel, onPrevChannel]);

  useEffect(() => {
    if (embedUrl) {
      setLoading(false);
      setHasError(false);
      return;
    }

    const video = videoRef.current;
    if (!video || !rawUrl) return;

    setLoading(true);
    setHasError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = getStreamUrl(rawUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.muted = isMuted;
        video.volume = volume;
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setLoading(false);
              setHasError(true);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.muted = isMuted;
      video.volume = volume;
      video.play().then(() => {
        setLoading(false);
        setIsPlaying(true);
      }).catch(() => {
        setLoading(false);
        setHasError(true);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.streamUrl, embedUrl, rawUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setIsPlaying(true));
    else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !isMuted;
    setIsMuted(next);
    v.muted = next;
    if (!next && volume === 0) {
      setVolume(0.8);
      v.volume = 0.8;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!channel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {channel.logo || channel.thumbnail || channel.poster ? (
              <img
                src={channel.logo || channel.thumbnail || channel.poster}
                alt=""
                className="w-8 h-8 rounded-lg object-contain bg-slate-800 p-0.5 border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                {(channel.name || channel.title || 'CH').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white line-clamp-1">{channel.name || channel.title}</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white shrink-0">
                  {channel.status || 'LIVE'}
                </span>
                {channel.isMovie && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black flex items-center gap-0.5 shrink-0">
                    <Film size={10} /> MOVIE
                  </span>
                )}
                {embedUrl && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                    Protected Player
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {channel.group || channel.category || channel.batch || channel.course || 'Live Stream'}
                {channel.resolution ? ` • ${channel.resolution}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const target = embedUrl || streamUrl;
                if (target) window.open(target, '_blank', 'noopener,noreferrer');
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Open in new window"
            >
              <ExternalLink size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Box */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {embedUrl ? (
            <iframe
              key={channel.id || embedUrl}
              src={embedUrl}
              title={channel.name || channel.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              className="w-full h-full object-contain"
              onClick={togglePlay}
            />
          )}

          {loading && !hasError && !embedUrl && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <p className="text-xs text-slate-300 font-medium">Connecting to stream...</p>
            </div>
          )}

          {hasError && !embedUrl && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle size={32} className="text-amber-400 mb-2" />
              <p className="text-sm font-semibold text-slate-200">Stream Currently Unavailable</p>
              <p className="text-xs text-slate-400 mt-1">Please try another channel or refresh</p>
              {onNextChannel && (
                <button
                  onClick={onNextChannel}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Try Next Channel
                </button>
              )}
            </div>
          )}

          {/* Prev/Next arrows on video */}
          {onPrevChannel && (
            <button
              onClick={onPrevChannel}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-cyan-500 text-white transition-all z-10 cursor-pointer"
              title="Previous Channel"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {onNextChannel && (
            <button
              onClick={onNextChannel}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-cyan-500 text-white transition-all z-10 cursor-pointer"
              title="Next Channel"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between p-3.5 bg-slate-900/90 border-t border-slate-800">
          <div className="flex items-center gap-3">
            {!embedUrl ? (
              <>
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </button>

                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-slate-300 hover:text-white cursor-pointer">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVolume(val);
                      if (videoRef.current) {
                        videoRef.current.volume = val;
                        if (val > 0 && isMuted) {
                          setIsMuted(false);
                          videoRef.current.muted = false;
                        }
                      }
                    }}
                    className="w-20 accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Protected stream active • Controls available in player</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

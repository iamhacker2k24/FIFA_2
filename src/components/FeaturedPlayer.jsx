import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  RotateCcw,
  Film,
  Radio,
  Tv,
  ChevronLeft,
  ChevronRight,
  PictureInPicture,
  Heart,
  Share2,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';
import { getStreamUrl } from '../utils/streamHelper';

export default function FeaturedPlayer({
  channel,
  onNextChannel,
  onPrevChannel,
  onClose,
  isFavorite,
  onToggleFavorite,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewers, setViewers] = useState(18420);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [copied, setCopied] = useState(false);

  // Random dynamic viewers fluctuation
  useEffect(() => {
    const base = Math.floor(Math.random() * 8000) + 12000;
    setViewers(base);
    const interval = setInterval(() => {
      setViewers(v => Math.max(1000, v + Math.floor(Math.random() * 60 - 28)));
    }, 4000);
    return () => clearInterval(interval);
  }, [channel?.id]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Main HLS Loader
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel?.streamUrl) return;

    setLoading(true);
    setHasError(false);
    setErrorMessage('');
    setQualities([]);
    setCurrentQuality(-1);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = getStreamUrl(channel.streamUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setLoading(false);
        setHasError(false);
        // Extract multi-bitrate levels
        if (data.levels && data.levels.length > 0) {
          setQualities(
            data.levels.map((lvl, index) => ({
              index,
              height: lvl.height || 'Auto',
              bitrate: Math.round(lvl.bitrate / 1000),
            }))
          );
        }

        video.muted = isMuted;
        video.volume = volume;
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay with sound restricted, fallback to muted autoplay
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.warn('Featured HLS error:', data);
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
              setErrorMessage('Live feed currently unavailable. Stream provider may be offline or georestricted.');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS direct
      video.src = streamUrl;
      video.muted = isMuted;
      video.volume = volume;
      video
        .play()
        .then(() => {
          setLoading(false);
          setIsPlaying(true);
        })
        .catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => {
            setLoading(false);
            setIsPlaying(true);
          }).catch(err => {
            setLoading(false);
            setHasError(true);
            setErrorMessage('Unable to play stream format natively.');
          });
        });
    } else {
      setLoading(false);
      setHasError(true);
      setErrorMessage('HLS is not supported in this browser.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.streamUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    setIsMuted(next);
    video.muted = next;
    if (!next && video.volume === 0) {
      setVolume(0.8);
      video.volume = 0.8;
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
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

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  const handleQualityChange = (e) => {
    const levelIndex = parseInt(e.target.value, 10);
    setCurrentQuality(levelIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  };

  const reloadStream = () => {
    const stream = channel?.streamUrl;
    if (hlsRef.current && stream) {
      setLoading(true);
      setHasError(false);
      hlsRef.current.loadSource(stream);
      hlsRef.current.startLoad();
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(channel.streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!channel) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'mb-8'
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* 16:9 Video Aspect Container */}
      <div className="relative aspect-video max-h-[72vh] w-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          className="w-full h-full object-contain"
          onClick={togglePlay}
        />

        {/* Loading Spinner */}
        {loading && !hasError && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-indigo-500/20 border-b-indigo-400 animate-spin" style={{ animationDirection: 'reverse' }} />
              <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                <Tv size={24} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-200">Buffering {channel.name}...</p>
              <p className="text-xs text-slate-500 mt-1">Connecting to live HLS transmission feed</p>
            </div>
          </div>
        )}

        {/* Error Screen with Fallback & Re-try */}
        {hasError && (
          <div className="absolute inset-0 bg-radial from-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Broadcast Feed Temporarily Offline</h3>
            <p className="text-sm text-slate-400 max-w-md mt-1.5">{errorMessage || 'Unable to establish connection to this streaming source.'}</p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={reloadStream}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
              >
                <RotateCcw size={14} /> Retry Feed
              </button>
              <button
                onClick={onNextChannel}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-all"
              >
                Next Channel <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Top Floating Channel Info Header */}
        <div
          className={`absolute top-0 left-0 right-0 p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 pointer-events-none ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-3.5 pointer-events-auto">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt=""
                className="w-12 h-12 rounded-2xl bg-slate-900/90 p-1.5 object-contain border border-slate-700 shadow-xl"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xl">
                {channel.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
                  {channel.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-md shadow-red-600/40">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  LIVE
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-cyan-950 border border-cyan-800/80 text-cyan-300">
                  {channel.resolution || '1080p'}
                </span>
                {channel.isMovie && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-black flex items-center gap-1 shadow-sm">
                    <Film size={12} /> MOVIE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                <span className="text-slate-400 font-medium">{channel.group}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {viewers.toLocaleString()} Watching Now
                </span>
              </div>
            </div>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => onToggleFavorite(channel.id)}
              className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
                isFavorite
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-black/60 text-slate-300 hover:bg-black/80 hover:text-white border border-slate-700/60'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all"
              title="Copy Stream URL"
            >
              <Share2 size={18} />
            </button>

            {onClose && !isFullscreen && (
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all"
                title="Minimize Cinema Player"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Channel Prev/Next Quick Floating Navigation (Left & Right) */}
        <button
          onClick={onPrevChannel}
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-cyan-500 text-white backdrop-blur-md border border-slate-700/60 transition-all duration-200 z-30 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          title="Previous Channel"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={onNextChannel}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-cyan-500 text-white backdrop-blur-md border border-slate-700/60 transition-all duration-200 z-30 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          title="Next Channel"
        >
          <ChevronRight size={22} />
        </button>

        {/* Bottom Floating Control Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Left Play/Pause & Sound Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/25"
              title={isPlaying ? 'Pause Stream' : 'Play Stream'}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            {/* Volume / Mute Controls */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 backdrop-blur-md">
              <button
                onClick={toggleMute}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : volume < 0.5 ? (
                  <Volume1 size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                title="Volume"
              />
              <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            <button
              onClick={reloadStream}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title="Refresh / Resync Live Feed"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Right Controls: Quality, PiP, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Multi-bitrate Quality Dropdown */}
            {qualities.length > 0 && (
              <select
                value={currentQuality}
                onChange={handleQualityChange}
                className="bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer hover:border-slate-600 transition-all font-medium"
              >
                <option value={-1}>Auto Quality</option>
                {qualities.map(q => (
                  <option key={q.index} value={q.index}>
                    {q.height}p ({q.bitrate} kbps)
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={togglePiP}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title="Picture-in-Picture"
            >
              <PictureInPicture size={18} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 border border-slate-700/60 transition-all font-semibold"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Cinema'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        {/* Copy Toast feedback */}
        {copied && (
          <div className="absolute top-20 right-6 bg-cyan-500 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg animate-fade-in z-40">
            Stream URL Copied!
          </div>
        )}
      </div>
    </div>
  );
}

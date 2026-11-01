import React, { useEffect, useRef, useState, memo } from 'react';
import Hls from 'hls.js';
import { Play, Volume2, VolumeX, Heart, Film, Tv, Radio } from 'lucide-react';
import { getStreamUrl } from '../utils/streamHelper';

const ChannelTile = memo(function ChannelTile({
  channel,
  onSelect,
  isFavorite,
  onToggleFavorite,
  isHovered,
  onHover,
  hoverSoundEnabled = true,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [inView, setInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Strictly enforce mute: ONLY the currently hovered tile has sound!
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered && hoverSoundEnabled && isPlaying) {
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {
        // If browser blocked unmuted autoplay, stay muted
        video.muted = true;
      });
    } else {
      video.muted = true;
    }
  }, [isHovered, hoverSoundEnabled, isPlaying]);

  // Intersection observer to only stream visible tiles (prevent browser freeze)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        rootMargin: '120px',
        threshold: 0.05,
      }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  // HLS stream auto play
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !inView) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    const streamUrl = getStreamUrl(channel.streamUrl);
    setHasError(false);

    if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be') || streamUrl.includes('twitch.tv')) {
      setHasError(true);
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 20,
        maxBufferLength: 8,
        maxMaxBufferLength: 15,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = !(isHovered && hoverSoundEnabled);
        video.play().then(() => {
          setIsPlaying(true);
          setHasError(false);
        }).catch(() => {
          video.muted = true;
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
              setHasError(true);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.muted = !(isHovered && hoverSoundEnabled);
      video.play().then(() => setIsPlaying(true)).catch(() => {
        video.muted = true;
        video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
      });
    } else {
      setHasError(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [inView, channel.streamUrl]);

  const handleMouseEnter = () => {
    onHover(channel.id);
  };

  const handleMouseLeave = () => {
    onHover(null);
  };

  const handleFav = (e) => {
    e.stopPropagation();
    onToggleFavorite(channel.id);
  };

  // Generate color palette based on channel name
  const badgeGradients = [
    'from-rose-500 to-red-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-cyan-500 to-blue-600',
    'from-indigo-500 to-purple-600',
    'from-fuchsia-500 to-pink-600',
  ];
  let hash = 0;
  for (let i = 0; i < channel.name.length; i++) hash += channel.name.charCodeAt(i);
  const gradient = badgeGradients[Math.abs(hash) % badgeGradients.length];
  const initials = channel.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'TV';

  return (
    <div
      ref={containerRef}
      onClick={() => onSelect(channel)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col rounded-xl overflow-hidden bg-slate-900/80 border transition-all duration-200 cursor-pointer ${
        isHovered
          ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl shadow-cyan-500/20 scale-[1.03] z-20'
          : 'border-slate-800/80 hover:border-slate-700 hover:shadow-lg'
      }`}
    >
      {/* Small Screen Video Aspect Box (16:9) */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        {/* First Logo Presentation (always shown as base poster / loading layer) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-3 bg-gradient-to-b from-slate-900 to-slate-950 transition-opacity duration-500 ${
            isPlaying && !hasError ? 'opacity-0 pointer-events-none' : 'opacity-100 z-10'
          }`}
        >
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              onError={() => setImgError(true)}
              className="w-12 h-12 object-contain rounded-lg p-1 bg-slate-800/80 border border-slate-700/60 shadow-md"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}
            >
              {initials}
            </div>
          )}

          <span className="text-[11px] font-semibold text-slate-300 mt-2 text-center line-clamp-1 px-1">
            {channel.name}
          </span>

          {hasError ? (
            <span className="text-[9px] text-amber-400 font-medium mt-0.5">Connecting Feed...</span>
          ) : (
            <span className="text-[9px] text-cyan-400 font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Live Preview
            </span>
          )}
        </div>

        {/* Video Auto-play element (muted by default, ONLY unmuted on mouse hover) */}
        {inView && (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted={true}
            loop
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isPlaying && !hasError ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Floating Badges on Top */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white shadow">
              <span className="w-1 h-1 rounded-full bg-white animate-ping" />
              LIVE
            </span>

            {channel.isMovie && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-black shadow flex items-center gap-0.5">
                <Film size={9} />
                MOVIE
              </span>
            )}
          </div>

          {/* Sound & Favorite Status Indicator */}
          <div className="flex items-center gap-1 pointer-events-auto">
            {/* Audio Indicator: Green wave when hovered, muted gray otherwise */}
            {isHovered ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-md animate-pulse">
                <Volume2 size={10} />
                SOUND ON
              </span>
            ) : (
              <span className="p-1 rounded-full bg-black/60 text-slate-400 text-[10px]">
                <VolumeX size={11} />
              </span>
            )}

            <button
              onClick={handleFav}
              className={`p-1 rounded-full backdrop-blur-md transition-all ${
                isFavorite
                  ? 'bg-rose-500 text-white'
                  : 'bg-black/60 text-slate-300 hover:text-rose-400 hover:bg-black/80'
              }`}
              title={isFavorite ? 'Favorited' : 'Favorite'}
            >
              <Heart size={11} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Hover Click Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-lg shadow-cyan-500/30">
            <Play size={10} fill="currentColor" /> Click to Expand Cinema
          </span>
        </div>
      </div>

      {/* Small Screen Channel Name & Category Details */}
      <div className="p-2 flex items-center gap-2">
        {/* Tiny Logo */}
        <div className="flex-shrink-0">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt=""
              onError={() => setImgError(true)}
              className="w-6 h-6 object-contain rounded bg-slate-800 p-0.5 border border-slate-700/60"
            />
          ) : (
            <div
              className={`w-6 h-6 rounded bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-[9px]`}
            >
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
            {channel.name}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="truncate">{channel.group}</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono text-[9px]">{channel.resolution || 'HD'}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChannelTile;

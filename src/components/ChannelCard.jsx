import React, { useEffect, useRef, useState, memo } from 'react';
import Hls from 'hls.js';
import { Play, Volume2, VolumeX, Maximize2, Heart, Tv, Film, Radio, AlertCircle } from 'lucide-react';

const ChannelCard = memo(function ChannelCard({
  channel,
  isSelected,
  onSelect,
  isFavorite,
  onToggleFavorite,
  globalMuted = true,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [inView, setInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isCardMuted, setIsCardMuted] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Sync with global mute preference initially
  useEffect(() => {
    setIsCardMuted(globalMuted);
    if (videoRef.current) {
      videoRef.current.muted = globalMuted;
    }
  }, [globalMuted]);

  // Use Intersection Observer so only channels visible in viewport instantiate HLS & play
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        rootMargin: '100px', // Preload slightly before appearing
        threshold: 0.1,
      }
    );

    const current = containerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  // Handle HLS stream mounting and unmounting
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

    const streamUrl = channel.streamUrl;
    setHasError(false);

    if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be') || streamUrl.includes('twitch.tv')) {
      // YouTube/Twitch live embed or link
      setHasError(true);
      return;
    }

    // Direct HLS or MPEG-TS
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = isCardMuted;
        video.play().then(() => {
          setIsPlaying(true);
          setHasError(false);
        }).catch(() => {
          // Autoplay policy fallback: ensure muted
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try recovering network error once
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
      // Native Safari iOS/macOS HLS
      video.src = streamUrl;
      video.muted = isCardMuted;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
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
  }, [inView, channel.streamUrl, isCardMuted]);

  const toggleSound = (e) => {
    e.stopPropagation();
    const nextMuted = !isCardMuted;
    setIsCardMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(channel.id);
  };

  // Generate color hash for channel badge
  const getBadgeColor = (name) => {
    const colors = [
      'from-rose-500 to-red-600',
      'from-amber-500 to-orange-600',
      'from-emerald-500 to-teal-600',
      'from-cyan-500 to-blue-600',
      'from-indigo-500 to-purple-600',
      'from-fuchsia-500 to-pink-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = channel.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'TV';

  return (
    <div
      ref={containerRef}
      onClick={() => onSelect(channel)}
      className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border ${
        isSelected
          ? 'bg-slate-900/90 border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl shadow-cyan-500/20 scale-[1.02]'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850 hover:shadow-xl hover:shadow-black/60 hover:-translate-y-1'
      } backdrop-blur-md`}
    >
      {/* Video Container (16:9 Aspect Ratio) */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        {inView ? (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted={isCardMuted}
            loop
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isPlaying && !hasError ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : null}

        {/* Loading / Offline / Standby State */}
        {(!isPlaying || hasError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-radial from-slate-900 to-slate-950 p-4 text-center">
            {hasError ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 animate-pulse">
                  <AlertCircle size={20} />
                </div>
                <span className="text-xs text-slate-400 font-medium">Feed Connecting...</span>
                <span className="text-[10px] text-slate-500">Click to load in main player</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {channel.logo && !imgError ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      onError={() => setImgError(true)}
                      className="w-12 h-12 rounded-xl object-contain bg-slate-800/80 p-1.5 border border-slate-700/60 shadow-lg"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getBadgeColor(channel.name)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                      {initials}
                    </div>
                  )}
                  {/* Subtle spinner while loading */}
                  <div className="absolute -inset-1 rounded-2xl border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                </div>
                <span className="text-xs text-slate-400 font-medium tracking-wide">Connecting Live Stream</span>
              </div>
            )}
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5">
            {/* Live Indicator */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/90 text-white shadow-md shadow-red-500/40 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE
            </span>

            {/* Resolution */}
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 border border-slate-700/60 text-cyan-300 backdrop-blur-md">
              {channel.resolution || 'HD'}
            </span>

            {/* Movie Tag */}
            {channel.isMovie && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/90 text-black shadow-sm flex items-center gap-0.5">
                <Film size={10} />
                MOVIE
              </span>
            )}
          </div>

          {/* Interactive Actions on Card */}
          <div className="flex items-center gap-1 pointer-events-auto">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isCardMuted ? 'Unmute preview sound' : 'Mute preview sound'}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                !isCardMuted
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 ring-2 ring-cyan-300'
                  : 'bg-black/60 text-slate-300 hover:bg-black/80 hover:text-white'
              }`}
            >
              {!isCardMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                isFavorite
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-black/60 text-slate-300 hover:bg-black/80 hover:text-rose-400'
              }`}
            >
              <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Hover Quick Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 pointer-events-none">
          <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1 drop-shadow">
            <Play size={12} fill="currentColor" /> Click to Play Cinema
          </span>
          <span className="text-[10px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/60">
            {isCardMuted ? 'Playing Muted' : 'Sound Active'}
          </span>
        </div>
      </div>

      {/* Channel Info Row */}
      <div className="p-3.5 flex items-center gap-3">
        {/* Channel Icon */}
        <div className="flex-shrink-0">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt=""
              onError={() => setImgError(true)}
              className="w-10 h-10 rounded-xl object-contain bg-slate-800 border border-slate-700/60 p-1 shadow-sm"
            />
          ) : (
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getBadgeColor(channel.name)} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
              {initials}
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold text-slate-100 truncate group-hover:text-cyan-400 transition-colors">
              {channel.name}
            </h4>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-medium text-slate-400 truncate">
              {channel.group}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          </div>
        </div>

        {/* Play Button Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 group-hover:bg-cyan-500 text-slate-400 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
          <Play size={14} fill="currentColor" className="ml-0.5" />
        </div>
      </div>
    </div>
  );
});

export default ChannelCard;

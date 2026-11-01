import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import CategoryNav from './components/CategoryNav';
import ChannelTile from './components/ChannelTile';
import CinemaModal from './components/CinemaModal';
import PlaylistModal from './components/PlaylistModal';
import HomePage from './components/HomePage';
import SportsHub from './components/SportsHub';
import NetflixHub from './components/NetflixHub';
import PWHub from './components/PWHub';
import ApnaCollegeHub from './components/ApnaCollegeHub';
import YTPaidCoursesHub from './components/YTPaidCoursesHub';
import initialChannels from './Data/channels.json';
import {
  Film,
  Tv,
  ArrowLeft,
  Home,
} from 'lucide-react';

const CHANNELS_PER_PAGE = 50; // 5 columns by 10 rows

export default function App() {
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('section');
      if (['tv', 'sports', 'netflix', 'pw', 'apnacollege', 'ytcourses'].includes(s)) {
        return s;
      }
    } catch {}
    return 'home';
  });

  const [channels, setChannels] = useState(initialChannels || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyMovies, setOnlyMovies] = useState(false);
  const [activeModalChannel, setActiveModalChannel] = useState(null);
  const [activeModalList, setActiveModalList] = useState([]);
  const [hoveredChannelId, setHoveredChannelId] = useState(null);
  const [hoverSoundEnabled, setHoverSoundEnabled] = useState(true);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('stream_favs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(CHANNELS_PER_PAGE);
  const [isSyncingServer, setIsSyncingServer] = useState(false);

  // Section items live counts for Home page
  const [sectionCounts, setSectionCounts] = useState({
    tv: (initialChannels || []).length,
    sports: 0,
    netflix: 0,
    pw: 0,
    apnacollege: 0,
    ytcourses: 0,
  });

  // Handle URL history navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('section');
      if (['tv', 'sports', 'netflix', 'pw', 'apnacollege', 'ytcourses'].includes(s)) {
        setActiveSection(s);
      } else {
        setActiveSection('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenSection = (sectionId) => {
    setActiveSection(sectionId);
    try {
      const url = sectionId === 'home' ? window.location.pathname : `?section=${sectionId}`;
      window.history.pushState(null, '', url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  // Load channels from backend server API
  const refreshChannelsFromServer = useCallback(async () => {
    try {
      setIsSyncingServer(true);
      const res = await fetch('/api/channels');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.channels || [];
      if (list && list.length > 0) {
        setChannels(list);
      }
    } catch (err) {
      console.warn('Backend server not responding, using cached channels:', err.message);
    } finally {
      setIsSyncingServer(false);
    }
  }, []);

  // Refresh counts across all sections for the Home portal
  const refreshCounts = useCallback(async () => {
    try {
      const [sportsRes, netflixRes, pwRes, apnaRes, ytcRes] = await Promise.allSettled([
        fetch('/api/sports').then((r) => r.json()),
        fetch('/api/netflix').then((r) => r.json()),
        fetch('/api/pw').then((r) => r.json()),
        fetch('/api/apnacollege').then((r) => r.json()),
        fetch('/api/ytcourses').then((r) => r.json()),
      ]);

      setSectionCounts({
        tv: channels.length,
        sports: sportsRes.status === 'fulfilled' && Array.isArray(sportsRes.value) ? sportsRes.value.length : 0,
        netflix: netflixRes.status === 'fulfilled' && Array.isArray(netflixRes.value) ? netflixRes.value.length : 0,
        pw: pwRes.status === 'fulfilled' && Array.isArray(pwRes.value) ? pwRes.value.length : 0,
        apnacollege: apnaRes.status === 'fulfilled' && Array.isArray(apnaRes.value) ? apnaRes.value.length : 0,
        ytcourses: ytcRes.status === 'fulfilled' && Array.isArray(ytcRes.value) ? ytcRes.value.length : 0,
      });
    } catch {}
  }, [channels.length]);

  useEffect(() => {
    refreshChannelsFromServer();
  }, [refreshChannelsFromServer]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, activeSection]);

  const sentinelRef = useRef(null);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem('stream_favs', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggleFavorite = useCallback((channelId) => {
    setFavorites((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  }, []);

  // Compute category list and statistics for TV Provider
  const { categories, categoryCounts, movieCount } = useMemo(() => {
    const counts = {};
    let movies = 0;

    channels.forEach((ch) => {
      counts[ch.group] = (counts[ch.group] || 0) + 1;
      if (ch.isMovie) movies++;
    });

    counts['All'] = channels.length;
    counts['Movies'] = movies;

    const baseCategories = [
      'All',
      'Movies',
      'Sports',
      'News',
      'Bangla',
      'Kids',
      'Music',
      'Hindi & India',
      'English',
      'Documentary',
      'Favorites',
    ];

    return {
      categories: baseCategories,
      categoryCounts: counts,
      movieCount: movies,
    };
  }, [channels]);

  // Handle category selection
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat === 'Movies') {
      setOnlyMovies(true);
    } else {
      setOnlyMovies(false);
    }
    setVisibleCount(CHANNELS_PER_PAGE);
  };

  // Toggle movie shortcut
  const handleToggleOnlyMovies = () => {
    const next = !onlyMovies;
    setOnlyMovies(next);
    if (next) {
      setSelectedCategory('Movies');
    } else if (selectedCategory === 'Movies') {
      setSelectedCategory('All');
    }
    setVisibleCount(CHANNELS_PER_PAGE);
  };

  // Filter channels based on search, category, onlyMovies, favorites
  const filteredChannels = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return channels.filter((channel) => {
      if (onlyMovies && !channel.isMovie) return false;

      if (selectedCategory === 'Favorites') {
        if (!favorites.includes(channel.id)) return false;
      } else if (selectedCategory === 'Movies') {
        if (!channel.isMovie) return false;
      } else if (selectedCategory !== 'All' && !onlyMovies) {
        if (channel.group !== selectedCategory) return false;
      }

      if (q) {
        const matchesName = channel.name.toLowerCase().includes(q);
        const matchesGroup = channel.group.toLowerCase().includes(q);
        const matchesMovie = q === 'movie' && channel.isMovie;
        if (!matchesName && !matchesGroup && !matchesMovie) return false;
      }

      return true;
    });
  }, [channels, searchTerm, selectedCategory, onlyMovies, favorites]);

  // Progressive channels for infinite scroll
  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  // Infinite scroll observer
  useEffect(() => {
    if (activeSection !== 'tv') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < filteredChannels.length) {
          setVisibleCount((prev) => Math.min(prev + CHANNELS_PER_PAGE, filteredChannels.length));
        }
      },
      { rootMargin: '300px', threshold: 0.1 }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [visibleCount, filteredChannels.length, activeSection]);

  // Modal navigation
  const currentModalIndex = useMemo(() => {
    if (!activeModalChannel) return -1;
    const list = activeModalList.length > 0 ? activeModalList : channels;
    return list.findIndex((c) => c.id === activeModalChannel.id);
  }, [channels, activeModalList, activeModalChannel]);

  const handleNextChannel = () => {
    const list = activeModalList.length > 0 ? activeModalList : channels;
    if (list.length === 0 || currentModalIndex === -1) return;
    const nextIdx = (currentModalIndex + 1) % list.length;
    setActiveModalChannel(list[nextIdx]);
  };

  const handlePrevChannel = () => {
    const list = activeModalList.length > 0 ? activeModalList : channels;
    if (list.length === 0 || currentModalIndex === -1) return;
    const prevIdx = (currentModalIndex - 1 + list.length) % list.length;
    setActiveModalChannel(list[prevIdx]);
  };

  const handleApplyNewChannels = async (newChannels) => {
    setChannels(newChannels);
    setVisibleCount(CHANNELS_PER_PAGE);

    // Persist to server backend
    try {
      await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannels),
      });
    } catch (err) {
      console.warn('Failed to sync new channels to backend:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        onOpenImporter={() => setIsImporterOpen(true)}
        totalChannels={channels.length}
        movieCount={movieCount}
        activeSection={activeSection}
        onGoHome={() => handleOpenSection('home')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-5 lg:px-7 py-5">
        {/* ==================== HOME PAGE PORTAL ==================== */}
        {activeSection === 'home' && (
          <HomePage
            onOpenSection={handleOpenSection}
            counts={sectionCounts}
          />
        )}

        {/* ==================== 1. TV PROVIDER SECTION ==================== */}
        {activeSection === 'tv' && (
          <div className="space-y-6 animate-fade-in">
            {/* TV Provider Sub-Navbar */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800/80">
              <button
                onClick={() => handleOpenSection('home')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeft size={16} />
                <span>Back to Home</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Current Window:</span>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  📺 TV Provider ({channels.length} Live Channels)
                </span>
              </div>
            </div>

            {/* Top Search Option Bar */}
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={(val) => {
                setSearchTerm(val);
                setVisibleCount(CHANNELS_PER_PAGE);
              }}
              onlyMovies={onlyMovies}
              onToggleOnlyMovies={handleToggleOnlyMovies}
              globalMuted={!hoverSoundEnabled}
              onToggleGlobalMute={() => setHoverSoundEnabled(!hoverSoundEnabled)}
              totalResults={filteredChannels.length}
              totalChannels={channels.length}
              activeCategory={selectedCategory}
              onCategorySelect={handleSelectCategory}
            />

            {/* Category Navigation Pills */}
            <CategoryNav
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              categoryCounts={categoryCounts}
              favoriteCount={favorites.length}
            />

            {/* 5 by 10 Small Screen Video Grid with Infinite Scroll */}
            {displayedChannels.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {displayedChannels.map((channel) => (
                    <ChannelTile
                      key={channel.id}
                      channel={channel}
                      onSelect={(ch) => {
                        setActiveModalChannel(ch);
                        setActiveModalList(displayedChannels);
                      }}
                      isFavorite={favorites.includes(channel.id)}
                      onToggleFavorite={toggleFavorite}
                      isHovered={hoveredChannelId === channel.id}
                      onHover={setHoveredChannelId}
                      hoverSoundEnabled={hoverSoundEnabled}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Sentinel element */}
                <div ref={sentinelRef} className="w-full py-8 flex flex-col items-center justify-center">
                  {visibleCount < filteredChannels.length ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-4 h-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                      <span>Loading more live feeds... ({displayedChannels.length} / {filteredChannels.length})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 font-medium">
                      ✓ All {filteredChannels.length} live channels loaded
                    </span>
                  )}
                </div>
              </>
            ) : (
              /* Empty Search State */
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-slate-700">
                  <Film size={26} />
                </div>
                <h3 className="text-base font-bold text-slate-200">No Channels Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  No live channels match "{searchTerm}". Try clearing your search query or reset category filter.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setOnlyMovies(false);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                >
                  Reset Filters & Show All
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== 2. SPORTS ONLY SECTION ==================== */}
        {activeSection === 'sports' && (
          <div className="animate-fade-in">
            <SportsHub
              onSelectStream={(item, list) => {
                setActiveModalChannel(item);
                setActiveModalList(list || []);
              }}
              onBackToHome={() => handleOpenSection('home')}
            />
          </div>
        )}

        {/* ==================== 3. NETFLIX SECTION ==================== */}
        {activeSection === 'netflix' && (
          <div className="animate-fade-in">
            <NetflixHub
              onSelectMovie={(item) => setActiveModalChannel(item)}
              onBackToHome={() => handleOpenSection('home')}
            />
          </div>
        )}

        {/* ==================== 4. PW SECTION ==================== */}
        {activeSection === 'pw' && (
          <div className="animate-fade-in">
            <PWHub
              onSelectLecture={(item) => setActiveModalChannel(item)}
              onBackToHome={() => handleOpenSection('home')}
            />
          </div>
        )}

        {/* ==================== 5. APNA COLLEGE SECTION ==================== */}
        {activeSection === 'apnacollege' && (
          <div className="animate-fade-in">
            <ApnaCollegeHub
              onSelectLecture={(item) => setActiveModalChannel(item)}
              onBackToHome={() => handleOpenSection('home')}
            />
          </div>
        )}

        {/* ==================== 6. YT PAID COURSE SECTION ==================== */}
        {activeSection === 'ytcourses' && (
          <div className="animate-fade-in">
            <YTPaidCoursesHub
              onSelectCourse={(item) => setActiveModalChannel(item)}
              onBackToHome={() => handleOpenSection('home')}
            />
          </div>
        )}
      </main>

      {/* Cinema Modal when clicking any video or channel */}
      {activeModalChannel && (
        <CinemaModal
          channel={activeModalChannel}
          onClose={() => setActiveModalChannel(null)}
          onNextChannel={handleNextChannel}
          onPrevChannel={handlePrevChannel}
        />
      )}

      {/* Dynamic M3U Parser Modal */}
      <PlaylistModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onApplyChannels={handleApplyNewChannels}
        currentCount={channels.length}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-[1720px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tv size={16} className="text-cyan-400" />
            <span className="font-semibold text-slate-300">DevStream Multi-Portal</span>
            <span>— TV Provider, Sports, Netflix, PW, Apna College, YT Paid Courses</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => handleOpenSection('home')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Home Sections
            </button>
            <span>•</span>
            <button
              onClick={() => handleOpenSection('tv')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              TV Provider
            </button>
            <span>•</span>
            <button
              onClick={() => setIsImporterOpen(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              M3U Importer
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

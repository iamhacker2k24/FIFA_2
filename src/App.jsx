import { useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { useSwipeable } from "react-swipeable";

const EMOJIS = ["⚽", "🔥", "❤️", "😲", "👏", "🏆", "🎉", "💯", "🚀", "🙌"];

export default function App() {
  const playerRef = useRef(null);
  const chatRef = useRef(null);

  const servers = [
    { name: "S_1", url: import.meta.env.VITE_SERVER_1 },
    { name: "S_2", url: import.meta.env.VITE_SERVER_2 },
    { name: "S_3", url: import.meta.env.VITE_SERVER_3 },
    { name: "S_4", url: import.meta.env.VITE_SERVER_4 },
    { name: "S_5", url: import.meta.env.VITE_SERVER_5 },
    { name: "S_6", url: import.meta.env.VITE_SERVER_6 },
    { name: "S_7", url: import.meta.env.VITE_SERVER_7 },
    { name: "S_8", url: import.meta.env.VITE_SERVER_8 },
    { name: "S_9", url: import.meta.env.VITE_SERVER_9 },
    { name: "S_10", url: import.meta.env.VITE_SERVER_10 },
    { name: "S_11", url: import.meta.env.VITE_SERVER_11 }
  ].filter((s) => s.url);

  const [currentServer, setCurrentServer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [viewers, setViewers] = useState(24851);
  const [seconds, setSeconds] = useState(0);
  const [allComments, setAllComments] = useState([]);
  const [liveComments, setLiveComments] = useState([]);
  const [message, setMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);
    const removeTimer = setTimeout(() => {
      setAppReady(true);
    }, 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setViewers((v) =>
        Math.max(1000, v + Math.floor(Math.random() * 50 - 25)),
      );
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/comments")
      .then((r) => r.json())
      .then((data) => {
        setAllComments(
          data.map((x) => ({
            id: x.id,
            user: x.email.split("@")[0],
            message: x.body,
          })),
        );
      });
  }, []);

  useEffect(() => {
    if (!allComments.length) return;

    const timer = setInterval(() => {
      const random =
        allComments[Math.floor(Math.random() * allComments.length)];

      const addEmoji = Math.random() > 0.6;

      setLiveComments((prev) =>
        [
          ...prev,
          {
            ...random,
            message: addEmoji
              ? `${random.message} ${EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
              }`
              : random.message,
          },
        ].slice(-50),
      );
    }, 2500);

    return () => clearInterval(timer);
  }, [allComments]);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [liveComments]);

  useEffect(() => {
    if (!cooldown) return;

    const timer = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const switchServer = (idx) => {
    if (cooldown > 0) {
      alert(`Please wait ${cooldown}s before switching servers`);
      return;
    }

    setLoading(true);
    setCurrentServer(idx);
    setCooldown(5);
  };

  const nextServer = () => switchServer((currentServer + 1) % servers.length);

  const prevServer = () =>
    switchServer((currentServer - 1 + servers.length) % servers.length);

  const handlers = useSwipeable({
    onSwipedLeft: nextServer,
    onSwipedRight: prevServer,
    trackMouse: true,
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    setLiveComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: "You",
        message,
      },
    ]);

    setMessage("");
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (!appReady) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div
          className={`w-full max-w-md transition-all duration-700 ease-in-out ${isFadingOut ? "opacity-0 scale-95 -translate-y-4" : "opacity-100 scale-100 translate-y-0"
            }`}
        >
          <div className="relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-zinc-900/30 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-yellow-500/10 blur-3xl"></div>
            <div className="absolute -right-16 -bottom-16 h-36 w-36 rounded-full bg-green-500/10 blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/30 animate-pulse">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="font-extrabold text-yellow-400 text-xl tracking-wider uppercase">
                Educational Purpose Only
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                This website is created solely for educational purposes. We do not support or promote piracy in any way.
              </p>

              <div className="h-[1px] w-full bg-white/10 my-2"></div>

              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-zinc-400">Created by</p>
                <p className="font-bold text-green-400 text-lg flex items-center gap-2">
                  Debabrata<span className="animate-bounce">💻✨</span>
                </p>
                <p className="font-bold text-orange-400 text-lg flex items-center gap-2">
                  last edit <span >23.44 IND</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 flex justify-between">
          <div className="font-bold text-xl">⚽ FIFA LIVE</div>
          <div>{viewers.toLocaleString()} Watching</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 md:p-5">
        <div
          ref={playerRef}
          {...handlers}
          className={`relative overflow-hidden border border-white/10 bg-black flex items-center justify-center ${isFullscreen ? "w-screen h-screen rounded-none" : "rounded-3xl"
            }`}
        >
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
              Loading stream...
            </div>
          )}

          <iframe
            key={servers[currentServer]?.url}
            src={servers[currentServer]?.url}
            title="Live Stream"
            sandbox="allow-scripts allow-same-origin allow-forms"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer"
            onLoad={() => setLoading(false)}
            className={`w-full border-0 ${isFullscreen
                ? "h-screen"
                : "h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh]"
              }`}
          />

          <div className="absolute top-4 left-4 z-30 bg-red-600 px-3 py-1 rounded-full text-sm font-semibold">
            LIVE
          </div>

          <div className="absolute top-4 right-4 z-30 bg-black/70 px-3 py-1 rounded-full text-sm font-semibold">
            {mm}:{ss}
          </div>

          <button
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 z-30 bg-black/70 hover:bg-black/90 px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {servers.map((s, i) => (
            <button
              key={i}
              onClick={() => switchServer(i)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap ${i === currentServer ? "bg-green-500 text-black" : "bg-white/10"
                }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl">Live Chat</h2>

            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              LIVE
            </div>
          </div>

          <div
            ref={chatRef}
            className="h-80 overflow-y-auto space-y-2 pr-2"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {liveComments.map((c, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur p-3 rounded-xl border border-white/5"
              >
                <div className="text-green-400 text-sm font-semibold">
                  {c.user}
                </div>

                <div className="text-sm text-zinc-200 mt-1">{c.message}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none"
            />

            <button
              onClick={sendMessage}
              className="px-5 rounded-xl bg-green-500 text-black font-semibold"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {cooldown > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold">
          Wait {cooldown}s before changing server
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 p-3 flex justify-between">
        <button onClick={prevServer}>◀ Prev</button>
        <button onClick={toggleFullscreen}>⛶ Fullscreen</button>
        <button onClick={nextServer}>Next ▶</button>
      </div>

      <div className="">
        <footer className="mt-10 border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  ⚽ FIFA LIVE STREAM
                </h3>

                <p className="text-sm text-zinc-400 mt-1">
                  Enjoy live football coverage with multiple streaming servers
                  and live chat.
                </p>
              </div>

              <div className="text-center md:text-right">
                <p className="text-zinc-300 text-sm">
                  Website Created & Developed By
                </p>

                <p className="font-bold text-green-400 text-lg">
                  Debabrata Paul
                </p>

                <p className="text-xs text-zinc-500 mt-1">
                  © {new Date().getFullYear()} All Rights Reserved
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <Analytics />
    </div>
  );
}

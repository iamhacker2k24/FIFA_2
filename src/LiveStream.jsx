import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";

export default function App() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const servers = useMemo(
    () =>
      [
        import.meta.env.VITE_SERVER_1,
        import.meta.env.VITE_SERVER_2,
        import.meta.env.VITE_SERVER_3,
        import.meta.env.VITE_SERVER_4,
        import.meta.env.VITE_SERVER_5,
        import.meta.env.VITE_SERVER_6,
        import.meta.env.VITE_SERVER_7,
        import.meta.env.VITE_SERVER_8,
        import.meta.env.VITE_SERVER_9,
        import.meta.env.VITE_SERVER_10,
      ].filter(Boolean),
    []
  );

  const [currentServer, setCurrentServer] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [qualities, setQualities] = useState([]);
  const [quality, setQuality] = useState(-1);
  const [isLive, setIsLive] = useState(false);

  const currentUrl = servers[currentServer];

  /*
   * Create HLS player
   */
  useEffect(() => {
    const video = videoRef.current;

    if (!video || !currentUrl) {
      setStatus("error");
      setError("No stream URL configured.");
      return;
    }

    console.log(
      `Loading Server ${currentServer + 1}`
    );

    setStatus("loading");
    setError("");
    setQualities([]);
    setQuality(-1);
    setIsLive(false);

    /*
     * Destroy previous player
     */
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    /*
     * Reset video
     */
    video.pause();
    video.removeAttribute("src");
    video.load();

    /*
     * Native HLS
     * Mainly Safari
     */
    if (
      video.canPlayType(
        "application/vnd.apple.mpegurl"
      )
    ) {
      console.log("Using native HLS");

      video.src = currentUrl;

      const onLoadedMetadata = () => {
        console.log("Native HLS loaded");

        setStatus("ready");

        if (video.duration === Infinity) {
          setIsLive(true);
        }

        video
          .play()
          .then(() => {
            setStatus("playing");
          })
          .catch(() => {
            console.log(
              "Autoplay blocked. User must press play."
            );
          });
      };

      const onPlaying = () => {
        setStatus("playing");
      };

      const onWaiting = () => {
        setStatus("buffering");
      };

      const onError = () => {
        console.error(
          "Native video error:",
          video.error
        );

        setStatus("error");
        setError(
          "The browser could not play this stream."
        );
      };

      video.addEventListener(
        "loadedmetadata",
        onLoadedMetadata
      );

      video.addEventListener(
        "playing",
        onPlaying
      );

      video.addEventListener(
        "waiting",
        onWaiting
      );

      video.addEventListener(
        "error",
        onError
      );

      return () => {
        video.removeEventListener(
          "loadedmetadata",
          onLoadedMetadata
        );

        video.removeEventListener(
          "playing",
          onPlaying
        );

        video.removeEventListener(
          "waiting",
          onWaiting
        );

        video.removeEventListener(
          "error",
          onError
        );

        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    /*
     * HLS.js
     *
     * Chrome
     * Edge
     * Firefox
     */
    if (Hls.isSupported()) {
      console.log("Using HLS.js");

      const hls = new Hls({
        enableWorker: true,

        /*
         * Live stream settings
         */
        lowLatencyMode: false,

        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 8,

        /*
         * Buffer
         */
        maxBufferLength: 30,
        maxMaxBufferLength: 60,

        /*
         * Retry
         */
        manifestLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
        fragLoadingMaxRetry: 3,

        /*
         * Start from highest compatible
         * quality automatically
         */
        startLevel: -1,
      });

      hlsRef.current = hls;

      /*
       * Load master playlist
       */
      hls.loadSource(currentUrl);

      /*
       * Attach video
       */
      hls.attachMedia(video);

      /*
       * Manifest loading
       */
      hls.on(
        Hls.Events.MANIFEST_LOADING,
        (event, data) => {
          console.log(
            "Manifest loading:",
            data.url
          );

          setStatus("loading");
        }
      );

      /*
       * Manifest loaded
       */
      hls.on(
        Hls.Events.MANIFEST_LOADED,
        (event, data) => {
          console.log(
            "Manifest loaded:",
            data
          );
        }
      );

      /*
       * Master playlist parsed
       */
      hls.on(
        Hls.Events.MANIFEST_PARSED,
        (event, data) => {
          console.log(
            "Master playlist parsed"
          );

          console.log(
            "Available qualities:",
            hls.levels
          );

          const levels = hls.levels.map(
            (level, index) => ({
              index,
              width: level.width,
              height: level.height,
              bitrate: level.bitrate,
            })
          );

          setQualities(levels);
          setStatus("ready");

          /*
           * Try autoplay
           */
          video
            .play()
            .then(() => {
              setStatus("playing");
            })
            .catch(() => {
              console.log(
                "Autoplay blocked."
              );
            });
        }
      );

      /*
       * Level changed
       */
      hls.on(
        Hls.Events.LEVEL_SWITCHED,
        (event, data) => {
          console.log(
            "Quality changed:",
            data.level
          );

          setQuality(data.level);
        }
      );

      /*
       * Fragment loaded
       */
      hls.on(
        Hls.Events.FRAG_LOADED,
        (event, data) => {
          console.log(
            "Segment loaded:",
            data.frag.url
          );

          setStatus("playing");
        }
      );

      /*
       * Error handling
       */
      hls.on(
        Hls.Events.ERROR,
        (event, data) => {
          console.error(
            "========== HLS ERROR =========="
          );

          console.error(
            "Type:",
            data.type
          );

          console.error(
            "Details:",
            data.details
          );

          console.error(
            "Fatal:",
            data.fatal
          );

          console.error(
            "URL:",
            data.url
          );

          console.error(
            "Response:",
            data.response
          );

          /*
           * Network error
           */
          if (
            data.fatal &&
            data.type ===
              Hls.ErrorTypes.NETWORK_ERROR
          ) {
            setStatus("error");

            setError(
              "Network error. The stream may be expired, unavailable, or blocked by CORS."
            );

            /*
             * Try recovery
             */
            console.log(
              "Trying network recovery..."
            );

            setTimeout(() => {
              if (
                hlsRef.current === hls
              ) {
                try {
                  hls.startLoad();
                  setStatus("loading");
                } catch (err) {
                  console.error(
                    err
                  );
                }
              }
            }, 2000);

            return;
          }

          /*
           * Media error
           */
          if (
            data.fatal &&
            data.type ===
              Hls.ErrorTypes.MEDIA_ERROR
          ) {
            console.log(
              "Trying media recovery..."
            );

            try {
              hls.recoverMediaError();
              setStatus("buffering");
            } catch (err) {
              console.error(
                err
              );

              setStatus("error");

              setError(
                "Media playback error."
              );
            }

            return;
          }

          /*
           * Unknown fatal error
           */
          if (data.fatal) {
            setStatus("error");

            setError(
              `HLS error: ${data.details}`
            );
          }
        }
      );

      /*
       * Cleanup
       */
      return () => {
        console.log(
          "Destroying HLS player"
        );

        hls.destroy();

        hlsRef.current = null;

        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    /*
     * HLS unsupported
     */
    setStatus("error");

    setError(
      "This browser does not support HLS playback."
    );
  }, [currentUrl, currentServer]);

  /*
   * Manual Play
   */
  const playVideo = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      await video.play();

      setStatus("playing");
      setError("");
    } catch (err) {
      console.error(
        "Play error:",
        err
      );

      setError(
        "Browser blocked playback. Click the Play button again."
      );
    }
  };

  /*
   * Pause
   */
  const pauseVideo = () => {
    const video = videoRef.current;

    if (!video) return;

    video.pause();

    setStatus("paused");
  };

  /*
   * Go Live
   */
  const goLive = () => {
    const video = videoRef.current;

    if (!video) return;

    if (
      hlsRef.current &&
      video.duration
    ) {
      video.currentTime =
        video.duration;

      video.play().catch(() => {});

      setStatus("playing");
    }
  };

  /*
   * Change quality
   */
  const changeQuality = (event) => {
    const selected =
      Number(event.target.value);

    if (!hlsRef.current) return;

    /*
     * -1 = Auto
     */
    hlsRef.current.currentLevel =
      selected;

    setQuality(selected);
  };

  /*
   * Switch server
   */
  const changeServer = (index) => {
    console.log(
      "Switching to Server",
      index + 1
    );

    setCurrentServer(index);
    setError("");
    setStatus("loading");
  };

  /*
   * Status text
   */
  const statusText = {
    idle: "Idle",
    loading: "Loading...",
    ready: "Ready",
    playing: "LIVE",
    buffering: "Buffering...",
    paused: "Paused",
    error: "Error",
  };

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-4">

          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                FIFA Stream
              </h1>

              <p className="text-gray-400 text-sm mt-1">
                HLS Live Player
              </p>
            </div>

            {/* Live status */}
            <div className="flex items-center gap-2">

              <span
                className={`w-3 h-3 rounded-full ${
                  status === "playing"
                    ? "bg-green-500 animate-pulse"
                    : "bg-gray-600"
                }`}
              />

              <span
                className={`font-semibold ${
                  status === "playing"
                    ? "text-green-400"
                    : "text-gray-400"
                }`}
              >
                {statusText[status]}
              </span>

            </div>

          </div>

        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* Server selector */}
        <section className="mb-5">

          <h2 className="text-lg font-semibold mb-3">
            Servers
          </h2>

          <div className="flex flex-wrap gap-2">

            {servers.map(
              (server, index) => (
                <button
                  key={index}
                  onClick={() =>
                    changeServer(index)
                  }
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    currentServer ===
                    index
                      ? "bg-green-600 hover:bg-green-500"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  Server {index + 1}
                </button>
              )
            )}

          </div>

        </section>

        {/* Video */}
        <section className="relative bg-black rounded-xl overflow-hidden border border-gray-800">

          <video
            ref={videoRef}
            controls
            playsInline
            preload="auto"
            className="block w-full aspect-video bg-black"
            onPlaying={() => {
              setStatus("playing");
              setError("");
            }}
            onWaiting={() => {
              setStatus("buffering");
            }}
            onPause={() => {
              if (
                status !== "error"
              ) {
                setStatus("paused");
              }
            }}
          />

          {/* Loading overlay */}
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

              <div className="bg-black/80 px-6 py-4 rounded-xl">

                <div className="flex items-center gap-3">

                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />

                  <span>
                    Loading stream...
                  </span>

                </div>

              </div>

            </div>
          )}

          {/* Error overlay */}
          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center p-5">

              <div className="max-w-lg text-center bg-black/90 border border-red-800 rounded-xl p-6">

                <div className="text-4xl mb-3">
                  ⚠️
                </div>

                <h3 className="text-xl font-bold text-red-400">
                  Stream Error
                </h3>

                <p className="text-gray-300 text-sm mt-3">
                  {error}
                </p>

                <button
                  onClick={() => {
                    setCurrentServer(
                      currentServer
                    );
                    setStatus(
                      "loading"
                    );
                    setError("");
                  }}
                  className="mt-5 bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg font-semibold"
                >
                  Retry
                </button>

              </div>

            </div>
          )}

        </section>

        {/* Controls */}
        <section className="mt-4 flex flex-wrap items-center gap-3">

          <button
            onClick={playVideo}
            className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg font-semibold"
          >
            ▶ Play
          </button>

          <button
            onClick={pauseVideo}
            className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-lg font-semibold"
          >
            ⏸ Pause
          </button>

          <button
            onClick={goLive}
            className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg font-semibold"
          >
            ● LIVE
          </button>

          {/* Quality */}
          {qualities.length > 0 && (
            <select
              value={quality}
              onChange={changeQuality}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              <option value={-1}>
                Auto
              </option>

              {qualities.map(
                (item) => (
                  <option
                    key={item.index}
                    value={item.index}
                  >
                    {item.height
                      ? `${item.height}p`
                      : `${item.width}x${item.height}`}
                  </option>
                )
              )}
            </select>
          )}

        </section>

        {/* Information */}
        <section className="mt-6 bg-gray-950 border border-gray-800 rounded-xl p-5">

          <h2 className="font-bold text-lg mb-4">
            Stream Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm">
                Server
              </p>

              <p className="font-bold mt-1">
                Server {currentServer + 1}
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm">
                Format
              </p>

              <p className="font-bold mt-1">
                HLS / M3U8
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm">
                Playback
              </p>

              <p className="font-bold mt-1">
                {statusText[status]}
              </p>
            </div>

          </div>

        </section>

        {/* Debug */}
        <details className="mt-5 bg-gray-950 border border-gray-800 rounded-xl p-4">

          <summary className="cursor-pointer font-semibold">
            Debug Information
          </summary>

          <div className="mt-4 text-sm text-gray-400 space-y-2">

            <p>
              HLS.js supported:{" "}
              {Hls.isSupported()
                ? "Yes"
                : "No"}
            </p>

            <p>
              Servers available:{" "}
              {servers.length}
            </p>

            <p>
              Current server:{" "}
              {currentServer + 1}
            </p>

            <p>
              Qualities detected:{" "}
              {qualities.length}
            </p>

            <p>
              Live stream:{" "}
              {isLive
                ? "Yes"
                : "Unknown"}
            </p>

          </div>

        </details>

      </main>

    </div>
  );
}
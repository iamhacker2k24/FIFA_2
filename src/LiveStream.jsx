import { useEffect, useState } from "react";

export default function App() {
  const servers = [
    import.meta.env.VITE_SERVER_1,
    import.meta.env.VITE_SERVER_2,
    import.meta.env.VITE_SERVER_3,
    import.meta.env.VITE_SERVER_4,
    import.meta.env.VITE_SERVER_5,
    import.meta.env.VITE_SERVER_6,
    import.meta.env.VITE_SERVER_7,
    import.meta.env.VITE_SERVER_8,
    import.meta.env.VITE_SERVER_9,
    import.meta.env.VITE_SERVER_10
  ].filter(Boolean);

  const [currentServer, setCurrentServer] = useState(0);

  useEffect(() => {
    console.log("===== ENV DEBUG =====");
    console.log("SERVERS ARRAY =", servers);
    console.log("ALL ENV =", import.meta.env);
  }, [servers]);

  return (
    <div className="min-h-screen bg-black text-white p-4">

      <h1 className="text-3xl font-bold mb-5">
        FIFA Stream Debug
      </h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {servers.map((server, index) => (
          <button
            key={index}
            onClick={() => {
              console.log("Switching to:", server);
              setCurrentServer(index);
            }}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Server {index + 1}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <strong>Current URL:</strong>
        <br />
        {servers[currentServer]}
      </div>

      <iframe
        title="stream"
        src={servers[currentServer]}
        sandbox="allow-scripts allow-same-origin allow-forms"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        style={{
          width: "100%",
          height: "80vh",
          border: "2px solid red",
          background: "#fff"
        }}
        onLoad={() => {
          console.log(
            "IFRAME LOADED:",
            servers[currentServer]
          );
        }}
      />
    </div>
  );
}
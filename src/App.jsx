import { useCallback, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Navbar } from "./components/Navbar";
import { DropZone } from "./components/DropZone";
import { ImportPanel } from "./components/ImportPanel";
import { Notice } from "./components/Notice";
import { WaveBackground } from "./components/WaveBackground";
import { PlayerBar } from "./components/PlayerBar";
import { LyricsPanel } from "./components/LyricsPanel";
import { QueuePanel } from "./components/QueuePanel";
import { About } from "./pages/About";
import { AllSongs } from "./pages/AllSongs";
import { PlaylistDetail } from "./pages/PlaylistDetail";
import { Playlists } from "./pages/Playlists";
import { VibeMap } from "./pages/VibeMap";
import { MusicProvider } from "./state/MusicProvider";

function App() {
  const [panel, setPanel] = useState(null); // "queue" | "lyrics" | null: one side panel at a time
  const queueToggleRef = useRef(null);
  const lyricsToggleRef = useRef(null);

  const closeQueue = useCallback(() => {
    setPanel(null);
    queueToggleRef.current.focus();
  }, []);
  const closeLyrics = useCallback(() => {
    setPanel(null);
    lyricsToggleRef.current.focus();
  }, []);

  return (
    <MusicProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <WaveBackground />
        <Navbar />
        <div className="layout">
          <main className="content">
            <Routes>
              <Route path="/" element={<AllSongs />} />
              <Route path="/vibe" element={<VibeMap />} />
              <Route path="/about" element={<About />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlists/:id" element={<PlaylistDetail />} />
            </Routes>
          </main>
          {panel === "queue" && <QueuePanel onClose={closeQueue} />}
          {panel === "lyrics" && <LyricsPanel onClose={closeLyrics} />}
        </div>
        <DropZone />
        <ImportPanel />
        <Notice />
        <PlayerBar
          queueOpen={panel === "queue"}
          onToggleQueue={() => setPanel(panel === "queue" ? null : "queue")}
          queueToggleRef={queueToggleRef}
          lyricsOpen={panel === "lyrics"}
          onToggleLyrics={() => setPanel(panel === "lyrics" ? null : "lyrics")}
          lyricsToggleRef={lyricsToggleRef}
        />
      </BrowserRouter>
    </MusicProvider>
  );
}

export default App;

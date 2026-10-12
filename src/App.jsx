import { useCallback, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Navbar } from "./components/Navbar";
import { DropZone } from "./components/DropZone";
import { ImportPanel } from "./components/ImportPanel";
import { Notice } from "./components/Notice";
import { WaveBackground } from "./components/WaveBackground";
import { PlayerBar } from "./components/PlayerBar";
import { QueuePanel } from "./components/QueuePanel";
import { AllSongs } from "./pages/AllSongs";
import { PlaylistDetail } from "./pages/PlaylistDetail";
import { Playlists } from "./pages/Playlists";
import { VibeMap } from "./pages/VibeMap";
import { MusicProvider } from "./state/MusicProvider";

function App() {
  const [queueOpen, setQueueOpen] = useState(false);
  const queueToggleRef = useRef(null);

  const closeQueue = useCallback(() => {
    setQueueOpen(false);
    queueToggleRef.current.focus();
  }, []);

  return (
    <MusicProvider>
      <BrowserRouter>
        <WaveBackground />
        <Navbar />
        <div className="layout">
          <main className="content">
            <Routes>
              <Route path="/" element={<AllSongs />} />
              <Route path="/vibe" element={<VibeMap />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlists/:id" element={<PlaylistDetail />} />
            </Routes>
          </main>
          {queueOpen && <QueuePanel onClose={closeQueue} />}
        </div>
        <DropZone />
        <ImportPanel />
        <Notice />
        <PlayerBar
          queueOpen={queueOpen}
          onToggleQueue={() => setQueueOpen(!queueOpen)}
          queueToggleRef={queueToggleRef}
        />
      </BrowserRouter>
    </MusicProvider>
  );
}

export default App;

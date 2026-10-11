import { useCallback, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Navbar } from "./components/Navbar";
import { PlayerBar } from "./components/PlayerBar";
import { QueuePanel } from "./components/QueuePanel";
import { AllSongs } from "./pages/AllSongs";
import { Playlists } from "./pages/Playlists";
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
        <Navbar />
        <div className="layout">
          <main className="content">
            <Routes>
              <Route path="/" element={<AllSongs />} />
              <Route path="/playlists" element={<Playlists />} />
            </Routes>
          </main>
          {queueOpen && <QueuePanel onClose={closeQueue} />}
        </div>
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

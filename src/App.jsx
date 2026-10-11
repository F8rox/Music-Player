import { BrowserRouter, Routes, Route } from "react-router";
import { MusicPlayer } from "./components/MusicPlayer";
import { AllSongs } from "./components/AllSongs";
import { Playlists } from "./components/Playlists";
import { Navbar } from "./components/Navbar";
import { MusicProvider } from "./state/MusicProvider";

function App() {
  return (
    <MusicProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="app-main">
            <div className="player-section">
              <MusicPlayer />
            </div>
            <div className="content-section">
              <Routes>
                <Route path="/" element={<AllSongs />} />
                <Route path="/playlists" element={<Playlists />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </MusicProvider>
  );
}

export default App;

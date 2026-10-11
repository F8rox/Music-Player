import { MusicPlayer } from "./components/MusicPlayer";
import { AllSongs } from "./components/AllSongs";
import { Playlists } from "./components/Playlists";
import { BrowserRouter, Routes, Route } from "react-router";
import { useMusic } from "./hooks/useMusic";
import { Navbar } from "./components/Navbar";

function App() {
  const music = useMusic();
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="app-main">
          <div className="player-section">
            <MusicPlayer music={music}/>
          </div>
          <div className="content-section">
            <Routes>
              <Route path="/" element={<AllSongs music={music}/>}/>
              <Route path="/playlists" element={<Playlists />}/>
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

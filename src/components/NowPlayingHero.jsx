import { Icon } from "./Icon";
import { tempoOf } from "../lib/tempo";
import { useMusic } from "../state/useMusic";
import { ImportButton } from "./ImportButton";

// The editorial top of All Songs: what's playing, big, with a glow tinted by the track's energy.
export const NowPlayingHero = () => {
  const { currentTrack, isPlaying, setIsPlaying, energyOf, analysisOf } = useMusic();

  if (!currentTrack) {
    return (
      <section className="hero">
        <p className="hero-label">Your library</p>
        <h1 className="hero-title">
          Your music, <span className="serif gradient-text">mixed live.</span>
        </h1>
        <p className="hero-sub">Add songs from your computer. They stay in this browser, analysed and ready to blend.</p>
        <ImportButton />
      </section>
    );
  }

  const level = Math.round(energyOf(currentTrack.id) ?? 3);
  const bpm = tempoOf(analysisOf(currentTrack.id));
  return (
    <section className={`hero hero-energy-${level}`}>
      <p className="hero-label">{isPlaying ? "Now playing" : "Paused"}</p>
      <h1 className="hero-title">{currentTrack.title}</h1>
      <p className="hero-artist">
        by <span className="serif">{currentTrack.artist}</span>
      </p>
      <div className="hero-meta">
        <span className="chip">Energy {level}/5</span>
        {bpm && <span className="chip">~{Math.round(bpm)} BPM</span>}
        <button
          type="button"
          className="control-btn play-btn hero-play"
          aria-label={`${isPlaying ? "Pause" : "Play"} ${currentTrack.title}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          <Icon name={isPlaying ? "pause" : "play"} size={28} />
        </button>
      </div>
    </section>
  );
};

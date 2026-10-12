import { formatTime } from "../lib/format";
import { tempoOf } from "../lib/tempo";
import { useMusic } from "../state/useMusic";

// undefined = still probing, null = file failed to load.
const durationLabel = (duration) => {
  if (duration === undefined) return "–:––";
  if (duration === null) return "Unavailable";
  return formatTime(duration);
};

// Energy dot + approximate tempo. Never colour alone: the dot carries a text label.
const AnalysisInfo = ({ songId }) => {
  const { analysisOf, energyOf } = useMusic();
  const analysis = analysisOf(songId);
  if (analysis === "pending") return <span className="energy-dot analysing" role="img" aria-label="Analysing" />;
  if (analysis === "failed") return <span className="analysis-note">Couldn't analyse</span>;
  if (!analysis) return null;
  const level = Math.round(energyOf(songId) ?? 3);
  const bpm = tempoOf(analysis);
  return (
    <>
      <span className={`energy-dot energy-${level}`} role="img" aria-label={`Energy ${level} of 5`} />
      {bpm && <span className="song-bpm" title="Approximate tempo">~{Math.round(bpm)}</span>}
    </>
  );
};

// `actions` sits beside the play button: buttons can't be nested inside buttons.
export const SongRow = ({ song, index, duration, active, onPlay, actions }) => (
  <div className={`song-row${active ? " active" : ""}`}>
    <button type="button" className="song-play" onClick={onPlay}>
      <span className="song-index" aria-hidden="true">{active ? "♪" : index + 1}</span>
      <span className="song-text">
        <span className="song-title">{song.title}</span>
        <span className="song-artist">
          {song.imported && <span className="yours-tag">Yours</span>}
          {song.artist}
        </span>
      </span>
      <span className="song-meta">
        <AnalysisInfo songId={song.id} />
      </span>
      <span className="song-duration">{durationLabel(duration)}</span>
    </button>
    {actions}
  </div>
);

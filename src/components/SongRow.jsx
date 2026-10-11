import { formatTime } from "../lib/format";

// undefined = still probing, null = file failed to load.
const durationLabel = (duration) => {
  if (duration === undefined) return "–:––";
  if (duration === null) return "Unavailable";
  return formatTime(duration);
};

export const SongRow = ({ song, index, duration, active, onPlay }) => (
  <button type="button" className={`song-row${active ? " active" : ""}`} onClick={onPlay}>
    <span className="song-index" aria-hidden="true">{active ? "♪" : index + 1}</span>
    <span className="song-text">
      <span className="song-title">{song.title}</span>
      <span className="song-artist">{song.artist}</span>
    </span>
    <span className="song-duration">{durationLabel(duration)}</span>
  </button>
);

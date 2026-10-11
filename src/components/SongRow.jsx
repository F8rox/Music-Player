import { formatTime } from "../lib/format";

// undefined = still probing, null = file failed to load.
const durationLabel = (duration) => {
  if (duration === undefined) return "–:––";
  if (duration === null) return "Unavailable";
  return formatTime(duration);
};

// `actions` sits beside the play button: buttons can't be nested inside buttons.
export const SongRow = ({ song, index, duration, active, onPlay, actions }) => (
  <div className={`song-row${active ? " active" : ""}`}>
    <button type="button" className="song-play" onClick={onPlay}>
      <span className="song-index" aria-hidden="true">{active ? "♪" : index + 1}</span>
      <span className="song-text">
        <span className="song-title">{song.title}</span>
        <span className="song-artist">{song.artist}</span>
      </span>
      <span className="song-duration">{durationLabel(duration)}</span>
    </button>
    {actions}
  </div>
);

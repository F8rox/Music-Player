export const SongRow = ({ song, index, active, onPlay }) => (
  <button type="button" className={`song-row${active ? " active" : ""}`} onClick={onPlay}>
    <span className="song-index" aria-hidden="true">{active ? "♪" : index + 1}</span>
    <span className="song-text">
      <span className="song-title">{song.title}</span>
      <span className="song-artist">{song.artist}</span>
    </span>
    <span className="song-duration" />
  </button>
);

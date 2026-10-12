import { useState } from "react";
import { useMusic } from "../state/useMusic";

// "Add songs" dropdown: every library song not already in the playlist, filterable.
// Stays open while adding several; Esc or clicking elsewhere closes it.
export const SongPicker = ({ playlist }) => {
  const { songs, addToPlaylist } = useMusic();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const query = filter.trim().toLowerCase();
  const options = songs.filter((song) => !playlist.songIds.includes(song.id)
    && (!query || `${song.title} ${song.artist}`.toLowerCase().includes(query)));

  return (
    <div
      className="song-picker"
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
    >
      <button
        type="button"
        className="primary-btn"
        aria-expanded={open}
        aria-controls="song-picker-panel"
        onClick={() => setOpen(!open)}
      >
        + Add songs
      </button>
      {open && (
        <div id="song-picker-panel" className="picker-panel">
          <label htmlFor="song-filter" className="visually-hidden">Search your library</label>
          <input
            id="song-filter"
            className="text-input"
            placeholder="Search your library"
            value={filter}
            autoFocus
            onChange={(e) => setFilter(e.target.value)}
          />
          <p className="picker-count" aria-live="polite">
            {options.length} {options.length === 1 ? "song" : "songs"} to add
          </p>
          <ul className="picker-list">
            {options.map((song) => (
              <li key={song.id}>
                <button
                  type="button"
                  className="picker-option"
                  aria-label={`Add ${song.title} to ${playlist.name}`}
                  onClick={() => addToPlaylist(playlist.id, song.id)}
                >
                  <span className="song-text">
                    <span className="song-title">{song.title}</span>
                    <span className="song-artist">{song.artist}</span>
                  </span>
                  <span className="picker-add" aria-hidden="true">+</span>
                </button>
              </li>
            ))}
          </ul>
          {options.length === 0 && (
            <p className="empty-message">{query ? "No matching songs." : "Every song is already in this playlist."}</p>
          )}
        </div>
      )}
    </div>
  );
};

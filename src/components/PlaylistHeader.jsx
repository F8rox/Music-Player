import { useState } from "react";
import { formatTime } from "../lib/format";
import { MAX_NAME } from "../lib/playlists";
import { useMusic } from "../state/useMusic";

// Name with inline rename, song count, total time, Play and Delete.
export const PlaylistHeader = ({ playlist, onDelete }) => {
  const { songById, durationOf, playFromList, renamePlaylist } = useMusic();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(playlist.name);
  const [error, setError] = useState("");

  const total = playlist.songIds
    .map((id) => durationOf(songById(id)))
    .filter(Number.isFinite)
    .reduce((sum, seconds) => sum + seconds, 0);
  const count = playlist.songIds.length;

  const save = (e) => {
    e.preventDefault();
    if (!renamePlaylist(playlist.id, draft)) return setError(`Name must be 1–${MAX_NAME} characters.`);
    setEditing(false);
    setError("");
  };

  return (
    <div className="page-header playlist-header">
      {editing ? (
        <form className="inline-form" onSubmit={save} noValidate>
          <label htmlFor="rename" className="visually-hidden">Playlist name</label>
          <input
            id="rename"
            className="text-input"
            value={draft}
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby="rename-error"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setEditing(false), setError(""), setDraft(playlist.name))}
          />
          <button type="submit" className="primary-btn">Save</button>
          <p id="rename-error" className="form-error" role="alert">{error}</p>
        </form>
      ) : (
        <div>
          <h1>{playlist.name}</h1>
          <p className="song-artist">
            {count} {count === 1 ? "song" : "songs"} · {formatTime(total)}
          </p>
        </div>
      )}
      <div className="import-actions">
        <button type="button" className="primary-btn" disabled={count === 0} onClick={() => playFromList(playlist.songIds, 0)}>
          Play
        </button>
        {!editing && (
          <button type="button" className="secondary-btn" onClick={() => { setDraft(playlist.name); setEditing(true); }}>
            Rename
          </button>
        )}
        <button type="button" className="secondary-btn" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
};

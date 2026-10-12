import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MAX_NAME } from "../lib/playlists";
import { useMusic } from "../state/useMusic";

export const Playlists = () => {
  const { playlists, createPlaylist } = useMusic();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const id = createPlaylist(name);
    if (!id) return setError(`Name must be 1–${MAX_NAME} characters.`);
    setName("");
    setError("");
    navigate(`/playlists/${id}`);
  };

  return (
    <section>
      <h1 className="page-title">
        Your <span className="serif gradient-text">playlists</span>
      </h1>
      <form className="inline-form" onSubmit={submit} noValidate>
        <label htmlFor="new-playlist" className="visually-hidden">New playlist name</label>
        <input
          id="new-playlist"
          className="text-input"
          placeholder="New playlist name"
          value={name}
          maxLength={MAX_NAME + 20}
          aria-invalid={Boolean(error)}
          aria-describedby="new-playlist-error"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="primary-btn">Create</button>
      </form>
      <p id="new-playlist-error" className="form-error" role="alert">{error}</p>
      {playlists.length === 0 ? (
        <p className="empty-message">No playlists yet. Create one above.</p>
      ) : (
        <ul className="playlist-list">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <Link to={`/playlists/${playlist.id}`} className="playlist-link">
                <span className="playlist-art" aria-hidden="true">{playlist.name.slice(0, 1).toUpperCase()}</span>
                <span className="song-title">{playlist.name}</span>
                <span className="song-artist">
                  {playlist.songIds.length} {playlist.songIds.length === 1 ? "song" : "songs"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlaylistHeader } from "../components/PlaylistHeader";
import { SongRow } from "../components/SongRow";
import { SortableList } from "../components/SortableList";
import { useMusic } from "../state/useMusic";

const MAX_RESULTS = 8;

export const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    playlists, songs, songById, durationOf, currentTrack, playFromList,
    addToPlaylist, removeFromPlaylist, movePlaylistSong, deletePlaylist,
  } = useMusic();
  const [filter, setFilter] = useState("");
  const [confirming, setConfirming] = useState(false);
  const playlist = playlists.find((p) => p.id === id);

  if (!playlist) {
    return (
      <section>
        <h2>Playlist not found</h2>
        <Link to="/playlists">Back to playlists</Link>
      </section>
    );
  }

  const query = filter.trim().toLowerCase();
  const results = query
    ? songs.filter((song) => !playlist.songIds.includes(song.id)
        && `${song.title} ${song.artist}`.toLowerCase().includes(query)).slice(0, MAX_RESULTS)
    : [];

  return (
    <section>
      <PlaylistHeader playlist={playlist} onDelete={() => setConfirming(true)} />

      {playlist.songIds.length === 0 ? (
        <p className="empty-message">No songs yet. Add some below.</p>
      ) : (
        <SortableList
          items={playlist.songIds}
          getId={(songId) => songId}
          getLabel={(songId) => songById(songId).title}
          onMove={(songId, toIndex) => movePlaylistSong(playlist.id, songId, toIndex)}
          renderItem={(songId, index) => {
            const song = songById(songId);
            return (
              <SongRow
                song={song}
                index={index}
                duration={durationOf(song)}
                active={song.id === currentTrack?.id}
                onPlay={() => playFromList(playlist.songIds, index)}
                actions={
                  <button
                    type="button"
                    className="control-btn"
                    aria-label={`Remove ${song.title} from ${playlist.name}`}
                    onClick={() => removeFromPlaylist(playlist.id, song.id)}
                  >
                    ✕
                  </button>
                }
              />
            );
          }}
        />
      )}

      <h3 className="section-title">Add songs</h3>
      <label htmlFor="song-filter" className="visually-hidden">Filter songs to add</label>
      <input
        id="song-filter"
        className="text-input"
        placeholder="Search your songs"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul className="song-list add-results">
        {results.map((song) => (
          <li key={song.id} className="add-result">
            <span className="song-text">
              <span className="song-title">{song.title}</span>
              <span className="song-artist">{song.artist}</span>
            </span>
            <button type="button" className="secondary-btn" onClick={() => addToPlaylist(playlist.id, song.id)}>
              Add
            </button>
          </li>
        ))}
      </ul>
      {query && results.length === 0 && <p className="empty-message">No matching songs to add.</p>}

      {confirming && (
        <ConfirmDialog
          title="Delete playlist?"
          message={`"${playlist.name}" will be deleted. The songs stay in your library.`}
          confirmLabel="Delete"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            deletePlaylist(playlist.id);
            navigate("/playlists");
          }}
        />
      )}
    </section>
  );
};

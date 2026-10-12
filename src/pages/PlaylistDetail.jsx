import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlaylistHeader } from "../components/PlaylistHeader";
import { SongPicker } from "../components/SongPicker";
import { SongRow } from "../components/SongRow";
import { SortableList } from "../components/SortableList";
import { useMusic } from "../state/useMusic";

export const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    playlists, songById, durationOf, currentTrack, playFromList,
    removeFromPlaylist, movePlaylistSong, deletePlaylist,
  } = useMusic();
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

  return (
    <section>
      <PlaylistHeader playlist={playlist} onDelete={() => setConfirming(true)} />
      <div className="playlist-toolbar">
        <SongPicker playlist={playlist} />
      </div>

      {playlist.songIds.length === 0 ? (
        <p className="empty-message panel">No songs yet. Use “Add songs” to pick from your library.</p>
      ) : (
        <div className="panel">
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
        </div>
      )}

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

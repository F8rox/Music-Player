import { useMusic } from "../state/useMusic";

export const AllSongs = () => {
  const { songs, currentTrack, playSong } = useMusic();
  return (
    <div className="all-songs">
      <h2>All Songs ({songs.length})</h2>
      <div className="songs-grid">
        {songs.map((song) => {
          const active = song.id === currentTrack.id;
          return (
            <button
              key={song.id}
              type="button"
              className={`song-card${active ? " active" : ""}`}
              onClick={() => playSong(song.id)}
            >
              <div className="song-info">
                <h3 className="song-title">{song.title}</h3>
                <p className="song-artist">{song.artist}</p>
              </div>
              <div className="play-button" aria-hidden="true">{active ? "♪" : "▶"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

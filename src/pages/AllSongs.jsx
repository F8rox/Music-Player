import { SongRow } from "../components/SongRow";
import { useMusic } from "../state/useMusic";

export const AllSongs = () => {
  const { songs, currentTrack, playSong } = useMusic();
  return (
    <section>
      <h2>All Songs ({songs.length})</h2>
      <ul className="song-list">
        {songs.map((song, index) => (
          <li key={song.id}>
            <SongRow
              song={song}
              index={index}
              active={song.id === currentTrack.id}
              onPlay={() => playSong(song.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

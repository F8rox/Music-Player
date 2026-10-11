import { SongMenu } from "../components/SongMenu";
import { SongRow } from "../components/SongRow";
import { useMusic } from "../state/useMusic";

export const AllSongs = () => {
  const { songs, durations, currentTrack, playFromList } = useMusic();
  const ids = songs.map((song) => song.id);
  return (
    <section>
      <h2>All Songs ({songs.length})</h2>
      <ul className="song-list">
        {songs.map((song, index) => (
          <li key={song.id}>
            <SongRow
              song={song}
              index={index}
              duration={durations[song.id]}
              active={song.id === currentTrack?.id}
              onPlay={() => playFromList(ids, index)}
              actions={<SongMenu song={song} />}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

import { ImportButton } from "../components/ImportButton";
import { NowPlayingHero } from "../components/NowPlayingHero";
import { SongMenu } from "../components/SongMenu";
import { SongRow } from "../components/SongRow";
import { useMusic } from "../state/useMusic";

export const AllSongs = () => {
  const { songs, durationOf, currentTrack, playFromList } = useMusic();
  const ids = songs.map((song) => song.id);
  return (
    <section>
      <NowPlayingHero />
      <div className="page-header">
        <h2>All Songs ({songs.length})</h2>
        <ImportButton />
      </div>
      <ul className="song-list">
        {songs.map((song, index) => (
          <li key={song.id}>
            <SongRow
              song={song}
              index={index}
              duration={durationOf(song)}
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

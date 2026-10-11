import { useState } from "react";
import * as P from "../lib/playlists";

// Playlist state and actions; rules live in src/lib/playlists.js.
export const usePlaylists = (initial, notify) => {
  const [playlists, setPlaylists] = useState(initial);

  return {
    playlists,
    // Returns the new playlist's id, or null when the name is invalid.
    createPlaylist: (name) => {
      if (!P.validateName(name)) return null;
      const id = crypto.randomUUID();
      setPlaylists((list) => P.create(list, name, id, Date.now()));
      return id;
    },
    renamePlaylist: (id, name) => {
      if (!P.validateName(name)) return false;
      setPlaylists((list) => P.rename(list, id, name));
      return true;
    },
    deletePlaylist: (id) => setPlaylists((list) => P.remove(list, id)),
    addToPlaylist: (id, songId) => {
      const { list, added } = P.addSong(playlists, id, songId);
      const name = playlists.find((p) => p.id === id)?.name;
      setPlaylists(list);
      notify(added ? `Added to ${name}` : `Already in ${name}`);
    },
    removeFromPlaylist: (id, songId) => setPlaylists((list) => P.removeSong(list, id, songId)),
    movePlaylistSong: (id, songId, toIndex) => setPlaylists((list) => P.moveSong(list, id, songId, toIndex)),
    forgetSong: (songId) => setPlaylists((list) => P.removeSongEverywhere(list, songId)),
  };
};

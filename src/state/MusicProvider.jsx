import { useState } from "react";
import { songs } from "../data/songs";
import { MusicContext } from "./useMusic";

const step = (id, delta) => {
  const index = songs.findIndex((song) => song.id === id);
  return songs[(index + delta + songs.length) % songs.length].id;
};

export const MusicProvider = ({ children }) => {
  const [currentId, setCurrentId] = useState(songs[0].id);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const value = {
    songs,
    currentTrack: songs.find((song) => song.id === currentId),
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    playSong: (id) => {
      setCurrentId(id);
      setIsPlaying(true);
    },
    nextTrack: () => setCurrentId((id) => step(id, 1)),
    prevTrack: () => setCurrentId((id) => step(id, -1)),
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

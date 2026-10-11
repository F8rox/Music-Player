import { useState } from "react"

const songs = [
    {
        id: 1,
        title: "I Wanna Be Yours",
        artist: "Arctic Monkeys",
        url: "/songs/I Wanna Be Yours.mp3",
        duration: "3:04",
    },
    {
        id: 2,
        title: "The way I are",
        artist: "Timbaland",
        url: "",
        duration: "2:40",
    },
    {
        id: 3,
        title: "My Love",
        artist: "Justin Timberlake",
        url: "",
        duration: "4:36",
    },
    {   
        id: 4,
        title: "Manic in Disguise",
        artist: "WonderBag",
        url: "",
        duration: "3:34",
    },
    {   
        id: 5,
        title: "Into You",
        artist: "Ariana Granede",
        url: "",
        duration: "4:14",
    },


];

export const useMusic = () => {
    const [allSongs, setAllSongs] = useState(songs);
    const [currentTrack, setcurrentTrack] = useState(songs[0]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);


    const handlePlaySong = (song, index) => {
        setcurrentTrack(song);
        setCurrentTrackIndex(index);
        setIsPlaying(true);
        console.log("clicked:", song.title);
    };

    const nextTrack = () => {
        setCurrentTrackIndex((prev) => {
            const nextIndex = (prev + 1) % allSongs.length;
            setcurrentTrack(allSongs[nextIndex]);
            return nextIndex;
        });
    };

    const prevTrack = () => {
        setCurrentTrackIndex((prev) => {
            const nextIndex = prev === 0 ? allSongs.length - 1: prev - 1;
            setcurrentTrack(allSongs[nextIndex]);
            return nextIndex;
        });
    };

    const formatTime = (time) => {
        if (isNaN(time) || time === undefined) return "0:00";

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    const play = () => setIsPlaying(true);
    const pause = () => setIsPlaying(false);
    


    return { allSongs, handlePlaySong, formatTime, currentTrackIndex, currentTrack, setCurrentTime, currentTime, duration, setDuration, nextTrack, prevTrack, play, pause, isPlaying, setIsPlaying, volume, setVolume};
};
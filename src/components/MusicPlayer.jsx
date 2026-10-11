import { useMusic } from "../hooks/useMusic";
import { useRef, useEffect } from "react";
export const MusicPlayer = ({music}) => {
        const {currentTrack, formatTime, setCurrentTime,  currentTime, duration, setDuration, nextTrack, prevTrack, isPlaying, pause, play, setIsPlaying, volume, setVolume} = music;
        const audioRef = useRef(null);

        const handleSeek = (e) => {
            const newTime = e.target.value;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        };

        const handleVolume = (e) => {
            const newVolume = e.target.value;
            setVolume(newVolume);
        };

        useEffect(()  => {
            const audio = audioRef.current;
            if(!audio) return;

            const handleLoadedMetadata = () => { 
                setDuration(audio.duration); 
                console.log(audio.duration);
            };

            const handleTimeUpdate = () => {
                setCurrentTime(audio.currentTime);
            };
            
            const handleEnded = () => {      
                nextTrack();
            };

            audio.addEventListener("loadedmetadata", handleLoadedMetadata);
            audio.addEventListener("timeupdate", handleTimeUpdate);
            audio.addEventListener("ended", handleEnded);
            return () => {
                audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
                audio.removeEventListener("timeupdate", handleTimeUpdate); 
                audio.removeEventListener("ended", handleEnded);
                };

            }, [setDuration, setCurrentTime, currentTrack, nextTrack]
        );

        useEffect(() => {
            const audio = audioRef.current;
            if(!audio) return;

            if(isPlaying){
                audio.play();
            }else{
                audio.pause();
            }

        }, [isPlaying, currentTrack, setIsPlaying]
    );


        useEffect(() => {
            const audio = audioRef.current;
            if(!audio) return;

            audio.volume = volume;

        },[volume]
    );

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

        return (
        <div className="music-player">
            <audio 
                ref={audioRef} 
                src={currentTrack.url} 
                preload="metadata"
            /> 

            <div className="track-info">
                <h3 className="track-title">{currentTrack.title}</h3>
                <p className="tracl-artist">{currentTrack.artist}</p>
            </div>

            <div className="progress-container">
                <span className="time">{formatTime(currentTime)}</span>
                <input 
                type ="range" 
                min = "0" 
                max = {duration || 0} 
                step = "0.1" 
                value = {currentTime || 0 }
                className = "progress-bar"
                onChange={handleSeek}
                style = {{"--progress": `${progressPercentage}%`}}
                />
                <span className="time">{formatTime(duration)}</span>
            </div>
            <div className="controls">
                <button className="control-btn" onClick={prevTrack}>⏮</button>
                <button className="control-btn play-btn" onClick={() => (isPlaying ? pause() : play())}>{isPlaying ? "⏸" : "▶"}</button>
                <button className="control-btn" onClick={nextTrack}>⏭    
                </button>
            </div>
            <div className="volume-container">
                <span className="volume-icon">🔊</span>
                <input type="range" min="0" max="1" step="0.000000000000001" className="volume-bar" onChange={handleVolume} value={(volume)} />
            </div>
        </div>
    );
};





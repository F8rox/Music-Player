import { useEffect, useRef } from "react";
import { formatTime } from "../lib/format";
import { useMusic } from "../state/useMusic";

export const PlayerBar = ({ queueOpen, onToggleQueue, queueToggleRef }) => {
  const {
    currentTrack, currentTime, setCurrentTime, duration, setDuration,
    isPlaying, setIsPlaying, volume, setVolume, nextTrack, prevTrack,
  } = useMusic();
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!isPlaying) {
      audio.pause();
      return;
    }
    // AbortError just means a newer src replaced this play() call; that one is still playing.
    audio.play().catch((error) => error.name !== "AbortError" && setIsPlaying(false));
  }, [isPlaying, currentTrack, setIsPlaying]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const resetTime = () => {
    setCurrentTime(0);
    setDuration(0);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="player-bar">
      <audio
        ref={audioRef}
        src={currentTrack.url}
        preload="metadata"
        onLoadStart={resetTime}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={nextTrack}
      />

      <div className="track-info">
        <p className="track-title">{currentTrack.title}</p>
        <p className="track-artist">{currentTrack.artist}</p>
      </div>

      <div className="player-center">
        <div className="controls">
          <button className="control-btn" aria-label="Previous" onClick={prevTrack}>⏮</button>
          <button
            className="control-btn play-btn"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className="control-btn" aria-label="Next" onClick={nextTrack}>⏭</button>
        </div>
        <div className="progress-container">
          <span className="time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            className="progress-bar"
            aria-label="Seek"
            onChange={handleSeek}
            style={{ "--progress": `${progressPercentage}%` }}
          />
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          className="volume-bar"
          aria-label="Volume"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ "--progress": `${volume * 100}%` }}
        />
        <button
          ref={queueToggleRef}
          className="control-btn"
          aria-label="Up next"
          aria-expanded={queueOpen}
          aria-controls="queue-panel"
          onClick={onToggleQueue}
        >
          ☰
        </button>
      </div>
    </footer>
  );
};

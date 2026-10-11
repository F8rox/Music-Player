import { useEffect, useRef } from "react";
import { formatTime } from "../lib/format";
import { useMusic } from "../state/useMusic";
import { useSongUrl } from "../state/useSongUrl";

export const PlayerBar = ({ queueOpen, onToggleQueue, queueToggleRef }) => {
  const {
    currentTrack, currentQid, restorePosition, currentTime, setCurrentTime, duration, setDuration,
    isPlaying, setIsPlaying, volume, setVolume, nextTrack, prevTrack, trackEnded,
    shuffled, toggleShuffle, repeat, cycleRepeat,
  } = useMusic();
  const url = useSongUrl(currentTrack);
  const audioRef = useRef(null);
  const pendingSeek = useRef(restorePosition);

  useEffect(() => {
    const audio = audioRef.current;
    // An imported song's object URL arrives async; play() before that would reject.
    if (!audio || !url) return;
    audio.volume = volume;
    if (!isPlaying) {
      audio.pause();
      return;
    }
    // AbortError just means a newer src replaced this play() call; that one is still playing.
    audio.play().catch((error) => error.name !== "AbortError" && setIsPlaying(false));
  }, [isPlaying, currentQid, url, volume, setIsPlaying]);

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.currentTarget.duration);
    // Restore the saved position once, after a reload.
    if (pendingSeek.current > 0) seek(Math.min(pendingSeek.current, e.currentTarget.duration));
    pendingSeek.current = 0;
  };

  const handleEnded = () => {
    // Repeat "one": same queue item, so the audio element isn't remounted; restart it here.
    if (!trackEnded()) return;
    seek(0);
    audioRef.current.play().catch(() => setIsPlaying(false));
  };

  const handlePrev = () => {
    if (audioRef.current.currentTime > 3 || !prevTrack()) seek(0);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const disabled = !currentTrack;

  return (
    <footer className="player-bar">
      {currentTrack && (
        <audio
          // Keyed by queue entry so a duplicate song in the queue starts from 0.
          key={currentQid}
          ref={audioRef}
          src={url ?? undefined}
          preload="metadata"
          onLoadStart={() => {
            setCurrentTime(0);
            setDuration(0);
          }}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={handleEnded}
        />
      )}

      <div className="track-info">
        <p className="track-title">{currentTrack?.title ?? "Nothing playing"}</p>
        <p className="track-artist">{currentTrack?.artist ?? "Pick a song to start"}</p>
      </div>

      <div className="player-center">
        <div className="controls">
          <button
            className="control-btn toggle-btn"
            aria-label="Shuffle"
            aria-pressed={shuffled}
            disabled={disabled}
            onClick={toggleShuffle}
          >
            🔀
          </button>
          <button className="control-btn" aria-label="Previous" disabled={disabled} onClick={handlePrev}>⏮</button>
          <button
            className="control-btn play-btn"
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={disabled}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className="control-btn" aria-label="Next" disabled={disabled} onClick={nextTrack}>⏭</button>
          <button
            className={`control-btn toggle-btn${repeat === "off" ? "" : " on"}`}
            aria-label={`Repeat ${repeat}`}
            onClick={cycleRepeat}
          >
            🔁{repeat === "one" && <span className="repeat-badge" aria-hidden="true">1</span>}
          </button>
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
            disabled={disabled}
            onChange={(e) => seek(Number(e.target.value))}
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

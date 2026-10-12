import { Icon } from "./Icon";
import { formatTime } from "../lib/format";
import { useMusic } from "../state/useMusic";
import { usePlaybackTime } from "../state/usePlaybackTime";
import { SettingsPopover } from "./SettingsPopover";
import { Visualiser } from "./Visualiser";

// A view: playback itself lives in the engine, driven by the provider.
export const PlayerBar = ({ queueOpen, onToggleQueue, queueToggleRef }) => {
  const {
    currentTrack, isPlaying, setIsPlaying, volume, setVolume, nextTrack, prevTrack, seek,
    shuffled, toggleShuffle, repeat, cycleRepeat,
  } = useMusic();
  const { current: currentTime, duration } = usePlaybackTime();

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const disabled = !currentTrack;

  return (
    <footer className="player-bar">
      <div className="track-info">
        <Visualiser />
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
            <Icon name="shuffle" />
          </button>
          <button className="control-btn" aria-label="Previous" disabled={disabled} onClick={prevTrack}><Icon name="prev" /></button>
          <button
            className="control-btn play-btn"
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={disabled}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <Icon name={isPlaying ? "pause" : "play"} size={22} />
          </button>
          <button className="control-btn" aria-label="Next" disabled={disabled} onClick={nextTrack}><Icon name="next" /></button>
          <button
            className={`control-btn toggle-btn${repeat === "off" ? "" : " on"}`}
            aria-label={`Repeat ${repeat}`}
            onClick={cycleRepeat}
          >
            <Icon name="repeat" />{repeat === "one" && <span className="repeat-badge" aria-hidden="true">1</span>}
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
        <SettingsPopover />
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
          <Icon name="queue" />
        </button>
      </div>
    </footer>
  );
};

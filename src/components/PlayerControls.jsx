import { formatTime } from "../lib/format";
import { useMusic } from "../state/useMusic";
import { usePlaybackTime } from "../state/usePlaybackTime";
import { Icon } from "./Icon";

// Shared by the player bar and, under 640px, the Up next drawer header.
export const ShuffleButton = ({ className = "" }) => {
  const { currentTrack, shuffled, toggleShuffle } = useMusic();
  return (
    <button
      type="button"
      className={`control-btn toggle-btn ${className}`}
      aria-label="Shuffle"
      aria-pressed={shuffled}
      disabled={!currentTrack}
      onClick={toggleShuffle}
    >
      <Icon name="shuffle" />
    </button>
  );
};

export const RepeatButton = ({ className = "" }) => {
  const { repeat, cycleRepeat } = useMusic();
  return (
    <button
      type="button"
      className={`control-btn toggle-btn${repeat === "off" ? "" : " on"} ${className}`}
      aria-label={`Repeat ${repeat}`}
      onClick={cycleRepeat}
    >
      <Icon name="repeat" />
      {repeat === "one" && <span className="repeat-badge" aria-hidden="true">1</span>}
    </button>
  );
};

// `current` and `duration` come from the caller so a parent that already tracks time doesn't subscribe twice.
export const SeekBar = ({ current, duration }) => {
  const { currentTrack, seek } = useMusic();
  return (
    <div className="progress-container">
      <span className="time">{formatTime(current)}</span>
      <input
        type="range"
        min="0"
        max={duration || 0}
        step="0.1"
        value={current}
        className="progress-bar"
        aria-label="Seek"
        aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
        disabled={!currentTrack}
        onChange={(e) => seek(Number(e.target.value))}
        style={{ "--progress": `${duration > 0 ? (current / duration) * 100 : 0}%` }}
      />
      <span className="time">{formatTime(duration)}</span>
    </div>
  );
};

// A seek bar that follows playback itself, for the drawer.
export const LiveSeekBar = () => {
  const { current, duration } = usePlaybackTime();
  return <SeekBar current={current} duration={duration} />;
};

export const VolumeSlider = ({ className = "" }) => {
  const { volume, setVolume } = useMusic();
  return (
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      className={`volume-bar ${className}`}
      aria-label="Volume"
      aria-valuetext={`Volume ${Math.round(volume * 100)}%`}
      value={volume}
      onChange={(e) => setVolume(Number(e.target.value))}
      style={{ "--progress": `${volume * 100}%` }}
    />
  );
};

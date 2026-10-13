import { Cover } from "./Cover";
import { Icon } from "./Icon";
import { useMusic } from "../state/useMusic";
import { usePlaybackTime } from "../state/usePlaybackTime";
import { RepeatButton, SeekBar, ShuffleButton, VolumeSlider } from "./PlayerControls";
import { SettingsPopover } from "./SettingsPopover";
import { Visualiser } from "./Visualiser";

// A view: playback itself lives in the engine, driven by the provider. Under 640px the `dock-extra`
// controls are hidden and live in the Up next drawer header instead.
export const PlayerBar = ({ queueOpen, onToggleQueue, queueToggleRef, lyricsOpen, onToggleLyrics, lyricsToggleRef }) => {
  const { currentTrack, isPlaying, setIsPlaying, nextTrack, prevTrack } = useMusic();
  const { current, duration } = usePlaybackTime();
  const disabled = !currentTrack;

  return (
    <footer className="player-bar">
      <div className="mini-progress" aria-hidden="true" style={{ "--progress": `${duration > 0 ? (current / duration) * 100 : 0}%` }} />
      <div className="track-info">
        <Visualiser />
        {currentTrack && <Cover song={currentTrack} eager />}
        <div className="track-text">
          <p className="track-title">{currentTrack?.title ?? "Nothing playing"}</p>
          <p className="track-artist">{currentTrack?.artist ?? "Pick a song to start"}</p>
        </div>
      </div>

      <div className="player-center">
        <div className="controls">
          <ShuffleButton className="dock-extra" />
          <button className="control-btn dock-extra" aria-label="Previous" disabled={disabled} onClick={prevTrack}><Icon name="prev" /></button>
          <button
            className="control-btn play-btn"
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={disabled}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <Icon name={isPlaying ? "pause" : "play"} size={22} />
          </button>
          <button className="control-btn" aria-label="Next" disabled={disabled} onClick={nextTrack}><Icon name="next" /></button>
          <RepeatButton className="dock-extra" />
        </div>
        <div className="dock-extra progress-wrap">
          <SeekBar current={current} duration={duration} />
        </div>
      </div>

      <div className="player-right">
        <div className="dock-extra player-extras">
          <SettingsPopover />
          <VolumeSlider />
        </div>
        <button
          ref={lyricsToggleRef}
          className="control-btn"
          aria-label="Lyrics"
          aria-expanded={lyricsOpen}
          aria-controls="lyrics-panel"
          disabled={disabled}
          onClick={onToggleLyrics}
        >
          <Icon name="lyrics" />
        </button>
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

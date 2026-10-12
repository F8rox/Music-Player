import { Icon } from "./Icon";
import { useState } from "react";
import { useMusic } from "../state/useMusic";

// Playback settings: smart crossfade on/off and fade length (saved with the rest of the state).
export const SettingsPopover = () => {
  const { settings, setSettings } = useMusic();
  const [open, setOpen] = useState(false);
  const update = (change) => setSettings((s) => ({ ...s, ...change }));

  return (
    <div
      className="song-menu"
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
    >
      <button
        type="button"
        className="control-btn"
        aria-label="Playback settings"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name="settings" />
      </button>
      {open && (
        <div className="menu settings-popover" role="group" aria-label="Playback settings">
          <label className="setting-row">
            <input
              type="checkbox"
              checked={settings.crossfade}
              onChange={(e) => update({ crossfade: e.target.checked })}
            />
            Smart crossfade
          </label>
          <label className="setting-row" htmlFor="fade-length">
            Fade length: {settings.fadeSeconds} s
          </label>
          <input
            id="fade-length"
            type="range"
            min="2"
            max="12"
            step="1"
            value={settings.fadeSeconds}
            disabled={!settings.crossfade}
            aria-valuetext={`${settings.fadeSeconds} seconds`}
            onChange={(e) => update({ fadeSeconds: Number(e.target.value) })}
          />
          <label className="setting-row">
            <input
              type="checkbox"
              checked={settings.beatMatch}
              disabled={!settings.crossfade}
              onChange={(e) => update({ beatMatch: e.target.checked })}
            />
            Beat-match (experimental)
          </label>
        </div>
      )}
    </div>
  );
};

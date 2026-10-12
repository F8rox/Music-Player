import { useEffect, useState } from "react";
import { engine } from "../audio/engine";

// Fast-changing time lives here, read only by the player bar and the drawer seek bar, so song lists
// don't re-render ~4×/s. It starts from the engine so a late-mounted reader doesn't miss loadedmetadata.
export const usePlaybackTime = () => {
  const [time, setTime] = useState(() => ({ current: engine.currentTime(), duration: engine.duration() }));

  useEffect(() => {
    const offs = [
      engine.on("loadstart", () => setTime({ current: 0, duration: 0 })),
      engine.on("loadedmetadata", (e) => setTime((t) => ({ ...t, duration: e.target.duration }))),
      engine.on("timeupdate", (e) => setTime((t) => ({ ...t, current: e.target.currentTime }))),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  return time;
};

import { useEffect, useRef } from "react";
import { engine } from "../audio/engine";
import { useMusic } from "../state/useMusic";

const BARS = 64;

// Frequency bars drawn straight onto a canvas each frame; React only re-runs this on
// play/pause or track-energy changes, never per frame.
export const Visualiser = () => {
  const { isPlaying, currentTrack, energyOf } = useMusic();
  const level = currentTrack ? energyOf(currentTrack.id) : undefined;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas.getContext("2d");
    const token = level ? `--energy-${Math.round(level)}` : "--text-muted";
    const colour = getComputedStyle(canvas).getPropertyValue(token).trim();
    // The analyser only exists after the first play (a user gesture); never create it early.
    const analyser = isPlaying ? engine.analyser() : null;
    const bins = new Uint8Array(analyser?.frequencyBinCount ?? 0);
    const usable = Math.floor(bins.length * 0.4); // most musical energy sits in the lower bins
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const fit = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
    };
    const draw = () => {
      g.clearRect(0, 0, canvas.width, canvas.height);
      if (!analyser) return;
      analyser.getByteFrequencyData(bins);
      g.fillStyle = colour; // set per frame: resizing the canvas resets context state
      const barWidth = canvas.width / BARS;
      for (let i = 0; i < BARS; i++) {
        const height = (bins[Math.floor((i * usable) / BARS)] / 255) * canvas.height;
        g.fillRect(i * barWidth, canvas.height - height, barWidth * 0.7, height);
      }
    };
    const loop = () => {
      draw();
      if (analyser && !reduced && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) loop();
    };

    fit();
    loop();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", fit);
    };
  }, [isPlaying, level]);

  return <canvas ref={canvasRef} className="visualiser" aria-hidden="true" />;
};

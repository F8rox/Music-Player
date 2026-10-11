import { useEffect, useState } from "react";
import { useMusic } from "../state/useMusic";

const hasFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes("Files");

// Whole-page drop target, shown only while files are dragged over the window.
export const DropZone = () => {
  const { importFiles, importing } = useMusic();
  const [active, setActive] = useState(false);

  useEffect(() => {
    let depth = 0; // dragenter/leave fire for every child; count to know when we really left
    const enter = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setActive(true);
    };
    const over = (e) => hasFiles(e) && e.preventDefault();
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setActive(false);
    };
    const drop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setActive(false);
      if (!importing) importFiles([...e.dataTransfer.files]);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, [importFiles, importing]);

  return active ? <div className="drop-zone" aria-hidden="true">Drop to add</div> : null;
};

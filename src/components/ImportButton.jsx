import { useRef } from "react";
import { filesFromDirectory } from "../library/importFiles";
import { useMusic } from "../state/useMusic";

const ACCEPT = "audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac,.lrc";

export const ImportButton = () => {
  const { importFiles, importing, notify } = useMusic();
  const inputRef = useRef(null);

  const pickFolder = async () => {
    let files;
    try {
      files = await filesFromDirectory(await window.showDirectoryPicker());
    } catch (error) {
      // Cancelling is silent; anything else (Chrome refuses Downloads, Desktop and Documents themselves) is said out loud.
      if (error.name !== "AbortError") {
        notify("Couldn't open that folder. Pick a folder inside Downloads, Desktop or Documents, not the folder itself, or use Add your music.");
      }
      return;
    }
    if (files.length === 0) return notify("No songs found in that folder.");
    importFiles(files);
  };

  return (
    <div className="import-actions">
      <button type="button" className="primary-btn" disabled={importing} onClick={() => inputRef.current.click()}>
        Add your music
      </button>
      {"showDirectoryPicker" in window && (
        <button type="button" className="secondary-btn" disabled={importing} onClick={pickFolder}>
          Add a folder
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          importFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
    </div>
  );
};

import { useRef } from "react";
import { filesFromDirectory } from "../library/importFiles";
import { useMusic } from "../state/useMusic";

const ACCEPT = "audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac";

export const ImportButton = () => {
  const { importFiles, importing } = useMusic();
  const inputRef = useRef(null);

  const pickFolder = async () => {
    try {
      importFiles(await filesFromDirectory(await window.showDirectoryPicker()));
    } catch {
      // The user cancelled the folder picker.
    }
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

import { useRef } from "react";
import { importable } from "../library/importFiles";
import { useMusic } from "../state/useMusic";

const ACCEPT = "audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac,.lrc";

export const ImportButton = () => {
  const { importFiles, importing, notify } = useMusic();
  const filesRef = useRef(null);
  const folderRef = useRef(null);

  return (
    <div className="import-actions">
      <button type="button" className="primary-btn" disabled={importing} onClick={() => filesRef.current.click()}>
        Add your music
      </button>
      <button type="button" className="secondary-btn" disabled={importing} onClick={() => folderRef.current.click()}>
        Add a folder
      </button>
      <input
        ref={filesRef}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          importFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
      {/* A folder input hands over every file inside, sub-folders included, and needs no permission prompt. */}
      <input
        ref={folderRef}
        type="file"
        webkitdirectory=""
        hidden
        onChange={(e) => {
          const files = importable([...e.target.files]);
          e.target.value = "";
          if (files.length === 0) notify("No songs found in that folder.");
          else importFiles(files);
        }}
      />
    </div>
  );
};

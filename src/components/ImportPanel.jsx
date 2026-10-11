import { useMusic } from "../state/useMusic";

const LABELS = {
  pending: "Adding…",
  added: "Added",
  duplicate: "Already in your library",
  invalid: "Can't play this file",
  "too-big": "Too big (over 100 MB)",
  "no-space": "Not enough storage",
  error: "Couldn't add",
};
const FAILED = ["invalid", "too-big", "no-space", "error"];

export const ImportPanel = () => {
  const { imports, importing, clearImports } = useMusic();
  if (imports.length === 0) return null;
  const done = imports.filter((entry) => entry.status !== "pending").length;

  return (
    <section className="import-panel" aria-label="Import progress">
      <div className="import-header">
        <span role="status">
          {importing ? `Adding ${done + 1} of ${imports.length}…` : `Finished: ${done} of ${imports.length}`}
        </span>
        {!importing && (
          <button type="button" className="control-btn" aria-label="Close import progress" onClick={clearImports}>
            ✕
          </button>
        )}
      </div>
      <ul className="import-list">
        {imports.map((entry) => (
          <li key={entry.key}>
            <span className="import-name">{entry.name}</span>
            <span className={FAILED.includes(entry.status) ? "import-status failed" : "import-status"}>
              {LABELS[entry.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

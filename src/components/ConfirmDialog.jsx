import { useEffect, useRef } from "react";

// Native modal <dialog>: focus trap, Esc and backdrop handling come from the platform.
export const ConfirmDialog = ({ title, message, confirmLabel, onConfirm, onCancel }) => {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={ref} className="confirm-dialog" onCancel={onCancel} aria-labelledby="confirm-title">
      <h2 id="confirm-title">{title}</h2>
      <p>{message}</p>
      <div className="dialog-actions">
        <button type="button" className="secondary-btn" onClick={onCancel} autoFocus>Cancel</button>
        <button type="button" className="danger-btn" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
};

import { useEffect, useState } from "react";
import { useMusic } from "../state/useMusic";

// The live region stays mounted so screen readers announce each new message.
export const Notice = () => {
  const { notice } = useMusic();
  const [hiddenId, setHiddenId] = useState(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setHiddenId(notice.id), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const visible = notice && notice.id !== hiddenId;
  return (
    <div className="notice" role="status">
      {visible && <span key={notice.id}>{notice.text}</span>}
    </div>
  );
};

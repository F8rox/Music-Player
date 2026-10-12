import { useEffect } from "react";

const FOCUSABLE = "button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex='-1'])";

// Keeps Tab inside `ref` while the panel is an overlay (under 1024px, where it covers the page).
// On wide screens Up next sits beside the content, so nothing is trapped.
export const useFocusTrap = (ref) => {
  useEffect(() => {
    const panel = ref.current;
    const onKey = (e) => {
      if (e.key !== "Tab" || !window.matchMedia("(max-width: 1023px)").matches) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const [first, last] = [items[0], items.at(-1)];
      if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ref]);
};

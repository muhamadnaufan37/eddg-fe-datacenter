import { useEffect, useState } from "react";

export function useInspectDetect() {
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    const detect = () => {
      try {
        if (isTouchDevice) {
          setIsInspectOpen(false);
          return;
        }

        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        const open = widthDiff > 160 || heightDiff > 160;
        setIsInspectOpen(open);
      } catch (e) {
        // ignore
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTouchDevice) return;

      if (e.key === "F12") setIsInspectOpen(true);
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i"))
        setIsInspectOpen(true);
    };

    const interval = window.setInterval(detect, 1000);
    window.addEventListener("resize", detect);
    window.addEventListener("keydown", onKey);
    detect();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", detect);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return { isInspectOpen };
}

export function renderSensitive(val: any, isInspectOpen: boolean) {
  return isInspectOpen ? "[Disamarkan saat inspeksi]" : (val ?? "-");
}

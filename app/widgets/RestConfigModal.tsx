"use client";

import { useEffect, useRef, useState } from "react";

export function RestConfigModal({
  start,
  interval,
  onSave,
  onClose,
}: {
  start: string;
  interval: number;
  onSave: (start: string, interval: number) => void;
  onClose: () => void;
}) {
  const [s, setS] = useState(start);
  const [iv, setIv] = useState(String(interval));
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-xs bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/60 uppercase">Quick Rest</p>
          <button onClick={onClose} className="text-white/50 hover:text-white/75 text-lg leading-none transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-5 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[0.25em] text-white/50 uppercase">Start Time</label>
            <input
              type="time"
              value={s}
              onChange={(e) => setS(e.target.value)}
              className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white/85 tracking-[0.1em] outline-none focus:border-white/25 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[0.25em] text-white/50 uppercase">Interval (minutes)</label>
            <input
              type="number"
              min="5"
              max="240"
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white/85 tracking-[0.1em] outline-none focus:border-white/25 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] text-white/50 border border-white/5 rounded-lg hover:bg-white/5 transition-colors capitalize">Cancel</button>
          <button
            onClick={() => { onSave(s, Math.max(5, parseInt(iv) || 60)); onClose(); }}
            className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors capitalize"
          >Save</button>
        </div>
      </div>
    </div>
  );
}

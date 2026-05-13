"use client";

import { useEffect, useRef } from "react";

export function QuoteModal({ quote, onClose }: { quote: { q: string; a: string }; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-sm bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Daily Quote</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none transition-colors">✕</button>
        </div>
        <div className="px-6 py-6 flex flex-col gap-4">
          <p className="text-sm tracking-[0.05em] text-white/80 leading-relaxed">&ldquo;{quote.q}&rdquo;</p>
          <p className="text-[11px] tracking-[0.2em] text-white/35 uppercase text-right">&mdash; {quote.a}</p>
        </div>
      </div>
    </div>
  );
}

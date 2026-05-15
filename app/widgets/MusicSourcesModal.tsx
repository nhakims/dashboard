"use client";

import { useEffect, useRef } from "react";

export function MusicSourcesModal({ onClose }: { onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sources = [
    { name: "Free To Use Music", desc: "Epic & cinematic tracks", url: "https://freetouse.com/music/category/epic" },
    { name: "Uppbeat", desc: "Inspiring royalty-free music", url: "https://uppbeat.io/music/category/inspiring" },
    { name: "Pixabay Music", desc: "Motivational background music", url: "https://pixabay.com/music/search/motivation/?order=ec" },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-sm bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/60 uppercase">Find Music</p>
          <button onClick={onClose} className="text-white/50 hover:text-white/75 text-lg leading-none transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-2 px-5 py-4">
          {sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors group"
            >
              <div>
                <p className="text-[11px] tracking-[0.15em] text-white/75 group-hover:text-white/90 transition-colors">{s.name}</p>
                <p className="text-[10px] tracking-[0.1em] text-white/40 mt-0.5">{s.desc}</p>
              </div>
              <svg className="w-3 h-3 text-white/35 group-hover:text-white/60 shrink-0 ml-3 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
        <div className="px-5 pb-5 flex flex-col gap-2">
          <p className="text-[9px] tracking-[0.15em] text-white/35 text-center leading-relaxed">
            Please respect the creators&apos; talent and work — read each platform&apos;s licensing terms before use.
          </p>
          <p className="text-[9px] tracking-[0.15em] text-white/25 text-center leading-relaxed">
            If you enjoy the music, consider supporting the creator directly — follow, share, or purchase their work where possible.
          </p>
        </div>
      </div>
    </div>
  );
}

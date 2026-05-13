"use client";

import { useEffect, useRef, useState } from "react";

export function QuranPlayerModal({
  surahs,
  currentSurah,
  currentAyahIndex,
  isPlaying,
  onPlayToggle,
  onSurahSelect,
  onClose,
  quranFont,
}: {
  surahs: { number: number; name: string; englishName: string; numberOfAyahs: number; revelationType: string }[];
  currentSurah: { number: number; name: string; englishName: string; ayahs: { audio: string }[] } | null;
  currentAyahIndex: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onSurahSelect: (num: number) => void;
  onClose: () => void;
  quranFont?: "naskh" | "kitab";
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = surahs.filter(
    (s) =>
      s.englishName.toLowerCase().includes(filter.toLowerCase()) ||
      s.name.includes(filter) ||
      s.number.toString().includes(filter)
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <p className="text-xs tracking-[0.3em] text-white/60 uppercase">Quran Player</p>
            <p className="text-[10px] tracking-[0.2em] text-white/40 mt-0.5">Streaming · Mishary Rashid Alafasy</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white/75 text-lg leading-none transition-colors">✕</button>
        </div>

        <div className="px-6 py-8 flex flex-col items-center gap-6 border-b border-white/5 bg-white/[0.02]">
          <div className="w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-8 justify-center mx-auto">
            <button
              onClick={onPlayToggle}
              className="w-16 h-16 flex items-center justify-center bg-[#3a3a3a] hover:bg-[#4a4a4a] border border-white/8 rounded-lg transition-all shrink-0"
              aria-label="Play/Pause Quran"
            >
              {isPlaying ? (
                <svg className="w-7 h-7 text-white/90" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-7 h-7 text-white/90" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <div className="text-center w-auto">
              {!currentSurah && (
                <p className="text-[10px] tracking-[0.2em] text-white/50 uppercase mb-1">Select a Surah</p>
              )}
              {currentSurah ? (
                <div className="flex flex-col items-center sm:items-start sm:gap-1">
                  <p className="text-2xl sm:text-3xl text-white/95 tracking-wide leading-tight text-center" dir="rtl" style={{ fontFamily: quranFont === "kitab" ? "Kitab" : "var(--font-arabic)" }}>
                    {currentSurah.name}
                  </p>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-white/70 mt-1 truncate max-w-[20rem] text-center sm:text-left">
                    {currentSurah.englishName}
                    <span className="text-[10px] tracking-[0.2em] text-white/50 ml-2">· {currentAyahIndex + 1} / {currentSurah.ayahs.length}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm tracking-[0.1em] text-white/50">—</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-white/5">
          <input
            type="text"
            placeholder="Search surah..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent text-sm text-white/85 tracking-[0.1em] placeholder-white/20 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px] scrollbar-thin">
          <div className="p-4 flex flex-col gap-1">
            {filtered.map((s) => (
              <button
                key={s.number}
                onClick={() => onSurahSelect(s.number)}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${s.number === currentSurah?.number ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[10px] tracking-[0.2em] text-white/40 tabular-nums w-4 shrink-0">{s.number}</span>
                  <div className="text-left min-w-0">
                    <p className={`text-xs tracking-[0.2em] uppercase truncate ${s.number === currentSurah?.number ? "text-white/95" : "text-white/70"}`}>
                      {s.englishName}
                    </p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mt-0.5">
                      {s.revelationType} · {s.numberOfAyahs} ayahs
                    </p>
                  </div>
                </div>
                <span className={`text-sm ${s.number === currentSurah?.number ? "text-white/90" : "text-white/40"}`} dir="rtl" style={{ fontFamily: quranFont === "kitab" ? "Kitab" : "var(--font-arabic)" }}>
                  {s.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs tracking-[0.2em] text-white/50 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

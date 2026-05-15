"use client";

import { useEffect, useRef, useState } from "react";

export function VerseModal({
  verse,
  verseNo,
  onNext,
  onClose,
  quranFont,
}: {
  verse: { surah: { englishName: string; englishNameTranslation: string; revelationType: string }; numberInSurah: number; text: string };
  verseNo: number;
  onNext: () => void;
  onClose: () => void;
  quranFont?: "naskh" | "kitab";
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [arabicText, setArabicText] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    fetch(`https://api.alquran.cloud/v1/ayah/${verseNo}`)
      .then((r) => r.json())
      .then((d) => { if (d.data) setArabicText(d.data.text); })
      .catch(() => {});
  }, [verseNo]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <p className="text-xs tracking-[0.3em] text-white/60 uppercase">{verse.surah.englishName} · {verse.numberInSurah}</p>
            <p className="text-[10px] tracking-[0.2em] text-white/40 mt-0.5">{verse.surah.englishNameTranslation} · {verse.surah.revelationType}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white/75 text-lg leading-none transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-4 px-5 py-6">
          {arabicText && (
            <p className="text-3xl text-white/95 leading-loose text-right" dir="rtl" style={{ fontFamily: quranFont === "kitab" ? "Kitab" : "var(--font-arabic)" }}>{arabicText}</p>
          )}
          <div className="border-t border-white/5" />
          <p className="text-sm tracking-[0.05em] text-white/95 leading-relaxed italic">{verse.text}</p>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] text-white/50 border border-white/5 rounded-lg hover:bg-white/5 transition-colors capitalize">Close</button>
          <button onClick={onNext} className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors capitalize">Next verse</button>
        </div>
      </div>
    </div>
  );
}

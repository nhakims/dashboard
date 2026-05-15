"use client";

import { useEffect, useRef } from "react";

export function QuranVerseDetailModal({
  surahName,
  surahEnglishName,
  surahNameTranslation,
  ayahIndex,
  totalAyahs,
  arabicText,
  translationText,
  quranFont,
  counterZoom,
  onPrev,
  onNext,
  onClose,
}: {
  surahName: string;
  surahEnglishName: string;
  surahNameTranslation: string;
  ayahIndex: number;
  totalAyahs: number;
  arabicText: string;
  translationText: string | null;
  quranFont?: "naskh" | "kitab";
  counterZoom: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm"
      style={{ zoom: counterZoom }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-lg bg-[#111] border border-white/8 rounded-xl overflow-hidden flex flex-col">

        <div className="flex items-start justify-between px-5 py-4 border-b border-white/5">
          <div className="flex-1 flex flex-col items-center gap-1 text-center">
            <p className="text-xs tracking-[0.25em] text-white/65 uppercase">{surahEnglishName} · {ayahIndex + 1} / {totalAyahs}</p>
            <p className="text-[10px] tracking-[0.15em] text-white/35">{surahNameTranslation}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white/75 text-lg leading-none transition-colors shrink-0 ml-3 mt-0.5">✕</button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-8">
          <p
            className="fc-85 leading-loose text-center w-full"
            dir="rtl"
            style={{ fontFamily: quranFont === "kitab" ? "Kitab" : "var(--font-arabic)", fontSize: "2.8rem" }}
          >
            {arabicText}
          </p>
          {translationText && (
            <>
              <div className="border-t border-white/5" />
              <p className="text-xs fc-50 tracking-[0.04em] text-center leading-relaxed">{translationText}</p>
              <p className="text-[9px] tracking-[0.15em] text-white/20 text-center uppercase">Pickthall Translation</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-white/5">
          <button
            onClick={onPrev}
            disabled={ayahIndex === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-[0.15em] fc-40 hover:fc-70 disabled:opacity-20 disabled:cursor-not-allowed transition-colors capitalize"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
          <div className="flex-1 text-center text-[10px] tracking-[0.2em] fc-20 tabular-nums">
            {ayahIndex + 1} / {totalAyahs}
          </div>
          <button
            onClick={onNext}
            disabled={ayahIndex === totalAyahs - 1}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-[0.15em] fc-40 hover:fc-70 disabled:opacity-20 disabled:cursor-not-allowed transition-colors capitalize"
          >
            Next
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}

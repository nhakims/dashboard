"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { QuranPlayerModal } from "./QuranPlayerModal";

interface Props {
  show: boolean;
  quranFont: "naskh" | "kitab" | undefined;
  showPlayerAbove: boolean;
  onPlayStart: () => void;
}

export interface QuranPlayerHandle {
  pause: () => void;
}

export const QuranPlayerWidget = forwardRef<QuranPlayerHandle, Props>(function QuranPlayerWidget(
  { show, quranFont, showPlayerAbove, onPlayStart },
  ref
) {
  const [surahs, setSurahs] = useState<{ number: number; name: string; englishName: string; numberOfAyahs: number; revelationType: string }[]>([]);
  const [currentSurah, setCurrentSurah] = useState<{ number: number; name: string; englishName: string; ayahs: { audio: string }[] } | null>(null);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isQuranPlaying, setIsQuranPlaying] = useState(false);
  const [quranVolume, setQuranVolume] = useState(1);
  const [showQuranModal, setShowQuranModal] = useState(false);

  const quranAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentSurahRef = useRef(currentSurah);
  const currentAyahIndexRef = useRef(currentAyahIndex);
  const surahsRef = useRef(surahs);

  useImperativeHandle(ref, () => ({
    pause: () => {
      if (quranAudioRef.current) quranAudioRef.current.pause();
      setIsQuranPlaying(false);
    },
  }));

  useEffect(() => { currentSurahRef.current = currentSurah; }, [currentSurah]);
  useEffect(() => { currentAyahIndexRef.current = currentAyahIndex; }, [currentAyahIndex]);
  useEffect(() => { surahsRef.current = surahs; }, [surahs]);

  const loadSurah = useCallback(async (num: number, autoPlay = true, startAyah = 0) => {
    try {
      const r = await fetch(`https://api.alquran.cloud/v1/surah/${num}/ar.alafasy`);
      const d = await r.json();
      if (d.data && quranAudioRef.current) {
        quranAudioRef.current.pause();

        setCurrentSurah(d.data);
        const idx = Math.max(0, Math.min(startAyah, d.data.ayahs.length - 1));
        setCurrentAyahIndex(idx);
        quranAudioRef.current.src = d.data.ayahs[idx].audio;
        localStorage.setItem("current-surah-num", String(num));
        localStorage.setItem("current-ayah-index", String(idx));

        if (autoPlay) {
          onPlayStart();
          quranAudioRef.current.play().catch(error => {
            if (error.name !== "AbortError") {
              console.error("Quran player play failed:", error);
            }
            setIsQuranPlaying(false);
          });
          setIsQuranPlaying(true);
        }
      }
    } catch {
      // Silence fetch errors
    }
  }, [onPlayStart]);

  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/surah")
      .then((r) => r.json())
      .then((d) => { if (d.data) setSurahs(d.data); })
      .catch(() => {});

    const savedQuranVolume = localStorage.getItem("quran-volume");
    if (savedQuranVolume) setQuranVolume(Number(savedQuranVolume));
    const savedSurahNum = localStorage.getItem("current-surah-num");
    if (savedSurahNum) {
      const savedAyah = parseInt(localStorage.getItem("current-ayah-index") ?? "0");
      loadSurah(Number(savedSurahNum), false, isNaN(savedAyah) ? 0 : savedAyah);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentSurah) {
      localStorage.setItem("current-surah-num", String(currentSurah.number));
      localStorage.setItem("current-ayah-index", String(currentAyahIndex));
    }
  }, [currentSurah, currentAyahIndex]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      quranAudioRef.current = new Audio();
      quranAudioRef.current.volume = quranVolume;

      const audio = quranAudioRef.current;
      const handleEnded = () => {
        const surah = currentSurahRef.current;
        const index = currentAyahIndexRef.current;
        const allSurahs = surahsRef.current;

        if (surah && index < surah.ayahs.length - 1) {
          const nextIndex = index + 1;
          setCurrentAyahIndex(nextIndex);
          audio.src = surah.ayahs[nextIndex].audio;
          audio.play();
        } else if (surah && allSurahs.length > 0) {
          const nextSurahNum = surah.number + 1;
          const nextSurahExists = allSurahs.some(s => s.number === nextSurahNum);

          if (nextSurahExists) {
            loadSurah(nextSurahNum, true);
          } else {
            setIsQuranPlaying(false);
            setCurrentAyahIndex(0);
            if (surah) audio.src = surah.ayahs[0].audio;
          }
        } else {
          setIsQuranPlaying(false);
          setCurrentAyahIndex(0);
        }
      };

      audio.addEventListener("ended", handleEnded);
      return () => {
        audio.removeEventListener("ended", handleEnded);
        audio.pause();
      };
    }
  }, [loadSurah]);

  useEffect(() => {
    if (quranAudioRef.current) quranAudioRef.current.volume = quranVolume;
    localStorage.setItem("quran-volume", String(quranVolume));
  }, [quranVolume]);

  useEffect(() => {
    if (!show && isQuranPlaying && quranAudioRef.current) {
      quranAudioRef.current.pause();
      setIsQuranPlaying(false);
    }
  }, [show, isQuranPlaying]);

  const toggleQuranPlay = () => {
    if (!quranAudioRef.current) return;
    if (!currentSurah) {
      setShowQuranModal(true);
      return;
    }

    if (isQuranPlaying) {
      quranAudioRef.current.pause();
      setIsQuranPlaying(false);
    } else {
      onPlayStart();
      quranAudioRef.current.play().catch(error => {
        if (error.name !== "AbortError") {
          console.error("Quran player play failed:", error);
        }
        setIsQuranPlaying(false);
      });
      setIsQuranPlaying(true);
    }
  };

  if (!show) return null;

  return (
    <>
      {showQuranModal && (
        <QuranPlayerModal
          surahs={surahs}
          currentSurah={currentSurah}
          currentAyahIndex={currentAyahIndex}
          isPlaying={isQuranPlaying}
          onPlayToggle={toggleQuranPlay}
          onSurahSelect={loadSurah}
          onClose={() => setShowQuranModal(false)}
          quranFont={quranFont}
        />
      )}
      <div className={`w-full flex flex-col items-center gap-2 ${showPlayerAbove ? "mt-2" : "mt-10"}`}>
        <button
          onClick={() => setShowQuranModal(true)}
          className="flex items-center gap-3 px-4 py-2 rounded bg-white/[0.03] border-0 hover:bg-white/[0.06] transition-all group max-w-xs w-full"
        >
          <div
            onClick={(e) => { e.stopPropagation(); toggleQuranPlay(); }}
            className="w-8 h-8 flex items-center justify-center bg-white/5 border-0 rounded shrink-0 group-hover:bg-white/10"
          >
            {isQuranPlaying ? (
              <svg className="w-4 h-4 fc-60" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-4 h-4 fc-60" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-[0.2em] fc-30 uppercase mb-0.5">Quran Streaming</p>
            {currentSurah ? (
              <>
                <p className="text-2xl fc-80 leading-tight my-2" dir="rtl" style={{ fontFamily: quranFont === "kitab" ? "Kitab" : "var(--font-arabic)" }}>{currentSurah.name}</p>
                <p className="text-[10px] fc-40 tracking-[0.2em] uppercase truncate">
                  {currentSurah.englishName}
                  <span className="text-[10px] fc-30 ml-2">· {currentAyahIndex + 1}</span>
                </p>
              </>
            ) : (
              <p className="text-xs fc-40">Select a Surah</p>
            )}
          </div>
        </button>
      </div>
    </>
  );
});

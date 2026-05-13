"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteMediaFile, getMediaFile, saveMediaFile } from "./lib/media-db";
import { BgSettingsModal } from "./widgets/BgSettingsModal";
import { ClockFace } from "./widgets/ClockFace";
import { ListItemModal } from "./widgets/ListItemModal";
import { LocationPickerModal } from "./widgets/LocationPickerModal";
import { MediaModal } from "./widgets/MediaModal";
import { QuoteModal } from "./widgets/QuoteModal";
import { QuranPlayerModal } from "./widgets/QuranPlayerModal";
import { ReminderModal } from "./widgets/ReminderModal";
import { RestConfigModal } from "./widgets/RestConfigModal";
import { TermsModal } from "./widgets/TermsModal";
import { VerseModal } from "./widgets/VerseModal";
import { WeatherIcon } from "./widgets/WeatherIcon";
import { ZonePicker } from "./widgets/ZonePicker";
import {
  DEFAULT_BG,
  getWeatherInfo,
  hexToRgbStr,
  type BgConfig,
  type PrayerTimes,
  type Reminder,
  type WeatherData,
  type WeatherLoc,
} from "./widgets/types";

export default function Clock() {
  const [zone, setZone] = useState("WLY01");
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [listItems, setListItems] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [restStart, setRestStart] = useState("08:30");
  const [restInterval, setRestInterval] = useState(60);
  const [showRestConfig, setShowRestConfig] = useState(false);
  const [weatherLoc, setWeatherLoc] = useState<WeatherLoc | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showListAdd, setShowListAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; text: string } | null>(null);
  const [bgConfig, setBgConfig] = useState<BgConfig>(DEFAULT_BG);
  const [showBgSettings, setShowBgSettings] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [verseNo, setVerseNo] = useState(1);
  const [verseData, setVerseData] = useState<{ surah: { englishName: string; englishNameTranslation: string; revelationType: string }; numberInSurah: number; text: string } | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<{ q: string; a: string } | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const [hijriDate, setHijriDate] = useState<string | null>(null);
  const [tracks, setTracks] = useState<{ id: string; name: string }[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const tracksRef = useRef(tracks);
  const currentTrackIdRef = useRef(currentTrackId);
  const isPlayingRef = useRef(isPlaying);
  const autoPlayNextRef = useRef(false);
  const restoreProgressRef = useRef(0);

  // Quran Player State
  const [surahs, setSurahs] = useState<{ number: number; name: string; englishName: string }[]>([]);
  const [currentSurah, setCurrentSurah] = useState<{ number: number; name: string; englishName: string; ayahs: { audio: string }[] } | null>(null);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isQuranPlaying, setIsQuranPlaying] = useState(false);
  const [quranVolume, setQuranVolume] = useState(1);
  const [showQuranModal, setShowQuranModal] = useState(false);
  const quranAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentSurahRef = useRef(currentSurah);
  const currentAyahIndexRef = useRef(currentAyahIndex);
  const surahsRef = useRef(surahs);

  // Reminder state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderNow, setReminderNow] = useState(() => new Date());

  useEffect(() => { currentSurahRef.current = currentSurah; }, [currentSurah]);
  useEffect(() => { currentAyahIndexRef.current = currentAyahIndex; }, [currentAyahIndex]);
  useEffect(() => { surahsRef.current = surahs; }, [surahs]);

  useEffect(() => {
    const id = setInterval(() => setReminderNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const loadSurah = useCallback(async (num: number, autoPlay = true, startAyah = 0) => {
    try {
      const r = await fetch(`https://api.alquran.cloud/v1/surah/${num}/ar.alafasy`);
      const d = await r.json();
      if (d.data && quranAudioRef.current) {
        quranAudioRef.current.pause();
        if (isPlayingRef.current && audioRef.current) {
          audioRef.current.pause();
        }

        setCurrentSurah(d.data);
        const idx = Math.max(0, Math.min(startAyah, d.data.ayahs.length - 1));
        setCurrentAyahIndex(idx);
        quranAudioRef.current.src = d.data.ayahs[idx].audio;
        localStorage.setItem("current-surah-num", String(num));
        localStorage.setItem("current-ayah-index", String(idx));

        if (autoPlay) {
          quranAudioRef.current.play().catch(error => {
            if (error.name !== "AbortError") {
              console.error("Quran player play failed:", error);
            }
            setIsQuranPlaying(false);
          });
          setIsQuranPlaying(true);
          setIsPlaying(false);
        }
      }
    } catch {
      // Silence fetch errors
    }
  }, []);

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
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      quranAudioRef.current.play().catch(error => {
        if (error.name !== "AbortError") {
          console.error("Quran player play failed:", error);
        }
        setIsQuranPlaying(false);
      });
      setIsQuranPlaying(true);
    }
  };

  useEffect(() => {
    if (!bgConfig.showQuranPlayer && isQuranPlaying && quranAudioRef.current) {
      quranAudioRef.current.pause();
      setIsQuranPlaying(false);
    }
  }, [bgConfig.showQuranPlayer, isQuranPlaying]);

  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { currentTrackIdRef.current = currentTrackId; }, [currentTrackId]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const loadTrack = useCallback(async (id: string, autoPlay = false, startAt = 0) => {
    try {
      const file = await getMediaFile(id);
      if (!file || !audioRef.current) return;

      audioRef.current.pause();

      if (quranAudioRef.current) {
        quranAudioRef.current.pause();
        setIsQuranPlaying(false);
      }

      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
      const url = URL.createObjectURL(file.blob);
      audioBlobUrlRef.current = url;

      audioRef.current.src = url;
      audioRef.current.load();

      if (startAt > 0) {
        const seek = () => {
          if (audioRef.current) audioRef.current.currentTime = startAt;
          audioRef.current?.removeEventListener("loadedmetadata", seek);
        };
        audioRef.current.addEventListener("loadedmetadata", seek);
        setProgress(startAt);
      } else {
        setProgress(0);
        localStorage.removeItem("media-progress");
      }

      if (autoPlay) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isPlaying && currentTrackId) {
      const interval = setInterval(() => {
        if (audioRef.current) {
          const t = audioRef.current.currentTime;
          setProgress(t);
          localStorage.setItem(`media-progress`, String(t));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTrackId]);

  useEffect(() => {
    const savedTracks = localStorage.getItem("media-tracks");
    if (savedTracks) setTracks(JSON.parse(savedTracks));
    const savedTrackId = localStorage.getItem("current-track-id");
    const savedProgress = parseFloat(localStorage.getItem("media-progress") ?? "0") || 0;
    if (savedTrackId) {
      restoreProgressRef.current = savedProgress;
      setCurrentTrackId(savedTrackId);
    }
    const savedVolume = localStorage.getItem("media-volume");
    if (savedVolume) setVolume(Number(savedVolume));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();

      const audio = audioRef.current;
      const updateDuration = () => setDuration(audio.duration);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        const currentTracks = tracksRef.current;
        const currentId = currentTrackIdRef.current;
        const index = currentTracks.findIndex((t) => t.id === currentId);

        if (index !== -1 && index < currentTracks.length - 1) {
          autoPlayNextRef.current = true;
          setCurrentTrackId(currentTracks[index + 1].id);
        } else if (currentTracks.length > 0) {
          autoPlayNextRef.current = true;
          setCurrentTrackId(currentTracks[0].id);
        }
      };
      const handleError = (e: Event) => {
        console.error("Audio error event:", e);
        if (audio.error) {
          console.error("Error code:", audio.error.code);
          console.error("Error message:", audio.error.message);
        }
      };

      audio.addEventListener("loadedmetadata", updateDuration);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);

      return () => {
        audio.removeEventListener("loadedmetadata", updateDuration);
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
        audio.pause();
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    localStorage.setItem("media-volume", String(volume));
  }, [volume]);

  useEffect(() => {
    if (currentTrackId) {
      const shouldAutoPlay = autoPlayNextRef.current;
      const startAt = restoreProgressRef.current;
      autoPlayNextRef.current = false;
      restoreProgressRef.current = 0;
      localStorage.setItem("current-track-id", currentTrackId);
      loadTrack(currentTrackId, shouldAutoPlay, startAt);
    }
  }, [currentTrackId, loadTrack]);

  const selectTrack = useCallback((id: string) => {
    autoPlayNextRef.current = true;
    setCurrentTrackId(id);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrackId) return;

    if (isPlaying) {
      audioRef.current.pause();
      localStorage.setItem(`media-progress`, String(audioRef.current.currentTime));
    } else {
      if (isQuranPlaying && quranAudioRef.current) {
        quranAudioRef.current.pause();
        setIsQuranPlaying(false);
      }
      audioRef.current.play().catch(() => {});
    }
  };

  const handleUpload = async (file: File) => {
    const id = Date.now().toString();
    try {
      await saveMediaFile({ id, blob: file });
      const newTracks = [...tracks, { id, name: file.name }];
      setTracks(newTracks);
      localStorage.setItem("media-tracks", JSON.stringify(newTracks));
      if (!currentTrackId) setCurrentTrackId(id);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMediaFile(id);
    const newTracks = tracks.filter(t => t.id !== id);
    setTracks(newTracks);
    localStorage.setItem("media-tracks", JSON.stringify(newTracks));
    if (currentTrackId === id) {
      setCurrentTrackId(newTracks[0]?.id || null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setIsPlaying(false);
    }
  };

  const handleSeek = (val: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setProgress(val);
      if (currentTrackId) {
        localStorage.setItem(`media-progress`, String(val));
      }
    }
  };

  useEffect(() => {
    if (!bgConfig.showPlayer && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [bgConfig.showPlayer, isPlaying]);

  useEffect(() => {
    if (!localStorage.getItem("terms-accepted")) setShowTerms(true);
    const saved = localStorage.getItem("solat-zone");
    if (saved) setZone(saved);
    const todayKey = `clock-list-${new Date().toISOString().slice(0, 10)}`;
    const savedList = localStorage.getItem(todayKey) ?? localStorage.getItem("clock-list");
    const defaultList = [{ id: "default", text: "Some text here", done: false }];
    const parsed = savedList ? JSON.parse(savedList) : defaultList;
    setListItems(parsed.map((i: { id: string; text: string; done?: boolean }) => ({ ...i, done: i.done ?? false })));
    localStorage.removeItem("clock-list");
    setRestStart(localStorage.getItem("rest-start") ?? "08:30");
    setRestInterval(parseInt(localStorage.getItem("rest-interval") ?? "60"));
    const savedLoc = localStorage.getItem("weather-loc");
    if (savedLoc) setWeatherLoc(JSON.parse(savedLoc));
    const savedBg = localStorage.getItem("bg-config");
    if (savedBg) setBgConfig(JSON.parse(savedBg));
    const savedReminders = localStorage.getItem("reminders");
    if (savedReminders) setReminders(JSON.parse(savedReminders));
    const savedVerse = localStorage.getItem("quran-verse");
    const next = savedVerse ? (parseInt(savedVerse) % 6236) + 1 : 1;
    setVerseNo(next);
    localStorage.setItem("quran-verse", String(next));
  }, []);

  useEffect(() => {
    setVerseLoading(true);
    fetch(`https://api.alquran.cloud/v1/ayah/${verseNo}/en.pickthall`)
      .then((r) => r.json())
      .then((d) => { if (d.data) setVerseData(d.data); })
      .catch(() => {})
      .finally(() => setVerseLoading(false));
  }, [verseNo]);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => { if (d.ip) setUserIp(d.ip); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("https://ummahapi.com/api/today-hijri")
      .then((r) => r.json())
      .then((d) => {
        const h = d?.data?.hijri;
        if (h?.day && h?.month_name && h?.year) {
          setHijriDate(`${h.day} ${h.month_name} ${h.year} H`);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!bgConfig.showDailyQuote) return;
    const today = new Date().toDateString();
    const cached = localStorage.getItem("daily-quote");
    if (cached) {
      const { date, quote } = JSON.parse(cached);
      if (date === today) { setDailyQuote(quote); return; }
    }
    fetch("/api/quote")
      .then((r) => r.json())
      .then((d) => {
        if (d.q && d.a) {
          setDailyQuote(d);
          localStorage.setItem("daily-quote", JSON.stringify({ date: today, quote: d }));
        }
      })
      .catch(() => {});
  }, [bgConfig.showDailyQuote]);

  const nextVerse = () => {
    const next = verseNo < 6236 ? verseNo + 1 : 1;
    setVerseNo(next);
    localStorage.setItem("quran-verse", String(next));
  };

  const saveBgConfig = (c: BgConfig) => {
    setBgConfig(c);
    localStorage.setItem("bg-config", JSON.stringify(c));
  };

  const saveRestConfig = (start: string, interval: number) => {
    setRestStart(start);
    setRestInterval(interval);
    localStorage.setItem("rest-start", start);
    localStorage.setItem("rest-interval", String(interval));
  };

  const saveList = (items: { id: string; text: string; done: boolean }[]) => {
    setListItems(items);
    const todayKey = `clock-list-${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(todayKey, JSON.stringify(items));
  };

  const saveReminders = (items: Reminder[]) => {
    setReminders(items);
    localStorage.setItem("reminders", JSON.stringify(items));
  };

  const nearestReminders = reminders
    .filter((r) => new Date(`${r.date}T${r.time}`).getTime() >= reminderNow.getTime() - 10 * 60 * 1000)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 3);

  const isReminderAlert = (r: Reminder) => {
    const diff = (new Date(`${r.date}T${r.time}`).getTime() - reminderNow.getTime()) / 60000;
    return diff >= -10 && diff <= 10;
  };

  const reminderToday = reminderNow.toISOString().slice(0, 10);
  const formatReminderDate = (d: string) => {
    if (d === reminderToday) return "Today";
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const addListItem = (text: string) => {
    if (!text.trim()) return;
    saveList([...listItems, { id: Date.now().toString(), text: text.trim(), done: false }]);
  };
  const editListItem = (id: string, text: string) => {
    saveList(listItems.map((i) => (i.id === id ? { ...i, text: text.trim() } : i)));
  };
  const toggleListItem = (id: string) => {
    saveList(listItems.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };
  const removeListItem = (id: string) => saveList(listItems.filter((i) => i.id !== id));

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    fetch(`https://api.waktusolat.app/solat/${zone}/${day}?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        const d = data?.prayerTime;
        if (d) {
          setPrayers({
            fajr: d.fajr,
            dhuhr: d.dhuhr,
            asr: d.asr,
            maghrib: d.maghrib,
            isha: d.isha,
          });
        }
      })
      .catch(() => setPrayers(null));
  }, [zone]);

  useEffect(() => {
    if (!weatherLoc) return;
    const fetchWeather = () => {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${weatherLoc.lat}&longitude=${weatherLoc.lon}&current=temperature_2m,weather_code&temperature_unit=celsius`
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.current) {
            setWeatherData({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code });
          }
        })
        .catch(() => {});
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [weatherLoc]);

  const saveWeatherLoc = (loc: WeatherLoc) => {
    setWeatherLoc(loc);
    setWeatherData(null);
    localStorage.setItem("weather-loc", JSON.stringify(loc));
  };

  const saveZone = (z: string) => {
    setZone(z);
    localStorage.setItem("solat-zone", z);
  };

  const bgStyle = { backgroundColor: bgConfig.color };

  return (
    <>
      {showTerms && (
        <TermsModal onAccept={() => { localStorage.setItem("terms-accepted", "1"); setShowTerms(false); }} />
      )}
      <div className="fixed inset-0 -z-10 transition-colors duration-500" style={bgStyle} />

      {showBgSettings && (
        <BgSettingsModal config={bgConfig} onSave={saveBgConfig} onClose={() => setShowBgSettings(false)} />
      )}
      {showPicker && (
        <ZonePicker current={zone} onSave={saveZone} onClose={() => setShowPicker(false)} />
      )}
      {showMediaModal && (
        <MediaModal
          tracks={tracks}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          onPlayToggle={togglePlay}
          onTrackSelect={selectTrack}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onSeek={handleSeek}
          onClose={() => setShowMediaModal(false)}
        />
      )}
      {showQuranModal && (
        <QuranPlayerModal
          surahs={surahs}
          currentSurah={currentSurah}
          currentAyahIndex={currentAyahIndex}
          isPlaying={isQuranPlaying}
          onPlayToggle={toggleQuranPlay}
          onSurahSelect={loadSurah}
          onClose={() => setShowQuranModal(false)}
          quranFont={bgConfig.quranFont}
        />
      )}
      {showRestConfig && (
        <RestConfigModal
          start={restStart}
          interval={restInterval}
          onSave={saveRestConfig}
          onClose={() => setShowRestConfig(false)}
        />
      )}
      {showLocPicker && (
        <LocationPickerModal
          current={weatherLoc}
          onSave={saveWeatherLoc}
          onClose={() => setShowLocPicker(false)}
        />
      )}
      {showReminderModal && (
        <ReminderModal
          reminders={reminders}
          onSave={saveReminders}
          onClose={() => setShowReminderModal(false)}
        />
      )}

      <div className="relative flex flex-col w-full h-full" style={{ "--fc": hexToRgbStr(bgConfig.fontColor ?? "#ffffff"), color: "rgb(var(--fc))", fontFamily: `var(--font-${bgConfig.fontFamily ?? "montserrat"})` } as React.CSSProperties}>
        {showVerseModal && verseData && (
          <VerseModal
            verse={verseData}
            verseNo={verseNo}
            onNext={nextVerse}
            onClose={() => setShowVerseModal(false)}
            quranFont={bgConfig.quranFont}
          />
        )}
        {showQuoteModal && dailyQuote && (
          <QuoteModal quote={dailyQuote} onClose={() => setShowQuoteModal(false)} />
        )}

        {/* Top bar */}
        <div className="flex items-center gap-3 w-full pt-4 px-4">
          {bgConfig.showQuran !== false ? (
            <button
              onClick={() => setShowVerseModal(true)}
              disabled={!verseData}
              className="min-w-0 text-left max-w-[75vw]"
            >
              <span className="block truncate text-[11px] fc-70 tracking-[0.1em]">
                {verseLoading ? "Loading…" : verseData ? `${verseData.surah.englishName} · ${verseData.numberInSurah} — ${verseData.text}` : ""}
              </span>
            </button>
          ) : (bgConfig.showDailyQuote && dailyQuote) ? (
            <button onClick={() => setShowQuoteModal(true)} className="min-w-0 text-left max-w-[75vw]">
              <span className="block truncate text-[11px] fc-70 tracking-[0.1em]">
                &ldquo;{dailyQuote.q}&rdquo;<span className="fc-25"> &mdash; {dailyQuote.a}</span>
              </span>
            </button>
          ) : null}
          <button
            onClick={() => setShowBgSettings(true)}
            className="shrink-0 fc-50 hover:fc-80 transition-colors ml-auto"
            title="Background settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>

        {bgConfig.showQuran !== false && bgConfig.showDailyQuote && dailyQuote && (
          <button onClick={() => setShowQuoteModal(true)} className="w-full pl-4 pb-1 text-left">
            <span className="block truncate text-[11px] fc-70 tracking-[0.1em]">
              &ldquo;{dailyQuote.q}&rdquo;<span className="fc-25"> &mdash; {dailyQuote.a}</span>
            </span>
          </button>
        )}

        <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none max-w-2xl w-full mx-auto px-4 sm:px-6">
          {/* Weather Widget */}
          {bgConfig.showWeather !== false && (
            <div onDoubleClick={() => setShowLocPicker(true)} className="w-full flex items-center flex-wrap justify-center gap-x-3 gap-y-1 cursor-pointer">
              {weatherData && weatherLoc ? (
                <>
                  <WeatherIcon kind={getWeatherInfo(weatherData.code).kind} className="w-5 h-5" />
                  <span className="text-2xl font-light fc-75 tabular-nums leading-none">{weatherData.temp}°</span>
                  <span className="text-[11px] tracking-[0.25em] fc-35 uppercase">{getWeatherInfo(weatherData.code).label}</span>
                  <span className="fc-10 text-xs hidden sm:inline">·</span>
                  <span className="text-[11px] tracking-[0.15em] fc-25 uppercase w-full text-center sm:w-auto">{weatherLoc.name}</span>
                </>
              ) : (
                <span className="text-[11px] tracking-[0.25em] fc-20 uppercase">+ Set weather location</span>
              )}
            </div>
          )}

          <ClockFace
            prayers={prayers}
            restStart={restStart}
            restInterval={restInterval}
            zone={zone}
            onRestConfigOpen={() => setShowRestConfig(true)}
            onZonePickerOpen={() => setShowPicker(true)}
            showRest={bgConfig.showRest}
            showPrayers={bgConfig.showPrayers}
            showHijri={bgConfig.showHijri}
            hijriDate={hijriDate}
          />

          {/* Media Player Widget */}
          {bgConfig.showPlayer !== false && (
            <div className="w-full flex flex-col items-center gap-2 mt-10 pt-4">
              <button
                onClick={() => setShowMediaModal(true)}
                className="flex items-center gap-3 px-4 py-2 rounded rounded-1 bg-white/[0.03] border-0 hover:bg-white/[0.06] transition-all group max-w-xs w-full"
              >
                <div
                  onClick={(e) => { e.stopPropagation(); if (tracks.length > 0) togglePlay(); }}
                  className={`w-8 h-8 flex items-center justify-center bg-white/5 border-0 rounded rounded-1 shrink-0 group-hover:bg-white/10 ${tracks.length === 0 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 fc-60" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-4 h-4 fc-60" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] tracking-[0.2em] fc-30 uppercase mb-2">Now Playing</p>
                  <p className="text-xs fc-60 truncate tracking-[0.15em] uppercase">
                    {tracks.find(t => t.id === currentTrackId)?.name || "No track selected"}
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Quran Player Widget */}
          {bgConfig.showQuranPlayer !== false && (
            <div className={`w-full flex flex-col items-center gap-2 ${bgConfig.showPlayer !== false ? "mt-2" : "mt-10"}`}>
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
                      <p className="text-2xl fc-80 leading-tight my-2" dir="rtl" style={{ fontFamily: bgConfig.quranFont === "kitab" ? "Kitab" : "var(--font-arabic)" }}>{currentSurah.name}</p>
                      <p className="text-[10px] fc-40 tracking-wide truncate">
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
          )}

          {/* Reminder Widget */}
          {bgConfig.showReminder !== false && (
            <div className="w-full mt-6">
              <button
                onClick={() => setShowReminderModal(true)}
                className="w-full flex flex-col gap-1.5"
              >
                {nearestReminders.length === 0 ? (
                  <p className="text-center text-[10px] tracking-[0.25em] fc-15 uppercase py-1">No upcoming reminders</p>
                ) : (
                  nearestReminders.map((r) => {
                    const alert = isReminderAlert(r);
                    const dateLabel = formatReminderDate(r.date);
                    return (
                      <div
                        key={r.id}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                          alert ? "bg-red-500/[0.07] border border-red-500/20" : "bg-white/[0.015]"
                        }`}
                      >
                        <span className={`text-[10px] tracking-[0.2em] tabular-nums font-medium shrink-0 ${alert ? "text-red-400/70" : "fc-25"}`}>{r.time}</span>
                        <span className={`text-[11px] tracking-[0.08em] truncate flex-1 ${alert ? "text-red-300/80" : "fc-40"}`}>{r.text}</span>
                        {dateLabel && <span className={`text-[10px] tracking-[0.1em] shrink-0 ${alert ? "text-red-400/40" : "fc-15"}`}>{dateLabel}</span>}
                      </div>
                    );
                  })
                )}
              </button>
            </div>
          )}

          {/* Tasks Widget */}
          {showListAdd && (
            <ListItemModal onSave={addListItem} onClose={() => setShowListAdd(false)} />
          )}
          {editingItem && (
            <ListItemModal
              initial={editingItem.text}
              onSave={(text) => editListItem(editingItem.id, text)}
              onClose={() => setEditingItem(null)}
            />
          )}
          {bgConfig.showNote !== false && (
            <div className="w-full mt-8">
              <button
                onClick={() => setListOpen((o) => !o)}
                className="flex items-center justify-center w-full fc-25 hover:fc-40 transition-colors mb-2"
              >
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${listOpen ? "rotate-180" : "rotate-0"}`}
                  fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 9l7 7 7-7" />
                </svg>
              </button>
              {listOpen && (
                <div className="w-full flex flex-col gap-1">
                  <div className={`flex flex-col gap-1 ${listItems.length > 3 ? "max-h-[calc(3*3.25rem)] overflow-y-auto pr-1" : ""}`}>
                    {listItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleListItem(item.id)}
                        onDoubleClick={() => { if (!item.done) setEditingItem(item); }}
                        className="flex items-center gap-3 px-4 py-2.5 border border-white/8 rounded-lg cursor-pointer select-none"
                      >
                        <span className={`flex-1 text-[12px] tracking-[0.1em] transition-all ${item.done ? "line-through fc-20" : "fc-45"}`}>{item.text}</span>
                        {confirmDelete === item.id ? (
                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { removeListItem(item.id); setConfirmDelete(null); }} className="text-[10px] tracking-[0.1em] text-red-400/70 hover:text-red-400 transition-colors">Confirm</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-[10px] tracking-[0.1em] fc-25 hover:fc-55 transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.id); }}
                            className="fc-20 hover:fc-55 transition-colors shrink-0"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowListAdd(true)}
                    className="flex items-center justify-center w-full py-2.5 fc-20 hover:fc-45 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {bgConfig.showCopyright !== false && (
          <div className="flex flex-col items-center pb-6 pt-4 gap-1">
            <div className="flex items-center gap-2">
              <a href="https://hakim.my" target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.25em] fc-70 hover:fc-35 uppercase transition-colors">&copy; 2026 &bull; Hakim Samah &bull; Dashboard</a>
              <button onClick={() => setShowTerms(true)} className="text-[10px] tracking-[0.2em] fc-25 hover:fc-50 uppercase transition-colors">· Terms</button>
            </div>
            {userIp && <span className="text-[9px] font-thin tracking-[0.2em] fc-25">{userIp}</span>}
          </div>
        )}
      </div>
    </>
  );
}

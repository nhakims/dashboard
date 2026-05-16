"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppearanceSettingsModal } from "./widgets/AppearanceSettingModal";
import { ClockFace } from "./widgets/ClockFace";
import { MediaPlayerHandle, MediaPlayerWidget } from "./widgets/MediaPlayerWidget";
import { QuoteModal } from "./widgets/QuoteModal";
import { QuranPlayerHandle, QuranPlayerWidget } from "./widgets/QuranPlayerWidget";
import { ReminderWidget } from "./widgets/ReminderWidget";
import { ReminderAlert } from "./widgets/ReminderAlert";
import { type Reminder, getNextOccurrence } from "./widgets/types";
import { RestConfigModal } from "./widgets/RestConfigModal";
import { TasksWidget } from "./widgets/TasksWidget";
import { BookmarksWidget } from "./widgets/BookmarksWidget";
import { TermsModal } from "./widgets/TermsModal";
import { VerseModal } from "./widgets/VerseModal";
import { WeatherWidget } from "./widgets/WeatherWidget";
import { ZonePicker } from "./widgets/ZonePicker";
import {
  DEFAULT_BG,
  FONT_SCALE,
  hexToRgbStr,
  type BgConfig,
  type PrayerTimes,
} from "./widgets/types";

export default function Clock() {
  const [zone, setZone] = useState("WLY01");
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [restStart, setRestStart] = useState("08:30");
  const [restInterval, setRestInterval] = useState(60);
  const [showRestConfig, setShowRestConfig] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [appearanceConfig, setAppearanceConfig] = useState<BgConfig>(DEFAULT_BG);
  const [showBgSettings, setShowBgSettings] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [verseNo, setVerseNo] = useState(1);
  const [verseData, setVerseData] = useState<{ surah: { englishName: string; englishNameTranslation: string; revelationType: string }; numberInSurah: number; text: string } | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<{ q: string; a: string } | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const [hijriDate, setHijriDate] = useState<string | null>(null);
  const [reminderAlert, setReminderAlert] = useState<Reminder | null>(null);
  const firedReminders = useRef<Set<string>>(new Set());

  const mediaPlayerRef = useRef<MediaPlayerHandle>(null);
  const quranPlayerRef = useRef<QuranPlayerHandle>(null);

  const pauseMedia = useCallback(() => mediaPlayerRef.current?.pause(), []);
  const pauseQuran = useCallback(() => quranPlayerRef.current?.pause(), []);

  useEffect(() => {
    if (!localStorage.getItem("terms-accepted")) setShowTerms(true);
    const saved = localStorage.getItem("solat-zone");
    if (saved) setZone(saved);
    setRestStart(localStorage.getItem("rest-start") ?? "08:30");
    setRestInterval(parseInt(localStorage.getItem("rest-interval") ?? "60"));
    const savedBg = localStorage.getItem("bg-config");
    if (savedBg) setAppearanceConfig(JSON.parse(savedBg));
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
    if (!appearanceConfig.showDailyQuote) return;
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
  }, [appearanceConfig.showDailyQuote]);

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

  const nextVerse = () => {
    const next = verseNo < 6236 ? verseNo + 1 : 1;
    setVerseNo(next);
    localStorage.setItem("quran-verse", String(next));
  };

  const saveAppearanceConfig = (c: BgConfig) => {
    setAppearanceConfig(c);
    localStorage.setItem("bg-config", JSON.stringify(c));
  };

  const saveRestConfig = (start: string, interval: number) => {
    setRestStart(start);
    setRestInterval(interval);
    localStorage.setItem("rest-start", start);
    localStorage.setItem("rest-interval", String(interval));
  };

  useEffect(() => {
    const check = () => {
      const saved = localStorage.getItem("reminders");
      if (!saved) return;
      const reminders: Reminder[] = JSON.parse(saved);
      const now = Date.now();
      for (const r of reminders) {
        const { date: effectiveDate, datetimeMs } = getNextOccurrence(r, now - 60000);
        const firedKey = `${r.id}-${effectiveDate}`;
        if (firedReminders.current.has(firedKey)) continue;
        const diff = datetimeMs - now;
        if (diff <= 0 && diff >= -60000) {
          firedReminders.current.add(firedKey);
          setReminderAlert({ ...r, date: effectiveDate });
          break;
        }
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  const saveZone = (z: string) => {
    setZone(z);
    localStorage.setItem("solat-zone", z);
  };

  const bgStyle = { backgroundColor: appearanceConfig.color };

  return (
    <>
      {reminderAlert && (
        <ReminderAlert reminder={reminderAlert} onDismiss={() => setReminderAlert(null)} />
      )}
      {showTerms && (
        <TermsModal onAccept={() => { localStorage.setItem("terms-accepted", "1"); setShowTerms(false); }} />
      )}
      <div className="fixed inset-0 -z-10 transition-colors duration-500" style={bgStyle} />

      {showBgSettings && (
        <AppearanceSettingsModal config={appearanceConfig} onSave={saveAppearanceConfig} onClose={() => setShowBgSettings(false)} />
      )}
      {showPicker && (
        <ZonePicker current={zone} onSave={saveZone} onClose={() => setShowPicker(false)} />
      )}
      {showRestConfig && (
        <RestConfigModal
          start={restStart}
          interval={restInterval}
          onSave={saveRestConfig}
          onClose={() => setShowRestConfig(false)}
        />
      )}

      <div className="relative flex flex-col w-full h-full" style={{ "--fc": hexToRgbStr(appearanceConfig.fontColor ?? "#ffffff"), color: "rgb(var(--fc))", fontFamily: `var(--font-${appearanceConfig.fontFamily ?? "montserrat"})` } as React.CSSProperties}>
        {showVerseModal && verseData && (
          <VerseModal
            verse={verseData}
            verseNo={verseNo}
            onNext={nextVerse}
            onClose={() => setShowVerseModal(false)}
            quranFont={appearanceConfig.quranFont}
          />
        )}
        {showQuoteModal && dailyQuote && (
          <QuoteModal quote={dailyQuote} onClose={() => setShowQuoteModal(false)} />
        )}

        {/* Top bar */}
        <div className="flex items-center gap-3 w-full pt-4 px-4">
          {appearanceConfig.showQuran !== false ? (
            <button
              onClick={() => setShowVerseModal(true)}
              disabled={!verseData}
              className="min-w-0 text-left max-w-[75vw]"
            >
              <span className="block truncate text-[11px] fc-70 tracking-[0.1em]">
                {verseLoading ? "Loading…" : verseData ? `${verseData.surah.englishName} · ${verseData.numberInSurah} — ${verseData.text}` : ""}
              </span>
            </button>
          ) : (appearanceConfig.showDailyQuote && dailyQuote) ? (
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>

        {appearanceConfig.showQuran !== false && appearanceConfig.showDailyQuote && dailyQuote && (
          <button onClick={() => setShowQuoteModal(true)} className="w-full pl-4 pb-1 text-left">
            <span className="block truncate text-[11px] fc-70 tracking-[0.1em]">
              &ldquo;{dailyQuote.q}&rdquo;<span className="fc-25"> &mdash; {dailyQuote.a}</span>
            </span>
          </button>
        )}

        <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none max-w-2xl w-full mx-auto px-4 sm:px-6" style={{ zoom: FONT_SCALE[appearanceConfig.fontSize ?? "md"] }}>
          <WeatherWidget show={appearanceConfig.showWeather !== false} />

          <ClockFace
            prayers={prayers}
            restStart={restStart}
            restInterval={restInterval}
            zone={zone}
            onRestConfigOpen={() => setShowRestConfig(true)}
            onZonePickerOpen={() => setShowPicker(true)}
            showRest={appearanceConfig.showRest}
            showPrayers={appearanceConfig.showPrayers}
            showHijri={appearanceConfig.showHijri}
            hijriDate={hijriDate}
          />

          <MediaPlayerWidget
            ref={mediaPlayerRef}
            show={appearanceConfig.showPlayer !== false}
            onPlayStart={pauseQuran}
          />

          <QuranPlayerWidget
            ref={quranPlayerRef}
            show={appearanceConfig.showQuranPlayer !== false}
            quranFont={appearanceConfig.quranFont}
            showPlayerAbove={appearanceConfig.showPlayer !== false}
            fontScale={FONT_SCALE[appearanceConfig.fontSize ?? "md"]}
            onPlayStart={pauseMedia}
          />

          <ReminderWidget show={appearanceConfig.showReminder !== false} />

          <TasksWidget show={appearanceConfig.showNote !== false} />

          <BookmarksWidget show={appearanceConfig.showBookmarks === true} />
        </div>

        {appearanceConfig.showCopyright !== false && (
          <div className="flex flex-col items-center pb-6 pt-4 gap-1">
            <div className="flex items-center gap-2">
              <a href="https://hakim.my" target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.25em] fc-70 hover:fc-35 uppercase transition-colors">&copy; 2026 &bull; Hakim Samah &bull; Dashboard</a>
              <button onClick={() => setShowTerms(true)} className="text-[10px] tracking-[0.2em] text-red-400/70 hover:text-red-400 uppercase transition-colors">· Terms</button>
            </div>
            {userIp && <span className="text-[9px] font-thin tracking-[0.2em] fc-25">{userIp}</span>}
          </div>
        )}
      </div>
    </>
  );
}

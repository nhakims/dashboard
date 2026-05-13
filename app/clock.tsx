"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteMediaFile, getMediaFile, saveMediaFile } from "./lib/media-db";

function AlertDot({ onClear }: { onClear: () => void }) {
  return (
    <button onClick={onClear} className="mr-2 fc-70 hover:fc transition-colors shrink-0" title="Click to clear">
      <svg className="w-3 h-3 animate-nudge-right" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerKey = (typeof PRAYER_KEYS)[number];

const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: "Subuh",
  dhuhr: "Zohor",
  asr: "Asar",
  maghrib: "Maghrib",
  isha: "Isyak",
};

const ZONES = [
  { code: "WLY01", name: "Kuala Lumpur / Putrajaya" },
  { code: "WLY02", name: "Labuan" },
  { code: "SGR01", name: "Gombak / Hulu Langat / Sepang" },
  { code: "SGR02", name: "Petaling / Klang / Kuala Langat" },
  { code: "SGR03", name: "Kuala Selangor / Sabak Bernam" },
  { code: "JHR01", name: "Pulau Aur / Pulau Pemanggil" },
  { code: "JHR02", name: "Johor Bahru / Kota Tinggi" },
  { code: "JHR03", name: "Kluang / Pontian" },
  { code: "JHR04", name: "Batu Pahat / Muar / Segamat" },
  { code: "KDH01", name: "Kota Setar / Kubang Pasu" },
  { code: "KDH02", name: "Kulim / Bandar Baharu" },
  { code: "KTN01", name: "Kota Bharu / Pasir Mas" },
  { code: "MLK01", name: "Melaka" },
  { code: "NSN01", name: "Nilai / Seremban / Port Dickson" },
  { code: "PHG01", name: "Kuantan / Pekan / Rompin" },
  { code: "PNG01", name: "Pulau Pinang" },
  { code: "PRK01", name: "Ipoh / Kuala Kangsar" },
  { code: "PRK02", name: "Teluk Intan / Bagan Datuk" },
  { code: "PLS01", name: "Kangar / Arau" },
  { code: "SBH01", name: "Kota Kinabalu" },
  { code: "SBH02", name: "Sandakan" },
  { code: "SWK01", name: "Kuching" },
  { code: "SWK02", name: "Sibu" },
  { code: "SWK03", name: "Miri" },
  { code: "TRG01", name: "Kuala Terengganu / Marang" },
  { code: "TRG02", name: "Besut / Setiu" },
  { code: "TRG03", name: "Hulu Terengganu" },
];

type PrayerTimes = Partial<Record<PrayerKey, string>>;

type WeatherLoc = { name: string; lat: number; lon: number };
type WeatherData = { temp: number; code: number };
type Reminder = { id: string; text: string; date: string; time: string };

function getWeatherInfo(code: number): { label: string; kind: "sun" | "partly" | "cloud" | "rain" | "snow" | "storm" | "fog" } {
  if (code === 0 || code === 1)   return { label: "Clear sky",     kind: "sun"    };
  if (code === 2)                 return { label: "Partly cloudy", kind: "partly" };
  if (code === 3)                 return { label: "Overcast",      kind: "cloud"  };
  if (code === 45 || code === 48) return { label: "Foggy",         kind: "fog"    };
  if (code >= 51 && code <= 57)   return { label: "Drizzle",       kind: "rain"   };
  if (code >= 61 && code <= 67)   return { label: "Rain",          kind: "rain"   };
  if (code >= 71 && code <= 77)   return { label: "Snow",          kind: "snow"   };
  if (code >= 80 && code <= 82)   return { label: "Showers",       kind: "rain"   };
  if (code >= 85 && code <= 86)   return { label: "Snow showers",  kind: "snow"   };
  if (code >= 95)                 return { label: "Thunderstorm",  kind: "storm"  };
  return { label: "—", kind: "cloud" };
}

function parseHHMM(raw: string): number {
  const [h, m, s = 0] = raw.trim().split(":").map(Number);
  return h * 3600 + m * 60 + s;
}


function ZonePicker({
  current,
  onSave,
  onClose,
}: {
  current: string;
  onSave: (zone: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState(current);
  const [filter, setFilter] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = ZONES.filter(
    (z) =>
      z.code.toLowerCase().includes(filter.toLowerCase()) ||
      z.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] fc-40 uppercase">Select Zone</p>
          <button onClick={onClose} className="fc-30 hover:fc-60 text-lg leading-none">
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-white/5">
          <input
            autoFocus
            type="text"
            placeholder="Search zone..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent text-sm fc-70 placeholder-white/20 outline-none tracking-wider"
          />
        </div>

        {/* Zone list */}
        <div className="overflow-y-auto max-h-72 scrollbar-thin">
          {filtered.map((z) => (
            <button
              key={z.code}
              onClick={() => setInput(z.code)}
              className={`w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition-colors ${
                input === z.code ? "bg-white/8 fc" : "fc-50"
              }`}
            >
              <span className="text-xs tracking-[0.2em]">{z.name}</span>
              <span className={`text-xs font-light tracking-widest ${input === z.code ? "fc-80" : "fc-25"}`}>
                {z.code}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-5 py-4 text-xs fc-25">No zones found.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs tracking-[0.2em] fc-30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(input); onClose(); }}
            className="flex-1 py-2 text-xs tracking-[0.2em] fc bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function RestConfigModal({
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
          <p className="text-xs tracking-[0.3em] fc-40 uppercase">Quick Rest</p>
          <button onClick={onClose} className="fc-30 hover:fc-60 text-lg leading-none">✕</button>
        </div>
        <div className="flex flex-col gap-5 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[0.25em] fc-30 uppercase">Start Time</label>
            <input
              type="time"
              value={s}
              onChange={(e) => setS(e.target.value)}
              className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm fc-70 outline-none focus:border-white/25 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[0.25em] fc-30 uppercase">Interval (minutes)</label>
            <input
              type="number"
              min="5"
              max="240"
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm fc-70 outline-none focus:border-white/25 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] fc-30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase">Cancel</button>
          <button
            onClick={() => { onSave(s, Math.max(5, parseInt(iv) || 60)); onClose(); }}
            className="flex-1 py-2 text-xs tracking-[0.2em] fc bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase"
          >Save</button>
        </div>
      </div>
    </div>
  );
}

function WeatherIcon({ kind, className }: { kind: string; className?: string }) {
  const cls = `${className ?? "w-5 h-5"} fc-50`;
  switch (kind) {
    case "sun":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "partly":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 4a4 4 0 014 3.8A3 3 0 1117 14H8a4 4 0 01-.5-7.97A4 4 0 0112.5 4z" />
          <circle cx="7" cy="8.5" r="2.5" />
          <path strokeLinecap="round" d="M7 3v1M7 14v1M2 8.5h1M12 8.5h1" />
        </svg>
      );
    case "rain":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17a4 4 0 010-8 4.5 4.5 0 018.93-1A3.5 3.5 0 1120.5 17H6z" />
          <path strokeLinecap="round" d="M8 20l-1 2M12 20l-1 2M16 20l-1 2" />
        </svg>
      );
    case "snow":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17a4 4 0 010-8 4.5 4.5 0 018.93-1A3.5 3.5 0 1120.5 17H6z" />
          <path strokeLinecap="round" d="M8 21v2M12 21v2M16 21v2M7 22l2-1M7 22l2 1M11 22l2-1M11 22l2 1M15 22l2-1M15 22l2 1" />
        </svg>
      );
    case "storm":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17a4 4 0 010-8 4.5 4.5 0 018.93-1A3.5 3.5 0 1120.5 17H6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 14l-2 3h3l-2 3" />
        </svg>
      );
    case "fog":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M3 12h18M5 16h14M7 8h10" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17a4 4 0 010-8 4.5 4.5 0 018.93-1A3.5 3.5 0 1120.5 17H6z" />
        </svg>
      );
  }
}

type GeoResult = { name: string; country: string; admin1?: string; latitude: number; longitude: number };

function LocationPickerModal({
  current,
  onSave,
  onClose,
}: {
  current: WeatherLoc | null;
  onSave: (loc: WeatherLoc) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherLoc[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
        );
        const d = await r.json();
        setResults(
          (d.results ?? []).map((x: GeoResult) => ({
            name: [x.name, x.admin1, x.country].filter(Boolean).join(", "),
            lat: x.latitude,
            lon: x.longitude,
          }))
        );
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSave({ name: "My Location", lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoLoading(false);
        onClose();
      },
      () => setGeoLoading(false)
    );
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] fc-40 uppercase">Weather Location</p>
          <button onClick={onClose} className="fc-30 hover:fc-60 text-lg leading-none">✕</button>
        </div>

        <button
          onClick={useCurrentLocation}
          disabled={geoLoading}
          className="flex items-center gap-3 px-5 py-3 border-b border-white/5 text-left hover:bg-white/5 transition-colors w-full"
        >
          <svg className="w-4 h-4 fc-35 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          <span className="text-xs tracking-[0.2em] fc-45 uppercase">
            {geoLoading ? "Locating…" : "Use current location"}
          </span>
        </button>

        <div className="px-5 py-3 border-b border-white/5">
          <input
            autoFocus
            type="text"
            placeholder="Search city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm fc-70 placeholder-white/20 outline-none tracking-wider"
          />
        </div>

        <div className="overflow-y-auto max-h-60">
          {searching && <p className="px-5 py-3 text-xs fc-25 tracking-widest">Searching…</p>}
          {!searching && results.map((loc, i) => (
            <button
              key={i}
              onClick={() => { onSave(loc); onClose(); }}
              className={`w-full text-left px-5 py-3 text-xs tracking-[0.15em] hover:bg-white/5 transition-colors ${
                current?.lat === loc.lat && current?.lon === loc.lon
                  ? "bg-white/8 fc"
                  : "fc-50"
              }`}
            >
              {loc.name}
            </button>
          ))}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-5 py-3 text-xs fc-25">No results.</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs tracking-[0.2em] fc-30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function hexToRgbStr(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const FONTS = [
  { id: "montserrat",       label: "Montserrat" },
  { id: "inter",            label: "Inter" },
  { id: "roboto",           label: "Roboto" },
  { id: "poppins",          label: "Poppins" },
  { id: "raleway",          label: "Raleway" },
  { id: "nunito",           label: "Nunito" },
  { id: "playfair-display", label: "Playfair Display" },
  { id: "lato",             label: "Lato" },
  { id: "oswald",           label: "Oswald" },
  { id: "dm-sans",          label: "DM Sans" },
] as const;

type FontId = typeof FONTS[number]["id"];

type BgConfig = {
  color: string;
  fontColor: string;
  showQuran: boolean;
  showDailyQuote: boolean;
  showWeather: boolean;
  showCopyright: boolean;
  showNote: boolean;
  showPlayer: boolean;
  showQuranPlayer: boolean;
  showReminder: boolean;
  showRest: boolean;
  showPrayers: boolean;
  showHijri: boolean;
  quranFont: "naskh" | "kitab";
  fontFamily: FontId;
};

const DEFAULT_BG: BgConfig = { color: "#0a0a0a", fontColor: "#ffffff", showQuran: false, showDailyQuote: false, showWeather: false, showCopyright: true, showNote: false, showPlayer: false, showQuranPlayer: false, showReminder: false, showRest: true, showPrayers: true, showHijri: false, quranFont: "naskh", fontFamily: "montserrat" };

function ColorSection({ label, value, onChange, presets }: { label: string; value: string; onChange: (v: string) => void; presets: string[] }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {label && <label className="text-[10px] tracking-[0.25em] text-white/30 uppercase">{label}</label>}
      <div className="flex gap-2 flex-wrap justify-center">
        {presets.map((c) => (
          <button key={c} onClick={() => onChange(c)} style={{ background: c }}
            className={`w-7 h-7 rounded-md border transition-colors ${value === c ? "border-white/50" : "border-white/10 hover:border-white/30"}`}
          />
        ))}
      </div>
      <p className="text-[10px] tracking-[0.25em] text-white/20 uppercase">Or pick your own</p>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-14 h-14 rounded-xl bg-transparent cursor-pointer" />
      <span className="text-xs text-white/35 tracking-widest font-mono">{value}</span>
    </div>
  );
}

function BgSettingsModal({ config, onSave, onClose }: { config: BgConfig; onSave: (c: BgConfig) => void; onClose: () => void }) {
  const [color, setColor] = useState(config.color ?? "#0a0a0a");
  const [fontColor, setFontColor] = useState(config.fontColor ?? "#ffffff");
  const [showQuran, setShowQuran] = useState(config.showQuran ?? true);
  const [showDailyQuote, setShowDailyQuote] = useState(config.showDailyQuote ?? false);
  const [showWeather, setShowWeather] = useState(config.showWeather ?? true);
  const [showCopyright, setShowCopyright] = useState(config.showCopyright ?? true);
  const [showNote, setShowNote] = useState(config.showNote ?? true);
  const [showPlayer, setShowPlayer] = useState(config.showPlayer ?? true);
  const [showQuranPlayer, setShowQuranPlayer] = useState(config.showQuranPlayer ?? true);
  const [showReminder, setShowReminder] = useState(config.showReminder ?? false);
  const [showRest, setShowRest] = useState(config.showRest ?? true);
  const [showPrayers, setShowPrayers] = useState(config.showPrayers ?? true);
  const [showHijri, setShowHijri] = useState(config.showHijri ?? false);
  const [quranFont, setQuranFont] = useState<"naskh" | "kitab">(config.quranFont ?? "naskh");
  const [fontFamily, setFontFamily] = useState<FontId>(config.fontFamily ?? "montserrat");
  const [openSection, setOpenSection] = useState<"bg" | "font" | "fontFamily" | "widget" | null>(null);
  const toggleSection = (s: "bg" | "font" | "fontFamily" | "widget") => setOpenSection((v) => (v === s ? null : s));
  const openBg = openSection === "bg";
  const openFont = openSection === "font";
  const openFontFamily = openSection === "fontFamily";
  const openWidget = openSection === "widget";
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => { onSave({ color, fontColor, showQuran, showDailyQuote, showWeather, showCopyright, showNote, showPlayer, showQuranPlayer, showReminder, showRest, showPrayers, showHijri, quranFont, fontFamily }); onClose(); };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-xs bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col mt-2 sm:mt-10 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-5rem)]">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Appearance</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        </div>

        <div className="flex flex-col overflow-y-auto min-h-0 flex-1 scrollbar-thin">
          {/* Background accordion */}
          <button
            onClick={() => toggleSection("bg")}
            className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-md border border-white/10 shrink-0" style={{ background: color }} />
              <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Background</p>
            </div>
            <svg className={`w-3.5 h-3.5 text-white/20 transition-transform ${openBg ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openBg && (
            <div className="px-5 pb-5">
              <ColorSection label="" value={color} onChange={setColor} presets={["#0a0a0a", "#0f172a", "#0d1117", "#1a0a2e", "#0a1628", "#1a1a0a"]} />
            </div>
          )}

          <div className="border-t border-white/5" />

          {/* Font color accordion */}
          <button
            onClick={() => toggleSection("font")}
            className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-md border border-white/10 shrink-0" style={{ background: fontColor }} />
              <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Text</p>
            </div>
            <svg className={`w-3.5 h-3.5 text-white/20 transition-transform ${openFont ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openFont && (
            <div className="px-5 pb-5">
              <ColorSection label="" value={fontColor} onChange={setFontColor} presets={["#ffffff", "#fef3c7", "#bfdbfe", "#bbf7d0", "#fecdd3", "#e9d5ff"]} />
            </div>
          )}

          <div className="border-t border-white/5" />

          {/* Font family accordion */}
          <button
            onClick={() => toggleSection("fontFamily")}
            className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/50 leading-none" style={{ fontFamily: `var(--font-${fontFamily})` }}>Aa</span>
              <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Font</p>
            </div>
            <svg className={`w-3.5 h-3.5 text-white/20 transition-transform ${openFontFamily ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openFontFamily && (
            <div className="px-3 pb-3 flex flex-col gap-0.5">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${fontFamily === f.id ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <span className="text-sm text-white/70" style={{ fontFamily: `var(--font-${f.id})` }}>{f.label}</span>
                  {fontFamily === f.id && <span className="text-white/40 text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/5" />

          <button
            onClick={() => toggleSection("widget")}
            className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Widgets</p>
            </div>
            <svg className={`w-3.5 h-3.5 text-white/20 transition-transform ${openWidget ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openWidget && (
            <div className="px-5 pb-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Daily Quran</p>
                <button
                  onClick={() => setShowQuran((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showQuran ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showQuran ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Quran Font</p>
                <div className="flex gap-1">
                  {(["naskh", "kitab"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setQuranFont(f)}
                      className={`px-2.5 py-1 text-[10px] tracking-[0.15em] rounded border transition-colors uppercase ${quranFont === f ? "border-white/30 text-white/70 bg-white/10" : "border-white/10 text-white/30 hover:text-white/50"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Daily Quote</p>
                <button
                  onClick={() => setShowDailyQuote((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showDailyQuote ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showDailyQuote ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Weather</p>
                <button
                  onClick={() => setShowWeather((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showWeather ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showWeather ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Quick Rest</p>
                <button
                  onClick={() => setShowRest((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showRest ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showRest ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Prayer Time</p>
                <button
                  onClick={() => setShowPrayers((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showPrayers ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showPrayers ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Tasks</p>
                <button
                  onClick={() => setShowNote((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showNote ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showNote ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Hijri Date</p>
                <button
                  onClick={() => setShowHijri((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showHijri ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showHijri ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Media Player</p>
                <button
                  onClick={() => setShowPlayer((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showPlayer ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showPlayer ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Quran Player</p>
                <button
                  onClick={() => setShowQuranPlayer((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showQuranPlayer ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showQuranPlayer ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Reminders</p>
                <button
                  onClick={() => setShowReminder((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showReminder ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showReminder ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Copyright</p>
                <button
                  onClick={() => setShowCopyright((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showCopyright ? "bg-white/30" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showCopyright ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase">Cancel</button>
          <button onClick={submit} className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase">Save</button>
        </div>
      </div>
    </div>
  );
}

function TermsModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-0 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-2">
          <p className="text-[10px] tracking-[0.35em] fc-30 uppercase mb-4">Before you continue</p>
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] fc-45 leading-relaxed tracking-[0.06em]">
              This app is offered as-is for personal use. While we strive to keep things running smoothly, this service provider cannot be held responsible for any issues, inaccuracies, or losses that may arise.
            </p>
            <p className="text-[10px] fc-45 leading-relaxed tracking-[0.06em]">
              Prayer times, weather data, and Quran content are fetched from third-party services and may occasionally differ from official sources.
            </p>
            <p className="text-[10px] fc-45 leading-relaxed tracking-[0.06em]">
              Your continued use of this app is taken as your acceptance of these terms.
            </p>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-[10px] tracking-[0.3em] fc-25 uppercase mb-2">Powered by</p>
          <ul className="flex flex-col gap-1">
            {[
              ["Prayer Time API", "api.waktusolat.app"],
              ["AlQuran Cloud", "alquran.cloud"],
              ["Open-Meteo", "open-meteo.com"],
              ["ipify", "ipify.org"],
              ["Vercel", "vercel.com"],
            ].map(([name, url]) => (
              <li key={url} className="flex items-center justify-between">
                <span className="text-[11px] fc-40 tracking-[0.1em]">{name}</span>
                <span className="text-[10px] fc-20 tracking-[0.08em] font-mono">{url}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onAccept}
            className="w-full py-2.5 text-xs tracking-[0.25em] fc bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase"
          >
            Agree
          </button>
        </div>
      </div>
    </div>
  );
}

function ListItemModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: string;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial ?? "");
  const overlayRef = useRef<HTMLDivElement>(null);
  const isEdit = !!initial;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => { if (text.trim()) { onSave(text); onClose(); } };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-xs bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] fc-40 uppercase">{isEdit ? "Edit Task" : "New Task"}</p>
          <button onClick={onClose} className="fc-30 hover:fc-60 text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-4">
          <input
            autoFocus
            type="text"
            placeholder="Type something…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full bg-transparent text-sm fc-70 placeholder-white/20 outline-none tracking-wider"
          />
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] fc-30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase">Cancel</button>
          <button onClick={submit} className="flex-1 py-2 text-xs tracking-[0.2em] fc bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase">{isEdit ? "Save" : "Add"}</button>
        </div>
      </div>
    </div>
  );
}

function QuoteModal({ quote, onClose }: { quote: { q: string; a: string }; onClose: () => void }) {
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
          <p className="text-xs tracking-[0.3em] fc-40 uppercase">Daily Quote</p>
          <button onClick={onClose} className="fc-30 hover:fc-60 text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-6 flex flex-col gap-4">
          <p className="text-sm fc-80 leading-relaxed tracking-wide">&ldquo;{quote.q}&rdquo;</p>
          <p className="text-[11px] fc-35 tracking-[0.2em] uppercase text-right">&mdash; {quote.a}</p>
        </div>
      </div>
    </div>
  );
}

function VerseModal({
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
            <p className="text-xs tracking-[0.3em] text-white/40 uppercase">{verse.surah.englishName} · {verse.numberInSurah}</p>
            <p className="text-[10px] tracking-[0.2em] text-white/25 mt-0.5">{verse.surah.englishNameTranslation} · {verse.surah.revelationType}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        </div>
        <div className="flex flex-col gap-4 px-5 py-6">
          {arabicText && (
            <p className="text-3xl text-white/90 leading-loose text-right" dir="rtl" style={{ fontFamily: quranFont === "kitab" ? "Kitab" : "var(--font-arabic)" }}>{arabicText}</p>
          )}
          <div className="border-t border-white/5" />
          <p className="text-sm text-white/90 leading-relaxed italic">{verse.text}</p>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase">Close</button>
          <button onClick={onNext} className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase">Next verse</button>
        </div>
      </div>
    </div>
  );
}

function MusicSourcesModal({ onClose }: { onClose: () => void }) {
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
          <p className="text-xs tracking-[0.3em] fc-40 uppercase">Find Music</p>
          <button onClick={onClose} className="fc-30 hover:fc-60 text-lg leading-none">✕</button>
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
                <p className="text-[11px] tracking-[0.15em] fc-60 group-hover:fc-80 transition-colors">{s.name}</p>
                <p className="text-[10px] tracking-[0.1em] fc-25 mt-0.5">{s.desc}</p>
              </div>
              <svg className="w-3 h-3 fc-20 group-hover:fc-40 shrink-0 ml-3 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
        <div className="px-5 pb-5">
          <p className="text-[9px] tracking-[0.15em] fc-20 text-center leading-relaxed">
            Please respect the creators&apos; talent and work — read each platform&apos;s licensing terms before use.
          </p>
        </div>
      </div>
    </div>
  );
}

function MediaModal({
  tracks,
  currentTrackId,
  isPlaying,
  progress,
  duration,
  onPlayToggle,
  onTrackSelect,
  onUpload,
  onDelete,
  onSeek,
  onClose,
}: {
  tracks: { id: string; name: string }[];
  currentTrackId: string | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onPlayToggle: () => void;
  onTrackSelect: (id: string) => void;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  onSeek: (val: number) => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Media Library</p>
            <p className="text-[10px] tracking-[0.2em] text-white/25 mt-0.5">Browser Storage · Offline Playback</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        </div>

        {/* Player Controls */}
        <div className="px-6 py-8 flex flex-col items-center gap-6 border-b border-white/5 bg-white/[0.02]">
          <div className="text-center w-full">
            <p className="text-sm font-medium fc-80 truncate px-4 uppercase">
              {tracks.find(t => t.id === currentTrackId)?.name || "No track selected"}
            </p>
          </div>

          <div className="flex items-center gap-8">
            <button
              onClick={onPlayToggle}
              disabled={!currentTrackId || tracks.length === 0}
              className="w-14 h-14 flex items-center justify-center bg-[#3a3a3a] hover:bg-[#4a4a4a] disabled:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed border border-white/8 rounded-lg transition-all group"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 fc-80" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-6 h-6 fc-80" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
          </div>

          <div className="w-full flex flex-col gap-3">
            <div className="flex justify-between text-[10px] fc-30 tracking-[0.2em] tabular-nums uppercase">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div 
              className="group/progress relative w-full h-[6px] bg-white/10 cursor-pointer overflow-hidden rounded-full"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = x / rect.width;
                onSeek(pct * duration);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full transition-all duration-300 ease-out rounded-full"
                style={{ width: `${(progress / (duration || 1)) * 100}%`, backgroundColor: 'rgb(var(--fc) / 0.7)' }}
              />
            </div>
          </div>

          <div className="w-full flex items-center gap-4">
            {/* volume control removed */}
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto min-h-[200px] scrollbar-thin">
          <div className="p-4 flex flex-col gap-1">
            {tracks.map((track) => (
              <div 
                key={track.id} 
                className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${track.id === currentTrackId ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <button 
                  onClick={() => onTrackSelect(track.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className={`text-xs tracking-[0.15em] truncate uppercase ${track.id === currentTrackId ? "fc-90" : "fc-50"}`}>
                    {track.name}
                  </p>
                </button>
                <button 
                  onClick={() => onDelete(track.id)}
                  className="opacity-0 group-hover:opacity-100 fc-20 hover:fc-60 transition-all p-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
            {tracks.length === 0 && (
              <p className="text-center py-8 text-[11px] fc-25 tracking-[0.2em] uppercase">No files found</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <input
            type="file" accept="audio/*" ref={fileInputRef} className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase"
          >
            Close
          </button>
          <button
            onClick={() => setShowSources(true)}
            className="flex-1 py-2 text-xs tracking-[0.2em] text-white/50 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase"
          >
            Find Music
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase"
          >
            Upload
          </button>
        </div>
      </div>
      {showSources && <MusicSourcesModal onClose={() => setShowSources(false)} />}
    </div>
  );
}

function QuranPlayerModal({
  surahs,
  currentSurah,
  currentAyahIndex,
  isPlaying,
  onPlayToggle,
  onSurahSelect,
  onClose,
  quranFont,
}: {
  surahs: { number: number; name: string; englishName: string }[];
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
  // volume control removed

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
            <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Quran Player</p>
            <p className="text-[10px] tracking-[0.2em] text-white/25 mt-0.5">Streaming · Mishary Rashid Alafasy</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        </div>

        {/* Player Controls */}
        <div className="px-6 py-8 flex flex-col items-center gap-6 border-b border-white/5 bg-white/[0.02]">
          <div className="w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-8 justify-center mx-auto">
            <button
              onClick={onPlayToggle}
              className="w-16 h-16 flex items-center justify-center bg-[#3a3a3a] hover:bg-[#4a4a4a] border border-white/8 rounded-lg transition-all group shrink-0"
              aria-label="Play/Pause Quran"
            >
              {isPlaying ? (
                <svg className="w-7 h-7 fc-80" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-7 h-7 fc-80" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <div className="text-center w-auto">
              {!currentSurah && (
                <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase mb-1">Select a Surah</p>
              )}
              {currentSurah ? (
                <div className="flex flex-col items-center sm:items-start sm:gap-1">
                  <p className="text-2xl sm:text-3xl fc-90 tracking-wide leading-tight text-center" dir="rtl" style={{ fontFamily: quranFont === "kitab" ? "Kitab" : "var(--font-arabic)" }}>
                    {currentSurah.name}
                  </p>
                  <p className="text-[11px] fc-50 tracking-[0.12em] mt-1 truncate max-w-[20rem] text-center sm:text-left">
                    {currentSurah.englishName}
                    <span className="text-[10px] fc-30 ml-2">· {currentAyahIndex + 1}/{currentSurah.ayahs.length}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm fc-30">—</p>
              )}
            </div>
          </div>

          <div className="w-full flex items-center gap-4">
            {/* volume control removed */}
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-white/5">
          <input
            type="text"
            placeholder="Search surah..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent text-sm fc-70 placeholder-white/20 outline-none tracking-wider"
          />
        </div>

        {/* Surah List */}
        <div className="flex-1 overflow-y-auto min-h-[200px] scrollbar-thin">
          <div className="p-4 flex flex-col gap-1">
            {filtered.map((s) => (
              <button 
                key={s.number} 
                onClick={() => onSurahSelect(s.number)}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${s.number === currentSurah?.number ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[10px] fc-25 tabular-nums w-4">{s.number}</span>
                  <div className="text-left min-w-0">
                    <p className={`text-xs tracking-wide truncate ${s.number === currentSurah?.number ? "fc-90" : "fc-50"}`}>
                      {s.englishName}
                    </p>
                  </div>
                </div>
                <span className={`text-sm ${s.number === currentSurah?.number ? "fc-80" : "fc-25"}`} dir="rtl" style={{ fontFamily: quranFont === "kitab" ? "Kitab" : "var(--font-arabic)" }}>
                  {s.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button 
            onClick={onClose} 
            className="w-full py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ClockFace({
  prayers,
  restStart,
  restInterval,
  zone,
  onRestConfigOpen,
  onZonePickerOpen,
  showRest,
  showPrayers,
  showHijri,
  hijriDate,
}: {
  prayers: PrayerTimes | null;
  restStart: string;
  restInterval: number;
  zone: string;
  onRestConfigOpen: () => void;
  onZonePickerOpen: () => void;
  showRest?: boolean;
  showPrayers?: boolean;
  showHijri?: boolean;
  hijriDate?: string | null;
}) {
  const [time, setTime] = useState<Date | null>(null);
  const [restAlert, setRestAlert] = useState(false);
  const [prayerAlert, setPrayerAlert] = useState(false);
  const [lockedRestTime, setLockedRestTime] = useState<string | null>(null);
  const [lockedPrayer, setLockedPrayer] = useState<{ label: string; scheduled: string } | null>(null);
  const alertedRestHour = useRef("");
  const alertedPrayer = useRef("");
  const restAlertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prayerAlertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!time) return;
    const currentHHMM = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
    {
      const [sH, sM] = restStart.split(":").map(Number);
      const nowMins = time.getHours() * 60 + time.getMinutes();
      const startMins = sH * 60 + sM;
      const distMins = ((nowMins - startMins) % (24 * 60) + 24 * 60) % (24 * 60);
      if (distMins % restInterval === 0 && alertedRestHour.current !== currentHHMM) {
        alertedRestHour.current = currentHHMM;
        setLockedRestTime(currentHHMM);
        setRestAlert(true);
        if (restAlertTimer.current) clearTimeout(restAlertTimer.current);
        restAlertTimer.current = setTimeout(() => { setRestAlert(false); setLockedRestTime(null); }, 5 * 60 * 1000);
      }
    }
    if (prayers) {
      const hit = PRAYER_KEYS.find((k) => {
        if (!prayers[k]) return false;
        const [h, m] = prayers[k]!.split(":").map(Number);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` === currentHHMM;
      });
      if (hit && alertedPrayer.current !== currentHHMM) {
        alertedPrayer.current = currentHHMM;
        setLockedPrayer({ label: PRAYER_LABELS[hit], scheduled: currentHHMM });
        setPrayerAlert(true);
        if (prayerAlertTimer.current) clearTimeout(prayerAlertTimer.current);
        prayerAlertTimer.current = setTimeout(() => { setPrayerAlert(false); setLockedPrayer(null); }, 5 * 60 * 1000);
      }
    }
  }, [time, prayers, restStart, restInterval]);

  if (!time) return null;

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");
  const dateLabel = time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const secondsPct = (time.getSeconds() / 59) * 100;
  const nowSecs = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();

  const [startH, startM] = restStart.split(":").map(Number);
  const startSecs = startH * 3600 + startM * 60;
  const intervalSecs = restInterval * 60;
  const elapsed = ((nowSecs - startSecs) % (24 * 3600) + 24 * 3600) % (24 * 3600);
  const periodsUntilNext = Math.floor(elapsed / intervalSecs) + 1;
  const nextRestSecs = (startSecs + periodsUntilNext * intervalSecs) % (24 * 3600);
  const nextRestTime = `${String(Math.floor(nextRestSecs / 3600)).padStart(2, "0")}:${String(Math.floor((nextRestSecs % 3600) / 60)).padStart(2, "0")}`;

  let nextPrayer: { label: string; scheduled: string } | null = null;
  if (prayers) {
    const upcoming = PRAYER_KEYS.filter((k) => prayers[k])
      .map((k) => {
        let diff = parseHHMM(prayers[k]!) - nowSecs;
        if (diff <= 0) diff += 24 * 3600;
        return { key: k, diff };
      })
      .sort((a, b) => a.diff - b.diff)[0];
    if (upcoming) {
      const raw = prayers[upcoming.key]!;
      const [h, m] = raw.split(":").map(Number);
      nextPrayer = { label: PRAYER_LABELS[upcoming.key], scheduled: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
    }
  }

  return (
    <>
      <div className="flex items-baseline tabular-nums">
        {`${hours}:${minutes}:${seconds}`.split("").map((char, i) => (
          <span key={i} className={`inline-block text-center text-[15vw] sm:text-[12vw] leading-none ${char === ":" ? "w-[5vw] sm:w-[4vw] font-light fc-50" : i >= 6 ? "w-[11vw] sm:w-[9vw] font-bold fc-60" : "w-[11vw] sm:w-[9vw] font-bold fc-90"}`}>
            {char}
          </span>
        ))}
      </div>
      <div className="w-1/2 sm:w-3/4 h-[3px] bg-white/10 rounded-full overflow-hidden mt-6">
        <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ width: `${secondsPct}%`, backgroundColor: 'rgb(var(--fc) / 0.7)' }} />
      </div>
      <div className="flex flex-col items-center gap-1 md:mt-6 xl:mt-6 2xl:mt-10">
        <p className="text-sm sm:text-xl font-bold tracking-[0.1em] sm:tracking-widest fc uppercase">{dateLabel}</p>
        {showHijri && hijriDate && (
          <p className="text-[10px] tracking-[0.25em] fc-35 uppercase">{hijriDate}</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row w-full mt-6">
        {showRest !== false && (
          <div
            onClick={() => { if (restAlert) { setRestAlert(false); setLockedRestTime(null); } }}
            onDoubleClick={onRestConfigOpen}
            className={`flex-1 flex flex-col items-center gap-2 pb-6 sm:pb-0 ${showPrayers !== false ? "sm:pr-8 border-b sm:border-b-0 sm:border-r border-white/5" : ""} cursor-pointer`}
          >
          <div className="flex items-center gap-1.5">
            {restAlert && <AlertDot onClear={() => { setRestAlert(false); setLockedRestTime(null); }} />}
            <p className="text-[12px] font-light tracking-[0.3em] fc-35 uppercase">Quick Rest</p>
          </div>
          <p className={`text-2xl tracking-[0.1em] tabular-nums ${restAlert ? "font-bold text-red-400" : "font-light fc"}`}>{lockedRestTime ?? nextRestTime}</p>
          <p className="text-[10px] tracking-[0.2em] fc-40 uppercase">next break</p>
          </div>
        )}
        {showPrayers !== false && (
          <div onClick={() => { if (prayerAlert) { setPrayerAlert(false); setLockedPrayer(null); } }} onDoubleClick={onZonePickerOpen} className={`flex-1 flex flex-col items-center gap-2 pt-6 sm:pt-0 ${showRest !== false ? "sm:pl-8" : ""} cursor-pointer`}>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {prayerAlert && <AlertDot onClear={() => { setPrayerAlert(false); setLockedPrayer(null); }} />}
            <p className="text-[12px] font-light tracking-[0.3em] fc-35 uppercase">Prayer Time</p>
            <span className="text-[10px] tracking-[0.2em] fc-20 uppercase border border-white/5 rounded px-1.5 py-0.5">{zone}</span>
          </div>
          {nextPrayer ? (
            <>
              <p className={`text-2xl tracking-[0.1em] tabular-nums ${prayerAlert ? "font-bold text-red-400" : "font-light fc"}`}>{(lockedPrayer ?? nextPrayer).scheduled}</p>
              <p className="text-[10px] tracking-[0.2em] fc-40 uppercase">{(lockedPrayer ?? nextPrayer).label}</p>
            </>
          ) : (
            <p className="text-2xl font-light fc-20">—</p>
          )}
          </div>
        )}
      </div>
    </>
  );
}

function ReminderModal({
  reminders,
  onSave,
  onClose,
}: {
  reminders: Reminder[];
  onSave: (items: Reminder[]) => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Reminder[]>(
    [...reminders].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
  );
  const [text, setText] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toTimeString().slice(0, 5);
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const editTextRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { editingId ? setEditingId(null) : onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editingId]);

  useEffect(() => {
    if (editingId) editTextRef.current?.focus();
  }, [editingId]);

  const startEdit = (item: Reminder) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditDate(item.date);
    setEditTime(item.time);
  };

  const saveEdit = () => {
    if (!editText.trim() || !editingId) return;
    const updated = items
      .map((i) => i.id === editingId ? { ...i, text: editText.trim(), date: editDate, time: editTime } : i)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    setItems(updated);
    setEditingId(null);
  };

  const addItem = () => {
    if (!text.trim()) return;
    const newItems = [...items, { id: crypto.randomUUID(), text: text.trim(), date, time }]
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    setItems(newItems);
    setText("");
    textRef.current?.focus();
  };

  const confirmRemove = (id: string) => {
    if (editingId === id) setEditingId(null);
    setConfirmDeleteId(null);
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    onSave(updated);
  };

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const formatDate = (d: string) => {
    if (d === today) return "Today";
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const isAlert = (r: Reminder) => {
    const diff = (new Date(`${r.date}T${r.time}`).getTime() - now.getTime()) / 60000;
    return diff >= -10 && diff <= 10;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-sm bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col max-h-[80dvh]">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Reminders</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-scroll min-h-0 scrollbar-thin">
          {items.length === 0 ? (
            <p className="text-center text-[11px] tracking-[0.15em] text-white/20 uppercase py-8">No reminders yet</p>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {items.map((item) => {
                const alert = isAlert(item);
                if (editingId === item.id) {
                  return (
                    <div key={item.id} className="flex flex-col gap-2 px-5 py-3 bg-white/[0.03]">
                      <input
                        ref={editTextRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                        className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs tracking-[0.1em] text-white/70 outline-none focus:bg-white/8 transition-colors"
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs tracking-[0.1em] text-white/50 outline-none focus:bg-white/8 transition-colors [color-scheme:dark]"
                        />
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs tracking-[0.1em] text-white/50 outline-none focus:bg-white/8 transition-colors [color-scheme:dark]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 text-[10px] tracking-[0.15em] uppercase text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
                        <button onClick={saveEdit} disabled={!editText.trim()} className="flex-1 py-1.5 text-[10px] tracking-[0.15em] uppercase text-white/60 bg-white/8 border border-white/10 rounded-lg hover:bg-white/12 transition-colors disabled:opacity-30">Save</button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors cursor-pointer hover:bg-white/[0.06] ${alert ? "bg-red-500/[0.06]" : ""}`}
                    onClick={() => startEdit(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] tracking-[0.15em] uppercase font-medium ${alert ? "text-red-400/70" : "text-white/25"}`}>{item.time}</span>
                        <span className={`text-[10px] ${alert ? "text-red-400/40" : "text-white/15"}`}>·</span>
                        <span className={`text-[10px] tracking-[0.1em] uppercase ${alert ? "text-red-400/40" : "text-white/15"}`}>{formatDate(item.date)}</span>
                      </div>
                      <p className={`text-xs tracking-[0.08em] truncate ${alert ? "text-red-300/80" : "text-white/50"}`}>{item.text}</p>
                    </div>
                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => confirmRemove(item.id)} className="text-[10px] tracking-[0.1em] text-red-400/70 hover:text-red-400 transition-colors">Confirm</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] tracking-[0.1em] text-white/25 hover:text-white/55 transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.id); }}
                        className="shrink-0 text-white/15 hover:text-white/50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-5 py-4 border-t border-white/5 flex flex-col gap-3">
            <input
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Reminder text…"
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs tracking-[0.1em] text-white/70 placeholder:text-white/20 outline-none focus:bg-white/8 transition-colors"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs tracking-[0.1em] text-white/50 outline-none focus:bg-white/8 transition-colors [color-scheme:dark]"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs tracking-[0.1em] text-white/50 outline-none focus:bg-white/8 transition-colors [color-scheme:dark]"
              />
            </div>
            <button
              onClick={addItem}
              disabled={!text.trim()}
              className="w-full py-2 text-xs tracking-[0.2em] uppercase text-white/40 hover:text-white/70 border border-white/8 hover:border-white/15 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        <div className="shrink-0 flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase">Cancel</button>
          <button onClick={() => { onSave(items); onClose(); }} className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase">Save</button>
        </div>
      </div>
    </div>
  );
}

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
        // Pause everything first
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
          // Move to next ayah in current surah
          const nextIndex = index + 1;
          setCurrentAyahIndex(nextIndex);
          audio.src = surah.ayahs[nextIndex].audio;
          audio.play();
        } else if (surah && allSurahs.length > 0) {
          // End of surah - load next surah if available
          const nextSurahNum = surah.number + 1;
          const nextSurahExists = allSurahs.some(s => s.number === nextSurahNum);

          if (nextSurahExists) {
            // Load next surah and play it
            loadSurah(nextSurahNum, true);
          } else {
            // No more surahs - stop playing
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
      // Pause media player first
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
      {/* Background layer */}
      <div className="fixed inset-0 -z-10 transition-colors duration-500" style={bgStyle} />

      {/* Settings button */}
      {showBgSettings && (
        <BgSettingsModal config={bgConfig} onSave={saveBgConfig} onClose={() => setShowBgSettings(false)} />
      )}

      {showPicker && (
        <ZonePicker
          current={zone}
          onSave={saveZone}
          onClose={() => setShowPicker(false)}
        />
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
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
        {/* Weather */}
        {bgConfig.showWeather !== false && <div onDoubleClick={() => setShowLocPicker(true)} className="w-full flex items-center flex-wrap justify-center gap-x-3 gap-y-1 cursor-pointer">
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
        </div>}

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

        {/* List */}
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
        {bgConfig.showNote !== false && <div className="w-full mt-8">
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
        </div>}

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

"use client";

import { useEffect, useRef, useState } from "react";

function AlertDot({ onClear }: { onClear: () => void }) {
  return (
    <button onClick={onClear} className="mr-2 text-white/70 hover:text-white transition-colors shrink-0" title="Click to clear">
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

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
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
      <div className="w-full max-w-md bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Select Zone</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">
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
            className="w-full bg-transparent text-sm text-white/70 placeholder-white/20 outline-none tracking-wider"
          />
        </div>

        {/* Zone list */}
        <div className="overflow-y-auto max-h-72">
          {filtered.map((z) => (
            <button
              key={z.code}
              onClick={() => setInput(z.code)}
              className={`w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition-colors ${
                input === z.code ? "bg-white/8 text-white" : "text-white/50"
              }`}
            >
              <span className="text-xs tracking-[0.2em]">{z.name}</span>
              <span className={`text-xs font-light tracking-widest ${input === z.code ? "text-white/80" : "text-white/25"}`}>
                {z.code}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-5 py-4 text-xs text-white/25">No zones found.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(input); onClose(); }}
            className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase"
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
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Quick Rest</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        </div>
        <div className="flex flex-col gap-5 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Start Time</label>
            <input
              type="time"
              value={s}
              onChange={(e) => setS(e.target.value)}
              className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-white/25 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Interval (minutes)</label>
            <input
              type="number"
              min="5"
              max="240"
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-white/25 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase">Cancel</button>
          <button
            onClick={() => { onSave(s, Math.max(5, parseInt(iv) || 60)); onClose(); }}
            className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase"
          >Save</button>
        </div>
      </div>
    </div>
  );
}

function WeatherIcon({ kind, className }: { kind: string; className?: string }) {
  const cls = `${className ?? "w-5 h-5"} text-white/50`;
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
      <div className="w-full max-w-md bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Weather Location</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        </div>

        <button
          onClick={useCurrentLocation}
          disabled={geoLoading}
          className="flex items-center gap-3 px-5 py-3 border-b border-white/5 text-left hover:bg-white/5 transition-colors w-full"
        >
          <svg className="w-4 h-4 text-white/35 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          <span className="text-xs tracking-[0.2em] text-white/45 uppercase">
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
            className="w-full bg-transparent text-sm text-white/70 placeholder-white/20 outline-none tracking-wider"
          />
        </div>

        <div className="overflow-y-auto max-h-60">
          {searching && <p className="px-5 py-3 text-xs text-white/25 tracking-widest">Searching…</p>}
          {!searching && results.map((loc, i) => (
            <button
              key={i}
              onClick={() => { onSave(loc); onClose(); }}
              className={`w-full text-left px-5 py-3 text-xs tracking-[0.15em] hover:bg-white/5 transition-colors ${
                current?.lat === loc.lat && current?.lon === loc.lon
                  ? "bg-white/8 text-white"
                  : "text-white/50"
              }`}
            >
              {loc.name}
            </button>
          ))}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-5 py-3 text-xs text-white/25">No results.</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

type BgConfig = {
  color: string;
};

const DEFAULT_BG: BgConfig = { color: "#0a0a0a" };

function BgSettingsModal({ config, onSave, onClose }: { config: BgConfig; onSave: (c: BgConfig) => void; onClose: () => void }) {
  const [color, setColor] = useState(config.color);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => { onSave({ color }); onClose(); };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-xs bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col mt-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Background</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5">
          <label className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-white/40 tracking-widest font-mono">{color}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["#0a0a0a", "#0f172a", "#0d1117", "#1a0a2e", "#0a1628", "#1a1a0a"].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={`w-7 h-7 rounded-md border transition-colors ${color === c ? "border-white/50" : "border-white/10 hover:border-white/30"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase">Cancel</button>
          <button onClick={submit} className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase">Save</button>
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
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">{isEdit ? "Edit Item" : "New Item"}</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-4">
          <input
            autoFocus
            type="text"
            placeholder="Type something…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full bg-transparent text-sm text-white/70 placeholder-white/20 outline-none tracking-wider"
          />
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2 text-xs tracking-[0.2em] text-white/30 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase">Cancel</button>
          <button onClick={submit} className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase">{isEdit ? "Save" : "Add"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);
  const [zone, setZone] = useState("WLY01");
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [restAlert, setRestAlert] = useState(false);
  const [prayerAlert, setPrayerAlert] = useState(false);
  const alertedRestHour = useRef(-1);
  const alertedPrayer = useRef("");
  const restAlertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prayerAlertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [listItems, setListItems] = useState<{ id: string; text: string }[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [listInput, setListInput] = useState("");
  const [restStart, setRestStart] = useState("08:30");
  const [restInterval, setRestInterval] = useState(60);
  const [showRestConfig, setShowRestConfig] = useState(false);
  const [weatherLoc, setWeatherLoc] = useState<WeatherLoc | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [showListAdd, setShowListAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; text: string } | null>(null);
  const [bgConfig, setBgConfig] = useState<BgConfig>(DEFAULT_BG);
  const [showBgSettings, setShowBgSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("solat-zone");
    if (saved) setZone(saved);
    const savedList = localStorage.getItem("clock-list");
    const defaultList = [{ id: "default", text: "Some text here" }];
    setListItems(savedList ? JSON.parse(savedList) : defaultList);
    setRestStart(localStorage.getItem("rest-start") ?? "08:30");
    setRestInterval(parseInt(localStorage.getItem("rest-interval") ?? "60"));
    const savedLoc = localStorage.getItem("weather-loc");
    if (savedLoc) setWeatherLoc(JSON.parse(savedLoc));
    const savedBg = localStorage.getItem("bg-config");
    if (savedBg) setBgConfig(JSON.parse(savedBg));
  }, []);

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

  const saveList = (items: { id: string; text: string }[]) => {
    setListItems(items);
    localStorage.setItem("clock-list", JSON.stringify(items));
  };
  const addListItem = (text: string) => {
    if (!text.trim()) return;
    saveList([...listItems, { id: Date.now().toString(), text: text.trim() }]);
  };
  const editListItem = (id: string, text: string) => {
    saveList(listItems.map((i) => (i.id === id ? { ...i, text: text.trim() } : i)));
  };
  const removeListItem = (id: string) => saveList(listItems.filter((i) => i.id !== id));

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!time) return;

    // Rest alert: fires once at the top of each hour
    if (time.getMinutes() === 0 && time.getSeconds() === 0) {
      if (alertedRestHour.current !== time.getHours()) {
        alertedRestHour.current = time.getHours();
        setRestAlert(true);
        if (restAlertTimer.current) clearTimeout(restAlertTimer.current);
        restAlertTimer.current = setTimeout(() => setRestAlert(false), 5 * 60 * 1000);
      }
    }

    // Prayer alert: fires once when current HH:MM matches a prayer time
    if (prayers) {
      const currentHHMM = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
      const hit = PRAYER_KEYS.find((k) => {
        if (!prayers[k]) return false;
        const [h, m] = prayers[k]!.split(":").map(Number);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` === currentHHMM;
      });
      if (hit && alertedPrayer.current !== currentHHMM) {
        alertedPrayer.current = currentHHMM;
        setPrayerAlert(true);
        if (prayerAlertTimer.current) clearTimeout(prayerAlertTimer.current);
        prayerAlertTimer.current = setTimeout(() => setPrayerAlert(false), 5 * 60 * 1000);
      }
    }
  }, [time, prayers]);

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

  if (!time) return null;

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");

  const dateLabel = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const secondsPct = (time.getSeconds() / 59) * 100;

  const nowSecs = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();

  // Next rest: based on configurable start + interval
  const [startH, startM] = restStart.split(":").map(Number);
  const startSecs = startH * 3600 + startM * 60;
  const intervalSecs = restInterval * 60;
  const elapsed = ((nowSecs - startSecs) % (24 * 3600) + 24 * 3600) % (24 * 3600);
  const periodsUntilNext = Math.floor(elapsed / intervalSecs) + 1;
  const nextRestSecs = (startSecs + periodsUntilNext * intervalSecs) % (24 * 3600);
  const nextRestTime = `${String(Math.floor(nextRestSecs / 3600)).padStart(2, "0")}:${String(Math.floor((nextRestSecs % 3600) / 60)).padStart(2, "0")}`;

  // Next prayer
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
      nextPrayer = {
        label: PRAYER_LABELS[upcoming.key],
        scheduled: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      };
    }
  }

  const bgStyle = { backgroundColor: bgConfig.color };

  return (
    <>
      {/* Background layer */}
      <div className="fixed inset-0 -z-10 transition-colors duration-500" style={bgStyle} />

      {/* Settings button */}
      <button
        onClick={() => setShowBgSettings(true)}
        className="fixed top-4 right-4 z-30 text-white/20 hover:text-white/50 transition-colors"
        title="Background settings"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </button>

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

      <div className="flex flex-col items-center gap-4 select-none w-full max-w-2xl px-4 sm:px-6">
        {/* Weather */}
        <div onDoubleClick={() => setShowLocPicker(true)} className="flex items-center flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1 cursor-pointer">
          {weatherData && weatherLoc ? (
            <>
              <WeatherIcon kind={getWeatherInfo(weatherData.code).kind} className="w-5 h-5" />
              <span className="text-2xl font-light text-white/75 tabular-nums leading-none">{weatherData.temp}°</span>
              <span className="text-[11px] tracking-[0.25em] text-white/35 uppercase">{getWeatherInfo(weatherData.code).label}</span>
              <span className="text-white/10 text-xs">·</span>
              <span className="text-[11px] tracking-[0.15em] text-white/25 uppercase">{weatherLoc.name}</span>
            </>
          ) : (
            <span className="text-[11px] tracking-[0.25em] text-white/20 uppercase">+ Set weather location</span>
          )}
        </div>

        {/* Time */}
        <div className="flex items-baseline tabular-nums">
          {`${hours}:${minutes}:${seconds}`.split("").map((char, i) => (
            <span
              key={i}
              className={`inline-block text-center text-[12vw] leading-none ${
                char === ":"
                  ? "w-[4vw] font-light text-white/50"
                  : i >= 6
                  ? "w-[9vw] font-bold text-white/60"
                  : "w-[9vw] font-bold text-white/90"
              }`}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-3/4 sm:w-1/2 h-[2px] bg-white/10 rounded-full overflow-hidden mt-6">
          <div
            className="h-full bg-white/70 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${secondsPct}%` }}
          />
        </div>

        {/* Date */}
        <p className="text-sm sm:text-xl font-bold tracking-[0.1em] sm:tracking-widest text-white uppercase xl:mt-6 2xl:mt-10">
          {dateLabel}
        </p>

        {/* Bottom info row */}
        <div className="flex flex-col sm:flex-row w-full mt-6">
          {/* Quick Rest */}
          <div onDoubleClick={() => setShowRestConfig(true)} className="flex-1 flex flex-col items-center gap-2 pb-6 sm:pb-0 sm:pr-8 border-b sm:border-b-0 sm:border-r border-white/5 cursor-pointer">
            <div className="flex items-center gap-1.5">
              {restAlert && <AlertDot onClear={() => setRestAlert(false)} />}
              <p className="text-[12px] font-light tracking-[0.3em] text-white/35 uppercase">Quick Rest</p>
            </div>
            <p className={`text-2xl tracking-[0.1em] text-white tabular-nums ${restAlert ? "font-bold" : "font-light"}`}>
              {nextRestTime}
            </p>
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">next break</p>
          </div>

          {/* Prayer Time */}
          <div className="flex-1 flex flex-col items-center gap-2 pt-6 sm:pt-0 sm:pl-8">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {prayerAlert && <AlertDot onClear={() => setPrayerAlert(false)} />}
              <p className="text-[12px] font-light tracking-[0.3em] text-white/35 uppercase">Waktu Solat</p>
              <button
                onClick={() => setShowPicker(true)}
                className="text-[10px] tracking-[0.2em] text-white/20 hover:text-white/50 uppercase transition-colors border border-white/5 hover:border-white/25 rounded px-1.5 py-0.5"
              >
                {zone}
              </button>
            </div>
            {nextPrayer ? (
              <>
                <p className={`text-2xl tracking-[0.1em] text-white tabular-nums ${prayerAlert ? "font-bold" : "font-light"}`}>
                  {nextPrayer.scheduled}
                </p>
                <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                  {nextPrayer.label}
                </p>
              </>
            ) : (
              <p className="text-2xl font-light text-white/20">—</p>
            )}
          </div>
        </div>

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
        <div className="w-full mt-8">
          <button
            onClick={() => setListOpen((o) => !o)}
            className="flex items-center justify-center w-full text-white/25 hover:text-white/40 transition-colors mb-2"
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
              {listItems.map((item) => (
                <div key={item.id} onDoubleClick={() => setEditingItem(item)} className="flex items-center gap-3 px-4 py-2.5 border border-white/8 rounded-lg cursor-pointer">
                  <span className="flex-1 text-[12px] tracking-[0.1em] text-white/45">{item.text}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeListItem(item.id); }}
                    className="text-white/20 hover:text-white/55 transition-colors shrink-0"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowListAdd(true)}
                className="flex items-center justify-center w-full py-2.5 text-white/20 hover:text-white/45 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <a href="https://hakim.my" target="_blank" rel="noopener noreferrer" className="fixed bottom-4 text-[10px] tracking-[0.25em] text-white/70 hover:text-white/35 uppercase transition-colors">&copy; 2026 &bull; Hakim Samah &bull; Dashboard</a>
      </div>
    </>
  );
}

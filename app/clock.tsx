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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
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

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);
  const [zone, setZone] = useState("WLY01");
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [restAlert, setRestAlert] = useState(false);
  const [prayerAlert, setPrayerAlert] = useState(false);
  const alertedRestHour = useRef(-1);
  const alertedPrayer = useRef("");
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [restStart, setRestStart] = useState("08:30");
  const [restInterval, setRestInterval] = useState(60);
  const [showRestConfig, setShowRestConfig] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("solat-zone");
    if (saved) setZone(saved);
    setNote(localStorage.getItem("clock-note") ?? "");
    setRestStart(localStorage.getItem("rest-start") ?? "08:30");
    setRestInterval(parseInt(localStorage.getItem("rest-interval") ?? "60"));
  }, []);

  const saveRestConfig = (start: string, interval: number) => {
    setRestStart(start);
    setRestInterval(interval);
    localStorage.setItem("rest-start", start);
    localStorage.setItem("rest-interval", String(interval));
  };

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

  return (
    <>
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

      <div className="flex flex-col items-center gap-4 select-none">
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
        <div className="w-1/2 h-[2px] bg-white/10 rounded-full overflow-hidden mt-6">
          <div
            className="h-full bg-white/70 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${secondsPct}%` }}
          />
        </div>

        {/* Date */}
        <p className="text-xl font-bold tracking-widest text-white uppercase xl:mt-6 2xl:mt-10">
          {dateLabel}
        </p>

        {/* Bottom info row */}
        <div className="flex w-full mt-6">
          {/* Quick Rest */}
          <div onDoubleClick={() => setShowRestConfig(true)} className="flex-1 flex flex-col items-center gap-2 pr-8 border-r border-white/5 cursor-pointer">
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
          <div className="flex-1 flex flex-col items-center gap-2 pl-8">
            <div className="flex items-center gap-2">
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

        {/* Note */}
        <div className="w-full mt-8">
          <button
            onClick={() => setNoteOpen((o) => !o)}
            className="flex items-center justify-center w-full text-white/25 hover:text-white/40 transition-colors mb-1"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${noteOpen ? "rotate-180" : "rotate-0"}`}
              fill="none" stroke="currentColor" strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 9l7 7 7-7" />
            </svg>
          </button>
          {noteOpen && (
            <textarea
              id="note"
              value={note}
              rows={note.split("\n").length + 1}
              onChange={(e) => { setNote(e.target.value); localStorage.setItem("clock-note", e.target.value); }}
              placeholder=""
              className="w-full resize-none bg-white/1 text-left text-[12px] text-white/40 placeholder-white/15 outline-none border-2 border-white/15 focus:border-white/50 transition-colors rounded-lg p-3 leading-relaxed"
            />
          )}
        </div>
      </div>
    </>
  );
}

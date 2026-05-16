"use client";

import { useEffect, useRef, useState } from "react";
import { AlertDot } from "./AlertDot";
import { PRAYER_KEYS, PRAYER_LABELS, parseHHMM } from "./types";
import type { PrayerTimes } from "./types";

export function ClockFace({
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
      <div className="w-1/2 md:w-3/4 h-[3px] bg-white/10 rounded-full overflow-hidden mt-1 sm:mt-2 2xl:mt-10">
        <div className="h-full rounded-full transition-transform duration-1000 ease-linear origin-left" style={{ transform: `scaleX(${secondsPct / 100})`, backgroundColor: 'rgb(var(--fc) / 0.7)' }} />
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

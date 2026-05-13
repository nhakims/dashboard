"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoResult, WeatherLoc } from "./types";

export function LocationPickerModal({
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
          <p className="text-xs tracking-[0.3em] text-white/60 uppercase">Weather Location</p>
          <button onClick={onClose} className="text-white/50 hover:text-white/75 text-lg leading-none transition-colors">✕</button>
        </div>

        <button
          onClick={useCurrentLocation}
          disabled={geoLoading}
          className="flex items-center gap-3 px-5 py-3 border-b border-white/5 text-left hover:bg-white/5 transition-colors w-full"
        >
          <svg className="w-4 h-4 text-white/55 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          <span className="text-xs tracking-[0.2em] text-white/65 uppercase">
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
            className="w-full bg-transparent text-sm text-white/85 tracking-[0.1em] placeholder-white/20 outline-none"
          />
        </div>

        <div className="overflow-y-auto max-h-60">
          {searching && <p className="px-5 py-3 text-xs tracking-[0.2em] text-white/40">Searching…</p>}
          {!searching && results.map((loc, i) => (
            <button
              key={i}
              onClick={() => { onSave(loc); onClose(); }}
              className={`w-full text-left px-5 py-3 text-xs tracking-[0.15em] hover:bg-white/5 transition-colors ${
                current?.lat === loc.lat && current?.lon === loc.lon
                  ? "bg-white/8 text-white"
                  : "text-white/70"
              }`}
            >
              {loc.name}
            </button>
          ))}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-5 py-3 text-xs tracking-[0.1em] text-white/40">No results.</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs tracking-[0.2em] text-white/50 border border-white/5 rounded-lg hover:bg-white/5 transition-colors uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

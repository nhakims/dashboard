"use client";

import { useEffect, useRef, useState } from "react";
import type { BgConfig, FontId } from "./types";
import { FONTS } from "./types";

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
      <span className="text-xs tracking-[0.15em] text-white/35 font-mono">{value}</span>
    </div>
  );
}

export function BgSettingsModal({ config, onSave, onClose }: { config: BgConfig; onSave: (c: BgConfig) => void; onClose: () => void }) {
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
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none transition-colors">✕</button>
        </div>

        <div className="flex flex-col overflow-y-auto min-h-0 flex-1 scrollbar-thin">
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
                  <span className="text-sm text-white/70 tracking-[0.05em]" style={{ fontFamily: `var(--font-${f.id})` }}>{f.label}</span>
                  {fontFamily === f.id && <span className="text-white/40 text-[10px] tracking-[0.1em]">✓</span>}
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
              {([
                ["Daily Quran",   showQuran,       setShowQuran],
                ["Daily Quote",   showDailyQuote,  setShowDailyQuote],
                ["Weather",       showWeather,     setShowWeather],
                ["Quick Rest",    showRest,        setShowRest],
                ["Prayer Time",   showPrayers,     setShowPrayers],
                ["Tasks",         showNote,        setShowNote],
                ["Hijri Date",    showHijri,       setShowHijri],
                ["Media Player",  showPlayer,      setShowPlayer],
                ["Quran Player",  showQuranPlayer, setShowQuranPlayer],
                ["Reminders",     showReminder,    setShowReminder],
                ["Copyright",     showCopyright,   setShowCopyright],
              ] as [string, boolean, React.Dispatch<React.SetStateAction<boolean>>][]).map(([label, val, setter]) => (
                <div key={label} className="flex items-center justify-between">
                  <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">{label}</p>
                  <button
                    onClick={() => setter((v) => !v)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${val ? "bg-white/30" : "bg-white/10"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${val ? "translate-x-[1.25rem]" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
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

"use client";

import { useEffect, useRef } from "react";
import { type Reminder } from "./types";

export function ReminderAlert({ reminder, onDismiss }: { reminder: Reminder; onDismiss: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onDismiss()}
    >
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-3 px-8 pt-8 pb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400/80" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="text-[10px] tracking-[0.3em] text-red-400/60 uppercase">Reminder</p>
          <p className="text-sm tracking-[0.08em] text-white/85 leading-relaxed">{reminder.text}</p>
          <p className="text-[10px] tracking-[0.2em] text-white/30 tabular-nums">{reminder.time} · {reminder.date}</p>
        </div>
        <div className="flex justify-center px-8 pb-7">
          <button
            onClick={onDismiss}
            className="px-8 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors capitalize"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

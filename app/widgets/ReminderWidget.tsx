"use client";

import { useEffect, useRef, useState } from "react";
import { type Reminder, type RecurrenceType, getNextOccurrence } from "./types";

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: "none",    label: "None"    },
  { value: "daily",   label: "Daily"   },
  { value: "weekly",  label: "Weekly"  },
  { value: "monthly", label: "Monthly" },
  { value: "yearly",  label: "Yearly"  },
];

function ReminderFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Reminder;
  onSave: (r: Reminder) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    if (initial?.time) return initial.time;
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toTimeString().slice(0, 5);
  });
  const [recurrence, setRecurrence] = useState<RecurrenceType>(initial?.recurrence ?? "none");
  const textRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    if (!text.trim()) return;
    onSave({ id: initial?.id ?? crypto.randomUUID(), text: text.trim(), date, time, recurrence });
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-sm bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/60 uppercase">{initial ? "Edit Reminder" : "Add Reminder"}</p>
          <button onClick={onClose} className="text-white/50 hover:text-white/75 text-lg leading-none transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-3 px-5 py-4">
          <input
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="What you wants to be reminded?"
            className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs tracking-[0.1em] text-white/85 placeholder:text-white/20 outline-none focus:bg-white/8 transition-colors"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs tracking-[0.1em] text-white/70 outline-none focus:bg-white/8 transition-colors [color-scheme:dark]"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs tracking-[0.1em] text-white/70 outline-none focus:bg-white/8 transition-colors [color-scheme:dark]"
            />
          </div>
          <div className="flex gap-1.5">
            {RECURRENCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setRecurrence(o.value)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] tracking-[0.1em] transition-colors ${
                  recurrence === o.value
                    ? "bg-white/15 text-white/85 border border-white/15"
                    : "bg-white/5 text-white/40 border border-white/5 hover:text-white/60 hover:bg-white/8"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="px-5 py-2 text-xs tracking-[0.2em] text-white/50 border border-white/5 rounded-lg hover:bg-white/5 transition-colors capitalize">Cancel</button>
          <button onClick={submit} disabled={!text.trim()} className="px-5 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors capitalize disabled:opacity-30 disabled:cursor-not-allowed">
            {initial ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  show: boolean;
}

export function ReminderWidget({ show }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (localStorage.getItem("reminders-open") === "1") setOpen(true);
    const saved = localStorage.getItem("reminders");
    if (saved) setReminders(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(id);
  }, []);

  const save = (items: Reminder[]) => {
    setReminders(items);
    localStorage.setItem("reminders", JSON.stringify(items));
  };

  const add = (r: Reminder) => {
    const updated = [...reminders, r].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    save(updated);
  };

  const edit = (r: Reminder) => {
    const updated = reminders
      .map((i) => (i.id === r.id ? r : i))
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    save(updated);
  };

  const remove = (id: string) => save(reminders.filter((r) => r.id !== id));

  const thresholdMs = now.getTime() - 10 * 60 * 1000;

  const isAlert = (r: Reminder) => {
    const { datetimeMs } = getNextOccurrence(r, thresholdMs);
    const diff = (datetimeMs - now.getTime()) / 60000;
    return diff >= -10 && diff <= 10;
  };

  const today = now.toISOString().slice(0, 10);
  const formatDate = (d: string) => {
    if (d === today) return "Today";
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const upcoming = reminders
    .map((r) => ({ r, ...getNextOccurrence(r, thresholdMs) }))
    .filter(({ datetimeMs, r }) => r.recurrence && r.recurrence !== "none" ? true : datetimeMs >= thresholdMs)
    .sort((a, b) => a.datetimeMs - b.datetimeMs);

  if (!show) return null;

  return (
    <>
      {showAdd && <ReminderFormModal onSave={add} onClose={() => setShowAdd(false)} />}
      {editing && (
        <ReminderFormModal
          initial={editing}
          onSave={(r) => edit(r)}
          onClose={() => setEditing(null)}
        />
      )}
      <div className="w-full">
        <button
          onClick={() => setOpen((o) => { const next = !o; localStorage.setItem("reminders-open", next ? "1" : "0"); return next; })}
          className="flex items-center justify-center gap-2 w-full fc-25 hover:fc-40 transition-colors mb-2"
        >
          {!open && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )}
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
            fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 9l7 7 7-7" />
          </svg>
        </button>

        {open && (
          <div className="w-full flex flex-col gap-1">
            <div className={`flex flex-col gap-1 ${upcoming.length > 3 ? "max-h-[calc(3*4rem)] overflow-y-auto pr-1" : ""}`}>
              {upcoming.length === 0 && (
                <p className="text-center text-[10px] tracking-[0.2em] fc-20 py-2">no upcoming reminders</p>
              )}
              {upcoming.map(({ r, date: nextDate }) => {
                const alert = isAlert(r);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
                      alert ? "bg-red-500/[0.07] border-red-500/20" : "border-white/8"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] tracking-[0.15em] tabular-nums font-medium ${alert ? "text-red-400/70" : "fc-60"}`}>{r.time}</span>
                        <span className={`text-[10px] ${alert ? "text-red-400/40" : "fc-25"}`}>·</span>
                        <span className={`text-[10px] tracking-[0.1em] ${alert ? "text-red-400/40" : "fc-45"}`}>{formatDate(nextDate)}</span>
                        {r.recurrence && r.recurrence !== "none" && (
                          <>
                            <span className={`text-[10px] ${alert ? "text-red-400/40" : "fc-25"}`}>·</span>
                            <span className={`text-[9px] tracking-[0.15em] uppercase ${alert ? "text-red-400/40" : "fc-25"}`}>{r.recurrence}</span>
                          </>
                        )}
                      </div>
                      <p className={`text-[11px] tracking-[0.08em] truncate ${alert ? "text-red-300/80" : "fc-55"}`}>{r.text}</p>
                    </div>
                    {confirmDelete === r.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { remove(r.id); setConfirmDelete(null); }} className="text-[10px] tracking-[0.1em] text-red-400/70 hover:text-red-400 transition-colors">Confirm</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-[10px] tracking-[0.1em] fc-25 hover:fc-55 transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setEditing(r)} className="fc-20 hover:fc-55 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.415.586H9v-1.414a2 2 0 01.586-1.414z" />
                          </svg>
                        </button>
                        <button onClick={() => setConfirmDelete(r.id)} className="fc-20 hover:fc-55 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center w-full py-2.5 fc-20 hover:fc-45 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Reminder } from "./types";

export function ReminderModal({
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
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
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

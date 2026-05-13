"use client";

import { useEffect, useState } from "react";
import { ReminderModal } from "./ReminderModal";
import { type Reminder } from "./types";

interface Props {
  show: boolean;
}

export function ReminderWidget({ show }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderNow, setReminderNow] = useState(() => new Date());

  useEffect(() => {
    const savedReminders = localStorage.getItem("reminders");
    if (savedReminders) setReminders(JSON.parse(savedReminders));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setReminderNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

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

  if (!show) return null;

  return (
    <>
      {showReminderModal && (
        <ReminderModal
          reminders={reminders}
          onSave={saveReminders}
          onClose={() => setShowReminderModal(false)}
        />
      )}
      <div className="w-full mt-6">
        <button onClick={() => setShowReminderModal(true)} className="w-full flex flex-col gap-1.5">
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
    </>
  );
}

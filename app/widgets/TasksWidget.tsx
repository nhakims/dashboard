"use client";

import { useEffect, useState } from "react";
import { ListItemModal } from "./ListItemModal";

interface Props {
  show: boolean;
}

export function TasksWidget({ show }: Props) {
  const [listItems, setListItems] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [showListAdd, setShowListAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    const todayKey = `clock-list-${new Date().toISOString().slice(0, 10)}`;
    const savedList = localStorage.getItem(todayKey) ?? localStorage.getItem("clock-list");
    const defaultList = [{ id: "default", text: "Some text here", done: false }];
    const parsed = savedList ? JSON.parse(savedList) : defaultList;
    setListItems(parsed.map((i: { id: string; text: string; done?: boolean }) => ({ ...i, done: i.done ?? false })));
    localStorage.removeItem("clock-list");
  }, []);

  const saveList = (items: { id: string; text: string; done: boolean }[]) => {
    setListItems(items);
    const todayKey = `clock-list-${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(todayKey, JSON.stringify(items));
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

  if (!show) return null;

  return (
    <>
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
      <div className="w-full">
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
      </div>
    </>
  );
}

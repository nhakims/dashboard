"use client";

import { useEffect, useState } from "react";
import { BookmarkModal } from "./BookmarkModal";

interface Bookmark {
  id: string;
  name: string;
  url: string;
}

interface Props {
  show: boolean;
}

export function BookmarksWidget({ show }: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("bookmarks-open") === "0") setOpen(false);
    const saved = localStorage.getItem("bookmarks");
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  const save = (items: Bookmark[]) => {
    setBookmarks(items);
    localStorage.setItem("bookmarks", JSON.stringify(items));
  };

  const add = (name: string, url: string) =>
    save([...bookmarks, { id: Date.now().toString(), name, url }]);

  const edit = (id: string, name: string, url: string) =>
    save(bookmarks.map((b) => (b.id === id ? { ...b, name, url } : b)));

  const remove = (id: string) => save(bookmarks.filter((b) => b.id !== id));

  if (!show) return null;

  return (
    <>
      {showAdd && (
        <BookmarkModal onSave={add} onClose={() => setShowAdd(false)} />
      )}
      {editing && (
        <BookmarkModal
          initial={{ name: editing.name, url: editing.url }}
          onSave={(name, url) => edit(editing.id, name, url)}
          onClose={() => setEditing(null)}
        />
      )}
      <div className="w-full">
        <button
          onClick={() => setOpen((o) => { const next = !o; localStorage.setItem("bookmarks-open", next ? "1" : "0"); return next; })}
          className="flex items-center justify-center gap-2 w-full fc-25 hover:fc-40 transition-colors mb-2"
        >
          {!open && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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
            <div className={`flex flex-col gap-1 ${bookmarks.length > 4 ? "max-h-[calc(4*3rem)] overflow-y-auto pr-1" : ""}`}>
              {bookmarks.length === 0 && (
                <p className="text-center text-[10px] tracking-[0.2em] fc-20 py-2">no bookmarks yet</p>
              )}
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 px-4 py-2.5 border border-white/8 rounded-lg"
                >
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 flex items-center gap-2 hover:fc-80 transition-colors fc-55"
                    onClick={() => setConfirmDelete(null)}
                  >
                    <svg className="w-3 h-3 shrink-0 fc-25" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="text-[12px] tracking-[0.1em] truncate">{b.name}</span>
                  </a>
                  {confirmDelete === b.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => { remove(b.id); setConfirmDelete(null); }} className="text-[10px] tracking-[0.1em] text-red-400/70 hover:text-red-400 transition-colors">Confirm</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-[10px] tracking-[0.1em] fc-25 hover:fc-55 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditing(b)}
                        className="fc-20 hover:fc-55 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.415.586H9v-1.414a2 2 0 01.586-1.414z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(b.id)}
                        className="fc-20 hover:fc-55 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
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

"use client";

import { useEffect, useRef, useState } from "react";

export function BookmarkModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: { name: string; url: string };
  onSave: (name: string, url: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const overlayRef = useRef<HTMLDivElement>(null);
  const isEdit = !!initial;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    const trimName = name.trim();
    let trimUrl = url.trim();
    if (!trimName || !trimUrl) return;
    if (!/^https?:\/\//i.test(trimUrl)) trimUrl = "https://" + trimUrl;
    onSave(trimName, trimUrl);
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-xs bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-xs tracking-[0.3em] text-white/60 uppercase">{isEdit ? "Edit Bookmark" : "New Bookmark"}</p>
          <button onClick={onClose} className="text-white/50 hover:text-white/75 text-lg leading-none transition-colors">✕</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            placeholder="Label"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full bg-transparent text-sm text-white/85 tracking-[0.1em] placeholder-white/20 outline-none border-b border-white/8 pb-2"
          />
          <input
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full bg-transparent text-sm text-white/85 tracking-[0.1em] placeholder-white/20 outline-none border-b border-white/8 pb-2"
          />
        </div>
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="px-5 py-2 text-xs tracking-[0.2em] text-white/50 border border-white/5 rounded-lg hover:bg-white/5 transition-colors capitalize">Cancel</button>
          <button onClick={submit} className="px-5 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors capitalize">{isEdit ? "Save" : "Add"}</button>
        </div>
      </div>
    </div>
  );
}

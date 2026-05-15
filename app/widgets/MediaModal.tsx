"use client";

import { useEffect, useRef, useState } from "react";
import { MusicSourcesModal } from "./MusicSourcesModal";

export function MediaModal({
  tracks,
  currentTrackId,
  isPlaying,
  progress,
  duration,
  onPlayToggle,
  onTrackSelect,
  onUpload,
  onDelete,
  onSeek,
  onClose,
}: {
  tracks: { id: string; name: string }[];
  currentTrackId: string | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onPlayToggle: () => void;
  onTrackSelect: (id: string) => void;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  onSeek: (val: number) => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <p className="text-xs tracking-[0.3em] text-white/60 uppercase">Media Library</p>
            <p className="text-[10px] tracking-[0.2em] text-white/40 mt-0.5">Browser Storage · Offline Playback</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white/75 text-lg leading-none transition-colors">✕</button>
        </div>

        <div className="px-6 py-8 flex flex-col items-center gap-6 border-b border-white/5 bg-white/[0.02]">
          <div className="text-center w-full">
            <p className="text-sm tracking-[0.1em] text-white/90 font-medium truncate px-4 uppercase">
              {tracks.find(t => t.id === currentTrackId)?.name || "No track selected"}
            </p>
          </div>

          <div className="flex items-center gap-8">
            <button
              onClick={onPlayToggle}
              disabled={!currentTrackId || tracks.length === 0}
              className="w-14 h-14 flex items-center justify-center bg-[#3a3a3a] hover:bg-[#4a4a4a] disabled:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed border border-white/8 rounded-lg transition-all"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white/90" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-6 h-6 text-white/90" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
          </div>

          <div className="w-full flex flex-col gap-3">
            <div className="flex justify-between text-[10px] tracking-[0.2em] text-white/50 tabular-nums uppercase">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div
              className="relative w-full h-[6px] bg-white/10 cursor-pointer overflow-hidden rounded-full"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = x / rect.width;
                onSeek(pct * duration);
              }}
            >
              <div
                className="absolute top-0 left-0 h-full transition-all duration-300 ease-out rounded-full bg-white/85"
                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px] scrollbar-thin">
          <div className="flex items-center justify-end px-4 pt-3 pb-1">
            <button
              onClick={() => setShowSources(true)}
              className="text-[10px] tracking-[0.2em] text-red-400/70 hover:text-red-400 transition-colors capitalize"
            >
              Find Music
            </button>
          </div>
          <div className="px-4 pb-4 flex flex-col gap-1">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${track.id === currentTrackId ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <button
                  onClick={() => onTrackSelect(track.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className={`text-xs tracking-[0.15em] truncate uppercase ${track.id === currentTrackId ? "text-white/95" : "text-white/70"}`}>
                    {track.name}
                  </p>
                </button>
                <button
                  onClick={() => onDelete(track.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/35 hover:text-white/75 transition-all p-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
            {tracks.length === 0 && (
              <p className="text-center py-8 text-[11px] tracking-[0.2em] text-white/40 uppercase">No files found</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-white/5">
          <input
            type="file" accept="audio/*" ref={fileInputRef} className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs tracking-[0.2em] text-white/50 border border-white/5 rounded-lg hover:bg-white/5 transition-colors capitalize"
          >
            Close
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 text-xs tracking-[0.2em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors capitalize"
          >
            Upload
          </button>
        </div>
      </div>
      {showSources && <MusicSourcesModal onClose={() => setShowSources(false)} />}
    </div>
  );
}

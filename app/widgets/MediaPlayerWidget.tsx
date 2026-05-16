"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { deleteMediaFile, getMediaFile, saveMediaFile } from "../lib/media-db";
import { MediaModal } from "./MediaModal";

interface Props {
  show: boolean;
  onPlayStart: () => void;
}

export interface MediaPlayerHandle {
  pause: () => void;
}

export const MediaPlayerWidget = forwardRef<MediaPlayerHandle, Props>(function MediaPlayerWidget(
  { show, onPlayStart },
  ref
) {
  const [tracks, setTracks] = useState<{ id: string; name: string }[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const tracksRef = useRef(tracks);
  const currentTrackIdRef = useRef(currentTrackId);
  const isPlayingRef = useRef(isPlaying);
  const autoPlayNextRef = useRef(false);
  const restoreProgressRef = useRef(0);

  useImperativeHandle(ref, () => ({
    pause: () => {
      if (audioRef.current) audioRef.current.pause();
    },
  }));

  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { currentTrackIdRef.current = currentTrackId; }, [currentTrackId]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const loadTrack = useCallback(async (id: string, autoPlay = false, startAt = 0) => {
    try {
      const file = await getMediaFile(id);
      if (!file || !audioRef.current) return;

      audioRef.current.pause();

      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
      const url = URL.createObjectURL(file.blob);
      audioBlobUrlRef.current = url;

      audioRef.current.src = url;
      audioRef.current.load();

      if (startAt > 0) {
        const seek = () => {
          if (audioRef.current) audioRef.current.currentTime = startAt;
          audioRef.current?.removeEventListener("loadedmetadata", seek);
        };
        audioRef.current.addEventListener("loadedmetadata", seek);
        setProgress(startAt);
      } else {
        setProgress(0);
        localStorage.removeItem("media-progress");
      }

      if (autoPlay) {
        onPlayStart();
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } catch {
      // ignore
    }
  }, [onPlayStart]);

  useEffect(() => {
    const savedTracks = localStorage.getItem("media-tracks");
    if (savedTracks) setTracks(JSON.parse(savedTracks));
    const savedTrackId = localStorage.getItem("current-track-id");
    const savedProgress = parseFloat(localStorage.getItem("media-progress") ?? "0") || 0;
    if (savedTrackId) {
      restoreProgressRef.current = savedProgress;
      setCurrentTrackId(savedTrackId);
    }
    const savedVolume = localStorage.getItem("media-volume");
    if (savedVolume) setVolume(Number(savedVolume));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();

      const audio = audioRef.current;
      const updateDuration = () => setDuration(audio.duration);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        const currentTracks = tracksRef.current;
        const currentId = currentTrackIdRef.current;
        const index = currentTracks.findIndex((t) => t.id === currentId);

        if (index !== -1 && index < currentTracks.length - 1) {
          autoPlayNextRef.current = true;
          setCurrentTrackId(currentTracks[index + 1].id);
        } else if (currentTracks.length > 0) {
          autoPlayNextRef.current = true;
          setCurrentTrackId(currentTracks[0].id);
        }
      };
      const handleError = (e: Event) => {
        console.error("Audio error event:", e);
        if (audio.error) {
          console.error("Error code:", audio.error.code);
          console.error("Error message:", audio.error.message);
        }
      };

      audio.addEventListener("loadedmetadata", updateDuration);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);

      return () => {
        audio.removeEventListener("loadedmetadata", updateDuration);
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
        audio.pause();
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    localStorage.setItem("media-volume", String(volume));
  }, [volume]);

  useEffect(() => {
    if (currentTrackId) {
      const shouldAutoPlay = autoPlayNextRef.current;
      const startAt = restoreProgressRef.current;
      autoPlayNextRef.current = false;
      restoreProgressRef.current = 0;
      localStorage.setItem("current-track-id", currentTrackId);
      loadTrack(currentTrackId, shouldAutoPlay, startAt);
    }
  }, [currentTrackId, loadTrack]);

  useEffect(() => {
    if (isPlaying && currentTrackId) {
      const interval = setInterval(() => {
        if (audioRef.current) {
          const t = audioRef.current.currentTime;
          setProgress(t);
          localStorage.setItem(`media-progress`, String(t));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTrackId]);

  useEffect(() => {
    if (!show && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [show, isPlaying]);

  const selectTrack = useCallback((id: string) => {
    autoPlayNextRef.current = true;
    setCurrentTrackId(id);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrackId) return;

    if (isPlaying) {
      audioRef.current.pause();
      localStorage.setItem(`media-progress`, String(audioRef.current.currentTime));
    } else {
      onPlayStart();
      audioRef.current.play().catch(() => {});
    }
  };

  const handleUpload = async (file: File) => {
    const id = Date.now().toString();
    try {
      await saveMediaFile({ id, blob: file });
      const newTracks = [...tracks, { id, name: file.name }];
      setTracks(newTracks);
      localStorage.setItem("media-tracks", JSON.stringify(newTracks));
      if (!currentTrackId) setCurrentTrackId(id);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMediaFile(id);
    const newTracks = tracks.filter(t => t.id !== id);
    setTracks(newTracks);
    localStorage.setItem("media-tracks", JSON.stringify(newTracks));
    if (currentTrackId === id) {
      setCurrentTrackId(newTracks[0]?.id || null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setIsPlaying(false);
    }
  };

  const handleSeek = (val: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setProgress(val);
      if (currentTrackId) {
        localStorage.setItem(`media-progress`, String(val));
      }
    }
  };

  if (!show) return null;

  return (
    <>
      {showMediaModal && (
        <MediaModal
          tracks={tracks}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          onPlayToggle={togglePlay}
          onTrackSelect={selectTrack}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onSeek={handleSeek}
          onClose={() => setShowMediaModal(false)}
        />
      )}
      <div className="w-full flex flex-col items-center gap-2 mt-4">
        <button
          onClick={() => setShowMediaModal(true)}
          className="flex items-center gap-3 px-4 py-2 rounded rounded-1 bg-white/[0.03] border-0 hover:bg-white/[0.06] transition-all group max-w-xs w-full"
        >
          <div
            onClick={(e) => { e.stopPropagation(); if (tracks.length > 0) togglePlay(); }}
            className={`w-8 h-8 flex items-center justify-center bg-white/5 border-0 rounded rounded-1 shrink-0 group-hover:bg-white/10 ${tracks.length === 0 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 fc-60" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-4 h-4 fc-60" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-[0.2em] fc-30 uppercase mb-2">Media Player</p>
            <p className="text-xs fc-60 truncate tracking-[0.15em] uppercase">
              {tracks.find(t => t.id === currentTrackId)?.name || "No track selected"}
            </p>
          </div>
        </button>
      </div>
    </>
  );
});

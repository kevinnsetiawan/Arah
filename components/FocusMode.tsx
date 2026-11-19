"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Target,
  X,
} from "lucide-react";
import { memberColor, PRIORITIES } from "@/lib/data";
import type { Task } from "@/lib/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import { Avatar } from "./Avatar";

const TOTAL_SECONDS = 25 * 60;
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface FocusModeProps {
  tasks: Task[];
  onComplete: (task: Task) => void;
  onClose: () => void;
}

export function FocusMode({ tasks, onComplete, onClose }: FocusModeProps) {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const task = tasks.length > 0 ? tasks[Math.min(index, tasks.length - 1)] : null;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (secondsLeft !== 0) return;
    setRunning(false);
    setSessions((count) => count + 1);
  }, [secondsLeft]);

  function toggleTimer() {
    if (secondsLeft === 0) {
      setSecondsLeft(TOTAL_SECONDS);
      setRunning(true);
      return;
    }
    setRunning((value) => !value);
  }

  function resetTimer() {
    setRunning(false);
    setSecondsLeft(TOTAL_SECONDS);
  }

  function handleComplete() {
    if (!task) return;
    onComplete(task);
    setRunning(false);
    setSecondsLeft(TOTAL_SECONDS);
  }

  function handleSkip() {
    setIndex((value) => (value + 1) % Math.max(tasks.length, 1));
    setRunning(false);
    setSecondsLeft(TOTAL_SECONDS);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeLabel = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = secondsLeft / TOTAL_SECONDS;
  const overdue = task ? isOverdue(task.dueDate) : false;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.22),transparent_65%)]" />

      <header className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-300">
          <Target className="h-4 w-4" />
          Mode Fokus
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup mode fokus"
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-12 text-center">
        {task ? (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                  PRIORITIES[task.priority].badge,
                )}
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", PRIORITIES[task.priority].dot)}
                />
                {PRIORITIES[task.priority].label}
              </span>
              {task.dueDate && (
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                    overdue
                      ? "bg-rose-500/15 text-rose-300"
                      : "bg-white/10 text-zinc-300",
                  )}
                >
                  Tenggat {overdue ? "lewat " : ""}
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>

            <h1 className="mt-3 max-w-2xl text-balance text-2xl font-bold leading-tight sm:text-4xl">
              {task.title}
            </h1>

            {task.description && (
              <p className="mt-2 max-w-lg text-xs leading-relaxed text-zinc-400 sm:text-sm">
                {task.description}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <Avatar name={task.assignee} color={memberColor(task.assignee)} />
              {task.assignee}
            </div>

            <div className="relative mt-8 flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full -rotate-90"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="none"
                  stroke="url(#focus-gradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                  className="transition-[stroke-dashoffset] duration-500 ease-linear"
                />
                <defs>
                  <linearGradient id="focus-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>

              <div>
                <p className="text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
                  {timeLabel}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  {secondsLeft === 0
                    ? "Waktu habis"
                    : running
                      ? "Berjalan"
                      : "Siap"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={toggleTimer}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-indigo-950/40 transition hover:bg-zinc-200 active:scale-[0.99]"
              >
                {running ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {running ? "Jeda" : secondsLeft === 0 ? "Mulai lagi" : "Mulai"}
              </button>

              <button
                type="button"
                onClick={handleComplete}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400 active:scale-[0.99]"
              >
                <Check className="h-4 w-4" />
                Tandai selesai
              </button>

              <button
                type="button"
                onClick={resetTimer}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/5"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/5"
              >
                <SkipForward className="h-4 w-4" />
                Lewati
              </button>
            </div>

            <p className="mt-6 text-[11px] text-zinc-500">
              Tugas {Math.min(index, tasks.length - 1) + 1} dari {tasks.length} ·
              diurutkan dari skor prioritas
              {sessions > 0 ? ` · ${sessions} sesi selesai` : ""}
            </p>
          </>
        ) : (
          <div className="max-w-md">
            <p className="text-4xl">🎉</p>
            <h1 className="mt-4 text-2xl font-bold">Semua tugas aktif beres</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Tidak ada yang perlu difokuskan sekarang. Tambah tugas baru dari
              papan, atau beristirahat dulu.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              Kembali ke papan
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

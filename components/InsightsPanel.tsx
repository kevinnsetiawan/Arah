"use client";

import { ArrowUpRight, Copy, Scale, Sparkles, Users } from "lucide-react";
import type { LoadLevel, MemberLoad, ScoredTask } from "@/lib/insights";
import { PRIORITIES } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

interface InsightsPanelProps {
  focus: ScoredTask[];
  workload: MemberLoad[];
  onOpenTask: (task: ScoredTask["task"]) => void;
  onOpenStandup: () => void;
  onOpenRebalance: () => void;
}

const LEVEL_STYLES: Record<
  LoadLevel,
  { label: string; badge: string; bar: string }
> = {
  ringan: {
    label: "Ringan",
    badge:
      "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    bar: "bg-sky-400",
  },
  seimbang: {
    label: "Seimbang",
    badge:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  padat: {
    label: "Padat",
    badge:
      "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    bar: "bg-rose-500",
  },
};

function scoreTone(score: number): string {
  if (score >= 75) {
    return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400";
  }
  if (score >= 55) {
    return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
  }
  return "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
}

export function InsightsPanel({
  focus,
  workload,
  onOpenTask,
  onOpenStandup,
  onOpenRebalance,
}: InsightsPanelProps) {
  const overloaded = workload.filter((load) => load.level === "padat").length;

  return (
    <div className="mb-5 grid gap-3 xl:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold leading-tight">Fokus Hari Ini</h2>
              <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                Diurutkan otomatis dari tenggat, prioritas & status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenStandup}
            className="btn-ghost shrink-0 py-1.5 text-xs"
            title="Buat teks ringkasan harian"
          >
            <Copy className="h-3.5 w-3.5" />
            Standup
          </button>
        </header>

        <ul className="mt-3 space-y-1">
          {focus.map(({ task, score, reasons }) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onOpenTask(task)}
                className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums",
                    scoreTone(score),
                  )}
                  title="Skor prioritas otomatis (0–100)"
                >
                  {score}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
                    {task.title}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="truncate">{task.assignee}</span>
                    <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    {reasons.slice(0, 2).map((reason) => (
                      <span
                        key={reason}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {reason}
                      </span>
                    ))}
                    <span className="sr-only">{PRIORITIES[task.priority].label}</span>
                  </span>
                </span>

                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition group-hover:text-indigo-500 dark:text-zinc-600" />
              </button>
            </li>
          ))}

          {focus.length === 0 && (
            <li className="rounded-xl border border-dashed border-zinc-300 px-3 py-5 text-center text-xs text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
              Tidak ada tugas aktif. Semua sudah beres 🎉
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Users className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold leading-tight">Beban Tim</h2>
              <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                Tugas aktif (belum selesai) per anggota
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {overloaded > 0 && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                {overloaded} padat
              </span>
            )}
            <button
              type="button"
              onClick={onOpenRebalance}
              title="Lihat saran pemerataan beban"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500/60 dark:hover:text-indigo-400"
            >
              <Scale className="h-3 w-3" />
              <span className="hidden sm:inline">Seimbangkan</span>
            </button>
          </div>
        </header>

        <ul className="mt-3 space-y-2">
          {workload.map((load) => {
            const styles = LEVEL_STYLES[load.level];
            return (
              <li key={load.member.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Avatar name={load.member.name} color={load.member.color} />
                    <span className="truncate text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      {load.member.name}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5">
                    {load.urgent > 0 && (
                      <span className="text-[10px] font-semibold text-red-500 dark:text-red-400">
                        {load.urgent} urgent
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        styles.badge,
                      )}
                    >
                      {styles.label}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        styles.bar,
                      )}
                      style={{ width: `${load.percent}%` }}
                    />
                  </div>
                  <span className="w-4 text-right text-[11px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                    {load.active}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

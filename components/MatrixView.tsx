"use client";

import { useMemo } from "react";
import {
  Archive,
  CalendarClock,
  Flame,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { COLUMN_IDS, PRIORITIES } from "@/lib/data";
import { scoreTask } from "@/lib/insights";
import type { Board, Task } from "@/lib/types";
import { cn, daysUntil, formatDate } from "@/lib/utils";

interface MatrixViewProps {
  board: Board;
  onOpenTask: (task: Task) => void;
}

interface Quadrant {
  id: "now" | "plan" | "delegate" | "later";
  title: string;
  subtitle: string;
  icon: LucideIcon;
  wrapper: string;
  badge: string;
  score: string;
}

const QUADRANTS: Quadrant[] = [
  {
    id: "now",
    title: "Kerjakan Sekarang",
    subtitle: "Penting & mendesak",
    icon: Flame,
    wrapper:
      "border-rose-200/80 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/5",
    badge:
      "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    score: "text-rose-500 dark:text-rose-400",
  },
  {
    id: "plan",
    title: "Jadwalkan",
    subtitle: "Penting, belum mendesak",
    icon: CalendarClock,
    wrapper:
      "border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-500/20 dark:bg-indigo-500/5",
    badge:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    score: "text-indigo-500 dark:text-indigo-400",
  },
  {
    id: "delegate",
    title: "Delegasikan",
    subtitle: "Mendesak, kurang penting",
    icon: UserCheck,
    wrapper:
      "border-amber-200/80 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/5",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    score: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "later",
    title: "Nanti Saja",
    subtitle: "Tidak penting & tidak mendesak",
    icon: Archive,
    wrapper:
      "border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-700/60 dark:bg-zinc-800/20",
    badge:
      "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-700/60 dark:text-zinc-300",
    score: "text-zinc-400 dark:text-zinc-500",
  },
];

interface Entry {
  task: Task;
  score: number;
}

export function MatrixView({ board, onOpenTask }: MatrixViewProps) {
  const buckets = useMemo(() => {
    const result: Record<Quadrant["id"], Entry[]> = {
      now: [],
      plan: [],
      delegate: [],
      later: [],
    };

    for (const columnId of COLUMN_IDS) {
      if (columnId === "done") continue;

      for (const task of board[columnId]) {
        const important = task.priority === "urgent" || task.priority === "high";
        const urgent = Boolean(task.dueDate) && daysUntil(task.dueDate) <= 2;

        const id: Quadrant["id"] =
          important && urgent
            ? "now"
            : important
              ? "plan"
              : urgent
                ? "delegate"
                : "later";

        result[id].push({ task, score: scoreTask(task, columnId).score });
      }
    }

    for (const id of Object.keys(result) as Quadrant["id"][]) {
      result[id].sort((a, b) => b.score - a.score);
    }

    return result;
  }, [board]);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <h2 className="text-sm font-semibold">Matriks Prioritas</h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Penting (prioritas tinggi/urgent) × Mendesak (tenggat ≤ 2 hari)
          </p>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          Klik kartu untuk mengubah prioritas atau tenggat
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {QUADRANTS.map((quadrant) => {
          const Icon = quadrant.icon;
          const entries = buckets[quadrant.id];

          return (
            <div
              key={quadrant.id}
              className={cn(
                "flex min-h-[190px] flex-col rounded-xl border p-3",
                quadrant.wrapper,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", quadrant.badge)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[12px] font-semibold leading-tight">
                      {quadrant.title}
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {quadrant.subtitle}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                    quadrant.badge,
                  )}
                >
                  {entries.length}
                </span>
              </div>

              <ul className="mt-2.5 space-y-1.5">
                {entries.map(({ task, score }) => {
                  const overdue =
                    Boolean(task.dueDate) && daysUntil(task.dueDate) < 0;

                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => onOpenTask(task)}
                        className="flex w-full items-center gap-2 rounded-lg border border-zinc-200/70 bg-white px-2 py-1.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow dark:border-zinc-700/80 dark:bg-zinc-800 dark:hover:border-indigo-500/50"
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            PRIORITIES[task.priority].dot,
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                            {task.title}
                          </span>
                          <span
                            className={cn(
                              "block truncate text-[10px]",
                              overdue
                                ? "text-rose-500 dark:text-rose-400"
                                : "text-zinc-400 dark:text-zinc-500",
                            )}
                          >
                            {task.assignee}
                            {task.dueDate
                              ? overdue
                                ? ` · lewat ${Math.abs(daysUntil(task.dueDate))} hari`
                                : ` · ${formatDate(task.dueDate)}`
                              : " · tanpa tenggat"}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-[10px] font-bold tabular-nums",
                            quadrant.score,
                          )}
                          title="Skor prioritas otomatis"
                        >
                          {score}
                        </span>
                      </button>
                    </li>
                  );
                })}

                {entries.length === 0 && (
                  <li className="rounded-lg border border-dashed border-zinc-300/80 px-2.5 py-4 text-center text-[10px] text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                    Tidak ada tugas di kuadran ini
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-3 px-1 text-[10px] text-zinc-400 dark:text-zinc-500">
        Tips: pindahkan tugas “Delegasikan” ke anggota dengan beban Ringan lewat
        panel Beban Tim di tampilan Papan.
      </p>
    </section>
  );
}

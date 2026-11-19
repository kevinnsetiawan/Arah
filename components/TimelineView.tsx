"use client";

import { Fragment, useMemo } from "react";
import { COLUMN_IDS, MEMBERS, PRIORITIES } from "@/lib/data";
import type { Board, Priority, Task } from "@/lib/types";
import { addDaysISO, cn, daysUntil, todayISO } from "@/lib/utils";
import { Avatar } from "./Avatar";

const DAY_COUNT = 14;

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
});
const DAY_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const PRIORITY_BORDER: Record<Priority, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-amber-400",
  low: "border-l-zinc-300 dark:border-l-zinc-600",
};

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const byPriority =
      PRIORITIES[a.priority].order - PRIORITIES[b.priority].order;
    return byPriority !== 0 ? byPriority : a.title.localeCompare(b.title);
  });
}

interface TimelineViewProps {
  board: Board;
  onOpenTask: (task: Task) => void;
  onAddTask: (member: string, iso: string) => void;
}

export function TimelineView({ board, onOpenTask, onAddTask }: TimelineViewProps) {
  const today = todayISO();
  const days = useMemo(
    () => Array.from({ length: DAY_COUNT }, (_, index) => addDaysISO(today, index)),
    [today],
  );

  const activeTasks = useMemo(
    () => COLUMN_IDS.filter((id) => id !== "done").flatMap((id) => board[id]),
    [board],
  );

  const rows = useMemo(
    () =>
      MEMBERS.map((member) => {
        const tasks = activeTasks.filter((task) => task.assignee === member.name);
        return {
          member,
          overdue: sortTasks(
            tasks.filter((task) => task.dueDate && daysUntil(task.dueDate) < 0),
          ),
          byDay: days.map((day) =>
            sortTasks(tasks.filter((task) => task.dueDate === day)),
          ),
          noDue: sortTasks(tasks.filter((task) => !task.dueDate)),
        };
      }),
    [activeTasks, days],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">Timeline 14 Hari</h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Jadwal per anggota · klik sel kosong untuk menambah tugas pada tanggal itu
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Terlambat
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Hari ini
          </span>
        </div>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[1080px]">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `10rem 7.5rem repeat(${days.length}, minmax(5.5rem, 1fr)) 9rem`,
            }}
          >
            <div className="sticky left-0 z-10 flex items-end border-b border-r border-zinc-200/70 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
              Anggota
            </div>
            <div className="flex items-end border-b border-r border-zinc-200/70 bg-rose-50/50 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-rose-500 dark:border-zinc-800 dark:bg-rose-500/5">
              Terlambat
            </div>

            {days.map((day) => {
              const date = new Date(`${day}T00:00:00`);
              const isToday = day === today;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={day}
                  className={cn(
                    "border-b border-r border-zinc-200/70 px-1 py-2 text-center dark:border-zinc-800",
                    isToday && "bg-indigo-50/70 dark:bg-indigo-500/10",
                    isWeekend && !isToday && "bg-zinc-50/80 dark:bg-zinc-800/20",
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-wide",
                      isToday ? "text-indigo-500" : "text-zinc-400",
                    )}
                  >
                    {WEEKDAY_FORMATTER.format(date)}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-[11px] font-semibold",
                      isToday
                        ? "text-indigo-600 dark:text-indigo-300"
                        : "text-zinc-600 dark:text-zinc-300",
                    )}
                  >
                    {DAY_FORMATTER.format(date)}
                  </p>
                </div>
              );
            })}

            <div className="flex items-end border-b border-zinc-200/70 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
              Tanpa tenggat
            </div>

            {rows.map((row) => (
              <Fragment key={row.member.id}>
                <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-zinc-200/70 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <Avatar name={row.member.name} color={row.member.color} />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold">
                      {row.member.name}
                    </p>
                    <p className="truncate text-[10px] text-zinc-400">
                      {row.member.role}
                    </p>
                  </div>
                </div>

                <div className="min-h-[58px] border-b border-r border-zinc-200/70 bg-rose-50/40 p-1 dark:border-zinc-800 dark:bg-rose-500/5">
                  <Chips tasks={row.overdue} onOpen={onOpenTask} danger />
                </div>

                {days.map((day, index) => {
                  const date = new Date(`${day}T00:00:00`);
                  const isToday = day === today;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <div
                      key={`${row.member.id}-${day}`}
                      onClick={() => onAddTask(row.member.name, day)}
                      title={`Tambah tugas untuk ${row.member.name} pada ${DAY_FORMATTER.format(date)}`}
                      className={cn(
                        "min-h-[58px] cursor-copy border-b border-r border-zinc-200/70 p-1 transition hover:bg-indigo-50/60 dark:border-zinc-800 dark:hover:bg-indigo-500/10",
                        isToday && "bg-indigo-50/40 dark:bg-indigo-500/5",
                        isWeekend && !isToday && "bg-zinc-50/60 dark:bg-zinc-800/10",
                      )}
                    >
                      <Chips tasks={row.byDay[index]} onOpen={onOpenTask} />
                    </div>
                  );
                })}

                <div className="min-h-[58px] border-b border-zinc-200/70 p-1 dark:border-zinc-800">
                  <Chips tasks={row.noDue} onOpen={onOpenTask} />
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <p className="px-4 py-2.5 text-[10px] text-zinc-400 dark:text-zinc-500">
        Hanya tugas aktif yang ditampilkan. Klik kartu untuk mengubah detailnya.
      </p>
    </section>
  );
}

function Chips({
  tasks,
  onOpen,
  danger,
}: {
  tasks: Task[];
  onOpen: (task: Task) => void;
  danger?: boolean;
}) {
  if (tasks.length === 0) return null;

  const visible = tasks.slice(0, 2);
  const rest = tasks.length - visible.length;

  return (
    <div className="space-y-1">
      {visible.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(task);
          }}
          title={`${task.title} — ${task.assignee}`}
          className={cn(
            "block w-full truncate rounded-md border-l-2 bg-white px-1.5 py-1 text-left text-[10px] font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200/70 transition hover:ring-indigo-300 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:ring-indigo-500/50",
            danger ? "border-l-rose-500" : PRIORITY_BORDER[task.priority],
          )}
        >
          {task.title}
        </button>
      ))}

      {rest > 0 && (
        <p className="px-1 text-[9px] font-semibold text-zinc-400">+{rest} lagi</p>
      )}
    </div>
  );
}

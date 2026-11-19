"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Trash2 } from "lucide-react";
import { memberColor, PRIORITIES } from "@/lib/data";
import type { Task } from "@/lib/types";
import { cn, formatDate, isDueToday, isOverdue } from "@/lib/utils";
import { Avatar } from "./Avatar";

interface TaskCardProps {
  task: Task;
  overlay?: boolean;
  done?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function TaskCard({ task, overlay, done, onEdit, onDelete }: TaskCardProps) {
  const priority = PRIORITIES[task.priority];
  const overdue = !done && isOverdue(task.dueDate);
  const dueToday = !done && isDueToday(task.dueDate);

  return (
    <article
      onClick={overlay ? undefined : () => onEdit?.(task)}
      className={cn(
        "relative rounded-xl border border-zinc-200/90 bg-white p-3 shadow-sm transition",
        !overlay &&
          "cursor-grab hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md active:cursor-grabbing dark:hover:border-zinc-700",
        "dark:border-zinc-800 dark:bg-zinc-900",
        overlay &&
          "rotate-2 scale-[1.02] cursor-grabbing shadow-xl shadow-zinc-950/20 ring-2 ring-indigo-500/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
              priority.badge,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
            {priority.label}
          </span>
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {!overlay && (
          <button
            type="button"
            aria-label={`Hapus tugas ${task.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.(task);
            }}
            className="rounded-md p-1 text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover/card:opacity-100 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <h3 className="mt-2 text-[13px] font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
        {task.title}
      </h3>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar name={task.assignee} color={memberColor(task.assignee)} />
          <span className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {task.assignee}
          </span>
        </span>

        {task.dueDate && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              overdue
                ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                : dueToday
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "text-zinc-400 dark:text-zinc-500",
            )}
          >
            <CalendarDays className="h-3 w-3" />
            {overdue ? "Lewat " : ""}
            {dueToday ? "Hari ini" : formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </article>
  );
}

export function SortableTaskCard({
  task,
  done,
  onEdit,
  onDelete,
}: Omit<TaskCardProps, "overlay">) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("touch-none select-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <div className="group/card">
        <TaskCard task={task} done={done} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

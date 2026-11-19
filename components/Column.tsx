"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { ColumnId, ColumnMeta, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SortableTaskCard } from "./TaskCard";

interface ColumnProps {
  column: ColumnMeta;
  tasks: Task[];
  totalCount: number;
  dragging: boolean;
  filterActive: boolean;
  onAdd: (columnId: ColumnId) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function Column({
  column,
  tasks,
  totalCount,
  dragging,
  filterActive,
  onAdd,
  onEdit,
  onDelete,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section className="group flex min-w-0 flex-col rounded-2xl border border-zinc-200/80 bg-zinc-100/60 p-2.5 transition-colors dark:border-zinc-800/80 dark:bg-zinc-900/40">
      <header className="flex items-center justify-between gap-2 px-1.5 py-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", column.dot)} />
          <h2 className="truncate text-sm font-semibold">{column.title}</h2>
          <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
            {totalCount}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAdd(column.id)}
          aria-label={`Tambah tugas di ${column.title}`}
          title={column.hint}
          className="rounded-lg p-1 text-zinc-400 transition hover:bg-white hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "mt-1 flex min-h-[140px] flex-col gap-2 overflow-y-auto rounded-xl p-0.5 transition-colors xl:max-h-[calc(100vh-340px)]",
          isOver &&
            "bg-indigo-500/5 ring-2 ring-inset ring-indigo-400/50 dark:bg-indigo-500/10",
        )}
      >
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              done={column.id === "done"}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 px-3 py-8 text-center text-[11px] font-medium text-zinc-400 dark:border-zinc-700 dark:text-zinc-500",
              isOver && "border-indigo-400 text-indigo-500 dark:border-indigo-500",
            )}
          >
            {dragging
              ? "Lepas kartu di sini"
              : filterActive && totalCount > 0
                ? "Tidak ada yang cocok dengan filter"
                : "Belum ada tugas — klik + untuk menambah"}
          </div>
        )}
      </div>
    </section>
  );
}

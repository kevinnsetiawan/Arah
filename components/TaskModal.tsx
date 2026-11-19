"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { COLUMNS, MEMBERS, PRIORITIES } from "@/lib/data";
import type { ColumnId, Priority, Task } from "@/lib/types";
import { daysFromNow } from "@/lib/utils";

export interface TaskDraft {
  title: string;
  description: string;
  assignee: string;
  priority: Priority;
  dueDate: string;
  tags: string[];
  columnId: ColumnId;
}

interface TaskModalProps {
  task: Task | null;
  defaultColumn: ColumnId;
  defaultAssignee?: string;
  defaultDueDate?: string;
  onSubmit: (draft: TaskDraft) => void;
  onDelete: (task: Task) => void;
  onClose: () => void;
}

export function TaskModal({
  task,
  defaultColumn,
  defaultAssignee,
  defaultDueDate,
  onSubmit,
  onDelete,
  onClose,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assignee, setAssignee] = useState(
    task?.assignee ?? defaultAssignee ?? MEMBERS[0].name,
  );
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ?? defaultDueDate ?? daysFromNow(3),
  );
  const [tags, setTags] = useState(task?.tags.join(", ") ?? "");
  const [columnId, setColumnId] = useState<ColumnId>(defaultColumn);
  const [error, setError] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError("Judul tugas wajib diisi.");
      titleRef.current?.focus();
      return;
    }

    onSubmit({
      title: cleanTitle,
      description: description.trim(),
      assignee,
      priority,
      dueDate,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 4),
      columnId,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-zinc-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="max-h-[92vh] w-full animate-slide-up overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="task-modal-title" className="text-base font-semibold">
              {task ? "Ubah tugas" : "Tugas baru"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {task
                ? "Perbarui detail atau pindahkan ke kolom lain."
                : "Isi detail singkat agar mudah dikerjakan."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="task-title" className="label">
              Judul
            </label>
            <input
              id="task-title"
              ref={titleRef}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (error) setError("");
              }}
              placeholder="Contoh: Perbaikan form pengajuan cuti"
              className="field"
              aria-invalid={Boolean(error)}
            />
            {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
          </div>

          <div>
            <label htmlFor="task-description" className="label">
              Deskripsi
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Konteks, langkah, atau hasil yang diharapkan…"
              rows={3}
              className="field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-assignee" className="label">
                Penanggung jawab
              </label>
              <select
                id="task-assignee"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                className="field"
              >
                {MEMBERS.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-priority" className="label">
                Prioritas
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
                className="field"
              >
                {(Object.keys(PRIORITIES) as Priority[]).map((value) => (
                  <option key={value} value={value}>
                    {PRIORITIES[value].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-due" className="label">
                Tenggat
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="field dark:[color-scheme:dark]"
              />
            </div>

            <div>
              <label htmlFor="task-column" className="label">
                Kolom
              </label>
              <select
                id="task-column"
                value={columnId}
                onChange={(event) => setColumnId(event.target.value as ColumnId)}
                className="field"
              >
                {COLUMNS.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-tags" className="label">
              Label
            </label>
            <input
              id="task-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Bug, Backend, UI/UX"
              className="field"
            />
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Pisahkan dengan koma, maksimal 4 label.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {task ? (
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                Batal
              </button>
              <button type="submit" className="btn-primary">
                {task ? "Simpan perubahan" : "Tambah tugas"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

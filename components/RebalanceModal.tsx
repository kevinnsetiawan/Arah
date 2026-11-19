"use client";

import { useEffect } from "react";
import { ArrowRight, Scale, X } from "lucide-react";
import { memberColor, PRIORITIES } from "@/lib/data";
import type { RebalanceMove } from "@/lib/insights";
import { cn, formatDate } from "@/lib/utils";
import { Avatar } from "./Avatar";

interface RebalanceModalProps {
  moves: RebalanceMove[];
  onApply: () => void;
  onClose: () => void;
}

export function RebalanceModal({ moves, onApply, onClose }: RebalanceModalProps) {
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
        aria-labelledby="rebalance-title"
        className="max-h-[92vh] w-full animate-slide-up overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
              <Scale className="h-4 w-4" />
            </span>
            <div>
              <h2 id="rebalance-title" className="text-base font-semibold">
                Saran Pemerataan Beban
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Dipilih dari anggota terpadat, prioritas rendah lebih dulu.
              </p>
            </div>
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

        {moves.length > 0 ? (
          <>
            <ul className="space-y-2">
              {moves.map((move) => (
                <li
                  key={move.taskId}
                  className="rounded-xl border border-zinc-200/80 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                        PRIORITIES[move.priority].badge,
                      )}
                    >
                      {PRIORITIES[move.priority].label}
                    </span>
                    {move.dueDate && (
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        Tenggat {formatDate(move.dueDate)}
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 truncate text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
                    {move.title}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <Avatar name={move.from} color={memberColor(move.from)} />
                    <span className="truncate">{move.from}</span>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <Avatar name={move.to} color={memberColor(move.to)} />
                    <span className="truncate font-semibold text-emerald-600 dark:text-emerald-400">
                      {move.to}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
              Tugas yang dipindah tetap mempertahankan tenggat, label, dan isi
              deskripsinya.
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-3 py-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/5">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Beban tim sudah seimbang 🎉
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Tidak ada tugas yang perlu dipindahkan saat ini.
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            {moves.length > 0 ? "Batal" : "Tutup"}
          </button>
          {moves.length > 0 && (
            <button type="button" onClick={onApply} className="btn-primary">
              <Scale className="h-4 w-4" />
              Terapkan {moves.length} pemindahan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

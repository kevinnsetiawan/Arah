"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  keywords?: string;
  hint?: string;
  icon?: ReactNode;
  run: () => void;
}

interface CommandPaletteProps {
  items: PaletteItem[];
  onClose: () => void;
}

export function CommandPalette({ items, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items.slice(0, 12);

    return items
      .filter((item) =>
        `${item.label} ${item.description ?? ""} ${item.keywords ?? ""}`
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 12);
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function execute(item: PaletteItem) {
    item.run();
    onClose();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (filtered.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filtered[activeIndex];
      if (item) execute(item);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-start justify-center bg-zinc-950/40 p-4 pt-[10vh] backdrop-blur-sm sm:pt-[14vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pencarian cepat"
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl animate-slide-up overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-2 border-b border-zinc-200/80 px-3.5 dark:border-zinc-800">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari tugas atau perintah…"
            aria-label="Cari tugas atau perintah"
            className="h-12 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <kbd className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            Esc
          </kbd>
        </div>

        <ul className="max-h-[52vh] overflow-y-auto p-1.5">
          {filtered.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => execute(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                  index === activeIndex
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    index === activeIndex
                      ? "bg-white text-indigo-500 shadow-sm dark:bg-zinc-900"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                  )}
                >
                  {item.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </span>
                  )}
                </span>

                {item.hint && (
                  <span className="shrink-0 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    {item.hint}
                  </span>
                )}
              </button>
            </li>
          ))}

          {filtered.length === 0 && (
            <li className="px-3 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Tidak ada hasil untuk “{query}”.
            </li>
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-zinc-200/80 px-3.5 py-2 text-[10px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          <span>↑↓ pilih · ↵ jalankan</span>
          <span>Ctrl K buka/tutup</span>
        </div>
      </div>
    </div>
  );
}

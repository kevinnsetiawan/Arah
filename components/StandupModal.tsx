"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";

interface StandupModalProps {
  text: string;
  onClose: () => void;
}

export function StandupModal({ text, onClose }: StandupModalProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }

    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
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
        aria-labelledby="standup-title"
        className="w-full animate-slide-up rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="standup-title" className="text-base font-semibold">
              Ringkasan Standup
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Dibuat otomatis dari papan — siap tempel ke WhatsApp atau Teams.
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

        <pre className="max-h-[45vh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 font-sans text-[12px] leading-relaxed text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-950/60 dark:text-zinc-300 dark:ring-zinc-800">
          {text}
        </pre>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="hidden text-[11px] text-zinc-400 dark:text-zinc-500 sm:block">
            Bisa diedit dulu setelah disalin.
          </p>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Tutup
            </button>
            <button type="button" onClick={handleCopy} className="btn-primary">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Salin teks
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaStatus() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    function handlePrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }

    function updateOnline() {
      setOffline(!navigator.onLine);
    }

    updateOnline();
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  async function handleInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setPromptEvent(null);
    }
  }

  const showInstall = Boolean(promptEvent) && !dismissed && !installed;

  if (!showInstall && !offline) return null;

  return (
    <>
      {showInstall && (
        <div className="fixed bottom-4 left-4 z-40 w-[19rem] animate-slide-up rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
              <Download className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">Pasang Papan Proyek</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Dibuka seperti aplikasi, tetap jalan saat internet mati.
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="btn-primary px-2.5 py-1 text-[11px]"
                >
                  Pasang
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="btn-ghost px-2.5 py-1 text-[11px]"
                >
                  Nanti
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Tutup"
              className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {offline && (
        <div className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg dark:bg-white dark:text-zinc-900">
          <WifiOff className="h-3 w-3" />
          Mode offline — data tersimpan lokal
        </div>
      )}
    </>
  );
}

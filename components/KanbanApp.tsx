"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Columns3,
  Copy,
  LayoutGrid,
  Moon,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Sun,
  Target,
  Timer,
  X,
} from "lucide-react";
import {
  COLUMNS,
  COLUMN_IDS,
  MEMBERS,
  PRIORITIES,
  createInitialBoard,
  isBoard,
} from "@/lib/data";
import {
  buildStandup,
  getFocusTasks,
  getWorkload,
  suggestRebalance,
  type RebalanceMove,
} from "@/lib/insights";
import type { Board, ColumnId, Priority, Task } from "@/lib/types";
import { cn, isOverdue, uid } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Column } from "./Column";
import { CommandPalette, type PaletteItem } from "./CommandPalette";
import { FocusMode } from "./FocusMode";
import { InsightsPanel } from "./InsightsPanel";
import { MatrixView } from "./MatrixView";
import { RebalanceModal } from "./RebalanceModal";
import { StandupModal } from "./StandupModal";
import { TaskCard } from "./TaskCard";
import { TaskModal, type TaskDraft } from "./TaskModal";
import { TimelineView } from "./TimelineView";

const STORAGE_KEY = "sf-papan-proyek-board-v2";
const THEME_KEY = "sf-papan-proyek-theme";
const VIEW_KEY = "sf-papan-proyek-view";

const VIEWS = [
  { id: "board", label: "Papan", Icon: Columns3 },
  { id: "timeline", label: "Timeline", Icon: CalendarRange },
  { id: "matrix", label: "Matriks", Icon: LayoutGrid },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

function isViewId(value: string): value is ViewId {
  return VIEWS.some((view) => view.id === value);
}

function findColumnId(board: Board, taskId: string): ColumnId | null {
  for (const id of COLUMN_IDS) {
    if (board[id].some((task) => task.id === taskId)) return id;
  }
  return null;
}

export function KanbanApp() {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [mounted, setMounted] = useState(false);

  const [query, setQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");

  const [activeId, setActiveId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [view, setView] = useState<ViewId>("board");
  const [standupOpen, setStandupOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [rebalanceMoves, setRebalanceMoves] = useState<RebalanceMove[] | null>(
    null,
  );
  const [modal, setModal] = useState<{
    task: Task | null;
    columnId: ColumnId;
    assignee?: string;
    dueDate?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isBoard(parsed)) setBoard(parsed);
      }

      const savedView = localStorage.getItem(VIEW_KEY);
      if (savedView && isViewId(savedView)) setView(savedView);
    } catch {
      // data rusak / localStorage diblokir — pakai data contoh
    }

    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    } catch {
      // penyimpanan penuh / diblokir — abaikan
    }
  }, [board, mounted]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!modal && !focusOpen) setPaletteOpen((open) => !open);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [modal, focusOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const allTasks = useMemo(
    () => COLUMN_IDS.flatMap((id) => board[id]),
    [board],
  );

  const activeTask = useMemo(
    () => (activeId ? (allTasks.find((task) => task.id === activeId) ?? null) : null),
    [activeId, allTasks],
  );

  const stats = useMemo(() => {
    const doneIds = new Set(board.done.map((task) => task.id));
    const total = allTasks.length;
    const done = board.done.length;
    const progress = board.progress.length;
    const overdue = allTasks.filter(
      (task) => !doneIds.has(task.id) && isOverdue(task.dueDate),
    ).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    return { total, done, progress, overdue, percent };
  }, [allTasks, board]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = {} as Record<ColumnId, Task[]>;

    for (const id of COLUMN_IDS) {
      result[id] = board[id].filter((task) => {
        if (assigneeFilter !== "all" && task.assignee !== assigneeFilter) {
          return false;
        }
        if (priorityFilter !== "all" && task.priority !== priorityFilter) {
          return false;
        }
        if (!needle) return true;
        const haystack = `${task.title} ${task.description} ${task.assignee} ${task.tags.join(" ")}`;
        return haystack.toLowerCase().includes(needle);
      });
    }

    return result;
  }, [board, query, assigneeFilter, priorityFilter]);

  const filterActive =
    query.trim() !== "" || assigneeFilter !== "all" || priorityFilter !== "all";

  const focusTasks = useMemo(() => getFocusTasks(board), [board]);
  const focusQueue = useMemo(() => getFocusTasks(board, 100), [board]);
  const workload = useMemo(() => getWorkload(board), [board]);
  const standupText = useMemo(() => buildStandup(board), [board]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);

    setBoard((previous) => {
      const from = findColumnId(previous, draggedId);
      const to = COLUMN_IDS.includes(overId as ColumnId)
        ? (overId as ColumnId)
        : findColumnId(previous, overId);

      if (!from || !to || from === to) return previous;

      const draggedTask = previous[from].find((task) => task.id === draggedId);
      if (!draggedTask) return previous;

      const target = previous[to];
      const overIndex = target.findIndex((task) => task.id === overId);
      const nextTarget = [...target];
      nextTarget.splice(
        overIndex >= 0 ? overIndex : nextTarget.length,
        0,
        draggedTask,
      );

      return {
        ...previous,
        [from]: previous[from].filter((task) => task.id !== draggedId),
        [to]: nextTarget,
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (draggedId === overId) return;

    setBoard((previous) => {
      const from = findColumnId(previous, draggedId);
      const to = COLUMN_IDS.includes(overId as ColumnId)
        ? (overId as ColumnId)
        : findColumnId(previous, overId);

      if (!from || !to || from !== to) return previous;

      const oldIndex = previous[from].findIndex((task) => task.id === draggedId);
      const newIndex = previous[from].findIndex((task) => task.id === overId);
      if (oldIndex < 0 || newIndex < 0) return previous;

      return { ...previous, [from]: arrayMove(previous[from], oldIndex, newIndex) };
    });
  }

  const closeModal = useCallback(() => setModal(null), []);

  function openNew(
    columnId: ColumnId = "todo",
    options: { assignee?: string; dueDate?: string } = {},
  ) {
    setModal({ task: null, columnId, ...options });
  }

  function handleComplete(task: Task) {
    setBoard((previous) => {
      const from = findColumnId(previous, task.id);
      if (!from || from === "done") return previous;

      const existing = previous[from].find((item) => item.id === task.id);
      if (!existing) return previous;

      return {
        ...previous,
        [from]: previous[from].filter((item) => item.id !== task.id),
        done: [existing, ...previous.done],
      };
    });
  }

  function openRebalance() {
    setRebalanceMoves(suggestRebalance(board));
  }

  function applyRebalance() {
    if (!rebalanceMoves || rebalanceMoves.length === 0) return;

    const target = new Map(rebalanceMoves.map((move) => [move.taskId, move.to]));

    setBoard((previous) => {
      const next = {} as Board;
      for (const id of COLUMN_IDS) {
        next[id] = previous[id].map((task) => {
          const assignee = target.get(task.id);
          return assignee ? { ...task, assignee } : task;
        });
      }
      return next;
    });

    setRebalanceMoves(null);
  }

  function openEdit(task: Task) {
    const columnId = findColumnId(board, task.id) ?? "todo";
    setModal({ task, columnId });
  }

  function handleDelete(task: Task) {
    const confirmed = window.confirm(`Hapus tugas "${task.title}"?`);
    if (!confirmed) return;

    setBoard((previous) => {
      const columnId = findColumnId(previous, task.id);
      if (!columnId) return previous;
      return {
        ...previous,
        [columnId]: previous[columnId].filter((item) => item.id !== task.id),
      };
    });
    setModal(null);
  }

  function handleSubmit(draft: TaskDraft) {
    const { columnId, ...fields } = draft;

    if (modal?.task) {
      const editingId = modal.task.id;
      setBoard((previous) => {
        const from = findColumnId(previous, editingId);
        if (!from) return previous;

        const existing = previous[from].find((task) => task.id === editingId);
        if (!existing) return previous;

        const updated: Task = { ...existing, ...fields };

        if (from === columnId) {
          return {
            ...previous,
            [from]: previous[from].map((task) =>
              task.id === editingId ? updated : task,
            ),
          };
        }

        return {
          ...previous,
          [from]: previous[from].filter((task) => task.id !== editingId),
          [columnId]: [updated, ...previous[columnId]],
        };
      });
    } else {
      const created: Task = { id: uid(), createdAt: Date.now(), ...fields };
      setBoard((previous) => ({
        ...previous,
        [columnId]: [created, ...previous[columnId]],
      }));
    }

    closeModal();
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Kembalikan papan ke data contoh? Semua perubahan akan hilang.",
    );
    if (confirmed) setBoard(createInitialBoard());
  }

  function clearFilters() {
    setQuery("");
    setAssigneeFilter("all");
    setPriorityFilter("all");
  }

  function changeView(next: ViewId) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // abaikan
    }
  }

  function toggleTheme() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    setTheme(next ? "dark" : "light");
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // abaikan
    }
  }

  const closeStandup = useCallback(() => setStandupOpen(false), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const closeFocus = useCallback(() => setFocusOpen(false), []);
  const closeRebalance = useCallback(() => setRebalanceMoves(null), []);

  const paletteItems: PaletteItem[] = [
    {
      id: "action-new",
      label: "Tambah tugas baru",
      description: "Buat kartu di kolom Akan Dikerjakan",
      hint: "Aksi",
      icon: <Plus className="h-3.5 w-3.5" />,
      run: () => openNew("todo"),
    },
    {
      id: "action-standup",
      label: "Buka ringkasan standup",
      description: "Teks siap salin ke WhatsApp / Teams",
      hint: "Aksi",
      icon: <Copy className="h-3.5 w-3.5" />,
      run: () => setStandupOpen(true),
    },
    {
      id: "action-focus",
      label: "Mulai mode fokus",
      description: "Pomodoro 25 menit untuk tugas prioritas tertinggi",
      hint: "Aksi",
      icon: <Target className="h-3.5 w-3.5" />,
      run: () => setFocusOpen(true),
    },
    {
      id: "action-rebalance",
      label: "Seimbangkan beban tim",
      description: "Saran pemindahan tugas dari yang padat ke yang ringan",
      hint: "Aksi",
      icon: <Scale className="h-3.5 w-3.5" />,
      run: openRebalance,
    },
    ...VIEWS.map(({ id: viewId, label, Icon }) => ({
      id: `view-${viewId}`,
      label: `Tampilan ${label}`,
      description: viewId === view ? "Sedang aktif" : "Ganti model tampilan",
      hint: "Tampilan",
      icon: <Icon className="h-3.5 w-3.5" />,
      run: () => changeView(viewId),
    })),
    {
      id: "action-theme",
      label: theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap",
      description: "Preferensi tema tersimpan otomatis",
      hint: "Aksi",
      icon:
        theme === "dark" ? (
          <Sun className="h-3.5 w-3.5" />
        ) : (
          <Moon className="h-3.5 w-3.5" />
        ),
      run: toggleTheme,
    },
    {
      id: "action-filter",
      label: "Reset pencarian & filter",
      description: "Tampilkan semua tugas lagi",
      hint: "Aksi",
      icon: <X className="h-3.5 w-3.5" />,
      run: clearFilters,
    },
    ...COLUMN_IDS.flatMap((columnId) => {
      const columnTitle =
        COLUMNS.find((column) => column.id === columnId)?.title ?? columnId;

      return board[columnId].map((task) => ({
        id: `task-${task.id}`,
        label: task.title,
        description: `${columnTitle} · ${task.assignee}`,
        keywords: task.tags.join(" "),
        hint: PRIORITIES[task.priority].label,
        icon: <CircleDot className="h-3.5 w-3.5" />,
        run: () => openEdit(task),
      }));
    }),
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-6">
        <div className="mx-auto max-w-[1600px] animate-pulse space-y-4">
          <div className="h-14 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/60" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/50"
              />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/40"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
              SF
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Papan Proyek</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                SF Group · Internal
              </p>
            </div>
          </div>

          <div className="relative order-3 w-full sm:order-none sm:ml-4 sm:max-w-md sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari tugas, orang, atau label…"
              aria-label="Cari tugas"
              className="field py-1.5 pl-9 pr-9 text-[13px] sm:pr-16"
            />
            {!query && (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500 sm:block">
                Ctrl K
              </kbd>
            )}
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden -space-x-2 sm:flex">
              {MEMBERS.slice(0, 4).map((member) => (
                <Avatar
                  key={member.id}
                  name={member.name}
                  color={member.color}
                  size="md"
                />
              ))}
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-950">
                +{Math.max(MEMBERS.length - 4, 0)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFocusOpen(true)}
              title="Mode fokus — Pomodoro 25 menit"
              className="btn-ghost px-2.5 sm:px-3"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Fokus</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ganti tema terang/gelap"
              title="Ganti tema"
              className="btn-ghost px-2.5"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => openNew("todo")}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Tugas Baru
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Papan Proyek
            </h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
              {stats.total} tugas · {stats.percent}% selesai · geser kartu untuk
              memindahkan status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 inline-flex items-center gap-0.5 rounded-xl border border-zinc-200 bg-white p-0.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {VIEWS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => changeView(id)}
                  aria-pressed={view === id}
                  title={`Tampilan ${label}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                    view === id
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
              aria-label="Filter penanggung jawab"
              className="field w-auto py-1.5 text-xs"
            >
              <option value="all">Semua anggota</option>
              {MEMBERS.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as "all" | Priority)
              }
              aria-label="Filter prioritas"
              className="field w-auto py-1.5 text-xs"
            >
              <option value="all">Semua prioritas</option>
              {(Object.keys(PRIORITIES) as Priority[]).map((value) => (
                <option key={value} value={value}>
                  {PRIORITIES[value].label}
                </option>
              ))}
            </select>

            {filterActive && (
              <button type="button" onClick={clearFilters} className="btn-ghost py-1.5 text-xs">
                <X className="h-3.5 w-3.5" />
                Reset filter
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              title="Kembalikan data contoh"
              aria-label="Kembalikan data contoh"
              className="btn-ghost px-2.5 py-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <section className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              icon={<CircleDashed className="h-4 w-4" />}
              label="Total tugas"
              value={stats.total}
              tone="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
            />
            <Stat
              icon={<Timer className="h-4 w-4" />}
              label="Dikerjakan"
              value={stats.progress}
              tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            />
            <Stat
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Selesai"
              value={stats.done}
              tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            />
            <Stat
              icon={<CalendarClock className="h-4 w-4" />}
              label="Terlambat"
              value={stats.overdue}
              tone="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
              {stats.percent}%
            </span>
          </div>
        </section>

        <InsightsPanel
          focus={focusTasks}
          workload={workload}
          onOpenTask={openEdit}
          onOpenStandup={() => setStandupOpen(true)}
          onOpenRebalance={openRebalance}
        />

        {view === "board" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  tasks={visible[column.id]}
                  totalCount={board[column.id].length}
                  dragging={activeId !== null}
                  filterActive={filterActive}
                  onAdd={openNew}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            <DragOverlay
              dropAnimation={{
                duration: 180,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  overlay
                  done={board.done.some((task) => task.id === activeTask.id)}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {view === "timeline" && (
          <TimelineView
            board={board}
            onOpenTask={openEdit}
            onAddTask={(member, iso) =>
              openNew("todo", { assignee: member, dueDate: iso })
            }
          />
        )}

        {view === "matrix" && <MatrixView board={board} onOpenTask={openEdit} />}

        <p className="mt-6 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          Data tersimpan otomatis di browser (localStorage).{" "}
          {view === "board"
            ? "Tarik kartu antar kolom, atau klik kartu untuk mengubah detail."
            : view === "timeline"
              ? "Klik sel kosong untuk menambah tugas pada tanggal tersebut."
              : "Klik kartu untuk mengubah prioritas atau tenggat."}
        </p>
      </main>

      {modal && (
        <TaskModal
          key={
            modal.task?.id ??
            `new-${modal.columnId}-${modal.assignee ?? ""}-${modal.dueDate ?? ""}`
          }
          task={modal.task}
          defaultColumn={modal.columnId}
          defaultAssignee={modal.assignee}
          defaultDueDate={modal.dueDate}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onClose={closeModal}
        />
      )}

      {focusOpen && (
        <FocusMode
          tasks={focusQueue.map((entry) => entry.task)}
          onComplete={handleComplete}
          onClose={closeFocus}
        />
      )}

      {rebalanceMoves && (
        <RebalanceModal
          moves={rebalanceMoves}
          onApply={applyRebalance}
          onClose={closeRebalance}
        />
      )}

      {standupOpen && (
        <StandupModal text={standupText} onClose={closeStandup} />
      )}

      {paletteOpen && (
        <CommandPalette items={paletteItems} onClose={closePalette} />
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          tone,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p className="text-lg font-bold leading-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

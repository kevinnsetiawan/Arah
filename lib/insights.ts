import { COLUMN_IDS, MEMBERS, PRIORITIES } from "./data";
import type { Board, ColumnId, Member, Priority, Task } from "./types";
import { daysUntil } from "./utils";

const PRIORITY_POINTS: Record<Priority, number> = {
  urgent: 42,
  high: 32,
  medium: 22,
  low: 12,
};

export interface ScoredTask {
  task: Task;
  columnId: ColumnId;
  score: number;
  reasons: string[];
  dueInDays: number;
}

/**
 * Skor prioritas 0–100 yang menggabungkan:
 * prioritas, kedekatan tenggat, status kolom, dan lama menunggu di papan.
 */
export function scoreTask(task: Task, columnId: ColumnId): ScoredTask {
  let score = PRIORITY_POINTS[task.priority];
  const reasons: string[] = [];
  const dueInDays = daysUntil(task.dueDate);

  if (task.dueDate) {
    if (dueInDays < 0) {
      score += 38;
      reasons.push(
        dueInDays === -1 ? "Lewat 1 hari" : `Lewat ${Math.abs(dueInDays)} hari`,
      );
    } else if (dueInDays === 0) {
      score += 32;
      reasons.push("Tenggat hari ini");
    } else if (dueInDays <= 2) {
      score += 24;
      reasons.push(dueInDays === 1 ? "Tenggat besok" : `Tenggat ${dueInDays} hari lagi`);
    } else if (dueInDays <= 5) {
      score += 14;
      reasons.push(`Tenggat ${dueInDays} hari lagi`);
    } else if (dueInDays <= 10) {
      score += 6;
    }
  }

  if (columnId === "progress") {
    score += 8;
    reasons.push("Sedang dikerjakan");
  } else if (columnId === "todo") {
    score += 3;
  }

  const ageDays = Math.floor((Date.now() - task.createdAt) / 86_400_000);
  if (ageDays >= 7) {
    score += 5;
    reasons.push("Sudah lama menunggu");
  } else if (ageDays >= 3) {
    score += 2;
  }

  if (reasons.length === 0) {
    reasons.push(PRIORITIES[task.priority].label);
  }

  return {
    task,
    columnId,
    score: Math.min(100, Math.round(score)),
    reasons: reasons.slice(0, 3),
    dueInDays,
  };
}

export function getFocusTasks(board: Board, limit = 3): ScoredTask[] {
  const scored: ScoredTask[] = [];

  for (const columnId of COLUMN_IDS) {
    if (columnId === "done") continue;
    for (const task of board[columnId]) {
      scored.push(scoreTask(task, columnId));
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.dueInDays - b.dueInDays)
    .slice(0, limit);
}

export type LoadLevel = "ringan" | "seimbang" | "padat";

export interface MemberLoad {
  member: Member;
  active: number;
  urgent: number;
  level: LoadLevel;
  percent: number;
}

export function getWorkload(board: Board): MemberLoad[] {
  const activeTasks = COLUMN_IDS.filter((id) => id !== "done").flatMap(
    (id) => board[id],
  );

  const counter = new Map<string, { active: number; urgent: number }>();
  for (const member of MEMBERS) {
    counter.set(member.name, { active: 0, urgent: 0 });
  }

  for (const task of activeTasks) {
    const entry = counter.get(task.assignee);
    if (!entry) continue;
    entry.active += 1;
    if (task.priority === "urgent") entry.urgent += 1;
  }

  const maxActive = Math.max(
    1,
    ...MEMBERS.map((member) => counter.get(member.name)?.active ?? 0),
  );

  return MEMBERS.map((member) => {
    const entry = counter.get(member.name) ?? { active: 0, urgent: 0 };
    const level: LoadLevel =
      entry.active >= 3 ? "padat" : entry.active === 2 ? "seimbang" : "ringan";

    return {
      member,
      active: entry.active,
      urgent: entry.urgent,
      level,
      percent: Math.round((entry.active / maxActive) * 100),
    };
  }).sort((a, b) => b.active - a.active || a.member.name.localeCompare(b.member.name));
}

function firstName(name: string): string {
  return name.split(" ")[0];
}

export interface RebalanceMove {
  taskId: string;
  title: string;
  from: string;
  to: string;
  priority: Priority;
  dueDate: string;
}

function moveCandidateCost(entry: { task: Task; columnId: ColumnId }): number {
  let cost = 0;

  // Pekerjaan yang sedang berjalan sebaiknya tidak dipindah.
  if (entry.columnId === "progress") cost += 20;
  if (entry.task.priority === "urgent") cost += 15;
  else if (entry.task.priority === "high") cost += 8;

  const days = daysUntil(entry.task.dueDate);
  if (Number.isFinite(days)) {
    if (days <= 1) cost += 12;
    else if (days <= 3) cost += 5;
  }

  return cost;
}

/**
 * Saran pemindahan tugas dari anggota terpadat ke yang paling ringan.
 * Hanya diusulkan jika selisih beban minimal 2 tugas.
 */
export function suggestRebalance(board: Board, maxMoves = 3): RebalanceMove[] {
  const active: { task: Task; columnId: ColumnId }[] = [];
  for (const columnId of COLUMN_IDS) {
    if (columnId === "done") continue;
    for (const task of board[columnId]) {
      active.push({ task, columnId });
    }
  }

  const load = new Map<string, number>();
  for (const member of MEMBERS) load.set(member.name, 0);
  for (const entry of active) {
    load.set(entry.task.assignee, (load.get(entry.task.assignee) ?? 0) + 1);
  }

  const moves: RebalanceMove[] = [];
  const used = new Set<string>();

  for (let step = 0; step < maxMoves; step += 1) {
    const ranked = MEMBERS.map((member) => ({
      name: member.name,
      count: load.get(member.name) ?? 0,
    })).sort((a, b) => b.count - a.count);

    const heaviest = ranked[0];
    const lightest = ranked[ranked.length - 1];

    if (!heaviest || !lightest) break;
    if (heaviest.count <= 1) break;
    if (heaviest.count - lightest.count < 2) break;

    const candidate = active
      .filter(
        (entry) =>
          entry.task.assignee === heaviest.name && !used.has(entry.task.id),
      )
      .sort((a, b) => moveCandidateCost(a) - moveCandidateCost(b))[0];

    if (!candidate) break;

    used.add(candidate.task.id);
    moves.push({
      taskId: candidate.task.id,
      title: candidate.task.title,
      from: heaviest.name,
      to: lightest.name,
      priority: candidate.task.priority,
      dueDate: candidate.task.dueDate,
    });

    load.set(heaviest.name, heaviest.count - 1);
    load.set(lightest.name, lightest.count + 1);
  }

  return moves;
}

function dueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (!iso || !Number.isFinite(days)) return "";
  if (days < 0) return `lewat ${Math.abs(days)} hari`;
  if (days === 0) return "hari ini";
  if (days === 1) return "besok";
  return `${days} hari lagi`;
}

function line(task: Task, withDue = true): string {
  const due = withDue && task.dueDate ? ` (${dueLabel(task.dueDate)})` : "";
  return `• ${task.title} — ${firstName(task.assignee)}${due}`;
}

function byDueDate(a: Task, b: Task): number {
  return daysUntil(a.dueDate) - daysUntil(b.dueDate);
}

/** Ringkasan harian siap tempel ke WhatsApp / Teams. */
export function buildStandup(board: Board): string {
  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const done = board.done.slice(0, 4);
  const progress = [...board.progress].sort(byDueDate).slice(0, 5);

  const activeTasks = COLUMN_IDS.filter((id) => id !== "done").flatMap(
    (id) => board[id],
  );

  const overdue = activeTasks.filter(
    (task) => task.dueDate && daysUntil(task.dueDate) < 0,
  );

  const upcoming = [...board.todo, ...board.backlog]
    .filter((task) => {
      if (!task.dueDate) return false;
      const days = daysUntil(task.dueDate);
      return days >= 0 && days <= 3;
    })
    .sort(byDueDate)
    .slice(0, 4);

  const total = COLUMN_IDS.reduce((sum, id) => sum + board[id].length, 0);
  const doneCount = board.done.length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  const parts: string[] = [
    "*Update Harian — Papan Proyek SF Group*",
    `_${dateLabel}_`,
    "",
    "*Selesai*",
    done.length ? done.map((task) => line(task, false)).join("\n") : "• Belum ada yang selesai",
    "",
    "*Sedang dikerjakan*",
    progress.length
      ? progress.map((task) => line(task)).join("\n")
      : "• Belum ada yang dikerjakan",
    "",
  ];

  if (overdue.length > 0) {
    parts.push("*Perlu perhatian*");
    parts.push(
      overdue
        .slice(0, 4)
        .map(
          (task) =>
            `• ⚠️ ${task.title} — ${firstName(task.assignee)} (lewat ${Math.abs(
              daysUntil(task.dueDate),
            )} hari)`,
        )
        .join("\n"),
    );
    parts.push("");
  }

  parts.push("*Berikutnya (≤ 3 hari)*");
  parts.push(
    upcoming.length
      ? upcoming.map((task) => line(task)).join("\n")
      : "• Tidak ada tenggat dekat",
  );
  parts.push("");
  parts.push(
    `_Total ${total} tugas · ${doneCount} selesai (${percent}%) · ${overdue.length} terlambat_`,
  );

  return parts.join("\n");
}

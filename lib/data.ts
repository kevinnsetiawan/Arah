import type {
  Board,
  ColumnId,
  ColumnMeta,
  Member,
  Priority,
  Task,
} from "./types";
import { daysFromNow, uid } from "./utils";

export const MEMBERS: Member[] = [
  { id: "andi", name: "Andi Pratama", role: "Backend", color: "bg-indigo-500" },
  { id: "siti", name: "Siti Rahma", role: "Product", color: "bg-rose-500" },
  { id: "budi", name: "Budi Santoso", role: "QA", color: "bg-emerald-500" },
  { id: "dewi", name: "Dewi Lestari", role: "UI/UX", color: "bg-amber-500" },
  { id: "rizky", name: "Rizky Maulana", role: "Frontend", color: "bg-sky-500" },
];

export const MEMBER_MAP: Record<string, Member> = Object.fromEntries(
  MEMBERS.map((member) => [member.name, member]),
);

export function memberColor(name: string): string {
  return MEMBER_MAP[name]?.color ?? "bg-zinc-500";
}

export const COLUMNS: ColumnMeta[] = [
  {
    id: "backlog",
    title: "Backlog",
    hint: "Ide & antrian",
    dot: "bg-zinc-400",
    glow: "group-hover:border-zinc-300 dark:group-hover:border-zinc-700",
  },
  {
    id: "todo",
    title: "Akan Dikerjakan",
    hint: "Sudah diprioritaskan",
    dot: "bg-sky-500",
    glow: "group-hover:border-sky-300 dark:group-hover:border-sky-800",
  },
  {
    id: "progress",
    title: "Dikerjakan",
    hint: "Sedang berjalan",
    dot: "bg-amber-500",
    glow: "group-hover:border-amber-300 dark:group-hover:border-amber-800",
  },
  {
    id: "done",
    title: "Selesai",
    hint: "Sudah tuntas",
    dot: "bg-emerald-500",
    glow: "group-hover:border-emerald-300 dark:group-hover:border-emerald-800",
  },
];

export const COLUMN_IDS: ColumnId[] = COLUMNS.map((column) => column.id);

export const PRIORITIES: Record<
  Priority,
  { label: string; badge: string; dot: string; order: number }
> = {
  urgent: {
    label: "Urgent",
    badge:
      "bg-red-50 text-red-600 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
    dot: "bg-red-500",
    order: 0,
  },
  high: {
    label: "Tinggi",
    badge:
      "bg-orange-50 text-orange-600 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
    dot: "bg-orange-500",
    order: 1,
  },
  medium: {
    label: "Sedang",
    badge:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    dot: "bg-amber-500",
    order: 2,
  },
  low: {
    label: "Rendah",
    badge:
      "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20",
    dot: "bg-zinc-400",
    order: 3,
  },
};

function makeTask(task: Omit<Task, "id" | "createdAt">): Task {
  return { id: uid(), createdAt: Date.now(), ...task };
}

export function createInitialBoard(): Board {
  return {
    backlog: [
      makeTask({
        title: "Susun SOP penggunaan aplikasi internal",
        description:
          "Dokumen panduan singkat untuk karyawan baru: login, pengajuan, dan pelaporan.",
        assignee: "Siti Rahma",
        priority: "medium",
        dueDate: daysFromNow(7),
        tags: ["Dokumen"],
      }),
      makeTask({
        title: "Riset library chart untuk dashboard KPI",
        description:
          "Bandingkan Recharts, ApexCharts, dan Chart.js dari sisi ukuran bundle.",
        assignee: "Rizky Maulana",
        priority: "low",
        dueDate: daysFromNow(5),
        tags: ["Riset"],
      }),
    ],
    todo: [
      makeTask({
        title: "Desain ulang halaman login",
        description:
          "Buat versi baru dengan layout dua kolom dan ilustrasi ringan.",
        assignee: "Dewi Lestari",
        priority: "high",
        dueDate: daysFromNow(2),
        tags: ["UI/UX"],
      }),
      makeTask({
        title: "Perbaikan bug filter laporan bulanan",
        description:
          "Filter tanggal tidak membaca rentang akhir bulan dengan benar.",
        assignee: "Budi Santoso",
        priority: "urgent",
        dueDate: daysFromNow(-1),
        tags: ["Bug"],
      }),
      makeTask({
        title: "Migrasi data absensi ke database baru",
        description:
          "Pindahkan 6 bulan data historis dan validasi jumlah baris.",
        assignee: "Andi Pratama",
        priority: "medium",
        dueDate: daysFromNow(6),
        tags: ["Backend"],
      }),
      makeTask({
        title: "Siapkan materi presentasi progres mingguan",
        description:
          "Rangkum capaian sprint dan kendala untuk meeting hari Jumat.",
        assignee: "Siti Rahma",
        priority: "medium",
        dueDate: daysFromNow(2),
        tags: ["Laporan"],
      }),
    ],
    progress: [
      makeTask({
        title: "Integrasi API pengiriman email",
        description:
          "Notifikasi otomatis saat pengajuan disetujui atau ditolak.",
        assignee: "Rizky Maulana",
        priority: "high",
        dueDate: daysFromNow(1),
        tags: ["Backend"],
      }),
      makeTask({
        title: "Review keamanan halaman login",
        description:
          "Cek validasi input, rate limit, dan penanganan pesan error.",
        assignee: "Budi Santoso",
        priority: "high",
        dueDate: daysFromNow(4),
        tags: ["QA"],
      }),
      makeTask({
        title: "Modul approval cuti",
        description:
          "Alur persetujuan atasan langsung dengan riwayat perubahan status.",
        assignee: "Siti Rahma",
        priority: "medium",
        dueDate: daysFromNow(3),
        tags: ["Fitur"],
      }),
    ],
    done: [
      makeTask({
        title: "Setup repository & pipeline deploy",
        description:
          "CI sederhana: lint, build, lalu deploy otomatis ke staging.",
        assignee: "Andi Pratama",
        priority: "medium",
        dueDate: daysFromNow(-3),
        tags: ["DevOps"],
      }),
      makeTask({
        title: "Wireframe papan proyek",
        description: "Sketsa alur kartu, kolom, dan panel detail tugas.",
        assignee: "Dewi Lestari",
        priority: "low",
        dueDate: daysFromNow(-5),
        tags: ["UI/UX"],
      }),
    ],
  };
}

export function isBoard(value: unknown): value is Board {
  if (!value || typeof value !== "object") return false;
  return COLUMN_IDS.every((id) => {
    const column = (value as Record<string, unknown>)[id];
    return (
      Array.isArray(column) &&
      column.every(
        (task) =>
          task &&
          typeof task === "object" &&
          typeof (task as Task).id === "string" &&
          typeof (task as Task).title === "string",
      )
    );
  });
}

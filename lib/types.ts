export type Priority = "low" | "medium" | "high" | "urgent";

export type ColumnId = "backlog" | "todo" | "progress" | "done";

export interface Member {
  id: string;
  name: string;
  role: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: Priority;
  dueDate: string;
  tags: string[];
  createdAt: number;
}

export type Board = Record<ColumnId, Task[]>;

export interface ColumnMeta {
  id: ColumnId;
  title: string;
  hint: string;
  dot: string;
  glow: string;
}

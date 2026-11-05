export type Status = 'todo' | 'doing' | 'done';
export type Priority = 'baja' | 'media' | 'alta';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  label: string;
  status: Status;
  createdAt: number;
}

export type TaskDraft = Pick<Task, 'title' | 'description' | 'priority' | 'label' | 'status'>;

export const COLUMNS: { id: Status; title: string }[] = [
  { id: 'todo', title: 'Por hacer' },
  { id: 'doing', title: 'En curso' },
  { id: 'done', title: 'Hecho' },
];

export const PRIORITIES: { value: Priority; label: string; badge: 'neutral' | 'warning' | 'danger' }[] = [
  { value: 'alta', label: 'Alta', badge: 'danger' },
  { value: 'media', label: 'Media', badge: 'warning' },
  { value: 'baja', label: 'Baja', badge: 'neutral' },
];

import { Injectable, computed, effect, signal } from '@angular/core';
import { COLUMNS, Status, Task, TaskDraft } from './task.model';

const STORAGE_KEY = 'carril:tareas:v1';

/** Tareas de bienvenida: solo aparecen la primera vez que se abre la app */
function seed(): Task[] {
  const now = Date.now();
  const base = { description: '', label: '', createdAt: now };
  return [
    { ...base, id: crypto.randomUUID(), status: 'todo', priority: 'alta', title: 'Arrastra esta tarjeta a «En curso»', label: 'guía' },
    {
      ...base,
      id: crypto.randomUUID(),
      status: 'todo',
      priority: 'media',
      title: 'Prueba a moverla con el teclado',
      description: 'Enfoca la tarjeta con Tab y usa Alt + flechas: izquierda y derecha cambian de columna, arriba y abajo cambian el orden.',
      label: 'guía',
    },
    { ...base, id: crypto.randomUUID(), status: 'doing', priority: 'baja', title: 'Abre una tarjeta para editarla o borrarla', label: 'guía' },
    { ...base, id: crypto.randomUUID(), status: 'done', priority: 'baja', title: 'Las tareas se guardan en este navegador', label: '' },
  ];
}

function load(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return seed();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class BoardStore {
  /** Orden global: el orden dentro de cada columna es el orden de este array */
  readonly tasks = signal<Task[]>(load());

  readonly byColumn = computed(() => {
    const groups: Record<Status, Task[]> = { todo: [], doing: [], done: [] };
    for (const t of this.tasks()) groups[t.status].push(t);
    return groups;
  });

  constructor() {
    effect(() => {
      const tasks = this.tasks();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch {
        /* almacenamiento lleno o bloqueado: la app sigue funcionando en memoria */
      }
    });
  }

  get(id: string) {
    return this.tasks().find((t) => t.id === id);
  }

  add(draft: TaskDraft): Task {
    const task: Task = { ...draft, id: crypto.randomUUID(), createdAt: Date.now() };
    this.tasks.update((list) => [...list, task]);
    return task;
  }

  update(id: string, draft: TaskDraft) {
    const current = this.get(id);
    if (!current) return;
    if (current.status !== draft.status) {
      this.move(id, draft.status, null);
    }
    this.tasks.update((list) => list.map((t) => (t.id === id ? { ...t, ...draft } : t)));
  }

  /** Devuelve una función para deshacer el borrado */
  remove(id: string): () => void {
    const list = this.tasks();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return () => {};
    const task = list[index];
    this.tasks.set(list.filter((t) => t.id !== id));
    return () => {
      this.tasks.update((now) => {
        const copy = [...now];
        copy.splice(Math.min(index, copy.length), 0, task);
        return copy;
      });
    };
  }

  /**
   * Mueve una tarea a `status`, justo antes de `beforeId` (o al final de la columna si es null).
   */
  move(id: string, status: Status, beforeId: string | null) {
    if (id === beforeId) return;
    this.tasks.update((list) => {
      const task = list.find((t) => t.id === id);
      if (!task) return list;
      const rest = list.filter((t) => t.id !== id);
      const moved = { ...task, status };
      let index: number;
      if (beforeId) {
        index = rest.findIndex((t) => t.id === beforeId);
      } else {
        const lastInColumn = rest.map((t) => t.status).lastIndexOf(status);
        index = lastInColumn + 1;
        // Columna vacía: se coloca tras las columnas anteriores para mantener un orden estable
        if (lastInColumn === -1) {
          const order = COLUMNS.map((c) => c.id);
          const after = rest.findIndex((t) => order.indexOf(t.status) > order.indexOf(status));
          index = after === -1 ? rest.length : after;
        }
      }
      rest.splice(index, 0, moved);
      return rest;
    });
  }
}

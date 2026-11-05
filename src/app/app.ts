import { CUSTOM_ELEMENTS_SCHEMA, Component, computed, inject, signal } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { toast } from '@ivantm0/trazo';
import { BoardStore } from './board.store';
import { COLUMNS, PRIORITIES, Status, Task, TaskDraft } from './task.model';
import { MoveDirection, TaskCard } from './task-card';
import { TaskDialog } from './task-dialog';

type Theme = 'system' | 'light' | 'dark';
const THEME_KEY = 'carril:tema';

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

@Component({
  selector: 'app-root',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, TaskCard, TaskDialog],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly store = inject(BoardStore);
  private readonly announcer = inject(LiveAnnouncer);

  protected readonly columns = COLUMNS;
  protected readonly priorityFilterOptions = [
    { value: '', label: 'Todas las prioridades' },
    ...PRIORITIES.map((p) => ({ value: p.value, label: `Prioridad ${p.label.toLowerCase()}` })),
  ];

  protected readonly query = signal('');
  protected readonly priorityFilter = signal('');
  protected readonly filtering = computed(() => this.query().trim() !== '' || this.priorityFilter() !== '');

  protected readonly visible = computed(() => {
    const q = normalize(this.query().trim());
    const p = this.priorityFilter();
    const groups = this.store.byColumn();
    const match = (t: Task) =>
      (!p || t.priority === p) &&
      (!q || normalize(`${t.title} ${t.description} ${t.label}`).includes(q));
    return {
      todo: groups.todo.filter(match),
      doing: groups.doing.filter(match),
      done: groups.done.filter(match),
    } satisfies Record<Status, Task[]>;
  });

  protected readonly totals = computed(() => {
    const g = this.store.byColumn();
    return { all: g.todo.length + g.doing.length + g.done.length, done: g.done.length };
  });

  protected readonly visibleCount = computed(() => {
    const v = this.visible();
    return v.todo.length + v.doing.length + v.done.length;
  });

  // Ventana de tarea
  protected readonly dialogOpen = signal(false);
  protected readonly editing = signal<Task | null>(null);
  protected readonly newStatus = signal<Status>('todo');

  // Tema
  protected readonly theme = signal<Theme>(readTheme());
  protected readonly themeLabel = computed(
    () => ({ system: 'Tema: según el sistema', light: 'Tema: claro', dark: 'Tema: oscuro' })[this.theme()],
  );

  constructor() {
    this.applyTheme(this.theme());
  }

  protected openNew(status: Status = 'todo') {
    this.editing.set(null);
    this.newStatus.set(status);
    this.dialogOpen.set(true);
  }

  protected openEdit(task: Task) {
    this.editing.set(task);
    this.dialogOpen.set(true);
  }

  protected closeDialog() {
    const task = this.editing();
    this.dialogOpen.set(false);
    if (task) this.focusCard(task.id);
  }

  protected save(draft: TaskDraft) {
    const task = this.editing();
    if (task) {
      this.store.update(task.id, draft);
      this.dialogOpen.set(false);
      this.focusCard(task.id);
      toast({ message: 'Cambios guardados', variant: 'success', duration: 2500 });
    } else {
      const created = this.store.add(draft);
      this.dialogOpen.set(false);
      this.focusCard(created.id);
      toast({ message: `Tarea creada en «${columnTitle(draft.status)}»`, variant: 'success', duration: 2500 });
    }
  }

  protected remove() {
    const task = this.editing();
    if (!task) return;
    this.dialogOpen.set(false);
    this.editing.set(null);
    const undo = this.store.remove(task.id);
    toast({
      message: `«${task.title}» se ha borrado`,
      duration: 8000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          undo();
          this.focusCard(task.id);
        },
      },
    });
  }

  /** Suelta desde CDK: los índices son de la lista visible (puede estar filtrada) */
  protected drop(event: CdkDragDrop<Status, Status, Task>) {
    const task = event.item.data;
    const target = event.container.data;
    const visibleTarget = this.visible()[target].filter((t) => t.id !== task.id);
    const before = visibleTarget[event.currentIndex] ?? null;
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) return;
    this.store.move(task.id, target, before ? before.id : this.afterLastVisible(target, task.id));
    this.announcer.announce(`${task.title}: movida a ${columnTitle(target)}`);
  }

  /** Movimiento con teclado (Alt + flechas) */
  protected moveWithKeys(stale: Task, direction: MoveDirection) {
    // Dos atajos seguidos pueden llegar antes de que la vista se actualice
    const task = this.store.get(stale.id);
    if (!task) return;
    const order = COLUMNS.map((c) => c.id);
    const list = this.visible()[task.status];
    const index = list.findIndex((t) => t.id === task.id);

    if (direction === 'left' || direction === 'right') {
      const next = order[order.indexOf(task.status) + (direction === 'left' ? -1 : 1)];
      if (!next) return;
      this.store.move(task.id, next, null);
      this.announcer.announce(`Movida a ${columnTitle(next)}`);
    } else {
      if (direction === 'up') {
        if (index <= 0) return;
        this.store.move(task.id, task.status, list[index - 1].id);
      } else {
        if (index === -1 || index >= list.length - 1) return;
        this.store.move(task.id, task.status, list[index + 2]?.id ?? this.afterLastVisible(task.status, task.id));
      }
      const position = this.visible()[task.status].findIndex((t) => t.id === task.id) + 1;
      this.announcer.announce(`Posición ${position} de ${list.length}`);
    }
    this.focusCard(task.id);
  }

  protected cycleTheme() {
    const next: Theme = { system: 'light', light: 'dark', dark: 'system' }[this.theme()] as Theme;
    this.theme.set(next);
    this.applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* sin almacenamiento: el tema dura lo que la sesión */
    }
  }

  protected clearFilters() {
    this.query.set('');
    this.priorityFilter.set('');
  }

  /**
   * Con un filtro activo, "al final de lo visible" no es "al final de la columna":
   * devuelve la tarea oculta que sigue a la última visible, para insertar antes de ella.
   */
  private afterLastVisible(status: Status, movingId: string): string | null {
    const visible = this.visible()[status].filter((t) => t.id !== movingId);
    const all = this.store.byColumn()[status].filter((t) => t.id !== movingId);
    const last = visible.at(-1);
    if (!last) return null;
    return all[all.findIndex((t) => t.id === last.id) + 1]?.id ?? null;
  }

  private applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-trz-theme');
    else root.setAttribute('data-trz-theme', theme);
  }

  private focusCard(id: string) {
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus();
    });
  }
}

function columnTitle(status: Status) {
  return COLUMNS.find((c) => c.id === status)!.title;
}

function normalize(text: string) {
  return text.toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import { COLUMNS, PRIORITIES, Priority, Status, Task, TaskDraft } from './task.model';

/** Ventana para crear o editar una tarea, montada sobre trz-modal */
@Component({
  selector: 'app-task-dialog',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <trz-modal
      [open]="open()"
      [heading]="task() ? 'Editar tarea' : 'Nueva tarea'"
      (trzClose)="closed.emit()"
    >
      <form class="form" (submit)="submit($event)" novalidate>
        <trz-input
          #titleField
          label="Título"
          name="title"
          required
          maxlength="120"
          [value]="title()"
          [error]="titleError()"
          (trzInput)="title.set($any($event).detail.value); titleError.set('')"
          (keydown.enter)="submitFromField($event)"
        ></trz-input>

        <div class="field">
          <label for="task-description">Descripción</label>
          <textarea
            id="task-description"
            name="description"
            rows="4"
            maxlength="2000"
            placeholder="Opcional"
            [value]="description()"
            (input)="description.set($any($event.target).value)"
          ></textarea>
        </div>

        <div class="row">
          <trz-select
            label="Prioridad"
            name="priority"
            [options]="priorityOptions"
            [value]="priority()"
            (trzChange)="priority.set($any($event).detail.value)"
          ></trz-select>
          <trz-select
            label="Columna"
            name="status"
            [options]="statusOptions"
            [value]="status()"
            (trzChange)="status.set($any($event).detail.value)"
          ></trz-select>
        </div>

        <trz-input
          label="Etiqueta"
          name="label"
          maxlength="24"
          hint="Una palabra para agrupar: trabajo, casa, portfolio…"
          [value]="label()"
          (trzInput)="label.set($any($event).detail.value)"
          (keydown.enter)="submitFromField($event)"
        ></trz-input>

        <div class="actions">
          @if (task()) {
            <trz-button variant="ghost" class="delete" (click)="deleted.emit()">Borrar tarea</trz-button>
          }
          <trz-button variant="secondary" (click)="closed.emit()">Cancelar</trz-button>
          <trz-button type="submit">{{ task() ? 'Guardar cambios' : 'Crear tarea' }}</trz-button>
        </div>
      </form>
    </trz-modal>
  `,
  styles: `
    .form {
      display: grid;
      gap: var(--trz-space-5);
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--trz-space-4);
    }
    @media (max-width: 30rem) {
      .row { grid-template-columns: 1fr; }
    }
    .field {
      display: grid;
      gap: var(--trz-space-2);
    }
    .field label {
      font-size: var(--trz-text-sm);
      font-weight: var(--trz-weight-medium);
      line-height: var(--trz-leading-tight);
    }
    textarea {
      min-height: 6rem;
      padding: var(--trz-space-2) var(--trz-space-3);
      border: 1px solid var(--trz-color-border-strong);
      border-radius: var(--trz-radius-md);
      background: var(--trz-color-surface-raised);
      color: inherit;
      font: inherit;
      line-height: var(--trz-leading-normal);
      resize: vertical;
      transition: border-color var(--trz-duration-fast) var(--trz-ease), box-shadow var(--trz-duration-fast) var(--trz-ease);
    }
    textarea::placeholder { color: var(--trz-color-text-subtle); }
    textarea:hover { border-color: var(--trz-color-text-subtle); }
    textarea:focus {
      outline: none;
      border-color: var(--trz-color-primary);
      box-shadow: var(--trz-focus-ring);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--trz-space-2);
      padding-top: var(--trz-space-2);
    }
    .delete {
      margin-right: auto;
      --trz-color-text: var(--trz-color-danger);
    }
  `,
})
export class TaskDialog {
  readonly open = input(false);
  /** Tarea a editar; null para crear una nueva */
  readonly task = input<Task | null>(null);
  /** Columna inicial al crear */
  readonly defaultStatus = input<Status>('todo');

  readonly saved = output<TaskDraft>();
  readonly closed = output<void>();
  readonly deleted = output<void>();

  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly priority = signal<Priority>('media');
  protected readonly status = signal<Status>('todo');
  protected readonly label = signal('');
  protected readonly titleError = signal('');

  protected readonly priorityOptions = PRIORITIES.map((p) => ({ value: p.value, label: p.label }));
  protected readonly statusOptions = COLUMNS.map((c) => ({ value: c.id, label: c.title }));

  private readonly titleField = viewChild<ElementRef<HTMLTrzInputElement>>('titleField');

  constructor() {
    // Rellena el formulario cada vez que se abre
    effect(() => {
      if (!this.open()) return;
      const t = this.task();
      this.title.set(t?.title ?? '');
      this.description.set(t?.description ?? '');
      this.priority.set(t?.priority ?? 'media');
      this.status.set(t?.status ?? this.defaultStatus());
      this.label.set(t?.label ?? '');
      this.titleError.set('');
      requestAnimationFrame(() => this.titleField()?.nativeElement.setFocus());
    });
  }

  /** Los campos de Trazo no hacen el envío implícito con Intro de un <input> nativo */
  protected submitFromField(event: Event) {
    event.preventDefault();
    (event.target as HTMLElement).closest('form')?.requestSubmit();
  }

  protected submit(event: Event) {
    event.preventDefault();
    const title = this.title().trim();
    if (!title) {
      this.titleError.set('Escribe un título para la tarea.');
      this.titleField()?.nativeElement.setFocus();
      return;
    }
    this.saved.emit({
      title,
      description: this.description().trim(),
      priority: this.priority(),
      status: this.status(),
      label: this.label().trim().replace(/^#/, ''),
    });
  }
}

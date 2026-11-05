import { CUSTOM_ELEMENTS_SCHEMA, Component, computed, input, output } from '@angular/core';
import { PRIORITIES, Task } from './task.model';

export type MoveDirection = 'left' | 'right' | 'up' | 'down';

/** Tarjeta de una tarea. Es un botón: Intro o clic la abren, Alt + flechas la mueven */
@Component({
  selector: 'app-task-card',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class.done]': "task().status === 'done'" },
  template: `
    <button
      type="button"
      class="card"
      [attr.data-id]="task().id"
      [attr.aria-describedby]="'move-help'"
      (click)="opened.emit()"
      (keydown)="onKey($event)"
    >
      <span class="title">{{ task().title }}</span>
      @if (task().description) {
        <span class="description">{{ task().description }}</span>
      }
      <span class="meta">
        <trz-badge size="sm" dot [variant]="priority().badge">
          <span class="sr-only">Prioridad </span>{{ priority().label }}
        </trz-badge>
        @if (task().label) {
          <span class="label">#{{ task().label }}</span>
        }
      </span>
    </button>
  `,
  styles: `
    :host { display: block; }
    .card {
      position: relative;
      display: grid;
      gap: var(--trz-space-2);
      width: 100%;
      padding: var(--trz-space-3) var(--trz-space-4) var(--trz-space-3);
      border: 1px solid var(--trz-color-border);
      border-radius: var(--trz-radius-md);
      background: var(--trz-color-surface-raised);
      box-shadow: var(--trz-shadow-sm);
      color: var(--trz-color-text);
      font: inherit;
      text-align: left;
      cursor: grab;
      transition:
        border-color var(--trz-duration-fast) var(--trz-ease),
        box-shadow var(--trz-duration-normal) var(--trz-ease),
        transform var(--trz-duration-normal) var(--trz-ease);
    }
    .card:hover {
      border-color: var(--trz-color-border-strong);
      box-shadow: var(--trz-shadow-md);
    }
    .card:focus-visible {
      outline: none;
      border-color: var(--trz-color-primary);
      box-shadow: var(--trz-focus-ring), var(--trz-shadow-md);
    }
    .title {
      font-size: var(--trz-text-md);
      font-weight: var(--trz-weight-medium);
      line-height: var(--trz-leading-tight);
      overflow-wrap: anywhere;
    }
    .description {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      color: var(--trz-color-text-muted);
      font-size: var(--trz-text-sm);
      line-height: var(--trz-leading-normal);
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--trz-space-2);
      margin-top: var(--trz-space-1);
    }
    .label {
      color: var(--trz-color-primary-soft-text);
      font-size: var(--trz-text-xs);
      font-weight: var(--trz-weight-medium);
    }
    :host(.done) .title {
      color: var(--trz-color-text-muted);
      text-decoration: line-through;
      text-decoration-color: var(--trz-color-border-strong);
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `,
})
export class TaskCard {
  readonly task = input.required<Task>();
  readonly opened = output<void>();
  readonly moved = output<MoveDirection>();

  protected readonly priority = computed(() => PRIORITIES.find((p) => p.value === this.task().priority)!);

  protected onKey(event: KeyboardEvent) {
    if (!event.altKey) return;
    const map: Record<string, MoveDirection> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const direction = map[event.key];
    if (!direction) return;
    event.preventDefault();
    this.moved.emit(direction);
  }
}

import { expect, Page, test } from '@playwright/test';

const column = (page: Page, name: string) => page.getByRole('region', { name: new RegExp(`^${name}`) });

test.beforeEach(async ({ page }) => {
  // Cada test empieza con el tablero de bienvenida
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Carril', level: 1 })).toBeVisible();
});

test('crea una tarea con Intro y la guarda tras recargar', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva tarea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nueva tarea' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Título' })).toBeFocused();

  await page.keyboard.type('Repasar signals');
  await page.keyboard.press('Enter');

  await expect(dialog).toBeHidden();
  const card = column(page, 'Por hacer').getByRole('button', { name: /Repasar signals/ });
  await expect(card).toBeFocused();

  await page.reload();
  await expect(column(page, 'Por hacer').getByRole('button', { name: /Repasar signals/ })).toBeVisible();
});

test('no deja crear una tarea sin título', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva tarea' }).click();
  await page.locator('app-task-dialog').getByRole('button', { name: 'Crear tarea' }).click();
  await expect(page.getByText('Escribe un título para la tarea.')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('el botón + de una columna crea la tarea en esa columna', async ({ page }) => {
  await page.getByRole('button', { name: 'Añadir tarea a Hecho' }).click();
  await expect(page.getByRole('textbox', { name: 'Título' })).toBeFocused();
  await page.keyboard.type('Publicar en Netlify');
  await page.keyboard.press('Enter');
  await expect(column(page, 'Hecho').getByRole('button', { name: /Publicar en Netlify/ })).toBeVisible();
});

test('mueve una tarjeta con el teclado y anuncia el cambio', async ({ page }) => {
  const card = column(page, 'Por hacer').getByRole('button', { name: /Arrastra esta tarjeta/ });
  await card.focus();
  await page.keyboard.press('Alt+ArrowRight');
  await page.keyboard.press('Alt+ArrowUp');

  const doing = column(page, 'En curso').getByRole('button');
  await expect(doing.first()).toContainText('Arrastra esta tarjeta');
  await expect(doing.first()).toBeFocused();
  await expect(page.locator('.cdk-live-announcer-element')).toContainText('Posición 1 de 2');
});

test('arrastra una tarjeta a otra columna con el ratón', async ({ page }) => {
  const card = column(page, 'Por hacer').getByRole('button', { name: /Arrastra esta tarjeta/ });
  const target = column(page, 'Hecho').getByRole('list');
  const from = (await card.boundingBox())!;
  const to = (await target.boundingBox())!;

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height - 10, { steps: 20 });
  await page.mouse.up();

  await expect(column(page, 'Hecho').getByRole('button', { name: /Arrastra esta tarjeta/ })).toBeVisible();
  await expect(column(page, 'Por hacer').getByRole('button', { name: /Arrastra esta tarjeta/ })).toHaveCount(0);
});

test('borra una tarea y la recupera con Deshacer', async ({ page }) => {
  await page.getByRole('button', { name: /Abre una tarjeta/ }).click();
  await page.locator('app-task-dialog').getByRole('button', { name: 'Borrar tarea' }).click();
  await expect(page.getByRole('button', { name: /Abre una tarjeta/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.getByRole('button', { name: /Abre una tarjeta/ })).toBeVisible();
});

test('edita una tarea y la cambia de columna', async ({ page }) => {
  await page.getByRole('button', { name: /Abre una tarjeta/ }).click();
  await expect(page.getByRole('dialog', { name: 'Editar tarea' })).toBeVisible();
  // El contenido va en el DOM ligero del trz-modal, no dentro de su <dialog> interno
  const dialog = page.locator('app-task-dialog');
  await dialog.getByLabel('Columna').selectOption('done');
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(column(page, 'Hecho').getByRole('button', { name: /Abre una tarjeta/ })).toBeVisible();
});

test('filtra por texto y por prioridad', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Buscar tareas' }).fill('teclado');
  await expect(page.getByRole('status').filter({ hasText: 'coinciden' })).toContainText('1 de 4');
  await expect(page.locator('app-task-card')).toHaveCount(1);

  await page.getByRole('button', { name: 'Quitar filtros' }).click();
  await page.getByLabel('Filtrar por prioridad').selectOption('alta');
  await expect(page.locator('app-task-card')).toHaveCount(1);
  await expect(page.locator('app-task-card')).toContainText('Arrastra esta tarjeta');
});

test('el tema elegido se recuerda', async ({ page }) => {
  await page.getByRole('button', { name: 'Tema: según el sistema' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-trz-theme', 'light');
  await page.getByRole('button', { name: 'Tema: claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-trz-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-trz-theme', 'dark');
});

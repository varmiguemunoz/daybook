# Daybook — Plan del sistema de notas (fase 1)

Objetivo: notas en Markdown, organizadas en carpetas y relacionadas entre sí.

- **Ver:** la nota se muestra renderizada.
- **Editar:** doble clic entra en modo edición sobre el texto Markdown.
- **Guardar:** `Ctrl+S` (o `⌘S` en Mac) guarda.

Esta fase la programas tú. El plan sigue la arquitectura actual del repo para que el feature quede igual que tareas y equipos.

---

## 0. Decisiones antes de escribir código

| Decisión                         | Recomendación                                                                   | Alternativa                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ¿De quién son las notas?         | Del workspace (como las tareas), con `authorId`                                 | Privadas por miembro: añade `ownerId` y filtra por él en cada consulta                         |
| ¿Quién edita o borra?            | Cualquier miembro con `note:write`                                              | Solo el autor: mismo patrón que los comentarios (`assertAuthor`)                               |
| Carpetas anidadas                | Sí, con `parentId` (árbol)                                                      | Un solo nivel: más simple, sin recursión                                                       |
| Relaciones                       | Explícitas: lista de ids en la nota, con panel "Relacionadas" y "Mencionada en" | Enlaces `[[Título]]` dentro del Markdown (lo dejo para la fase 2)                              |
| Editor                           | `<textarea>` con fuente mono                                                    | CodeMirror 6 con resaltado de Markdown (`@uiw/react-codemirror` + `@codemirror/lang-markdown`) |
| Borrar una carpeta con contenido | Mover sus notas y subcarpetas a la carpeta padre                                | Bloquear el borrado si no está vacía                                                           |
| Ediciones simultáneas            | Gana la última escritura (fase 1)                                               | Control de versión con `updatedAt` y 409 si cambió (fase 2)                                    |

---

## 1. Librerías

| Paquete            | Versión | Para qué                                                                         |
| ------------------ | ------- | -------------------------------------------------------------------------------- |
| `react-markdown`   | 10.1    | Renderiza Markdown a React sin `dangerouslySetInnerHTML`                         |
| `remark-gfm`       | 4.0     | Tablas, listas de tareas `- [ ]`, tachado y autolinks (GitHub Flavored Markdown) |
| `rehype-highlight` | 7.0     | Opcional: resaltado de bloques de código                                         |

```bash
npm install -w @daybook/web react-markdown remark-gfm
```

Reglas de seguridad:

- No instales `rehype-raw`. Sin él, `react-markdown` ignora el HTML crudo dentro del Markdown y no hay XSS.
- Deja el `urlTransform` por defecto: bloquea enlaces `javascript:`.
- Los enlaces externos se abren con `target="_blank"` y `rel="noreferrer"`, mediante el prop `components={{ a: ... }}`.

---

## 2. Modelo de datos (`packages/domain`)

**`src/schemas/folder.ts`**

```ts
export const folderSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  parentId: idSchema.nullable().default(null),
  name: nonEmptyText, // máx. 200
  order: z.number().int().nonnegative().default(0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export const createFolderInputSchema = z.object({ name: nonEmptyText, parentId: idSchema.nullable().default(null) });
export const updateFolderInputSchema = z.object({ name: nonEmptyText, parentId: idSchema.nullable(), order: z.number().int().nonnegative() }).partial();
```

**`src/schemas/note.ts`**

```ts
const noteBody = z.string().max(100_000);

export const noteSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  folderId: idSchema.nullable().default(null),
  authorId: idSchema,
  title: nonEmptyText,
  body: noteBody.default(''),
  linkIds: z.array(idSchema).max(100).default([]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export const createNoteInputSchema = z.object({ title: nonEmptyText, folderId: idSchema.nullable().default(null), body: noteBody.default('') });
// Sin defaults: con .partial() sobre campos con default, Zod rellenaría los ausentes y borraría datos en cada PATCH.
export const updateNoteInputSchema = z.object({ title: nonEmptyText, folderId: idSchema.nullable(), body: noteBody }).partial();
export const noteLinksInputSchema = z.object({ linkIds: z.array(idSchema).max(100) });
```

- **Listados ligeros:** `type NoteSummary = Pick<Note, 'id' | 'title' | 'folderId' | 'updatedAt'>`. Las listas no deben traer el `body`.
- **Exports:** añade los dos esquemas en `src/index.ts`.
- **Permisos** (`src/permissions.ts`): añade `'note:write'` a `PERMISSIONS` y al rol `member`.

---

## 3. API (`apps/api`)

### 3.1 Puertos (`src/ports/repositories.ts`)

```ts
export interface FolderRepository {
  listByWorkspace(workspaceId: string): Promise<Folder[]>;
  findById(workspaceId: string, id: string): Promise<Folder | null>;
  create(folder: Folder): Promise<Folder>;
  update(workspaceId: string, id: string, patch: Partial<Folder>): Promise<Folder | null>;
  remove(workspaceId: string, id: string): Promise<boolean>;
}

export interface NoteRepository {
  list(workspaceId: string, query: { folderId?: string | null; search?: string }): Promise<NoteSummary[]>;
  findById(workspaceId: string, id: string): Promise<Note | null>;
  findByIds(workspaceId: string, ids: string[]): Promise<NoteSummary[]>;
  findLinkingTo(workspaceId: string, id: string): Promise<NoteSummary[]>; // backlinks
  create(note: Note): Promise<Note>;
  update(workspaceId: string, id: string, patch: Partial<Note>): Promise<Note | null>;
  moveFolder(workspaceId: string, fromFolderId: string, toFolderId: string | null): Promise<void>;
  removeLink(workspaceId: string, targetId: string): Promise<void>; // limpia relaciones al borrar
  remove(workspaceId: string, id: string): Promise<boolean>;
}
```

Añade `folders` y `notes` a `Repositories`.

### 3.2 Adaptadores

- **Memoria** (`adapters/memory/notes-repositories.ts`): dos clases sobre `Collection`, igual que `MemoryTeamRepository`. Registra las colecciones en `adapters/memory/index.ts` y en el array del purge de workspace.
- **Mongo:**
  - Modelos en `adapters/mongo/models/notes.ts`. Todo `nullable` del dominio va como `default: null`; no lo marques `required`, que es justo el error que acabas de ver con `projectId`.
  - Índices: `notes {workspaceId, folderId, updatedAt: -1}`, `notes {workspaceId, linkIds}` para los backlinks y `folders {workspaceId, parentId}`.
  - Listados con `.select('title folderId updatedAt')` para no traer el body.
  - Búsqueda con `$regex` escapado: reutiliza `escapeRegExp` de `task-repository.ts`.
  - Añade `NoteModel` y `FolderModel` a `SCOPED_DOCUMENTS` en `support-repositories.ts` para que se borren con la organización.

### 3.3 Servicios

**`modules/folders/folder-service.ts`**

- `createFolder` valida que `parentId` exista en el workspace.
- `updateFolder` impide ciclos: no mover una carpeta dentro de sí misma ni de sus descendientes. Recorre los ancestros del destino.
- `deleteFolder` mueve notas y subcarpetas al padre y luego borra.

**`modules/notes/note-service.ts`**

- `listNotes`, `getNote` (devuelve `{ note, related, backlinks }`), `createNote`, `updateNote`, `setLinks`, `deleteNote`.
- `setLinks` filtra los ids que no existen en el workspace y el propio id de la nota.
- `deleteNote` llama a `removeLink` para que nadie apunte a una nota borrada.
- `createNote` y `updateNote` validan que `folderId` exista.
- Emite eventos del bus: `note.created`, `note.updated`, `note.deleted`, `folder.changed`.

### 3.4 Rutas

| Método | Ruta                      | Permiso      | Respuesta                      |
| ------ | ------------------------- | ------------ | ------------------------------ |
| GET    | `/api/folders`            | sesión       | `Folder[]`                     |
| POST   | `/api/folders`            | `note:write` | `Folder` (201)                 |
| PATCH  | `/api/folders/:id`        | `note:write` | `Folder`                       |
| DELETE | `/api/folders/:id`        | `note:write` | 204                            |
| GET    | `/api/notes?folderId=&q=` | sesión       | `NoteSummary[]`                |
| GET    | `/api/notes/:id`          | sesión       | `{ note, related, backlinks }` |
| POST   | `/api/notes`              | `note:write` | `Note` (201)                   |
| PATCH  | `/api/notes/:id`          | `note:write` | `Note`                         |
| PUT    | `/api/notes/:id/links`    | `note:write` | `Note`                         |
| DELETE | `/api/notes/:id`          | `note:write` | 204                            |

Usa el patrón existente:

```ts
routes.patch('/:id', permit('note:write'), async context => {
  const { workspace } = context.get('scope');
  const input = parseBody(updateNoteInputSchema, await readJson(context));
  return context.json(await updateNote(repositories, workspace.id, context.req.param('id'), input));
});
```

`folderId=` vacío significa "notas sueltas"; sin el parámetro, todas. Regístralas en `app.ts`, dentro de `apiRoutes`.

Opcional: añade notas al buscador ⌘K en `modules/search/search-service.ts`, buscando por título.

---

## 4. Web (`apps/web`)

### 4.1 Estructura

```
src/pages/NotesPage.tsx
src/modules/notes/
  components/
    NotesSidebar.tsx        árbol de carpetas + lista de notas + botones nuevo
    FolderTree.tsx          recursivo, usa lib/folder-tree
    FolderItem.tsx          fila de carpeta: abrir, renombrar, borrar (OptionMenu)
    NoteList.tsx            notas de la carpeta activa
    NoteListItem.tsx
    NotePane.tsx            decide vista o edición
    NoteHeader.tsx          título editable, carpeta, estado "Guardado / Sin guardar"
    MarkdownView.tsx        react-markdown + remark-gfm
    NoteEditor.tsx          textarea controlado
    RelatedNotes.tsx        relacionadas + "Mencionada en"
    NotePicker.tsx          Popover + SearchField para elegir notas a relacionar
  hooks/
    use-note-editor.ts      draft, dirty, save, entrar/salir de edición
    use-save-shortcut.ts    Ctrl/⌘+S
    use-unsaved-guard.ts    beforeunload + confirmación al cambiar de nota
  services/
    queries.ts              TanStack Query (lista abajo)
  lib/
    folder-tree.ts          lista plana → árbol, y ruta de ancestros
```

### 4.2 Ruta y navegación

- `app/router.tsx`: `const NotesPage = lazy(...)` y `<Route path="notes" element={<NotesPage />} />`.
- `app/shell/nav-items.ts`: `{ to: '/notes', label: 'Notes', icon: 'notebook-pen' }` en `WORKSPACE_NAV`. El icono se incluye solo porque el plugin de Lucide detecta el literal.
- **Estado en la URL**, como Settings: `/notes?folder=<id>&note=<id>` con `useSearchParams`. Así el botón atrás y recargar la página funcionan, sin store global.

### 4.3 Datos (`services/queries.ts`)

| Hook                                                  | Query key                                                            | Notas                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `useFolders()`                                        | `['folders']`                                                        |                                                                         |
| `useNotes(folderId)`                                  | `['notes', folderId ?? 'root']`                                      | Solo resúmenes                                                          |
| `useNote(id)`                                         | `['note', id]`                                                       | `enabled: Boolean(id)`                                                  |
| `useCreateFolder / useUpdateFolder / useDeleteFolder` | invalidan `['folders']` y `['notes']`                                | ids en las variables, no en el argumento del hook                       |
| `useCreateNote`                                       | invalida `['notes']`                                                 | Al crear, navega a `?note=<nuevo id>` en modo edición                   |
| `useSaveNote`                                         | `setQueryData(['note', id])` con la respuesta + invalida `['notes']` | Sin optimismo: guardar es explícito y el usuario espera la confirmación |
| `useSetNoteLinks`                                     | invalida `['note', id]` y `['note', destino]`                        | Los backlinks del destino cambian                                       |
| `useDeleteNote`                                       | invalida `['notes']`, quita `['note', id]`                           | Al terminar, limpia `?note`                                             |

Añade las query keys a `queryKeys` en `core/services/api-client.ts`. En `core/hooks/use-sse.ts` añade `note.*` → `['notes', 'note']` y `folder.changed` → `['folders']`.

### 4.4 Ver, editar y guardar

`use-note-editor.ts` es el centro del feature:

```ts
export function useNoteEditor(note: Note) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const save = useSaveNote();
  const dirty = draft !== note.body;

  function persist() {
    if (!dirty || save.isPending) return;
    save.mutate(
      { id: note.id, patch: { body: draft } },
      {
        onError: () => showToast('Could not save the note', 'error'),
      },
    );
  }

  return { editing, startEditing: () => setEditing(true), stopEditing: () => setEditing(false), draft, setDraft, dirty, saving: save.isPending, persist };
}
```

- **Reiniciar el borrador al cambiar de nota:** monta el panel con `key={note.id}`, así el estado se reinicia solo y no necesitas un `useEffect` para sincronizar el borrador.
- **Doble clic:** `<article onDoubleClick={startEditing}>` en `MarkdownView`. Añade también un botón "Edit" visible, porque el doble clic no es accesible con teclado ni descubrible.
- **`Ctrl/⌘+S`** (`use-save-shortcut.ts`):
  ```ts
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
      event.preventDefault(); // evita "Guardar página" del navegador
      onSave();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSave]);
  ```
  Como `onSave` cambia en cada render, guarda la función en un `useRef` o registra el listener en el `onKeyDown` del textarea. Esto último es más simple y solo actúa mientras editas.
- **Salir de edición:** `Esc` vuelve a la vista. Si hay cambios, pregunta con `ConfirmDialog` ("Discard changes?") o guarda primero; decide cuál prefieres.
- **Cambios sin guardar** (`use-unsaved-guard.ts`):
  - Escucha `beforeunload` mientras `dirty`.
  - Al cambiar de nota desde la lista, pide confirmación si hay cambios.
  - La app usa `BrowserRouter`, así que `useBlocker` de React Router no está disponible. Bloquear la navegación del sidebar requiere migrar a `createBrowserRouter` (fase 2).
- **Estado visible:** "Saved", "Unsaved changes" o "Saving…" en `NoteHeader`, con `aria-live="polite"`.

### 4.5 Markdown (`MarkdownView.tsx`)

```tsx
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const components = {
  a: (props: ComponentProps<'a'>) => <a {...props} target="_blank" rel="noreferrer" />,
};

export function MarkdownView({ body, onEdit }: { body: string; onEdit: () => void }) {
  if (!body.trim()) return <EmptyState icon="file-text" title="Empty note" text="Double-click or press Edit to start writing." />;
  return (
    <article className="md" onDoubleClick={onEdit}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {body}
      </Markdown>
    </article>
  );
}
```

Carga la página de notas con `lazy`, como el resto. Así `react-markdown` no entra en el bundle inicial.

### 4.6 Relaciones

- **`RelatedNotes`** muestra dos listas:
  - "Related": las notas que esta enlaza (`related`).
  - "Mentioned in": las notas que enlazan a esta (`backlinks`).
  - Clic en cualquiera abre `?note=<id>`.
- **`NotePicker`:**
  - Un botón "Link note" abre un `Popover` con `SearchField` que consulta `useNotes` con búsqueda.
  - Al elegir, llama a `useSetNoteLinks` con `[...linkIds, elegido]`.
  - Cada relación tiene un botón para quitarla.
- **Fase 2:** sintaxis `[[Título]]` en el Markdown, con un plugin de remark propio que convierta esos nodos en enlaces internos, y autocompletado en el editor.

### 4.7 Componentes existentes que debes reutilizar

`Popover`, `OptionMenu` (menú de carpeta: Rename, New subfolder, Delete), `ConfirmDialog`, `Modal` (nueva carpeta), `SearchField`, `EmptyState`, `Skeleton`, `Icon`, `showToast` y `ApiError` (mostrar `error.message` en 4xx).

---

## 5. Estilos

Crea `src/styles/pages/notes.css` e impórtalo en `styles/index.css`, antes de `motion.css` y `responsive.css`. Usa solo los tokens existentes.

**Layout**

```css
.notes {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 260px;
  height: 100%;
  min-height: 0;
}
.notes-side,
.notes-related {
  overflow-y: auto;
  border-right: 1px solid var(--border);
}
.notes-related {
  border-right: 0;
  border-left: 1px solid var(--border);
}
.notes-pane {
  overflow-y: auto;
  padding: 24px 32px;
}
```

**Árbol de carpetas**

- Filas de 30px con `padding-left: calc(8px + var(--depth) * 14px)`; pasa `--depth` por `style`.
- La activa con `background: var(--surface-2)`; chevron de abrir y cerrar con `Icon`.

**Editor**

```css
.note-editor {
  width: 100%;
  min-height: 60vh;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 16px;
  background: var(--surface);
  color: var(--text);
  font:
    13.5px/1.6 'Geist Mono',
    ui-monospace,
    monospace;
  tab-size: 2;
}
.note-editor:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
```

**Markdown renderizado (`.md`)**

- `max-width: 72ch` para una lectura cómoda.
- `h1`–`h3` con más espacio arriba que abajo.
- `p, ul, ol` con `margin: 0 0 12px`.
- `code` en `var(--surface-2)` con `border-radius: var(--r-xs)`.
- `pre` con `overflow-x: auto`.
- `blockquote` con borde completo y tinte `var(--accent-soft)`; evita la barra lateral sola, que la guía de diseño desaconseja.
- `table` con `border-collapse: collapse` y bordes `var(--border)`.
- `a` con `color: var(--accent)` y `text-underline-offset: 3px`.
- Checkboxes de GFM `input[type=checkbox]` con `accent-color: var(--accent)`.

**Responsive** (en `responsive.css`): por debajo de 900px, una sola columna. El árbol pasa a un `Drawer` o a una vista lista → nota, y las relaciones van debajo de la nota.

---

## 6. Orden de trabajo

Cada paso termina con `npm run typecheck && npm run lint` en verde.

1. **Dominio:** `folder.ts`, `note.ts`, exports y el permiso `note:write`.
2. **API en memoria:**
   - Puertos, adaptadores en memoria, servicios y rutas.
   - Prueba con `curl` o con el cliente HTTP de tu editor, usando `PERSISTENCE=memory`.
3. **Mongo:** modelos, índices, adaptadores y purge. Prueba otra vez con `PERSISTENCE=mongo`, reiniciando el API para confirmar que persiste.
4. **Web, esqueleto:** ruta `/notes`, ítem en el sidebar, `NotesPage` con las tres columnas vacías y `useSearchParams`.
5. **Carpetas:** `useFolders`, `lib/folder-tree.ts`, `FolderTree`, crear, renombrar, mover y borrar.
6. **Notas:** `useNotes`, `NoteList`, crear nota (abre en edición) y borrar con `ConfirmDialog`.
7. **Ver:** instala `react-markdown` y `remark-gfm`, `MarkdownView` y `notes.css`.
8. **Editar y guardar:** `useNoteEditor`, `NoteEditor`, doble clic, `Ctrl/⌘+S`, `Esc`, estado "Saved / Unsaved", guardia de cambios.
9. **Relaciones:** `RelatedNotes`, `NotePicker`, quitar relación, backlinks.
10. **Tiempo real y búsqueda:** eventos SSE y notas en ⌘K (opcional).
11. **Pulido:** estados vacíos, carga y error, foco visible, responsive y revisión en tema claro y oscuro.

---

## 7. Criterios de aceptación

| Paso                | Criterio                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dominio             | `PATCH` con solo `{ title }` no borra el `body`, porque el esquema de edición no tiene defaults                                                     |
| API                 | Otra organización recibe 404 en `GET /api/notes/:id`; un body de 100 001 caracteres da 422; mover una carpeta dentro de su hija da 422              |
| Mongo               | Crear, reiniciar el API y la nota sigue ahí; las listas no incluyen `body`                                                                          |
| Carpetas            | Borrar una carpeta con notas las deja en la carpeta padre, no se pierden                                                                            |
| Ver                 | Tablas, listas de tareas y código se ven bien en claro y oscuro; `<script>` escrito en la nota se muestra como texto, no se ejecuta                 |
| Editar              | Doble clic abre el editor con el Markdown original; `Ctrl+S` y `⌘S` guardan sin abrir el diálogo del navegador; tras guardar aparece "Saved"        |
| Cambios sin guardar | Cambiar de nota o cerrar la pestaña con cambios pide confirmación                                                                                   |
| Relaciones          | Relacionar A→B muestra B en "Related" de A y A en "Mentioned in" de B; borrar B lo quita de A                                                       |
| Tiempo real         | Otro miembro edita una nota y tu lista se actualiza sin recargar                                                                                    |
| Calidad             | Archivos de menos de 200 líneas, funciones de menos de 40 y complejidad de 10 o menos (lo exige ESLint); código en inglés; comentarios de una línea |

---

## 8. Fase 2 (implementada)

- Enlaces `[[Título]]` y `[[Título|texto]]`: el servidor los resuelve al guardar (`mentionIds`), aparecen en "Related" y en "Mentioned in"; escribir `[[` abre el autocompletado; un enlace a una nota que no existe la crea.
- Autoguardado 1,5 s después de dejar de escribir; `Ctrl/⌘+S` sigue guardando al instante.
- Control de versión: el `PATCH` envía `baseUpdatedAt`; si otra persona guardó antes, responde 409 (`note_conflict`) con su versión y la nota ofrece "Use their version" o "Keep mine". Mover o relacionar no cambia la versión.
- Arrastrar notas y carpetas a otra carpeta, o al espacio vacío del árbol para sacarlas al nivel superior.
- Descargar la nota como `.md`.
- `createBrowserRouter` + `useBlocker`: salir de una nota con cambios sin guardar pide confirmación desde cualquier navegación.

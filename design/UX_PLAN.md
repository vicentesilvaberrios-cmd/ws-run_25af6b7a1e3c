# Plan de UX — Fichas de clientes (Momo)

> Cambios incrementales sobre el panel del dueño. Todo el texto en español,
> orientado al usuario final, sin jerga técnica. Reutilizar SIEMPRE el design
> system de `app/globals.css` y respetar el aislamiento por `org_id` (RLS).

---

## 0. Cambio transversal — `app/dashboard/layout.tsx`

**Objetivo:** hacer alcanzable la nueva sección desde la navegación principal.

- Añadir un enlace en el `<nav>` de la `.navbar` con el texto **"Fichas"**
  y `href="/dashboard/clientes"`.
- Mismo patrón visual que los demás enlaces del nav (mismo tamaño, mismo
  espaciado `.navbar nav { gap: var(--sp-4) }`).
- Mantener el orden existente: insertar **"Fichas"** junto a las demás
  secciones del panel (no al final si rompe la jerarquía visual; seguir el
  orden ya establecido por el resto del menú).
- El enlace activo debe marcarse como los demás (estilo actual del nav del
  panel); el dev no introduce variantes nuevas.
- **Accesibilidad:** el `<nav>` ya existente provee el contexto; el enlace
  debe ser operable por teclado (el focus-visible del design system aplica).
- **Responsive:** sin cambios; el nav ya hace `flex-wrap`.

---

## 1. Pantalla — Lista de clientes
**Ruta:** `app/dashboard/clientes/page.tsx` (server component)

**Objetivo del usuario:** ver todas las personas vinculadas al negocio y
abrir la ficha de cualquiera para ver su historial.

**Layout:**
- `<div className="container stack">`
- Encabezado:
  - `<h1>Fichas de clientes</h1>`
  - `<p className="subtitle muted">Personas que han reservado o han sido
    añadidas a tu negocio.</p>`
- Tarjeta principal: `<section className="card">` con título
  `<h2 className="title">Clientes</h2>`.
- Listado dentro de `.table-wrap` con `<table className="table">`.
- Columnas: **Nombre**, **Teléfono**, **Email**.
- Fila clicable (enlace a `/dashboard/clientes/[id]`); el nombre es el
  ancla visible, el resto de la fila también debe ser navegable.
- Orden por defecto: alfabético por nombre (ascendente).

**Estados obligatorios:**
- **Cargando:** envolver el listado en `<Suspense fallback={<p
  className="muted">Cargando…</p>}>` (patrón del resto del panel).
- **Vacío:** `.empty-state` con el texto
  **"Aún no tienes clientes. Aparecerán aquí cuando alguien reserve por
  primera vez."** Sin botón de "crear cliente" (los clientes nacen al
  reservar).
- **Error:** `.alert-error` con el texto
  **"No pudimos cargar los clientes. Inténtalo de nuevo."** y botón
  secundario para reintentar (recarga de la página o `router.refresh()`).
- **Éxito:** el listado en sí; sin toasts.

**Accesibilidad:**
- `<table>` con `<thead>` y `<th scope="col">`.
- Cada fila de cliente envuelta en `<a>` accesible (no anidar `<a>`
  dentro de `<a>`); si el dev prefiere celda con enlace, usar un único
  `<a>` con texto "Ver ficha de {nombre}" y `sr-only` para que el
  contexto del nombre no se pierda al tabular.
- Email y teléfono como texto (no `mailto:`/`tel:` automáticos a menos
  que ya exista ese patrón en el panel).

**Responsive:**
- `.table-wrap` ya permite scroll horizontal en móvil; preferirlo a
  convertir la tabla en tarjetas para mantener consistencia con el resto
  del panel.

---

## 2. Pantalla — Ficha de cliente
**Ruta:** `app/dashboard/clientes/[id]/page.tsx` (server component)

**Objetivo del usuario:** consultar los datos de contacto del cliente, ver
su historial de citas (pasadas y futuras, con estado, incluido "no
asistió") y dejar una nota interna editable.

**Layout (de arriba abajo):**
1. Enlace de retorno: `← Volver a Fichas` → `/dashboard/clientes`,
   `className="text-sm muted"` (mismo patrón que "Volver" en el resto del
   panel).
2. Encabezado: `<h1>{nombre del cliente}</h1>` y, debajo, `.subtitle
   muted` con la fecha de alta, p. ej. **"Cliente desde {fecha}."**
3. **Datos de contacto** — `<section className="card">` con título
   `<h2 className="title">Datos de contacto</h2>` y un `.grid .grid-sm-2`
   con:
   - **Teléfono** (`.kpi` o `.field` de solo lectura con label + valor).
   - **Email** (idem).
   - Si falta un dato, mostrar el valor como `muted` con texto
     **"No indicado"** (no dejar hueco vacío).
4. **Nota libre** — `<section className="card">` con título
   `<h2 className="title">Nota interna</h2>`, breve descripción
   `muted text-sm` **"Información sobre el cliente. Solo la verá tu
   equipo."**, y el componente cliente `<ClientNote initialNote={…}
   clientId={…} />`.
5. **Historial de citas** — `<section className="card">` con título
   `<h2 className="title">Historial de citas</h2>`. Dentro, `.table-wrap`
   con `<table className="table">` y columnas:
   - **Fecha y hora**
   - **Servicio**
   - **Estado** (badge)
   Orden: por fecha ascendente (las más antiguas primero y las futuras al
   final) — esto muestra la evolución del cliente y deja las próximas al
   final, que es lo que el dueño quiere ver de un vistazo.

**Estados del historial:**
- **Vacío:** `.empty-state` con **"Este cliente aún no tiene citas."**
- **Cargando / error:** mismos patrones que el listado.

**Badges de estado (mapeo de dominio):**
- `confirmada` / `confirmado` → **"Confirmada"** `.badge-ok`
- `completada` / `completado` → **"Completada"** `.badge-ok`
- `cancelada` / `cancelado` → **"Cancelada"** `.badge-danger`
- `no_show` / `no_show` → **"No asistió"** `.badge-warn`
- (otros estados no contemplados: **"Pendiente"** `.badge-info` o
  `.badge` neutro; ajustar al estado real de la base de datos — el dev
  debe mapear todos los valores, no dejar ninguno sin badge).
- Acompañar siempre con texto (no solo color) para accesibilidad.

**Accesibilidad:**
- Encabezados en jerarquía correcta: un solo `<h1>`, los bloques
  secundarios con `<h2>`.
- Enlace "Volver" con texto visible (no solo ícono).
- Badges ya cumplen contraste y doble canal (color + texto).

**Responsive:**
- Grid de contacto: `.grid-sm-2` colapsa a una columna en < 640px.
- Tabla del historial en `.table-wrap` (scroll horizontal en móvil).
- La nota y la ficha a ancho completo en móvil.

**Estados de página (no del historial):**
- Si el `id` no existe o no pertenece al `org_id` (RLS lo bloquea),
  mostrar `.empty-state` o `.alert-error` con **"No encontramos esta
  ficha."** y enlace "Volver a Fichas".

---

## 3. Componente cliente — `app/dashboard/clientes/[id]/ClientNote.tsx`

**Objetivo:** permitir al dueño escribir y guardar una nota libre sobre el
cliente, con feedback claro.

**Layout:**
- `<div className="field">` con:
  - `<label htmlFor="client-note">Nota</label>`
  - `<textarea id="client-note" name="note" className="input" rows={4}
    defaultValue={initialNote} placeholder="…" />`
  - Texto de ayuda **"Máximo 1.000 caracteres. No se muestra al cliente."**
    debajo del campo con `aria-describedby="client-note-help"` en el
    textarea.
- `<div className="cluster">` con:
  - `<button type="button" className="btn btn-primary" onClick={save}>`
    con texto **"Guardar nota"** (deshabilitado si no hay cambios o está
    guardando).
  - Mensaje de estado a la derecha (`<span aria-live="polite">`) que
    muestra uno de: `""`, **"Guardando…"**, **"Nota guardada"** o
    **"No pudimos guardar la nota. Inténtalo de nuevo."**.

**Estados:**
- **Inicial:** muestra la nota actual; botón "Guardar nota" deshabilitado
  si no hay cambios respecto a `initialNote`.
- **Editando (con cambios):** botón habilitado.
- **Guardando:** botón con `disabled`, texto **"Guardando…"**; no permitir
  más cambios.
- **Guardado:** mostrar **"Nota guardada"** durante ~3 s y volver al
  estado inicial (botón se deshabilita al coincidir con el valor
  persistido). Actualizar `initialNote` para no permitir doble guardado
  idéntico.
- **Error:** `.alert-error` o `error-text` con el texto
  **"No pudimos guardar la nota. Inténtalo de nuevo."**; mantener el
  contenido del textarea; re-habilitar el botón para reintentar.

**Comportamiento:**
- Sin autoguardado: el guardado es explícito (coherente con el resto del
  panel; evita llamadas innecesarias).
- El `fetch` a `PATCH /api/clients/[id]` debe enviar el cuerpo con la
  clave `note` (es decisión del dev, no de UX). El componente es el
  responsable de traducir respuestas no-2xx al mensaje de error en
  español de arriba (no mostrar el error crudo).
- Tras éxito, `router.refresh()` para mantener coherencia con datos del
  servidor (opcional, recomendado).

**Accesibilidad:**
- `<label>` asociado por `htmlFor` (no anidar el textarea dentro del
  label).
- `aria-invalid="true"` en el textarea solo si la API devuelve error de
  validación de campo.
- Mensaje de estado en `aria-live="polite"` para que lectores de pantalla
  anuncien "Guardando…" / "Nota guardada" / error.
- `disabled` real en el botón (no solo visual).

**Responsive:**
- Textarea a `width: 100%` (la clase `.input` ya lo hace).
- En móvil, el cluster apila botón y mensaje si no caben (ya hace
  `flex-wrap`).

---

## 4. API — `app/api/clients/[id]/route.ts` (sin UI directa)

- Respuestas de error que la UI pueda traducir a mensajes amables:
  - Sin permisos (RLS / no miembro del `org_id`) → 403 → **"No tienes
    permiso para editar esta ficha."**
  - Cliente inexistente o de otro negocio → 404 → **"No encontramos esta
    ficha."**
  - Error de validación → 400 con campo y mensaje en español genérico
    (la UI ya muestra un mensaje de error en español propio).
  - Error de servidor → 500 → **"No pudimos guardar la nota. Inténtalo
    de nuevo."** (es el mismo mensaje que ya muestra el componente).
- El cuerpo del PATCH acepta, al menos, `{ "note": string }`. Longitud
  máxima 1.000 caracteres (acorde al texto de ayuda del componente).
- No exponer nunca `org_id` ni `id` como campos editables (UX no lo
  pide y la guía prohíbe esa superficie).

---

## 5. Consistencia entre pantallas (checklist)

- Mismo `.container` y `.stack` que el resto del panel.
- Mismo patrón de "Volver" (texto + flecha, `muted text-sm`).
- Misma jerarquía: un `<h1>` por pantalla, `<h2 className="title">` para
  secciones de tarjeta.
- Mismos badges (clases del design system) para todos los estados de
  cita, sin inventar variantes.
- Mismo patrón de `.empty-state` y `.alert-error` que el resto del
  panel.
- Mismo `.table-wrap` + `.table` para listados.
- Sin colores hardcodeados, sin estilos ad-hoc; todo vía tokens y clases
  de `app/globals.css`.

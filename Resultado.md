# Resultado — Momo · FIX incremental: Fichas de cliente

Este informe describe **únicamente** lo realmente construido en este run, verificado leyendo
los archivos del workspace. El stack confirmado por los archivos es **Next.js (App Router) +
TypeScript** con **Supabase** (cliente server/client en `lib/supabase/`) y base de datos
Postgres gestionada con migraciones SQL en `supabase/migrations/`.

El trabajo fue un **FIX incremental**: se respetó el esquema existente, el aislamiento
multi-tenant por `org_id` con RLS y el estilo de las funciones `SECURITY DEFINER` previas.
Las migraciones `0001`–`0003` **no se modificaron**; toda la lógica nueva vive en una migración
incremental **`0004_clients.sql`**.

---

## Qué se construyó por módulo

### 1. Base de datos — `supabase/migrations/0004_clients.sql` (NUEVA, incremental)

Migración nueva que agrega, sin tocar las anteriores:

- **(a) Tabla `clients`** por negocio con columnas: `id` (uuid pk), `org_id` (FK a
  `organizations`, `on delete cascade`), `name` (not null), `phone`, `email`,
  `note` (text not null default `''`) y `created_at`.
  - Índices únicos parciales para **evitar duplicados dentro del mismo `org`**:
    `clients_org_email_uniq` (por `org_id, email` cuando email no es vacío) y
    `clients_org_phone_uniq` (por `org_id, phone` cuando phone no es vacío).
  - **RLS habilitada** con políticas en el mismo estilo del resto del esquema:
    `clients_select_member` (SELECT con `is_member(org_id)`),
    `clients_insert_admin`, `clients_update_admin`, `clients_delete_admin`
    (con `is_admin(org_id)`).
- **(b) Vínculo cita↔cliente**: `alter table appointments add column ... client_id uuid`
  (nullable) con FK a `clients(id)` y `on delete set null`.
- **(c) RPC `find_or_create_client(p_org_id, p_name, p_phone, p_email)`** (`SECURITY DEFINER`):
  busca primero por email (normalizado a minúsculas), luego por teléfono dentro del `org`; si
  no existe lo crea; si existe, completa campos faltantes. Devuelve el `uuid` del cliente.
- **(d) `create_appointment(...)`** redefinida (reserva pública): tras validar inputs, negocio,
  servicio, slot disponible y rechazo de pasado, llama a `find_or_create_client` y guarda la
  cita con `client_id`. Conserva el guard de carrera vía `exclusion_violation` (constraint
  `no_overlap_booked`).
- **(e) `owner_create_appointment(...)`** redefinida (alta manual del dueño): valida
  `is_member(org_id)`, los inputs y el servicio, vincula el cliente con `find_or_create_client`
  y guarda la cita con `client_id`, manteniendo el mismo guard de solapamiento.

### 2. Panel del dueño — Pantalla de Fichas

- **`app/dashboard/clientes/page.tsx`** — Lista de clientes del negocio. Server component que
  carga `clients` filtrando por `org_id` (vía `getCurrentOrg()` + cliente Supabase server),
  ordenados por nombre. Muestra tabla con Nombre (enlace a la ficha), Teléfono y Email, con
  estados de error y vacío ("Aún no tienes clientes…"). Usa `Suspense` con fallback de carga.
- **`app/dashboard/clientes/[id]/page.tsx`** — Ficha individual. Carga el cliente por `id` +
  `org_id` (`.single()`) y sus citas (`appointments` con `client_id` + `org_id`, join a
  `services(name)`, orden ascendente por `starts_at`). Renderiza:
  - **Datos de contacto** (teléfono, email).
  - **Nota interna** editable (componente cliente).
  - **Historial de citas** (pasadas y futuras) con `StatusBadge` que cubre estados
    `booked` (Confirmada), `attended` (Completada), `cancelled` (Cancelada) y
    **`no_show` (No asistió)**, más fallback "Pendiente". Fechas formateadas en
    `es-ES`, zona `America/Santiago`. Maneja ficha inexistente con enlace de vuelta.
- **`app/dashboard/clientes/[id]/ClientNote.tsx`** — Componente cliente (`'use client'`) para
  editar la nota libre: textarea con límite de 1.000 caracteres, botón "Guardar nota", estados
  `idle/saving/saved/error`, `aria-live` para accesibilidad y `router.refresh()` tras guardar.
- **`app/api/clients/[id]/route.ts`** — Endpoint `PATCH` que actualiza **solo** el campo `note`.
  Verifica `getCurrentOrg()` (403 si no hay org), valida que `note` sea string ≤ 1.000 chars,
  y actualiza filtrando por `id` + `org_id` (RLS `clients_update_admin` como frontera real).
  Devuelve 400/403/404/500 con mensajes en español.

### 3. Navegación

- **`app/dashboard/layout.tsx`** incluye el enlace **"Fichas"** → `/dashboard/clientes` dentro
  del `<nav>` del panel, junto a Inicio, Resumen, Servicios, Horario y Agenda. La ruta nueva es
  alcanzable desde la navegación.

### 4. Reserva con vinculación (existente, ahora enlaza cliente)

- **`app/api/appointments/route.ts`** (alta manual del dueño) llama a la RPC
  `owner_create_appointment`, que ahora vincula el `client_id`. El `GET` ya selecciona
  `client_id` entre los campos de la cita.
- La reserva pública (`app/api/public/[slug]/appointments`) usa `create_appointment`, también
  redefinida en `0004` para vincular el cliente.

---

## Lista real de archivos generados/afectados en este run

Nuevos:
- `supabase/migrations/0004_clients.sql`
- `app/dashboard/clientes/page.tsx`
- `app/dashboard/clientes/[id]/page.tsx`
- `app/dashboard/clientes/[id]/ClientNote.tsx`
- `app/api/clients/[id]/route.ts`

Modificado (incremental, sin reescritura del resto):
- `app/dashboard/layout.tsx` (enlace "Fichas" en la navegación)

Contexto existente reutilizado (no reescrito): `lib/org.ts`, `lib/supabase/server.ts`,
`lib/supabase/client.ts`, `app/api/appointments/route.ts`, `app/api/public/[slug]/...`.

---

## Cómo correrlo

1. Aplicar migraciones de Supabase (incluye la nueva `0004_clients.sql`) sobre la base del
   proyecto, sin reaplicar manualmente las `0001`–`0003`.
2. Configurar las variables de entorno de Supabase que ya usa el proyecto
   (`lib/supabase/server.ts` / `client.ts`).
3. Instalar dependencias e iniciar la app Next.js:
   - `npm install`
   - `npm run dev` (desarrollo) o `npm run build` + `npm start` (producción).
4. Entrar al panel `/dashboard` y abrir **Fichas** (`/dashboard/clientes`).

---

## Criterios de aceptación CUBIERTOS

- ✅ Tabla `clients` por negocio (`org_id, name, phone, email, created_at`) con RLS por `org_id`
  en el mismo estilo (`is_member`/`is_admin`).
- ✅ Migración **nueva incremental `0004`** sin modificar `0001`–`0003`.
- ✅ `appointments.client_id` nullable agregado con FK `on delete set null`.
- ✅ Búsqueda/creación de cliente sin duplicar dentro del mismo `org` (por email/teléfono),
  vía RPC `find_or_create_client` + índices únicos parciales.
- ✅ Vinculación de la cita al reservar tanto pública (`create_appointment`) como manual
  (`owner_create_appointment`).
- ✅ Pantalla de Fichas: lista de clientes y ficha con datos de contacto + historial de citas
  (pasadas y futuras, con estado incluido **no-show**) + nota libre editable.
- ✅ Ruta nueva alcanzable desde la navegación (enlace "Fichas").
- ✅ Aislamiento por `org_id` y RLS respetados; constraint `no_overlap_booked` intacto.
- ✅ Alcance acotado a las fichas (no se tocaron otros módulos).

## Pendientes / limitaciones reales

- La nota se persiste vía endpoint `PATCH` que actualiza **solo** `note`; no hay edición de
  nombre/teléfono/email del cliente desde la UI de la ficha.
- No existe pantalla para **crear/eliminar** clientes manualmente desde el panel; los clientes
  se materializan al reservar (pública o manual) mediante `find_or_create_client`.
- La lista de clientes no incluye buscador ni paginación.
- Las políticas RLS restringen INSERT/UPDATE/DELETE de `clients` a `is_admin`; la creación
  automática durante la reserva pública depende de que la RPC sea `SECURITY DEFINER`.
- Los tipos de Supabase son intencionalmente mínimos (`lib/database.types.ts` exporta vacío);
  las consultas usan `as unknown as` para tipar los resultados en las páginas.

---

## Despliegue

✅ Desplegado y verificado en Railway (build OK).

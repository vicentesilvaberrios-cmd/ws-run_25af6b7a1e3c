# Plan de UX — Fix formato de hora 24h y zona horaria Chile

> Fix acotado: `lib/format.ts` → `formatTime` usa `hour12: false`, `hourCycle: 'h23'`,
> `timeZone: 'America/Santiago'`. Cambia **cómo se muestran** las horas; no altera
> flujos. La consistencia con el panel (input 24h nativo en editor de horario) es
> ahora total: **todo el producto habla en 24h, hora de Chile, sin AM/PM**.

---

## Alcance del fix (pantallas afectadas)

Las 4 vistas que muestran horas y consumen `formatTime`:

| # | Ruta | Pantalla | Dónde se ve la hora |
|---|------|----------|---------------------|
| 1 | `app/book/[slug]/BookingWizard.tsx` | Wizard público de reserva | Tarjetas de horarios disponibles + resumen de hora elegida |
| 2 | `app/book/[slug]/confirmacion/page.tsx` | Confirmación pública | Bloque "Tu reserva" (fecha + hora) |
| 3 | `app/dashboard/agenda/AgendaList.tsx` | Agenda del panel | KPI "Próxima cita", tabla de citas, lista de huecos del día |
| 4 | `app/dashboard/resumen/page.tsx` | Resumen del panel | Tabla de actividad reciente |

---

## 1. Wizard público de reserva — `app/book/[slug]/BookingWizard.tsx`

- **Objetivo:** que el cliente elija hora sin ambigüedad mañana/tarde.
- **Layout:** sin cambios; `.grid` de tarjetas de slots + bloque de resumen lateral/en panel.
- **Cambio UX:** cada tarjeta de slot muestra solo `HH:MM` (p. ej. `09:30`, `14:30`, `17:00`).
  - Si una hora cae fuera de horario de Chile (p. ej. madrugada UTC mal mapeada) **no debe
    mostrarse** — el fix lo evita. La UI no necesita mensaje nuevo.
- **Copy (sin cambios, solo verificar tono):**
  - Título paso: `"Elige un horario"`
  - Etiqueta del resumen: `"Hora"` (no "Hora (24h)" — es el formato por defecto).
  - Botón siguiente: `"Continuar"`
- **Estados:**
  - Cargando: `"Cargando horarios disponibles…"` (texto breve, no spinner técnico).
  - Vacío: `"No hay horarios disponibles para esta fecha. Prueba otro día."` con CTA
    `"Cambiar fecha"`.
- **Responsive/a11y:** tarjetas en `.grid` con `.grid-sm-2`; cada slot es un botón con
  `aria-label="Reservar a las HH:MM"`.

## 2. Confirmación pública — `app/book/[slug]/confirmacion/page.tsx`

- **Objetivo:** que el cliente confirme visualmente la hora reservada en 24h.
- **Layout:** `.card` con filas `.stack` de datos (servicio, profesional, fecha, hora).
- **Cambio UX:** la fila `"Hora"` muestra `HH:MM` (p. ej. `15:30`), alineado con la hora
  que vio en el wizard.
- **Copy:**
  - Título `h1`: `"¡Reserva confirmada!"`
  - Etiquetas: `"Servicio"`, `"Profesional"`, `"Fecha"`, `"Hora"`.
  - Botón final: `"Volver al inicio"`.
- **A11y:** bloque dentro de `.card` con `role="region"` y `aria-label="Resumen de la reserva"`.

## 3. Agenda del panel — `app/dashboard/agenda/AgendaList.tsx`

- **Objetivo:** agenda del admin coherente con el input 24h del editor de horario.
- **Layout:** sin cambios; `.kpi` arriba + `.table-wrap` con tabla de citas + listado de
  huecos libres del día.
- **Cambio UX:**
  - **KPI "Próxima cita":** `HH:MM` (p. ej. `09:00`) o `"Sin citas próximas"` si vacío.
  - **Columna "Hora"** de la tabla: `HH:MM` (sin sufijo).
  - **Lista de huecos:** `HH:MM` por hueco.
- **Copy (sin cambios):**
  - Título `h1`: `"Agenda"`
  - Cabeceras tabla: `"Hora"`, `"Cliente"`, `"Servicio"`, `"Estado"`.
  - Botón refrescar: `"Actualizar"`.
- **Estados:**
  - Cargando: `"Cargando agenda…"`
  - Vacío: `"No tienes citas para esta fecha. Selecciona otro día o espera nuevas reservas."`
- **Consistencia clave:** las horas de la agenda **deben coincidir 1:1** con las franjas
  configuradas en `app/dashboard/horario/HoursEditor.tsx` (input `<input type="time">` 24h).

## 4. Resumen del panel — `app/dashboard/resumen/page.tsx`

- **Objetivo:** actividad reciente en mismo formato 24h que el resto del panel.
- **Layout:** `.kpi` + `.table-wrap`; sin cambios estructurales.
- **Cambio UX:** columna `"Hora"` de la tabla de actividad reciente → `HH:MM`.
- **Copy:** sin cambios; títulos de dominio (`"Resumen"`, `"Actividad reciente"`).
- **Estados:** vacío → `"Aún no hay actividad. Las nuevas reservas aparecerán aquí."`.

---

## Reglas transversales (consistencia)

- **Idioma:** todo el copy en español; nunca mostrar `"24h"`, `"AM"`, `"PM"` como texto
  visible — el formato 24h **es** el formato por defecto y no necesita etiqueta.
- **Sin jerga:** no aparecen términos técnicos en ninguna pantalla afectada.
- **Design system:** se reutilizan `.card`, `.kpi`, `.table-wrap`, `.badge`, `.empty-state`,
  `.alert-error`; no se introducen estilos nuevos.
- **Responsive:** tablas dentro de `.table-wrap`; grids de slots con `.grid` + `.grid-sm-2`.
- **Accesibilidad:**
  - Horas como texto, **nunca** solo como color.
  - Botones de slot con `aria-label` que incluya la hora completa (`"Reservar a las 14:30"`).
  - Inputs de hora del editor (`HoursEditor`) ya tienen `<label>` asociado y
    `aria-describedby` para errores.
- **Migración visible para el usuario:** ninguna. El fix es invisible cuando funciona bien;
  si una hora se mostrara fuera de horario de Chile (regresión), `.alert-error` en la zona
  correspondiente con `"No pudimos cargar los horarios. Intenta de nuevo."` + botón
  `"Reintentar"`.
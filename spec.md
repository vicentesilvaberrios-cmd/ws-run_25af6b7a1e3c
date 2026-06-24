# Solicitud de cambios (modo fix)

Momo (FIX incremental). NO reescribas lo existente; respeta esquema, RLS/multi-tenant (org_id), estilo y el constraint no_overlap_booked. Agrega SOLO la funcionalidad de FICHAS DE CLIENTE:

1. Tabla de clientes por negocio (org_id, nombre, teléfono, email, created_at) con RLS por org_id (igual que el resto). Migración NUEVA incremental 0004 en supabase/migrations (NO modifiques 0001-0003).
2. Vincular citas con clientes: agrega client_id (nullable) a appointments. Al reservar desde la página pública o al crear una cita manual, busca o crea el cliente del negocio por email/teléfono (sin duplicar dentro del mismo org) y vincula la cita.
3. Pantalla de FICHAS en el panel del dueño: lista de clientes y, al abrir uno, su ficha con datos de contacto + historial de citas (pasadas y futuras, con estado incluido no-show) + una nota libre editable.

Requisitos: toda ruta nueva alcanzable desde la navegación; respeta RLS y el aislamiento por org_id; mantén el alcance acotado a las fichas.
-- ============================================================
-- ETHER — Migración Sprint 5: Nuevos campos de perfil y permisos
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ───────────────────────────────
-- TABLA: profiles — nuevos campos de identidad
-- ───────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS document_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- ───────────────────────────────
-- TABLA: user_permissions — 3 permisos adicionales
-- ───────────────────────────────
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS can_assign_technicians BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_finance       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_compliance  BOOLEAN DEFAULT false;

-- Preset: ORG_ADMIN ya existentes → activar nuevos permisos
UPDATE public.user_permissions
SET
  can_assign_technicians = true,
  can_view_finance       = true,
  can_manage_compliance  = true
WHERE profile_id IN (
  SELECT id FROM public.profiles WHERE role = 'ORG_ADMIN'
);

-- Preset: ANALYST → finanzas y compliance
UPDATE public.user_permissions
SET
  can_view_finance      = true,
  can_manage_compliance = true
WHERE profile_id IN (
  SELECT id FROM public.profiles WHERE role = 'ANALYST'
);

-- Preset: BUILDING_MANAGER → asignar técnicos
UPDATE public.user_permissions
SET
  can_assign_technicians = true
WHERE profile_id IN (
  SELECT id FROM public.profiles WHERE role = 'BUILDING_MANAGER'
);

-- ============================================================
-- FIN
-- ============================================================

-- ============================================================
-- ETHER — Migración RLS Multi-Tenant (Producción)
-- Reemplaza las políticas abiertas USING(true) del desarrollo
-- con políticas reales que filtran por org_id.
--
-- INSTRUCCIONES:
-- 1. Abre Supabase Dashboard → SQL Editor
-- 2. Pega y ejecuta este script completo
-- 3. Verifica en Authentication → Policies que se crearon
-- ============================================================

-- ───────────────────────────────
-- HELPER: función en esquema PUBLIC (auth no tiene permisos de escritura)
-- ───────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ───────────────────────────────
-- TABLA: organizations
-- Solo puede ver su propia organización
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON organizations;
DROP POLICY IF EXISTS "org_select_own" ON organizations;
DROP POLICY IF EXISTS "org_update_own" ON organizations;

CREATE POLICY "org_select_own" ON organizations
  FOR SELECT USING (id = public.get_user_org_id());

CREATE POLICY "org_update_own" ON organizations
  FOR UPDATE USING (id = public.get_user_org_id());

-- ───────────────────────────────
-- TABLA: profiles
-- Puede ver y editar perfiles de su misma organización
-- Siempre puede ver su propio perfil (bootstrap inicial)
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own_org" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_org" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_service" ON profiles;

CREATE POLICY "profiles_select_own_org" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR org_id = public.get_user_org_id()
  );

CREATE POLICY "profiles_update_own_org" ON profiles
  FOR UPDATE USING (
    id = auth.uid() OR org_id = public.get_user_org_id()
  );

CREATE POLICY "profiles_insert_service" ON profiles
  FOR INSERT WITH CHECK (true);
  -- Inserts solo los hace el trigger handle_new_user (SECURITY DEFINER)
  -- y createEtherUser con service_role. Ambos bypasan RLS.

-- ───────────────────────────────
-- TABLA: user_permissions
-- Solo ve permisos de usuarios de su org
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON user_permissions;
DROP POLICY IF EXISTS "permissions_own_org" ON user_permissions;

CREATE POLICY "permissions_own_org" ON user_permissions
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE org_id = public.get_user_org_id()
    )
  );

-- ───────────────────────────────
-- TABLA: buildings
-- Solo ve edificios de su organización
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON buildings;
DROP POLICY IF EXISTS "buildings_own_org" ON buildings;

CREATE POLICY "buildings_own_org" ON buildings
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- ───────────────────────────────
-- TABLA: areas
-- Solo ve áreas de su organización
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON areas;
DROP POLICY IF EXISTS "areas_own_org" ON areas;

CREATE POLICY "areas_own_org" ON areas
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- ───────────────────────────────
-- TABLA: maintenance_incidents
-- Solo ve incidentes de su organización
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON maintenance_incidents;
DROP POLICY IF EXISTS "incidents_own_org" ON maintenance_incidents;

CREATE POLICY "incidents_own_org" ON maintenance_incidents
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- ───────────────────────────────
-- TABLA: incident_comments
-- Solo ve comentarios de incidentes de su org
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON incident_comments;
DROP POLICY IF EXISTS "comments_own_org" ON incident_comments;

CREATE POLICY "comments_own_org" ON incident_comments
  FOR ALL USING (
    incident_id IN (
      SELECT id FROM maintenance_incidents WHERE org_id = public.get_user_org_id()
    )
  );

-- ───────────────────────────────
-- TABLA: technician_assignments
-- Solo ve asignaciones de su organización
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON technician_assignments;
DROP POLICY IF EXISTS "assignments_own_org" ON technician_assignments;

CREATE POLICY "assignments_own_org" ON technician_assignments
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- ───────────────────────────────
-- TABLA: assets_inventory
-- Solo ve activos de su organización
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON assets_inventory;
DROP POLICY IF EXISTS "assets_own_org" ON assets_inventory;

CREATE POLICY "assets_own_org" ON assets_inventory
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- ───────────────────────────────
-- TABLA: qr_codes_matrix
-- Solo ve QRs de su organización
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON qr_codes_matrix;
DROP POLICY IF EXISTS "qr_own_org" ON qr_codes_matrix;

CREATE POLICY "qr_own_org" ON qr_codes_matrix
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- ───────────────────────────────
-- TABLA: audit_logs_3100
-- No tiene org_id directo — filtra a través de maintenance_incidents
-- ───────────────────────────────
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON audit_logs_3100;
DROP POLICY IF EXISTS "audit_own_org" ON audit_logs_3100;

CREATE POLICY "audit_own_org" ON audit_logs_3100
  FOR ALL USING (
    incident_id IN (
      SELECT id FROM maintenance_incidents WHERE org_id = public.get_user_org_id()
    )
  );

-- ============================================================
-- FIN DE MIGRACIÓN
-- Verifica en Dashboard → Authentication → Policies
-- ============================================================

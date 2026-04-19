-- ==============================================================================
-- 🚀 ETHER COMMAND CENTER: MEGA SCHEMA SQL (VERSIÓN 3.1 FINAL)
-- ¡Corre todo este código en el SQL Editor de Supabase y tendrás la plataforma lista!
-- ==============================================================================

-- ==========================================
-- 🏢 1. NIVEL MULTITENANT Y GUBERNAMENTAL
-- ==========================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status_active BOOLEAN DEFAULT true,
  max_users INT DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- Mapea a auth.users(id)
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'INCIDENT_CREATOR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  can_create_building BOOLEAN DEFAULT false,
  can_export_pdf BOOLEAN DEFAULT false,
  can_delete_users BOOLEAN DEFAULT false
);

-- ==========================================
-- 🌍 2. NIVEL GEOGRÁFICO E INVENTARIOS
-- ==========================================

CREATE TABLE IF NOT EXISTS buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  status VARCHAR(50) DEFAULT 'Operativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  risk_level VARCHAR(50) DEFAULT 'Nivel 1: Básico'
);

CREATE TABLE IF NOT EXISTS assets_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Activo'
);

CREATE TABLE IF NOT EXISTS technician_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(profile_id, area_id)
);

-- ==========================================
-- 📸 3. MATRIZ POLIMÓRFICA DE CÓDIGOS QR
-- ==========================================

CREATE TABLE IF NOT EXISTS qr_codes_matrix (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'BUILDING', 'AREA', o 'ASSET'
  entity_id UUID NOT NULL,
  code_hash VARCHAR(255) UNIQUE NOT NULL 
);

-- ==========================================
-- 🔧 4. MOTOR DE TICKETS Y EVIDENCIA
-- ==========================================

CREATE TABLE IF NOT EXISTS maintenance_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Jerarcas del ticket
  creator_id UUID REFERENCES profiles(id) ON DELETE NO ACTION NOT NULL,
  assigned_tech_id UUID REFERENCES profiles(id) ON DELETE NO ACTION,
  
  -- Dónde pasó 
  building_id UUID REFERENCES buildings(id) ON DELETE NO ACTION NOT NULL,
  area_id UUID REFERENCES areas(id) ON DELETE NO ACTION,
  asset_id UUID REFERENCES assets_inventory(id) ON DELETE NO ACTION,
  
  -- Detalles de Falla y Foto/Video
  requirement_type VARCHAR(100) NOT NULL,
  equipment_name VARCHAR(255),
  description TEXT,
  media_url TEXT, -- <--- Aquí la base de datos guardará tu foto
  
  -- Status y Predictiva
  status VARCHAR(50) DEFAULT 'Abierto',
  urgency_level VARCHAR(50) DEFAULT 'Moderado',
  ai_risk_score INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS audit_logs_3100 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID REFERENCES maintenance_incidents(id) ON DELETE CASCADE NOT NULL,
  actor_profile_id UUID REFERENCES profiles(id) ON DELETE NO ACTION NOT NULL,
  action_taken TEXT NOT NULL,
  log_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 🤖 5. AUTOMATIZACIÓN DE NUEVOS REGISTROS (TRIGGER)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  IF new.raw_user_meta_data->>'organization' IS NOT NULL THEN
     INSERT INTO public.organizations (name) 
     VALUES (new.raw_user_meta_data->>'organization') 
     RETURNING id INTO new_org_id;
  END IF;

  INSERT INTO public.profiles (id, org_id, email, name, role)
  VALUES (
    new.id, 
    new_org_id,
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'Usuario Nuevo'), 
    COALESCE(new.raw_user_meta_data->>'role', 'ORG_ADMIN')
  );
  
  INSERT INTO public.user_permissions (profile_id) VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 📂 6. CREADOR DE STORAGE PÚBLICO (Para las fotos/videos de incidencia)
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('incidents-media', 'incidents-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Fotos de acceso global temporal" ON storage.objects FOR ALL USING (bucket_id = 'incidents-media');

-- ==========================================
-- 🔒 7. CONFIGURACIÓN RLS (Temporal ABIERTA en desarrollo frontend)
-- ==========================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs_3100 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON organizations;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON organizations FOR ALL USING (true);
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON profiles;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON profiles FOR ALL USING (true);
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON user_permissions;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON user_permissions FOR ALL USING (true);
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON buildings;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON buildings FOR ALL USING (true);
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON areas;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON areas FOR ALL USING (true);
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON assets_inventory;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON assets_inventory FOR ALL USING (true);
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON technician_assignments;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON technician_assignments FOR ALL USING (true);
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON qr_codes_matrix;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON qr_codes_matrix FOR ALL USING (true);
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON maintenance_incidents;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON maintenance_incidents FOR ALL USING (true);
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON audit_logs_3100;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON audit_logs_3100 FOR ALL USING (true);

-- ======================================================================
-- MÓDULO SOLICITANTE ÉLITE Y CALIDAD (V2)
-- ======================================================================

-- 1. Añadir columnas de métricas de calidad, SLA y voz al incidente
ALTER TABLE public.maintenance_incidents
ADD COLUMN IF NOT EXISTS rating_quality INTEGER CHECK (rating_quality >= 1 AND rating_quality <= 5),
ADD COLUMN IF NOT EXISTS rating_presentation INTEGER CHECK (rating_presentation >= 1 AND rating_presentation <= 5),
ADD COLUMN IF NOT EXISTS rating_solution INTEGER CHECK (rating_solution >= 1 AND rating_solution <= 5),
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS technician_in_transit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transcribed_text TEXT;

-- 2. Tabla de Mensajería y Expediente del Ticket
CREATE TABLE IF NOT EXISTS public.incident_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES public.maintenance_incidents(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de Seguridad (Desarrollo Libre)
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "DESARROLLO Activar FULL ACCESO" ON incident_comments;
CREATE POLICY "DESARROLLO Activar FULL ACCESO" ON incident_comments FOR ALL USING (true);

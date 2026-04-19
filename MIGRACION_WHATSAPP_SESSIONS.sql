-- Tabla para persistir el estado de conversaciones WhatsApp entrantes
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  step        TEXT NOT NULL DEFAULT 'START',
  problem     TEXT,
  area_text   TEXT,
  urgency     TEXT,
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar sesiones activas por teléfono rápidamente
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone_step
  ON whatsapp_sessions (phone, step);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_whatsapp_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_whatsapp_sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_session_timestamp();

-- RLS: solo el service role puede leer/escribir (acceso desde Server Actions)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON whatsapp_sessions
  FOR ALL
  USING (true);

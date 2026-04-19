import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { building_id, area_id, floor, description, urgency_level, requirement_type, equipment_name, media_url, reporter_name, reporter_phone } = body;

  if (!description?.trim()) return NextResponse.json({ error: 'Descripción requerida' }, { status: 400 });

  const supabase = createAdminClient();

  // Resolver org_id desde building_id
  let orgId: string | null = null;
  if (building_id) {
    const { data: b } = await supabase.from('buildings').select('org_id').eq('id', building_id).single();
    orgId = b?.org_id ?? null;
  }
  if (!orgId) {
    const { data: org } = await supabase.from('organizations').select('id').eq('status_active', true).limit(1).single();
    orgId = org?.id ?? null;
  }

  const { data: incident, error } = await supabase
    .from('maintenance_incidents')
    .insert([{
      org_id:           orgId,
      building_id:      building_id || null,
      area_id:          area_id || null,
      description,
      urgency_level:    urgency_level ?? 'Moderado',
      requirement_type: requirement_type ?? 'Mantenimiento Correctivo',
      equipment_name:   equipment_name || null,
      media_url:        media_url || null,
      status:           'Abierto',
      transcribed_text: reporter_name || reporter_phone
        ? `Reportado por: ${reporter_name || 'Anónimo'}${reporter_phone ? ` · WA: ${reporter_phone}` : ''}${floor ? ` · Piso ${floor}` : ''}`
        : `Ticket creado vía QR público${floor ? ` · Piso ${floor}` : ''}`,
    }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notificar técnico del área vía WhatsApp (fire-and-forget)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  fetch(`${base}/api/whatsapp/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incident_id: incident.id }),
  }).catch(() => null);

  return NextResponse.json({ id: incident.id });
}

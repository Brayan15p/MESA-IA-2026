import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsApp } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  const { incident_id } = await req.json();

  if (!incident_id) {
    return NextResponse.json({ error: 'incident_id requerido' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Cargar el ticket con datos de área, edificio y creador
  const { data: incident, error: incidentError } = await supabase
    .from('maintenance_incidents')
    .select(`
      id,
      description,
      urgency_level,
      requirement_type,
      equipment_name,
      area_id,
      building_id,
      org_id,
      areas ( name ),
      buildings ( name )
    `)
    .eq('id', incident_id)
    .single();

  if (incidentError || !incident) {
    return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
  }

  // Buscar técnico asignado al área
  let techPhone: string | null = null;
  let techName: string | null = null;

  if (incident.area_id) {
    const { data: assignment } = await supabase
      .from('technician_assignments')
      .select('profile_id, profiles ( name, phone )')
      .eq('area_id', incident.area_id)
      .limit(1)
      .single();

    if (assignment?.profiles) {
      const profile = assignment.profiles as any;
      techPhone = profile.phone ?? null;
      techName = profile.name ?? null;
    }
  }

  // Si no hay técnico en el área, buscar técnico de la org (fallback)
  if (!techPhone && incident.org_id) {
    const { data: fallback } = await supabase
      .from('profiles')
      .select('name, phone')
      .eq('org_id', incident.org_id)
      .eq('role', 'TECHNICIAN')
      .eq('is_active', true)
      .not('phone', 'is', null)
      .limit(1)
      .single();

    if (fallback) {
      techPhone = fallback.phone ?? null;
      techName = fallback.name ?? null;
    }
  }

  if (!techPhone) {
    return NextResponse.json({ sent: false, reason: 'Técnico sin número de teléfono registrado' });
  }

  const areaName = (incident.areas as any)?.name ?? 'Área no especificada';
  const buildingName = (incident.buildings as any)?.name ?? 'Sede no especificada';
  const urgencyEmoji = incident.urgency_level === 'Crítico' ? '🔴' : incident.urgency_level === 'Moderado' ? '🟡' : '🟢';
  const shortId = incident_id.slice(0, 8).toUpperCase();

  const message =
    `🚨 *Nuevo Ticket ETHER — #${shortId}*\n\n` +
    `${urgencyEmoji} *Urgencia:* ${incident.urgency_level}\n` +
    `📋 *Tipo:* ${incident.requirement_type}\n` +
    `📍 *Ubicación:* ${buildingName} › ${areaName}\n` +
    (incident.equipment_name ? `🔧 *Equipo:* ${incident.equipment_name}\n` : '') +
    `📝 *Descripción:* ${incident.description}\n\n` +
    `Ingresa al sistema ETHER para gestionar esta incidencia.`;

  await sendWhatsApp(techPhone, message);

  return NextResponse.json({ sent: true, to: techName });
}

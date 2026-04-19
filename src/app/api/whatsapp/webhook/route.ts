import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsApp } from '@/lib/twilio';
import {
  WhatsAppSession,
  getGreeting,
  getAreaQuestion,
  getUrgencyQuestion,
  getConfirmMessage,
  parseUrgency,
  isConfirm,
  isCancel,
} from '@/lib/whatsapp-flow';

// Twilio envía form-urlencoded
async function parseTwilioBody(req: NextRequest): Promise<Record<string, string>> {
  const text = await req.text();
  const params: Record<string, string> = {};
  for (const pair of text.split('&')) {
    const [k, v] = pair.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent((v ?? '').replace(/\+/g, ' '));
  }
  return params;
}

export async function POST(req: NextRequest) {
  const body = await parseTwilioBody(req);
  const rawFrom: string = body['From'] ?? '';
  const incomingMsg: string = (body['Body'] ?? '').trim();
  const phone = rawFrom.replace('whatsapp:', '');

  if (!phone || !incomingMsg) {
    return new NextResponse('', { status: 200 });
  }

  const supabase = createAdminClient();

  // Cargar o crear sesión
  let session: WhatsAppSession | null = null;
  const { data: existing } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone', phone)
    .neq('step', 'DONE')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  session = existing as WhatsAppSession | null;

  // --- Sin sesión activa: iniciar flujo ---
  if (!session) {
    const { data: newSession } = await supabase
      .from('whatsapp_sessions')
      .insert([{ phone, step: 'WAITING_PROBLEM' }])
      .select()
      .single();

    session = newSession as WhatsAppSession;
    await sendWhatsApp(phone, getGreeting());
    return new NextResponse('', { status: 200 });
  }

  const step = session.step;

  // --- Máquina de estados ---
  if (step === 'WAITING_PROBLEM') {
    await supabase
      .from('whatsapp_sessions')
      .update({ step: 'WAITING_AREA', problem: incomingMsg })
      .eq('id', session.id);
    await sendWhatsApp(phone, getAreaQuestion());

  } else if (step === 'WAITING_AREA') {
    await supabase
      .from('whatsapp_sessions')
      .update({ step: 'WAITING_URGENCY', area_text: incomingMsg })
      .eq('id', session.id);
    await sendWhatsApp(phone, getUrgencyQuestion());

  } else if (step === 'WAITING_URGENCY') {
    const urgency = parseUrgency(incomingMsg);
    if (!urgency) {
      await sendWhatsApp(phone, '⚠️ Responde *1* (Leve), *2* (Moderado) o *3* (Crítico).');
      return new NextResponse('', { status: 200 });
    }
    const updated = { ...session, urgency };
    await supabase
      .from('whatsapp_sessions')
      .update({ step: 'WAITING_CONFIRM', urgency })
      .eq('id', session.id);
    await sendWhatsApp(phone, getConfirmMessage(updated));

  } else if (step === 'WAITING_CONFIRM') {
    if (isCancel(incomingMsg)) {
      await supabase.from('whatsapp_sessions').update({ step: 'DONE' }).eq('id', session.id);
      await sendWhatsApp(phone, '❌ Solicitud cancelada. Escríbenos cuando necesites reportar algo.');
      return new NextResponse('', { status: 200 });
    }

    if (!isConfirm(incomingMsg)) {
      await sendWhatsApp(phone, 'Responde *SI* para confirmar o *NO* para cancelar.');
      return new NextResponse('', { status: 200 });
    }

    // Crear ticket en la base de datos
    // Intentar mapear area_text a un area_id real
    const { data: areas } = await supabase
      .from('areas')
      .select('id, name')
      .ilike('name', `%${session.area_text}%`)
      .limit(1);

    const areaId = areas?.[0]?.id ?? null;

    // Obtener org_id por defecto (primera org activa) o asociada al área
    let orgId = session.org_id ?? null;
    if (!orgId && areaId) {
      const { data: area } = await supabase.from('areas').select('org_id').eq('id', areaId).single();
      orgId = area?.org_id ?? null;
    }
    if (!orgId) {
      const { data: org } = await supabase.from('organizations').select('id').eq('status_active', true).limit(1).single();
      orgId = org?.id ?? null;
    }

    const { data: newIncident, error: insertError } = await supabase
      .from('maintenance_incidents')
      .insert([{
        org_id: orgId,
        description: session.problem,
        area_id: areaId,
        urgency_level: session.urgency,
        requirement_type: 'Mantenimiento Correctivo',
        status: 'Abierto',
        transcribed_text: `Ticket creado vía WhatsApp desde ${phone}. Área indicada: ${session.area_text}`,
      }])
      .select('id')
      .single();

    if (insertError || !newIncident) {
      await sendWhatsApp(phone, '❌ Hubo un error al crear el ticket. Intenta de nuevo o contacta directamente al equipo.');
      return new NextResponse('', { status: 200 });
    }

    await supabase.from('whatsapp_sessions').update({ step: 'DONE' }).eq('id', session.id);

    const shortId = newIncident.id.slice(0, 8).toUpperCase();
    await sendWhatsApp(
      phone,
      `✅ *Ticket #${shortId} creado exitosamente*\n\n` +
      `Tu solicitud fue registrada en el sistema ETHER y el equipo técnico ha sido notificado.\n\n` +
      `📋 *Problema:* ${session.problem}\n` +
      `📍 *Área:* ${session.area_text}\n` +
      `⚠️ *Urgencia:* ${session.urgency}\n\n` +
      `Recibirás actualizaciones por este medio. ¡Gracias!`
    );

    // Notificar al técnico del área
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/whatsapp/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_id: newIncident.id }),
    });
  }

  return new NextResponse('', { status: 200 });
}

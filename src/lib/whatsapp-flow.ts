export type FlowStep =
  | 'START'
  | 'WAITING_PROBLEM'
  | 'WAITING_AREA'
  | 'WAITING_URGENCY'
  | 'WAITING_CONFIRM'
  | 'DONE';

export interface WhatsAppSession {
  id?: string;
  phone: string;
  step: FlowStep;
  problem?: string;
  area_text?: string;
  urgency?: string;
  org_id?: string;
  created_at?: string;
  updated_at?: string;
}

export function getGreeting(): string {
  return (
    '🏥 *ETHER — Mesa de Ayuda*\n\n' +
    'Hola! Soy el asistente de mantenimiento. Te ayudaré a registrar tu solicitud.\n\n' +
    '¿Cuál es el problema o daño que encontraste? Descríbelo brevemente.'
  );
}

export function getAreaQuestion(): string {
  return '📍 ¿En qué área o piso está el problema? (Ej: Urgencias, Piso 2, UCI, Farmacia)';
}

export function getUrgencyQuestion(): string {
  return (
    '⚠️ ¿Qué tan urgente es?\n\n' +
    '1️⃣ *Leve* — Puede esperar días\n' +
    '2️⃣ *Moderado* — Hay que atenderlo este turno\n' +
    '3️⃣ *Crítico* — Peligro inmediato\n\n' +
    'Responde *1*, *2* o *3*.'
  );
}

export function getConfirmMessage(session: WhatsAppSession): string {
  return (
    '✅ *Confirmación de Solicitud*\n\n' +
    `📋 *Problema:* ${session.problem}\n` +
    `📍 *Área:* ${session.area_text}\n` +
    `⚠️ *Urgencia:* ${session.urgency}\n\n` +
    '¿Confirmas el envío? Responde *SI* para crear el ticket o *NO* para cancelar.'
  );
}

export function parseUrgency(msg: string): string | null {
  const m = msg.trim().toLowerCase();
  if (m === '1' || m.includes('leve')) return 'Leve';
  if (m === '2' || m.includes('moderado')) return 'Moderado';
  if (m === '3' || m.includes('critico') || m.includes('crítico')) return 'Crítico';
  return null;
}

export function isConfirm(msg: string): boolean {
  const m = msg.trim().toLowerCase();
  return m === 'si' || m === 'sí' || m === 'yes' || m === 's';
}

export function isCancel(msg: string): boolean {
  const m = msg.trim().toLowerCase();
  return m === 'no' || m === 'n' || m === 'cancelar';
}

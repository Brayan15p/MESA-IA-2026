'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QrCode, Building2, MapPin, ShieldAlert, Loader2, CheckCircle2, ImageIcon, Paperclip } from 'lucide-react';

function ReportContent() {
  const params     = useSearchParams();
  const buildingId = params.get('building_id') || '';
  const areaId     = params.get('area_id')     || '';
  const floor      = params.get('floor')       || '';

  const [building, setBuilding]   = useState('');
  const [area, setArea]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [ticketId, setTicketId]   = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError]         = useState('');

  const [form, setForm] = useState({
    requirement_type: 'Mantenimiento Correctivo (Rotura)',
    description:      '',
    urgency_level:    'Moderado',
    equipment_name:   '',
    reporter_name:    '',
    reporter_phone:   '',
  });

  useEffect(() => {
    if (!buildingId) return;
    fetch(`/api/report/location?building_id=${buildingId}&area_id=${areaId}`)
      .then(r => r.json())
      .then(d => { setBuilding(d.building ?? ''); setArea(d.area ?? ''); })
      .catch(() => {});
  }, [buildingId, areaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { setError('Describe el problema antes de enviar.'); return; }
    setSubmitting(true);
    setError('');

    let mediaUrl = '';
    if (mediaFile) {
      const fd = new FormData();
      fd.append('file', mediaFile);
      fd.append('building_id', buildingId);
      const up = await fetch('/api/report/upload', { method: 'POST', body: fd });
      if (up.ok) { const d = await up.json(); mediaUrl = d.url ?? ''; }
    }

    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, building_id: buildingId, area_id: areaId, floor, media_url: mediaUrl }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? 'Error al crear el ticket'); return; }
    setTicketId((data.id ?? '').slice(0, 8).toUpperCase());
    setSuccess(true);
  };

  if (success) return (
    <div className="text-center space-y-5 py-6">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">¡Reporte Enviado!</h2>
      <p className="text-zinc-400 text-sm">Ticket <span className="text-fuchsia-400 font-bold">#{ticketId}</span> registrado. El equipo técnico fue notificado.</p>
      <button onClick={() => { setSuccess(false); setForm(f => ({ ...f, description: '', equipment_name: '', reporter_name: '', reporter_phone: '' })); setMediaFile(null); }}
        className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors">
        Reportar otro problema
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Ubicación */}
      {(building || area || floor) && (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          {building && <span className="flex items-center gap-2 text-sm text-purple-200"><Building2 className="w-4 h-4 text-purple-400 shrink-0"/>{building}</span>}
          {floor && !area && <span className="flex items-center gap-2 text-sm text-purple-200"><MapPin className="w-4 h-4 text-indigo-400 shrink-0"/>Piso {floor}</span>}
          {area     && <span className="flex items-center gap-2 text-sm text-purple-200"><MapPin className="w-4 h-4 text-fuchsia-400 shrink-0"/>{area}</span>}
        </div>
      )}

      {/* Urgencia */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Urgencia</label>
        <div className="grid grid-cols-3 gap-2">
          {(['Leve','Moderado','Crítico'] as const).map(u => (
            <button key={u} type="button" onClick={() => setForm(f => ({...f, urgency_level: u}))}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                form.urgency_level === u
                  ? u==='Crítico' ? 'bg-rose-600 border-rose-500 text-white' : u==='Moderado' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-emerald-700 border-emerald-500 text-white'
                  : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'}`}>
              {u==='Leve'?'🟢':u==='Moderado'?'🟡':'🔴'} {u}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tipo de Problema</label>
        <select value={form.requirement_type} onChange={e => setForm(f=>({...f, requirement_type: e.target.value}))}
          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none text-sm">
          <option>Mantenimiento Correctivo (Rotura)</option>
          <option>Soporte Preventivo</option>
          <option>Falla Eléctrica / Red</option>
          <option>Riesgo Estructural</option>
        </select>
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">¿Qué está fallando? *</label>
        <textarea required rows={3} value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))}
          placeholder="Describe el daño con el mayor detalle posible..."
          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:border-fuchsia-500/50 outline-none resize-none text-sm"/>
      </div>

      {/* Equipo */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Equipo afectado</label>
        <input type="text" value={form.equipment_name} onChange={e => setForm(f=>({...f, equipment_name: e.target.value}))}
          placeholder="Ej: Ascensor, Caldera, Aire acondicionado..."
          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:border-fuchsia-500/50 outline-none text-sm"/>
      </div>

      {/* Foto */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Paperclip className="w-3 h-3"/>Foto del daño</label>
        {mediaFile ? (
          <div className="relative rounded-xl overflow-hidden border border-fuchsia-500/30">
            <img src={URL.createObjectURL(mediaFile)} alt="preview" className="w-full h-32 object-cover"/>
            <button type="button" onClick={()=>setMediaFile(null)}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-rose-600 transition-colors">✕</button>
          </div>
        ) : (
          <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-white/10 cursor-pointer hover:border-fuchsia-500/40 transition-colors">
            <ImageIcon className="w-5 h-5 text-fuchsia-400"/>
            <span className="text-sm text-zinc-500">Tomar foto o subir desde galería</span>
            <input type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={e=>setMediaFile(e.target.files?.[0]||null)}/>
          </label>
        )}
      </div>

      {/* Nombre y teléfono */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tu nombre</label>
          <input type="text" value={form.reporter_name} onChange={e=>setForm(f=>({...f, reporter_name: e.target.value}))}
            placeholder="Opcional"
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:border-fuchsia-500/50 outline-none text-sm"/>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">WhatsApp</label>
          <input type="tel" value={form.reporter_phone} onChange={e=>setForm(f=>({...f, reporter_phone: e.target.value}))}
            placeholder="+57 300..."
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:border-fuchsia-500/50 outline-none text-sm"/>
        </div>
      </div>

      {error && <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] text-base">
        {submitting ? <><Loader2 className="w-5 h-5 animate-spin"/>Enviando...</> : <><ShieldAlert className="w-5 h-5"/>Lanzar Alerta al Equipo</>}
      </button>
    </form>
  );
}

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-[#030008] text-zinc-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-500/20 px-4 py-2 rounded-full mb-3">
            <QrCode className="w-4 h-4 text-fuchsia-400"/>
            <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-widest">Reporte por QR · Sin login</span>
          </div>
          <h1 className="text-xl font-bold text-white">Reportar Incidente</h1>
          <p className="text-xs text-zinc-600 mt-1">Tu reporte llega directo al equipo técnico.</p>
        </div>
        <div className="bg-[#0a0118]/80 border border-purple-500/20 rounded-[2rem] p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(109,40,217,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500"/>
          <Suspense fallback={<div className="text-center py-8 text-zinc-500">Cargando...</div>}>
            <ReportContent/>
          </Suspense>
        </div>
        <p className="text-center text-xs text-zinc-700 mt-4">✦ ETHER · Sistema de Gestión de Mantenimiento</p>
      </div>
    </div>
  );
}

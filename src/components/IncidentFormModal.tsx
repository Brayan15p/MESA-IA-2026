'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Paperclip, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface IncidentFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialDescription?: string;
}

export default function IncidentFormModal({ onClose, onSuccess, initialDescription = '' }: IncidentFormModalProps) {
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<any[]>([]);

  const [form, setForm] = useState({
    requirement_type: 'Mantenimiento Correctivo',
    equipment_name: '',
    description: initialDescription,
    building_id: '',
    area_id: '',
    urgency_level: 'Moderado'
  });
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('org_id, role, name, id').eq('id', user.id).single();
        if (!profile) return;
        setUserProfile(profile);

        const { data: bData } = await supabase.from('buildings').select('*').eq('org_id', profile.org_id).order('name');
        if (bData) setBuildings(bData);

        const { data: aData } = await supabase.from('areas').select('*').eq('org_id', profile.org_id).order('name');
        if (aData) setAreas(aData);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (form.building_id) {
      setFilteredAreas(areas.filter(a => a.building_id === form.building_id));
    } else {
      setFilteredAreas([]);
    }
  }, [form.building_id, areas]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if(e.target.files && e.target.files.length > 0) {
        setMediaFile(e.target.files[0]);
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.building_id) { alert('⚠️ Selecciona la Sede afectada antes de continuar.'); return; }
    if (!form.description) { alert('⚠️ Describe el síntoma o daño detectado.'); return; }

    setIsUploading(true);

    let orgId = userProfile?.org_id;
    let creatorId = userProfile?.id;

    if (!orgId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: freshProfile } = await supabase.from('profiles').select('org_id, id').eq('id', user.id).single();
        orgId = freshProfile?.org_id;
        creatorId = freshProfile?.id || user.id;
      }
    }

    let finalMediaUrl = '';

    if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${orgId || 'public'}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('incidents-media').upload(filePath, mediaFile);
        if (!uploadError) {
             const { data: publicData } = supabase.storage.from('incidents-media').getPublicUrl(filePath);
             finalMediaUrl = publicData.publicUrl;
        }
    }

    const insertPayload: any = {
        creator_id: creatorId,
        building_id: form.building_id,
        requirement_type: form.requirement_type,
        equipment_name: form.equipment_name || null,
        description: form.description,
        urgency_level: form.urgency_level,
        media_url: finalMediaUrl || null,
        status: 'Abierto'
    };

    if (orgId) insertPayload.org_id = orgId;
    if (form.area_id) insertPayload.area_id = form.area_id;

    const { data: newIncident, error } = await supabase
      .from('maintenance_incidents')
      .insert([insertPayload])
      .select('id')
      .single();

    setIsUploading(false);

    if (!error && newIncident) {
      // Notificar al técnico del área vía WhatsApp
      fetch('/api/whatsapp/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: newIncident.id }),
      }).catch(() => null); // fire-and-forget: no bloquea el flujo
      onSuccess();
    } else {
       alert('Error al guardar el ticket: ' + error?.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#120726] border border-fuchsia-500/30 w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl relative my-8">
         <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />
         <h3 className="text-2xl font-bold text-white mb-2 relative z-10 flex items-center gap-2"><ShieldAlert className="text-rose-400"/> Levantar Incidencia</h3>
         <p className="text-sm text-purple-200/50 mb-6 font-medium relative z-10">Adjunta tus fotografías o material al reportar al Centro de Mando.</p>
         
         <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sede / Edificio Afectado</label>
                  <select required disabled={isUploading} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-fuchsia-500/50 outline-none"
                     value={form.building_id} onChange={(e)=>setForm({...form, building_id: e.target.value, area_id: ''})}>
                     <option value="">-- Selecciona Sede --</option>
                     {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Área / Piso Específico</label>
                  <select disabled={isUploading || !form.building_id} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-fuchsia-500/50 outline-none disabled:opacity-50"
                     value={form.area_id} onChange={(e)=>setForm({...form, area_id: e.target.value})}>
                     <option value="">Edificio completo</option>
                     {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tipo Requerimiento</label>
                  <select required disabled={isUploading} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-fuchsia-500/50 outline-none"
                     value={form.requirement_type} onChange={(e)=>setForm({...form, requirement_type: e.target.value})}>
                     <option>Mantenimiento Correctivo (Rotura)</option>
                     <option>Soporte Preventivo</option>
                     <option>Falla Eléctrica / Red</option>
                     <option>Riesgo Estructural</option>
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Urgencia</label>
                  <select required disabled={isUploading} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-fuchsia-500/50 outline-none"
                     value={form.urgency_level} onChange={(e)=>setForm({...form, urgency_level: e.target.value})}>
                     <option value="Leve">Leve (Puede esperar días)</option>
                     <option value="Moderado">Moderado (Turno actual)</option>
                     <option value="Crítico">Crítico (Peligro Inmediato)</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Activo / Hardware</label>
                  <input type="text" disabled={isUploading} placeholder="Ej. Equipo Resonancia" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none"
                     value={form.equipment_name} onChange={(e)=>setForm({...form, equipment_name: e.target.value})} />
               </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mt-2">
                  <Paperclip className="w-3 h-3"/> Evidencia Multimedia del Daño
                </label>

                {mediaFile && (
                  <div className="relative rounded-xl overflow-hidden border border-fuchsia-500/30 bg-black/40 mb-2">
                    {mediaFile.type.startsWith('video/') ? (
                      <video src={URL.createObjectURL(mediaFile)} controls className="w-full max-h-48 object-contain" />
                    ) : (
                      <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="w-full max-h-48 object-cover" />
                    )}
                    <button type="button" onClick={() => setMediaFile(null)}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-rose-600 transition-colors">✕</button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <label className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${mediaFile && mediaFile.type.startsWith('image/') ? 'border-fuchsia-500 bg-fuchsia-950/30' : 'border-white/10 bg-black/20 hover:border-purple-500/50 hover:bg-purple-950/20'}`}>
                    <input type="file" accept="image/*" capture="environment" disabled={isUploading}
                      onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <ImageIcon className="w-6 h-6 text-fuchsia-400" />
                    <span className="text-[10px] font-bold text-white text-center leading-tight">Tomar<br/>Foto</span>
                  </label>

                  <label className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${mediaFile && mediaFile.type.startsWith('video/') ? 'border-rose-500 bg-rose-950/30' : 'border-white/10 bg-black/20 hover:border-rose-500/50 hover:bg-rose-950/20'}`}>
                    <input type="file" accept="video/*" capture="environment" disabled={isUploading}
                      onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <span className="text-2xl">🎥</span>
                    <span className="text-[10px] font-bold text-white text-center leading-tight">Grabar<br/>Video</span>
                  </label>

                  <label className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${mediaFile ? 'border-emerald-500 bg-emerald-950/30' : 'border-white/10 bg-black/20 hover:border-emerald-500/50 hover:bg-emerald-950/20'}`}>
                    <input type="file" accept="image/*,video/*,.pdf" disabled={isUploading}
                      onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <span className="text-2xl">🗂️</span>
                    <span className="text-[10px] font-bold text-white text-center leading-tight">Galería<br/>/ Archivo</span>
                  </label>
                </div>
             </div>

            <div className="space-y-1">
               <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Evidencia Textual / Síntoma</label>
               <textarea required disabled={isUploading} rows={3} placeholder="Cuenta puntualmente qué se reventó, goteó, apagó..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none resize-none"
                  value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
               <button type="button" disabled={isUploading} onClick={onClose} className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white font-bold transition-all">Cancelar</button>
               <button type="submit" disabled={isUploading} className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin"/> Subiendo...</> : 'Lanzar Alarma al Equipo'}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}

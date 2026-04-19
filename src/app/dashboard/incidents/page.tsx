'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Cpu, Wrench } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import IncidentFormModal from '@/components/IncidentFormModal';
import TicketSidebarView from '@/components/TicketSidebarView';

export default function IncidentsPage() {
  const supabase = createClient();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase.from('profiles')
      .select('org_id, role, name, id')
      .eq('id', user.id).single();

    if (profile) {
      setCurrentUser(profile);
      let query = supabase.from('maintenance_incidents')
        .select('*, profiles:creator_id(name)')
        .order('created_at', { ascending: false });
      if (profile.org_id) query = query.eq('org_id', profile.org_id);
      const { data } = await query;
      if (data) setIncidents(data);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const abiertos   = incidents.filter(i => i.status === 'Abierto');
  const enTaller   = incidents.filter(i => i.status === 'En Taller');
  const mitigados  = incidents.filter(i => i.status === 'Mitigado');

  const UrgencyBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
      'Crítico':  'text-rose-400 bg-rose-500/10 border-rose-500/20',
      'Moderado': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      'Leve':     'text-zinc-400 bg-white/5 border-white/10',
    };
    return <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${colors[level] || colors['Leve']}`}>{level}</span>;
  };

  const TicketCard = ({ inc, colColor }: { inc: any; colColor: string }) => (
    <div onClick={() => setActiveTicket(inc)}
      className={`bg-${colColor}-950/20 border border-${colColor}-500/20 p-4 rounded-2xl hover:border-${colColor}-500/40 transition-all cursor-pointer`}>
      {inc.media_url && (
        <img src={inc.media_url} alt="Evidencia" className="w-full h-28 object-cover rounded-xl mb-3 border border-white/10" />
      )}
      <div className="flex justify-between items-start mb-2">
        <UrgencyBadge level={inc.urgency_level} />
        <span className="text-[10px] text-zinc-500 font-mono">#{inc.id.substring(0, 6)}</span>
      </div>
      <h4 className="text-white font-bold text-sm leading-tight mb-1">{inc.requirement_type}</h4>
      <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{inc.description}</p>
      <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-white/5 pt-2">
        <span className="truncate max-w-[120px]">{inc.equipment_name || 'Estructura'}</span>
        <span>{inc.profiles?.name || 'Anon'}</span>
      </div>
    </div>
  );

  return (
    <div className="text-zinc-300 space-y-8 pb-20">
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            Módulo de Incidentes
            <span className="bg-fuchsia-500/20 text-fuchsia-400 text-xs px-2.5 py-1 rounded-full border border-fuchsia-500/30">Nivel 1</span>
          </h2>
          <p className="text-purple-200/50 mt-1">Central de reportes, tickets y evidencia fotográfica.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]">
          <AlertTriangle className="w-5 h-5" /> Reportar Incidente
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-fuchsia-400 animate-pulse"><Cpu className="w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ABIERTOS */}
          <div className="bg-[#0a0118]/80 border border-rose-500/20 rounded-3xl p-6 min-h-[500px]">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-400" /> Abiertos / Críticos
              <span className="ml-auto bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full text-xs font-bold border border-rose-500/20">{abiertos.length}</span>
            </h3>
            <div className="space-y-4">
              {abiertos.map(inc => <TicketCard key={inc.id} inc={inc} colColor="rose" />)}
              {abiertos.length === 0 && <p className="text-xs text-center text-zinc-500 py-10">Bandeja limpia.</p>}
            </div>
          </div>

          {/* EN TALLER */}
          <div className="bg-[#0a0118]/80 border border-amber-500/20 rounded-3xl p-6 min-h-[500px]">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" /> En Taller
              <span className="ml-auto bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-500/20">{enTaller.length}</span>
            </h3>
            <div className="space-y-4">
              {enTaller.map(inc => <TicketCard key={inc.id} inc={inc} colColor="amber" />)}
              {enTaller.length === 0 && <p className="text-xs text-center text-zinc-500 py-10">Sin asignaciones activas.</p>}
            </div>
          </div>

          {/* MITIGADOS */}
          <div className="bg-[#0a0118]/80 border border-emerald-500/20 rounded-3xl p-6 min-h-[500px]">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Mitigados
              <span className="ml-auto bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-500/20">{mitigados.length}</span>
            </h3>
            <div className="space-y-4">
              {mitigados.map(inc => <TicketCard key={inc.id} inc={inc} colColor="emerald" />)}
              {mitigados.length === 0 && <p className="text-xs text-center text-zinc-500 py-10">Sin cierres este mes.</p>}
            </div>
          </div>

        </div>
      )}

      {showModal && (
        <IncidentFormModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); loadData(); }}
        />
      )}

      {activeTicket && currentUser && (
        <TicketSidebarView
          ticket={activeTicket}
          onClose={() => setActiveTicket(null)}
          currentUser={currentUser}
          onStatusChange={() => { loadData(); setActiveTicket(null); }}
        />
      )}
    </div>
  );
}

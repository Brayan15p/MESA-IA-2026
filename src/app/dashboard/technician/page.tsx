'use client';

import React, { useState, useEffect } from 'react';
import { Hammer, AlertTriangle, CheckCircle2, Wrench, Clock, Cpu, MapPin, Building2, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TicketSidebarView from '@/components/TicketSidebarView';

export default function TechnicianDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'Abierto' | 'En Taller' | 'Mitigado'>('Abierto');

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase.from('profiles')
      .select('org_id, role, name, id')
      .eq('id', user.id).single();

    if (!profile) { setLoading(false); return; }
    setCurrentUser(profile);

    // Asignación del técnico
    const { data: assign } = await supabase.from('technician_assignments')
      .select('*, areas(name), buildings(name)')
      .eq('profile_id', user.id)
      .maybeSingle();
    setAssignment(assign);

    // Query de tickets filtrado por área asignada
    let query = supabase.from('maintenance_incidents')
      .select('*, buildings:building_id(name), areas:area_id(name), profiles:creator_id(name)')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false });

    if (assign?.area_id) {
      query = query.eq('area_id', assign.area_id);
    } else if (assign?.building_id) {
      query = query.eq('building_id', assign.building_id);
    }

    const { data: ticketData } = await query;
    if (ticketData) setTickets(ticketData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = tickets.filter(t => t.status === activeTab);
  const totalAbiertos = tickets.filter(t => t.status === 'Abierto').length;
  const totalTaller   = tickets.filter(t => t.status === 'En Taller').length;
  const totalResueltos = tickets.filter(t => t.status === 'Mitigado').length;

  const TAB_CONFIG = [
    { key: 'Abierto',   label: 'Abiertos',   count: totalAbiertos,  color: 'rose' },
    { key: 'En Taller', label: 'En Taller',  count: totalTaller,    color: 'amber' },
    { key: 'Mitigado',  label: 'Resueltos',  count: totalResueltos, color: 'emerald' },
  ] as const;

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Hammer className="text-amber-400" /> Mi Búnker Operativo
        </h1>
        <p className="text-zinc-400 mt-1">
          {assignment
            ? `Asignado a: ${assignment.areas?.name || assignment.buildings?.name || 'Instalación general'}`
            : 'Sin zona asignada — mostrando todos los tickets de la organización'}
        </p>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0a0118]/80 border border-rose-500/10 rounded-2xl p-4">
          <p className="text-xs font-bold text-rose-400/70 uppercase tracking-wider mb-1">Pendientes</p>
          <p className="text-3xl font-black text-rose-400">{totalAbiertos}</p>
        </div>
        <div className="bg-[#0a0118]/80 border border-amber-500/10 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-400/70 uppercase tracking-wider mb-1">En Trabajo</p>
          <p className="text-3xl font-black text-amber-400">{totalTaller}</p>
        </div>
        <div className="bg-[#0a0118]/80 border border-emerald-500/10 rounded-2xl p-4">
          <p className="text-xs font-bold text-emerald-400/70 uppercase tracking-wider mb-1">Resueltos</p>
          <p className="text-3xl font-black text-emerald-400">{totalResueltos}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        {TAB_CONFIG.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/30`
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-transparent'
            }`}>
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? `bg-${tab.color}-500/20` : 'bg-white/10'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* LISTA DE TICKETS */}
      {loading ? (
        <div className="flex justify-center py-20 text-amber-400 animate-pulse"><Cpu className="w-10 h-10" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-white/5 rounded-3xl bg-black/20">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">Sin tickets en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(ticket => (
            <div key={ticket.id} onClick={() => setActiveTicket(ticket)}
              className="bg-[#0a0118]/70 border border-white/5 hover:border-amber-500/30 rounded-2xl p-5 cursor-pointer transition-all group">

              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2 flex-wrap">
                  {ticket.urgency_level === 'Crítico' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Crítico
                    </span>
                  )}
                  {ticket.urgency_level !== 'Crítico' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      {ticket.urgency_level}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">#{ticket.id.substring(0, 8)}</span>
              </div>

              {ticket.media_url && (
                <img src={ticket.media_url} alt="Evidencia" className="w-full h-24 object-cover rounded-xl mb-3 border border-white/10" />
              )}

              <h4 className="text-white font-bold text-sm mb-1">{ticket.requirement_type}</h4>
              <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{ticket.description}</p>

              <div className="flex items-center gap-3 text-[10px] text-zinc-500 border-t border-white/5 pt-3">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{ticket.buildings?.name || '—'}</span>
                {ticket.areas?.name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ticket.areas.name}</span>}
                <span className="ml-auto flex items-center gap-1"><Clock className="w-3 h-3" />
                  {new Date(ticket.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              <div className="mt-3 text-[10px] font-bold text-amber-400/60 group-hover:text-amber-400 transition-colors text-right">
                Ver expediente →
              </div>
            </div>
          ))}
        </div>
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

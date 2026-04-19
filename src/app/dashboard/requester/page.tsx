'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, CheckCircle2, Clock, Wrench, ShieldAlert, QrCode, Filter } from 'lucide-react';
import IncidentFormModal from '@/components/IncidentFormModal';
import TicketSidebarView from '@/components/TicketSidebarView';
import ClosingRatingModal from '@/components/ClosingRatingModal';
import { createClient } from '@/lib/supabase/client';

export default function RequesterDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Módulos Élite
  const [activeTab, setActiveTab] = useState('Todos');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [ratingTicket, setRatingTicket] = useState<any>(null);

  const supabase = createClient();

  const loadTickets = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          setCurrentUser(profile);

          const { data } = await supabase.from('maintenance_incidents')
            .select(`*, buildings:building_id(name)`)
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false });

          if(data) {
             setTickets(data);
             const unrated = data.find(t => t.status === 'Mitigado' && t.rating_quality === null);
             if (unrated) setRatingTicket(unrated);
          }
      }
      setLoading(false);
  };

  useEffect(() => {
     loadTickets();
  }, []);

  const handleSuccess = () => {
     setShowModal(false);
     setSuccessMsg(true);
     loadTickets();
     setTimeout(() => setSuccessMsg(false), 5000);
  };

  // Cálculos HUD
  const total = tickets.length;
  const mitigados = tickets.filter(t => t.status === 'Mitigado').length;
  const activos = total - mitigados;

  const filteredTickets = tickets.filter(t => {
     if (activeTab === 'Todos') return true;
     if (activeTab === 'Críticos') return t.urgency_level === 'Crítico';
     if (activeTab === 'Resueltos') return t.status === 'Mitigado';
     return true;
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <LayoutDashboard className="text-zinc-400" /> Mis Solicitudes
        </h1>
        <p className="text-zinc-400 mt-2">Portal de servicio base para reportar daños y revisar estados.</p>
      </div>

      {successMsg && (
         <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 mb-6">
            <CheckCircle2 className="w-6 h-6"/>
            <span>¡Tu requerimiento fue enviado al Centro de Mando exitosamente!</span>
         </div>
      )}

      {/* HUD MICRO-MÉTRICAS */}
      <div className="grid grid-cols-3 gap-4 mb-4">
         <div className="bg-[#0a0118]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col justify-center shadow-lg">
             <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Aportaciones</span>
             <span className="text-3xl font-black text-white">{total}</span>
         </div>
         <div className="bg-[#0a0118]/80 backdrop-blur-xl border border-rose-500/10 rounded-2xl p-4 flex flex-col justify-center shadow-lg">
             <span className="text-xs font-bold text-rose-500/70 uppercase tracking-wider mb-1">En Espera</span>
             <span className="text-3xl font-black text-rose-400">{activos}</span>
         </div>
         <div className="bg-[#0a0118]/80 backdrop-blur-xl border border-emerald-500/10 rounded-2xl p-4 flex flex-col justify-center shadow-lg">
             <span className="text-xs font-bold text-emerald-500/70 uppercase tracking-wider mb-1">Reparados</span>
             <span className="text-3xl font-black text-emerald-400">{mitigados}</span>
         </div>
      </div>

      {/* BOTONES MAESTROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button onClick={() => setShowModal(true)} className="bg-gradient-to-br from-purple-900/30 to-rose-900/10 border border-purple-500/30 hover:border-purple-500/60 p-8 rounded-[2rem] transition-all shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col items-center justify-center text-center gap-4 group">
             <div className="bg-purple-500/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                 <PlusCircle className="w-10 h-10 text-purple-400"/>
             </div>
             <div>
                 <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">CREAR NUEVA SOLICITUD</h3>
                 <p className="text-xs text-purple-200/50 max-w-xs mx-auto">Captura averías y material al equipo técnico.</p>
             </div>
        </button>

        <button onClick={() => { setShowModal(true); alert("Simulación de Escáner Activada"); }} className="bg-[#0a0118]/60 border border-emerald-500/20 hover:border-emerald-500/60 p-8 rounded-[2rem] transition-all flex flex-col items-center justify-center text-center gap-4 group">
            <div className="bg-emerald-500/10 p-4 rounded-full group-hover:scale-110 transition-transform">
                <QrCode className="w-8 h-8 text-emerald-400"/>
            </div>
            <div>
                <h3 className="text-xl font-bold text-emerald-100 mb-1 uppercase tracking-tight">Escáner Activo</h3>
                <p className="text-xs text-emerald-200/50 max-w-xs mx-auto">Usa el código QR del equipo para reportar al instante.</p>
            </div>
        </button>

      </div>

      <div className="mt-12">
        <div className="flex justify-between items-end mb-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400"/> Historial de Solicitudes
           </h2>
           <div className="flex gap-2">
              {['Todos', 'Críticos', 'Resueltos'].map(tab => (
                 <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1 ${activeTab === tab ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                 >
                    {tab === 'Todos' && <LayoutDashboard className="w-3 h-3"/>}
                    {tab === 'Críticos' && <ShieldAlert className="w-3 h-3"/>}
                    {tab === 'Resueltos' && <Filter className="w-3 h-3"/>}
                    {tab}
                 </button>
              ))}
           </div>
        </div>
        
        {loading ? (
             <div className="text-zinc-500 animate-pulse text-sm">Cargando bitácora interactiva...</div>
        ) : filteredTickets.length === 0 ? (
             <div className="bg-[#0a0118]/50 border border-purple-500/10 rounded-3xl p-12 text-center">
                 <p className="text-zinc-500 text-sm font-medium">No hay tickets bajo este filtro.</p>
             </div>
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredTickets.map(t => (
                     <div key={t.id} onClick={() => setActiveTicket(t)} className="bg-[#0a0118]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 hover:border-purple-500/40 hover:bg-[#120726] transition-all cursor-pointer group shadow-lg">
                         <div className="flex justify-between items-start mb-3">
                             <div className="flex gap-2 items-center">
                               {t.status === 'Abierto' && <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-1 rounded-md border border-rose-500/20">ABIERTO</span>}
                               {t.status === 'Mitigado' && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-500/20">MITIGADO</span>}
                               {t.status !== 'Abierto' && t.status !== 'Mitigado' && <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-500/20"><Wrench className="w-3 h-3 inline mr-1"/>EN TALLER</span>}
                             </div>
                             <div className="flex flex-col items-end text-right">
                                 <span className="text-[10px] text-zinc-500 font-mono tracking-wider">#{t.id.substring(0,8)}</span>
                                 <span className="text-[10px] text-zinc-600 mt-1">
                                     {new Date(t.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {new Date(t.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                             </div>
                         </div>
                         
                         {t.media_url && (
                             <img src={t.media_url} alt="Evidencia" className="w-full h-24 object-cover rounded-xl mb-3 border border-white/10" />
                         )}
                         
                         <h4 className="text-white font-bold leading-tight mb-2 text-sm">{t.requirement_type}</h4>
                         <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{t.description}</p>
                         
                         <div className="text-[10px] text-zinc-500 border-t border-white/5 pt-3">
                             Sede: {t.buildings?.name || 'Desconocida'}
                         </div>
                     </div>
                 ))}
             </div>
        )}
      </div>

      {showModal && (
          <IncidentFormModal 
             onClose={() => setShowModal(false)}
             onSuccess={handleSuccess}
          />
      )}

      {/* RENDER LATERAL (EXPEDIENTE) */}
      {activeTicket && currentUser && (
          <TicketSidebarView
             ticket={activeTicket}
             onClose={() => setActiveTicket(null)}
             currentUser={currentUser}
          />
      )}

      {/* RENDER MODAL DE CALIDAD INSTITUCIONAL */}
      {ratingTicket && (
          <ClosingRatingModal
             ticket={ratingTicket}
             onClose={() => setRatingTicket(null)}
             onSuccess={() => {
                setRatingTicket(null);
                loadTickets();
             }}
          />
      )}

    </div>
  );
}

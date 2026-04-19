'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, ShieldCheck, Wrench, AlertTriangle, Building, MapPin, QrCode, ArrowRight, TrendingUp, TrendingDown, Clock, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DashboardHomePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  // Analytics State
  const [activeThisMonth, setActiveThisMonth] = useState(0);
  const [resolvedThisMonth, setResolvedThisMonth] = useState(0);
  const [incidentsByArea, setIncidentsByArea] = useState<any[]>([]);
  const [recentCritical, setRecentCritical] = useState<any[]>([]);

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
           setErrorMsg('No se detectó sesión de usuario activa.');
           return;
        }

        let { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();

        // ---------- AUTO REPARADOR DE PERFILES HUÉRFANOS ----------
        if (!profile || !profile.org_id) {
           const orgName = user.user_metadata?.organization || 'Hospital Base (Auto-Generado)';
           
           // 1. Crear una Organización de emergencia
           const { data: newOrg, error: orgErr } = await supabase.from('organizations')
              .insert({ name: orgName })
              .select('id').single();
              
           if (newOrg) {
              // 2. Vincular el perfil a esa organización
              if (!profile) {
                 await supabase.from('profiles').insert({ 
                    id: user.id, 
                    org_id: newOrg.id, 
                    email: user.email || 'anon@ether.com', 
                    name: user.user_metadata?.name || 'Administrador', 
                    role: 'ORG_ADMIN' 
                 });
                 await supabase.from('user_permissions').insert({ profile_id: user.id });
              } else {
                 await supabase.from('profiles').update({ org_id: newOrg.id }).eq('id', user.id);
              }
              // Re-escribir la variable local para que fluya
              profile = { org_id: newOrg.id };
           } else {
              setErrorMsg(`El Auto-Reparador falló. Revisa tu base de datos Supabase: ${orgErr?.message}`);
              return;
           }
        }
        // -----------------------------------------------------------

        // Fechas para calcular el mes actual
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: incidents, error: incError } = await supabase.from('maintenance_incidents')
           .select(`*, buildings(name), areas(name)`)
           .eq('org_id', profile.org_id)
           .gte('created_at', startOfMonth.toISOString());

        if (incidents) {
          // Métricas Globales
          const active = incidents.filter(i => i.status !== 'Mitigado' && i.status !== 'Cerrado');
          const resolved = incidents.filter(i => i.status === 'Mitigado' || i.status === 'Cerrado');
          
          setActiveThisMonth(active.length);
          setResolvedThisMonth(resolved.length);

          // Agrupación de zonas fallidas (Clasificadas por Área/Piso)
          const areaCounts: Record<string, number> = {};
          active.forEach(inc => {
             const locName = inc.areas?.name || inc.buildings?.name || 'Desconocido';
             areaCounts[locName] = (areaCounts[locName] || 0) + 1;
          });

          // Convertir para el mapa visual de barras
          const sortedAreas = Object.entries(areaCounts)
             .map(([name, count]) => ({ name, count }))
             .sort((a, b) => b.count - a.count)
             .slice(0, 4);

          setIncidentsByArea(sortedAreas);

          // Tickets Críticos Recientes
          const critical = active.filter(i => i.urgency_level === 'Crítico').slice(0, 3);
          setRecentCritical(critical);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [supabase]);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Centro de Mando Analítico</h1>
        <p className="text-purple-200/50">Métricas operativas procesadas en tiempo real para gerencia.</p>
      </div>

      {loading ? (
         <div className="flex justify-center items-center h-40 animate-pulse text-fuchsia-500/50">
             <Activity className="w-10 h-10" />
         </div>
      ) : errorMsg ? (
         <div className="bg-rose-950/20 border border-rose-500/30 p-8 rounded-3xl relative overflow-hidden shadow-lg mb-8">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
               <AlertTriangle className="text-rose-400 w-6 h-6"/> Anomalía de Sincronización Detectada
            </h2>
            <p className="text-rose-200/80 font-medium">{errorMsg}</p>
         </div>
      ) : (
         <>
            {/* BIG METRICS BENTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-[#0a0118]/60 backdrop-blur-3xl border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs text-purple-100/60 font-bold uppercase tracking-wider">Activas (Este Mes)</p>
                  <Activity className="w-5 h-5 text-rose-400" />
                </div>
                <div className="flex items-end gap-3">
                   <p className="text-4xl font-black text-white tracking-tighter">{activeThisMonth}</p>
                   <span className="text-rose-400 font-bold text-sm bg-rose-500/10 px-2 py-0.5 rounded-full mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Atención</span>
                </div>
                <p className="text-xs text-purple-200/40 mt-3 font-medium">Incidentes requiriendo técnico.</p>
              </div>

              <div className="bg-[#0a0118]/60 backdrop-blur-3xl border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs text-purple-100/60 font-bold uppercase tracking-wider">Mantenimiento Exitoso</p>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex items-end gap-3">
                   <p className="text-4xl font-black text-white tracking-tighter">{resolvedThisMonth}</p>
                   <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded-full mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Mitigados</span>
                </div>
                <p className="text-xs text-purple-200/40 mt-3 font-medium">Resueltas en periodo mensual.</p>
              </div>

              <div className="bg-gradient-to-br from-fuchsia-900/40 to-purple-900/10 border border-fuchsia-500/30 p-6 rounded-3xl relative overflow-hidden shadow-[inset_0_0_20px_rgba(217,70,239,0.1)] col-span-1 md:col-span-2">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-fuchsia-500/20 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <p className="text-xs text-fuchsia-300 font-bold uppercase tracking-wider">Impacto Financiero Prevenido</p>
                   <BarChart3 className="w-5 h-5 text-fuchsia-300" />
                </div>
                <div className="flex items-end gap-4 relative z-10">
                   <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 to-white tracking-tighter">$0.00</p>
                   <p className="text-xs text-purple-200/50 mb-2 font-medium max-w-[150px] leading-tight">Módulo Analítico Costos (En Desarrollo)</p>
                </div>
              </div>
            </div>

            {/* SECONDARY ROW: CLASSIFIED AREAS & CRITICAL ALERTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               
               {/* Gráfico Visual de Áreas Fallidas */}
               <div className="lg:col-span-2 bg-[#12072e]/60 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden shadow-lg">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><MapPin className="text-purple-400 w-5 h-5"/> Mapa de Concentración de Riesgo</h2>
                  
                  {incidentsByArea.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <ShieldCheck className="w-12 h-12 text-emerald-400 mb-3" />
                        <p className="font-bold text-emerald-300">Infraestructura Sana</p>
                        <p className="text-xs text-emerald-100/50">Cero reportes en tus pisos este mes.</p>
                     </div>
                  ) : (
                     <div className="space-y-5">
                       {incidentsByArea.map((area, idx) => {
                          const maxCount = Math.max(...incidentsByArea.map(a => a.count));
                          const widthPct = Math.round((area.count / maxCount) * 100);
                          return (
                            <div key={idx} className="relative z-10">
                               <div className="flex justify-between text-xs font-bold text-purple-200 mb-1">
                                  <span>{area.name}</span>
                                  <span className="text-fuchsia-400">{area.count} Falla{area.count !== 1 ? 's' : ''}</span>
                               </div>
                               <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                                  <div 
                                    className="bg-gradient-to-r from-purple-600 to-fuchsia-500 h-full rounded-full relative" 
                                    style={{ width: `${widthPct}%` }}
                                  >
                                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                     </div>
                  )}
               </div>

               {/* Alertas Críticas (Directas del Kanban) */}
               <div className="bg-[#0a0118]/80 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-6 relative shadow-[inset_0_0_20px_rgba(244,63,94,0.05)] flex flex-col">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="text-rose-400 w-5 h-5"/> Alertas Críticas</h2>
                  
                  <div className="flex-1 space-y-3">
                     {recentCritical.length === 0 ? (
                        <p className="text-sm text-zinc-500 font-medium py-10 text-center bg-black/20 rounded-2xl border border-white/5">Sin amenazas graves.</p>
                     ) : (
                        recentCritical.map(inc => (
                          <div key={inc.id} className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-2xl">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-white truncate">{inc.requirement_type}</span>
                             </div>
                             <p className="text-[10px] text-purple-200/50 uppercase tracking-wider">{inc.buildings?.name || 'Sede'}</p>
                          </div>
                        ))
                     )}
                  </div>

                  <Link href="/dashboard/incidents" className="mt-4 pt-4 border-t border-white/5 text-xs font-bold text-rose-400 flex justify-between items-center hover:text-rose-300 transition-colors">
                     Ver todos los tickets <ChevronRight className="w-4 h-4" />
                  </Link>
               </div>
            </div>

            {/* QUICK ACTIONS BENTO */}
            <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <Link href="/dashboard/buildings" className="bg-[#100520] hover:bg-[#1a0b3b] transition-all border border-purple-500/20 p-6 rounded-3xl group flex flex-col justify-between h-36">
                  <Building className="w-8 h-8 text-fuchsia-400 mb-2" />
                  <div className="flex items-center justify-between">
                     <span className="font-semibold text-white">Gestionar Sedes</span>
                     <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>

                <Link href="/dashboard/areas" className="bg-[#100520] hover:bg-[#1a0b3b] transition-all border border-purple-500/20 p-6 rounded-3xl group flex flex-col justify-between h-36">
                  <MapPin className="w-8 h-8 text-emerald-400 mb-2" />
                  <div className="flex items-center justify-between">
                     <span className="font-semibold text-white">Topografía e Inventario</span>
                     <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>

                <Link href="/dashboard/qr" className="bg-gradient-to-br from-purple-800/40 to-fuchsia-900/20 hover:from-purple-700/50 transition-all border border-fuchsia-500/40 p-6 rounded-3xl group flex flex-col justify-between h-36 relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-[100px] h-[100px] bg-fuchsia-500/20 rounded-full blur-[30px]" />
                  <QrCode className="w-8 h-8 text-white relative z-10" />
                  <div className="flex items-center justify-between relative z-10">
                     <span className="font-bold text-white">Generador Códigos QR</span>
                     <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>

              </div>
            </div>
         </>
      )}
    </div>
  );
}

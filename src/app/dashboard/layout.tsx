'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Building, MapPin, QrCode, LogOut, Sparkles, AlertTriangle, ShieldCheck, DollarSign, Brain, MessageSquare, Menu, X, Hammer } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ALL_NAV_ITEMS = [
  { section: 'General',
    allowedRoles: ['ORG_ADMIN'],
    links: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Centro de Mando', hint: 'Métricas globales y alertas críticas', color: 'text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20' },
  ]},
  { section: 'Portal Técnico',
    allowedRoles: ['TECHNICIAN'],
    links: [
      { href: '/dashboard/technician', icon: Hammer, label: 'Mi Búnker Operativo', hint: 'Tus tickets asignados por área', color: 'text-amber-400 bg-amber-500/10 border border-amber-500/20' },
  ]},
  { section: 'Portal Solicitante',
    allowedRoles: ['REQUESTER'],
    links: [
      { href: '/dashboard/requester', icon: LayoutDashboard, label: 'Mis Solicitudes', hint: 'Reporta y rastrea tus averías', color: 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20' },
  ]},
  { section: 'Centro Analítico',
    allowedRoles: ['ANALYST'],
    links: [
      { href: '/dashboard/analyst', icon: LayoutDashboard, label: 'Visor de Datos', hint: 'Gráficas de tendencias y BI', color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' },
  ]},
  { section: 'Operaciones Clínicas',
    allowedRoles: ['ORG_ADMIN', 'BUILDING_MANAGER', 'ANALYST', 'TECHNICIAN'],
    links: [
      { href: '/dashboard/incidents', icon: AlertTriangle, label: 'Tablero de Tickets', hint: 'Kanban de incidentes activos', color: 'text-rose-400 bg-rose-500/10 border border-rose-500/20' },
      { href: '/dashboard/compliance', icon: ShieldCheck, label: 'Cumplimiento 3100', hint: 'Auditoría normativa colombiana', color: '', allowedRoles: ['ORG_ADMIN', 'BUILDING_MANAGER', 'ANALYST'] },
      { href: '/dashboard/finance', icon: DollarSign, label: 'Costos de Mantenimiento', hint: 'ROI, presupuesto y tendencias', color: 'text-emerald-400/80', allowedRoles: ['ORG_ADMIN', 'BUILDING_MANAGER', 'ANALYST'] },
  ]},
  { section: 'Inteligencia Artificial',
    allowedRoles: ['ORG_ADMIN', 'BUILDING_MANAGER', 'ANALYST', 'TECHNICIAN'],
    links: [
      { href: '/dashboard/chat', icon: MessageSquare, label: 'Asistente Conversacional', hint: 'Chat IA con contexto de tu hospital', color: 'text-indigo-400/80' },
      { href: '/dashboard/ai-predictive', icon: Brain, label: 'ETHER Brain', hint: 'Predicción de riesgo a 30/60/90 días', color: 'text-indigo-400/80' },
  ]},
  { section: 'Infraestructura',
    allowedRoles: ['ORG_ADMIN', 'BUILDING_MANAGER'],
    links: [
      { href: '/dashboard/buildings', icon: Building, label: 'Edificios y Sedes', hint: 'Crea y gestiona tu infraestructura', color: '' },
      { href: '/dashboard/areas', icon: MapPin, label: 'Áreas Operativas', hint: 'Pisos, zonas y salas por sede', color: '' },
      { href: '/dashboard/qr', icon: QrCode, label: 'Códigos QR', hint: 'Genera QR de reporte por área', color: '' },
      { href: '/dashboard/roles', icon: Users, label: 'Roles y Permisos', hint: 'Recluta y gestiona tu equipo', color: '', allowedRoles: ['ORG_ADMIN'] },
  ]},
];

function NavLinks({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ether-role') || '';
    return '';
  });
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userRole = data?.user?.user_metadata?.role || 'REQUESTER';
      setRole(userRole);
      localStorage.setItem('ether-role', userRole);
    });
  }, [supabase.auth]);

  if (!role) return <div className="p-4 text-xs text-purple-400/50 animate-pulse">Sincronizando Mando...</div>;

  return (
    <nav className="p-4 flex flex-col gap-1 pb-8">
      {ALL_NAV_ITEMS.filter(s => s.allowedRoles.includes(role)).map(({ section, links }) => {
        const visibleLinks = links.filter(l => !l.allowedRoles || l.allowedRoles.includes(role));
        if(visibleLinks.length === 0) return null;
        
        return (
          <div key={section}>
            <p className="px-4 text-[10px] uppercase tracking-widest text-purple-200/40 font-bold mt-4 mb-2">{section}</p>
            {visibleLinks.map(({ href, icon: Icon, label, hint, color }: any) => {
              const isActive = pathname === href;
              return (
                <Link key={href} href={href} onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all group
                    ${isActive
                      ? (color || 'text-white bg-white/10 border border-white/10')
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="leading-tight truncate">{label}</span>
                    {hint && (
                      <span className={`text-[10px] leading-tight truncate transition-colors
                        ${isActive ? 'opacity-60' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                        {hint}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )
      })}
    </nav>
  );
}

function LogoutButton() {
  const supabase = createClient();
  const handleLogout = async () => {
    localStorage.removeItem('ether-role');
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  return (
    <button onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 transition-all font-medium text-sm w-full">
      <LogOut className="w-5 h-5" /> Salir al Inicio
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030008] text-zinc-300 font-sans selection:bg-fuchsia-500/30 flex">

      {/* SIDEBAR (Desktop) */}
      <aside className="w-64 border-r border-purple-500/20 bg-[#0a0118]/80 backdrop-blur-3xl flex-col justify-between hidden md:flex sticky top-0 h-screen overflow-y-auto z-40 custom-scrollbar">
        <div>
          <div className="p-6 border-b border-purple-500/20 flex items-center gap-3">
            <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 p-2 rounded-xl border border-fuchsia-500/30">
              <Sparkles className="w-6 h-6 text-fuchsia-300" />
            </div>
            <span className="text-xl font-bold tracking-[0.1em] text-white">ETHER</span>
          </div>
          <NavLinks />
        </div>
        <div className="p-4 border-t border-purple-500/20">
          <LogoutButton />
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 w-full h-16 border-b border-purple-500/20 bg-[#0a0118]/95 backdrop-blur-3xl z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-fuchsia-300" />
          <span className="text-lg font-bold tracking-[0.1em] text-white">ETHER</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          
          {/* Panel */}
          <div className="relative w-72 bg-[#0a0118] border-r border-purple-500/30 h-full overflow-y-auto custom-scrollbar flex flex-col z-10">
            <div className="p-5 border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 p-1.5 rounded-xl border border-fuchsia-500/30">
                  <Sparkles className="w-5 h-5 text-fuchsia-300" />
                </div>
                <span className="text-lg font-bold tracking-[0.1em] text-white">ETHER</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1">
              <NavLinks onClose={() => setMobileOpen(false)} />
            </div>

            <div className="p-4 border-t border-purple-500/20">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-auto min-h-screen pt-16 md:pt-0">
        <div className="fixed top-[10%] left-[20%] w-[40vw] h-[40vw] bg-[#6d28d9]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed top-[50%] right-[10%] w-[30vw] h-[30vw] bg-[#c026d3]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="p-5 md:p-10 w-full max-w-7xl mx-auto relative z-10 text-zinc-300">
          {children}
        </div>
      </main>
    </div>
  );
}

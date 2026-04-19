'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Shield, ShieldAlert, Cpu, Wrench, ShieldCheck, Mail, Plus, X,
  Search, CheckCircle2, Lock, Building, MapPin, KeyRound, UploadCloud,
  Phone, CreditCard, Layers, Activity, ChevronRight, UserCheck, AlertCircle,
  DollarSign, ClipboardCheck, UserCog, Trash2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createEtherUser, createEtherUsersBulk } from '@/app/actions/user-actions';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Permission = {
  id: string;
  profile_id: string;
  can_export_pdf: boolean;
  can_create_building: boolean;
  can_delete_users: boolean;
  can_assign_technicians: boolean;
  can_view_finance: boolean;
  can_manage_compliance: boolean;
};

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  document_id?: string;
  phone?: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  document_id: string;
  phone: string;
  role: string;
  assigned_building_id: string;
  assigned_floor: string;
  assigned_area_id: string;
  can_export_pdf: boolean;
  can_create_building: boolean;
  can_delete_users: boolean;
  can_assign_technicians: boolean;
  can_view_finance: boolean;
  can_manage_compliance: boolean;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  ORG_ADMIN:        { label: 'Administrador',    color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30', icon: ShieldAlert,  desc: 'Control total del sistema' },
  BUILDING_MANAGER: { label: 'Encargado Sede',   color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',   icon: Building,     desc: 'Gestión de sedes asignadas' },
  TECHNICIAN:       { label: 'Técnico',           color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',     icon: Wrench,       desc: 'Atención de incidentes' },
  ANALYST:          { label: 'Analista',          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: Cpu,         desc: 'Reportes y métricas' },
  REQUESTER:        { label: 'Solicitante',       color: 'text-zinc-400 bg-white/5 border-white/10',               icon: UserCheck,    desc: 'Reporte de averías' },
};

const PERM_GROUPS = [
  {
    label: 'Datos y Reportes',
    perms: [
      { key: 'can_export_pdf',        label: 'Exportar PDFs',          icon: ClipboardCheck, color: 'emerald' },
      { key: 'can_view_finance',      label: 'Ver Módulo Finanzas',    icon: DollarSign,     color: 'teal'    },
      { key: 'can_manage_compliance', label: 'Ver Compliance 3100',    icon: ShieldCheck,    color: 'sky'     },
    ]
  },
  {
    label: 'Administración',
    perms: [
      { key: 'can_create_building',    label: 'Crear Edificios',        icon: Building,  color: 'indigo'  },
      { key: 'can_assign_technicians', label: 'Asignar Técnicos',       icon: UserCog,   color: 'violet'  },
      { key: 'can_delete_users',       label: 'Eliminar Usuarios',      icon: Trash2,    color: 'rose'    },
    ]
  }
];

const COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-500',
  teal:    'bg-teal-500',
  sky:     'bg-sky-500',
  indigo:  'bg-indigo-500',
  violet:  'bg-violet-500',
  rose:    'bg-rose-500',
};

const FORM_DEFAULT: FormState = {
  name: '', email: '', password: '', document_id: '', phone: '',
  role: 'REQUESTER',
  assigned_building_id: '', assigned_floor: '', assigned_area_id: '',
  can_export_pdf: false, can_create_building: false, can_delete_users: false,
  can_assign_technicians: false, can_view_finance: false, can_manage_compliance: false,
};

function roleDefaults(role: string): Partial<FormState> {
  const isAdmin   = role === 'ORG_ADMIN';
  const isAnalyst = role === 'ANALYST';
  const isManager = role === 'BUILDING_MANAGER';
  return {
    role,
    can_export_pdf:         isAdmin || isAnalyst,
    can_create_building:    isAdmin,
    can_delete_users:       isAdmin,
    can_assign_technicians: isAdmin || isManager,
    can_view_finance:       isAdmin || isAnalyst,
    can_manage_compliance:  isAdmin || isAnalyst,
    assigned_building_id: '', assigned_floor: '', assigned_area_id: '',
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RolesPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [team, setTeam]             = useState<Member[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [buildings, setBuildings]   = useState<any[]>([]);
  const [areas, setAreas]           = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [form, setForm]             = useState<FormState>(FORM_DEFAULT);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('org_id, role').eq('id', user.id).single();
    if (!profile?.org_id) { setErrorMsg('Entorno huérfano. Ve al Centro de Mando primero.'); setLoading(false); return; }
    setUserProfile(profile);

    const { data: teamData } = await supabase.from('profiles').select('*').eq('org_id', profile.org_id).order('name');
    if (teamData) setTeam(teamData);

    if (teamData) {
      const ids = teamData.map(t => t.id);
      const { data: permData } = await supabase.from('user_permissions').select('*').in('profile_id', ids);
      if (permData) setPermissions(permData);
    }

    const { data: bData } = await supabase.from('buildings').select('*').eq('org_id', profile.org_id).order('name');
    if (bData) setBuildings(bData);

    const { data: aData } = await supabase.from('areas').select('*').eq('org_id', profile.org_id).order('name');
    if (aData) setAreas(aData);

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const filteredTeam = team.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.document_id || '').includes(search)
  );

  const selectedPerms = permissions.find(p => p.profile_id === selectedMember?.id);

  const floorOptions = [...new Set(
    areas.filter(a => a.building_id === form.assigned_building_id && a.floor_number != null)
         .map(a => a.floor_number)
  )].sort((a, b) => a - b);

  const areaOptions = areas.filter(a =>
    a.building_id === form.assigned_building_id &&
    (form.assigned_floor === '' || String(a.floor_number) === form.assigned_floor)
  );

  const stats = {
    total:    team.length,
    admins:   team.filter(m => m.role === 'ORG_ADMIN').length,
    techs:    team.filter(m => m.role === 'TECHNICIAN').length,
    others:   team.filter(m => !['ORG_ADMIN','TECHNICIAN'].includes(m.role)).length,
    active:   team.filter(m => m.is_active).length,
  };

  // ── Toggle permiso ───────────────────────────────────────────────────────────

  const togglePermission = async (permId: string, field: string, current: boolean) => {
    const { error } = await supabase.from('user_permissions').update({ [field]: !current }).eq('id', permId);
    if (!error) setPermissions(prev => prev.map(p => p.id === permId ? { ...p, [field]: !current } : p));
  };

  // ── Submit reclutamiento ─────────────────────────────────────────────────────

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createEtherUser({ ...form, org_id: userProfile.org_id });
    if (res.success) {
      setShowModal(false);
      setForm(FORM_DEFAULT);
      loadData();
    } else {
      alert('Error: ' + res.error);
    }
    setIsSubmitting(false);
  };

  // ── CSV ──────────────────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = (ev.target?.result as string).split('\n').filter(l => l.trim());
      const parsed = lines.map(line => {
        const p = line.split(',');
        return { name: p[0]?.trim(), email: p[1]?.trim(), role: p[2]?.trim() || 'REQUESTER', password: p[3]?.trim() || 'Temporal2026', document_id: p[4]?.trim() || '' };
      });
      if (parsed[0]?.email?.toLowerCase().includes('correo')) parsed.shift();
      setCsvPreview(parsed);
      setShowCsvModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBulkSubmit = async () => {
    setIsSubmitting(true);
    const results = await createEtherUsersBulk(csvPreview, userProfile.org_id);
    const failed = results.filter(r => r.status === 'ERROR');
    if (failed.length) { alert(`${failed.length} errores. Revisa consola.`); console.error(failed); }
    else { setShowCsvModal(false); setCsvPreview([]); }
    loadData();
    setIsSubmitting(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex justify-center items-center h-64 animate-pulse text-fuchsia-500/40">
      <Activity className="w-10 h-10" />
    </div>
  );

  if (errorMsg) return (
    <div className="bg-rose-950/20 border border-rose-500/30 p-8 rounded-3xl">
      <p className="text-rose-300 font-semibold flex items-center gap-2"><AlertCircle className="w-5 h-5" />{errorMsg}</p>
    </div>
  );

  return (
    <div className="text-zinc-300 space-y-6 pb-20">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
            Gobierno ETHER
            <span className="bg-purple-500/20 text-purple-400 text-xs px-2.5 py-1 rounded-full border border-purple-500/30">Nivel 5</span>
          </h2>
          <p className="text-purple-200/50 font-medium text-sm">Control de accesos, roles jerárquicos y asignación territorial de tu organización.</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()}
            className="bg-black/40 border border-purple-500/30 hover:border-purple-400 text-purple-300 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all">
            <UploadCloud className="w-4 h-4" /> CSV Masivo
          </button>
          <button onClick={() => { setForm(FORM_DEFAULT); setShowModal(true); }}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]">
            <Plus className="w-4 h-4" /> Reclutar Personal
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Personal', value: stats.total,   icon: Users,      color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
          { label: 'Activos',        value: stats.active,  icon: CheckCircle2,color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Técnicos',       value: stats.techs,   icon: Wrench,     color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
          { label: 'Otros Roles',    value: stats.others,  icon: Cpu,        color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20'  },
        ].map(s => (
          <div key={s.label} className={`border ${s.bg} rounded-2xl p-4 flex items-center gap-4`}>
            <div className={`p-2.5 rounded-xl bg-black/30`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
            <div>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── NÓMINA ── */}
        <div className="lg:col-span-2 bg-[#0a0118]/80 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" /> Nómina Activa</h3>
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-purple-200/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Nombre, correo o cédula..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-purple-500/50 w-full" />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredTeam.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="w-10 h-10 text-purple-400/20 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No hay personal bajo este filtro.</p>
              </div>
            ) : filteredTeam.map(member => {
              const meta = ROLE_META[member.role] || ROLE_META.REQUESTER;
              const Icon = meta.icon;
              const isSelected = selectedMember?.id === member.id;

              return (
                <div key={member.id} onClick={() => setSelectedMember(isSelected ? null : member)}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-all group
                    ${isSelected ? 'bg-purple-900/20 border-l-2 border-l-fuchsia-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}>

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-white font-bold text-sm truncate">{member.name}</h4>
                      {member.is_active
                        ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        : <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Inactivo</span>
                      }
                    </div>
                    <p className="text-xs text-purple-200/50 truncate">{member.email}</p>
                    {member.document_id && (
                      <p className="text-[10px] text-zinc-600 font-mono mt-0.5">CC {member.document_id}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${meta.color}`}>
                      {meta.label}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform ${isSelected ? 'rotate-90 text-fuchsia-400' : 'group-hover:translate-x-0.5'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PANEL PERMISOS ── */}
        <div className="bg-[#120726]/80 backdrop-blur-3xl border border-purple-500/20 rounded-3xl flex flex-col overflow-hidden">
          {!selectedMember ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-purple-400/50" />
              </div>
              <p className="text-white font-bold mb-1">Matriz de Permisos</p>
              <p className="text-xs text-purple-200/40">Selecciona un miembro de la nómina para gestionar sus privilegios de acceso.</p>
            </div>
          ) : (
            <>
              {/* Member header */}
              {(() => {
                const meta = ROLE_META[selectedMember.role] || ROLE_META.REQUESTER;
                const Icon = meta.icon;
                return (
                  <div className="p-5 border-b border-purple-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.color} shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{selectedMember.name}</p>
                        <p className="text-xs text-purple-200/50">{selectedMember.email}</p>
                      </div>
                    </div>
                    {selectedMember.document_id && (
                      <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-1.5">
                        <CreditCard className="w-3 h-3 text-zinc-500" />
                        <span className="text-xs font-mono text-zinc-400">CC {selectedMember.document_id}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Toggles */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {selectedMember.role === 'ORG_ADMIN' ? (
                  <div className="text-center py-8">
                    <ShieldAlert className="w-10 h-10 text-fuchsia-400/50 mx-auto mb-3" />
                    <p className="text-xs text-purple-200/50">El Administrador tiene acceso total al sistema. Sus permisos no son editables.</p>
                  </div>
                ) : !selectedPerms ? (
                  <p className="text-xs text-zinc-500 text-center py-8">Sin registro de permisos.</p>
                ) : PERM_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200/40 mb-3">{group.label}</p>
                    <div className="space-y-2">
                      {group.perms.map(({ key, label, icon: Icon, color }) => {
                        const val = (selectedPerms as any)[key] as boolean;
                        return (
                          <div key={key} className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-2.5 border border-white/5">
                            <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                              <Icon className={`w-3.5 h-3.5 ${val ? `text-${color}-400` : 'text-zinc-600'}`} />
                              {label}
                            </span>
                            <button onClick={() => togglePermission(selectedPerms.id, key, val)}
                              className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${val ? COLOR_MAP[color] : 'bg-white/10'}`}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 ${val ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL DE RECLUTAMIENTO
      ══════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0d0621] border border-purple-500/30 w-full max-w-2xl rounded-[2rem] shadow-2xl relative my-8 overflow-hidden">

            {/* Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header modal */}
            <div className="relative z-10 p-7 border-b border-white/5 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <Plus className="text-purple-400 w-6 h-6" /> Reclutamiento de Personal
                </h3>
                <p className="text-sm text-purple-200/50">Genera credenciales seguras para tu equipo hospitalario.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-purple-200/50 hover:text-white p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="relative z-10 p-7 space-y-6">

              {/* ── DATOS PERSONALES ── */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300/50 mb-3 flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> Datos de Identidad
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/30" />
                    <input required type="text" placeholder="Nombre completo *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-fuchsia-500/50 placeholder-zinc-600" />
                  </div>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/30" />
                    <input type="text" placeholder="Cédula / Documento" value={form.document_id} onChange={e => setForm({ ...form, document_id: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-fuchsia-500/50 placeholder-zinc-600" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/30" />
                    <input required type="email" placeholder="Correo electrónico *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-fuchsia-500/50 placeholder-zinc-600" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/30" />
                    <input type="tel" placeholder="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-fuchsia-500/50 placeholder-zinc-600" />
                  </div>
                  <div className="relative sm:col-span-2">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/60" />
                    <input required minLength={6} type="text" placeholder="Contraseña inicial *" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-emerald-950/20 border border-emerald-500/30 rounded-xl py-3 pl-10 pr-4 text-emerald-200 text-sm font-mono focus:outline-none focus:border-emerald-500/50 placeholder-emerald-900" />
                  </div>
                </div>
              </div>

              {/* ── ROL ── */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300/50 mb-3 flex items-center gap-2">
                  <Shield className="w-3 h-3" /> Nivel de Acceso
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(ROLE_META).filter(([k]) => k !== 'ORG_ADMIN').map(([roleKey, meta]) => {
                    const Icon = meta.icon;
                    const active = form.role === roleKey;
                    return (
                      <div key={roleKey} onClick={() => setForm(f => ({ ...f, ...roleDefaults(roleKey) }))}
                        className={`border rounded-xl p-3 cursor-pointer transition-all
                          ${active ? `${meta.color} shadow-[0_0_15px_rgba(0,0,0,0.3)]` : 'bg-black/20 border-white/5 text-zinc-500 hover:border-white/20'}`}>
                        <Icon className={`w-4 h-4 mb-1.5 ${active ? '' : 'opacity-40'}`} />
                        <p className="text-xs font-bold leading-tight">{meta.label}</p>
                        <p className={`text-[10px] mt-0.5 ${active ? 'opacity-70' : 'opacity-30'}`}>{meta.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── ASIGNACIÓN TÉCNICO ── */}
              {form.role === 'TECHNICIAN' && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
                  <p className="text-xs font-bold text-amber-400 mb-3 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Asignación Territorial (Sede → Piso → Área)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-amber-400/60 uppercase tracking-wider block mb-1">Sede *</label>
                      <select required className="w-full bg-black/40 border border-amber-500/20 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-amber-500/50"
                        value={form.assigned_building_id}
                        onChange={e => setForm(f => ({ ...f, assigned_building_id: e.target.value, assigned_floor: '', assigned_area_id: '' }))}>
                        <option value="">Seleccionar...</option>
                        {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-400/60 uppercase tracking-wider block mb-1">Piso</label>
                      <select disabled={!form.assigned_building_id}
                        className="w-full bg-black/40 border border-amber-500/20 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-amber-500/50 disabled:opacity-40"
                        value={form.assigned_floor}
                        onChange={e => setForm(f => ({ ...f, assigned_floor: e.target.value, assigned_area_id: '' }))}>
                        <option value="">Todos los pisos</option>
                        {floorOptions.map(f => <option key={f} value={String(f)}>Piso {f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-400/60 uppercase tracking-wider block mb-1">Área</label>
                      <select disabled={!form.assigned_building_id}
                        className="w-full bg-black/40 border border-amber-500/20 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-amber-500/50 disabled:opacity-40"
                        value={form.assigned_area_id}
                        onChange={e => setForm(f => ({ ...f, assigned_area_id: e.target.value }))}>
                        <option value="">Toda la instalación</option>
                        {areaOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PERMISOS FINOS ── */}
              {!['ORG_ADMIN', 'REQUESTER'].includes(form.role) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300/50 mb-3 flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Ajuste Fino de Privilegios
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERM_GROUPS.flatMap(g => g.perms).map(({ key, label, icon: Icon, color }) => {
                      const val = (form as any)[key] as boolean;
                      return (
                        <div key={key} className="flex items-center justify-between bg-black/30 rounded-xl px-3 py-2.5 border border-white/5">
                          <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                            <Icon className={`w-3.5 h-3.5 ${val ? `text-${color}-400` : 'text-zinc-600'}`} />
                            {label}
                          </span>
                          <button type="button" onClick={() => setForm(f => ({ ...f, [key]: !val }))}
                            className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${val ? COLOR_MAP[color] : 'bg-white/10'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 ${val ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── FOOTER ── */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white font-bold transition-all text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white px-7 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                  {isSubmitting ? <><Activity className="w-4 h-4 animate-spin" /> Creando...</> : <><CheckCircle2 className="w-4 h-4" /> Sellar Contrato</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL CSV
      ══════════════════════════════════════════════════════ */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0d0621] border border-purple-500/30 w-full max-w-3xl rounded-[2rem] p-7 shadow-2xl relative my-8">
            <button onClick={() => setShowCsvModal(false)} className="absolute top-6 right-6 text-purple-200/50 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><UploadCloud className="text-purple-400 w-5 h-5" /> Carga Masiva Detectada</h3>
            <p className="text-sm text-purple-200/50 mb-5">Revisa los datos antes de inyectarlos en el directorio activo.</p>

            <div className="bg-black/30 rounded-xl border border-white/10 overflow-hidden mb-5">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-white/5 uppercase font-bold text-[10px] tracking-widest text-zinc-400">
                  <tr>
                    <th className="p-3">Nombre</th><th className="p-3">Email</th>
                    <th className="p-3">Rol</th><th className="p-3">Doc.</th><th className="p-3">Contraseña</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(0, 10).map((u, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3 text-purple-400 font-bold">{u.role}</td>
                      <td className="p-3 font-mono text-zinc-500">{u.document_id || '—'}</td>
                      <td className="p-3 font-mono text-emerald-400">{u.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvPreview.length > 10 && <div className="p-3 text-center text-xs text-zinc-500 bg-white/5">Y {csvPreview.length - 10} filas más...</div>}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-purple-300/60">Se crearán <b>{csvPreview.length}</b> perfiles.</p>
              <button onClick={handleBulkSubmit} disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-500 text-white px-7 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50">
                {isSubmitting ? 'Inyectando...' : 'Aprobar Carga Masiva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

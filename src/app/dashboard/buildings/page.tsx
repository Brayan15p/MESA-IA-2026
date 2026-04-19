'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, X, MapPin, Activity, Grid3X3, ArrowLeft, Layers, CheckCircle2, Trash2, AlertCircle, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function BuildingsPage() {
  const supabase = createClient();

  // ── State Global ──────────────────────────────
  const [orgId, setOrgId]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // ── Edificios ─────────────────────────────────
  const [buildings, setBuildings] = useState<any[]>([]);
  const [showBuildForm, setShowBuildForm] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [buildLocation, setBuildLocation] = useState('');
  const [buildFloors, setBuildFloors] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Drill-down Áreas ──────────────────────────
  const [activeBuilding, setActiveBuilding] = useState<any>(null);
  const [areas, setAreas]                   = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas]     = useState(false);
  const [showAreaForm, setShowAreaForm]     = useState(false);
  const [areaName, setAreaName]           = useState('');
  const [areaFloor, setAreaFloor]         = useState('');
  const [areaType, setAreaType]           = useState('');
  const [areaSubmitting, setAreaSubmitting] = useState(false);

  // ── Bootstrap ─────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Sin sesión activa.'); setLoading(false); return; }

      let { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();

      // Auto-reparador
      if (!profile?.org_id) {
        const orgMeta = user.user_metadata?.organization || 'Mi Hospital';
        const { data: newOrg } = await supabase.from('organizations').insert({ name: orgMeta }).select('id').single();
        if (newOrg) {
          await supabase.from('profiles').upsert({ id: user.id, org_id: newOrg.id, email: user.email, name: user.user_metadata?.name || 'Admin', role: 'ORG_ADMIN' });
          profile = { org_id: newOrg.id };
        }
      }

      if (!profile?.org_id) { setError('No se pudo resolver la Organización.'); setLoading(false); return; }
      setOrgId(profile.org_id);
      await fetchBuildings(profile.org_id);
      setLoading(false);
    }
    init();
  }, []);

  // ── CRUD Edificios ────────────────────────────
  const fetchBuildings = async (oid: string) => {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('org_id', oid)
      .order('created_at', { ascending: false });
    if (data) setBuildings(data);
    if (error) console.error('fetchBuildings error:', error.message);
  };

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setSubmitting(true);
    const { error: err } = await supabase.from('buildings').insert([{ name: buildName, location: buildLocation, total_floors: buildFloors ? parseInt(buildFloors) : null, org_id: orgId }]);
    if (!err) {
      setBuildName(''); setBuildLocation(''); setBuildFloors('');
      setShowBuildForm(false);
      await fetchBuildings(orgId);
    } else {
      alert('Error BD: ' + err.message);
    }
    setSubmitting(false);
  };

  const deleteBuilding = async (id: string) => {
    if (!confirm('¿Eliminar este edificio y todas sus áreas permanentemente?')) return;
    await supabase.from('buildings').delete().eq('id', id);
    if (orgId) await fetchBuildings(orgId);
    if (activeBuilding?.id === id) setActiveBuilding(null);
  };

  // ── Drill-down: Entrar a Edificio ─────────────
  const openBuilding = async (building: any) => {
    setActiveBuilding(building);
    setShowAreaForm(false);
    setLoadingAreas(true);
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('building_id', building.id)
      .order('floor_number', { ascending: true });
    if (data) setAreas(data);
    if (error) console.error('fetchAreas error:', error.message);
    setLoadingAreas(false);
  };

  // ── CRUD Áreas ────────────────────────────────
  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBuilding || !orgId) return;
    setAreaSubmitting(true);
    const { error: err } = await supabase.from('areas').insert([{
      name: areaName,
      floor_number: areaFloor ? parseInt(areaFloor) : null,
      area_type: areaType || null,
      building_id: activeBuilding.id,
      org_id: orgId
    }]);
    if (!err) {
      setAreaName(''); setAreaFloor(''); setAreaType('');
      setShowAreaForm(false);
      // Refrescar lista de áreas
      const { data } = await supabase.from('areas').select('*').eq('building_id', activeBuilding.id).order('floor_number', { ascending: true });
      setAreas(data || []);
    } else {
      alert('Error BD: ' + err.message);
    }
    setAreaSubmitting(false);
  };

  const deleteArea = async (id: string) => {
    if (!confirm('¿Eliminar esta área?')) return;
    await supabase.from('areas').delete().eq('id', id);
    setAreas(prev => prev.filter(a => a.id !== id));
  };

  // ── Render ────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center h-64 animate-pulse text-fuchsia-500/50">
      <Activity className="w-10 h-10" />
    </div>
  );

  if (error) return (
    <div className="bg-rose-950/20 border border-rose-500/30 p-8 rounded-3xl">
      <p className="text-rose-300 font-semibold">{error}</p>
    </div>
  );

  // ╔═══════════════════════════════════════╗
  // ║  DRILL-DOWN: Vista Interior Edificio ║
  // ╚═══════════════════════════════════════╝
  if (activeBuilding) return (
    <div className="text-zinc-300 space-y-6 pb-20">
      {/* Bread-crumb */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveBuilding(null)} className="text-purple-400 hover:text-white flex items-center gap-1.5 text-sm font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Sedes
        </button>
        <ChevronRight className="w-4 h-4 text-zinc-600"/>
        <span className="text-white font-bold">{activeBuilding.name}</span>
      </div>

      {/* Header Edificio */}
      <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/10 border border-purple-500/30 rounded-3xl p-8 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="bg-white/5 p-4 rounded-2xl border border-purple-500/20">
            <Building2 className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{activeBuilding.name}</h2>
            <p className="text-purple-200/60 text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {activeBuilding.location || 'Sin dirección asignada'}
              {activeBuilding.total_floors && <span className="ml-3 text-indigo-400">· {activeBuilding.total_floors} pisos totales</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operativo
          </span>
          <button onClick={() => setShowAreaForm(!showAreaForm)}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]">
            <Plus className="w-4 h-4" /> {showAreaForm ? 'Cancelar' : 'Nueva Área / Piso'}
          </button>
        </div>
      </div>

      {/* Formulario Nueva Área */}
      {showAreaForm && (
        <div className="bg-[#0a0118]/80 backdrop-blur-3xl border border-fuchsia-500/30 p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-[-30%] right-[-5%] w-48 h-48 bg-fuchsia-500/10 rounded-full blur-[60px] pointer-events-none" />
          <h3 className="text-lg font-bold text-white mb-5 relative z-10 flex items-center gap-2">
            <Layers className="text-fuchsia-400 w-5 h-5" /> Registrar Área / Zona / Piso
          </h3>
          <form onSubmit={handleCreateArea} className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1 space-y-2">
                <label className="text-xs font-bold text-purple-200/60 uppercase tracking-wider">Nombre del Área *</label>
                <input required type="text" value={areaName} onChange={e => setAreaName(e.target.value)}
                  placeholder="Ej. UCI Piso 2, Quirófano A..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-fuchsia-500/50 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-200/60 uppercase tracking-wider">Número de Piso</label>
                <input type="number" value={areaFloor} onChange={e => setAreaFloor(e.target.value)}
                  placeholder="Ej. 2, 3, -1 (sótano)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-fuchsia-500/50 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-200/60 uppercase tracking-wider">Tipo de Área</label>
                <select value={areaType} onChange={e => setAreaType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-fuchsia-500/60 transition-all font-medium">
                  <option value="">Categoría libre...</option>
                  <option value="Clínica">Clínica</option>
                  <option value="Quirúrgica">Quirúrgica</option>
                  <option value="Administrativa">Administrativa</option>
                  <option value="Técnica">Técnica / Mantenimiento</option>
                  <option value="Emergencias">Emergencias</option>
                  <option value="UCI">UCI / Cuidados Intensivos</option>
                  <option value="Farmacia">Farmacia</option>
                  <option value="Laboratorio">Laboratorio</option>
                  <option value="Almacén">Almacén</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={areaSubmitting}
                className="bg-emerald-900/50 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-400 hover:text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50">
                <CheckCircle2 className="w-4 h-4" /> {areaSubmitting ? 'Registrando...' : 'Confirmar Área'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Áreas */}
      {loadingAreas ? (
        <div className="flex justify-center py-16 animate-pulse text-purple-500/40"><Activity className="w-8 h-8" /></div>
      ) : areas.length === 0 ? (
        <div className="py-16 text-center border border-white/5 rounded-3xl bg-black/20">
          <Grid3X3 className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <p className="text-purple-200/50 font-medium">Este edificio no tiene áreas registradas.</p>
          <p className="text-zinc-500 text-sm mt-1">Usa el botón superior para añadir pisos, zonas o salas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map(area => (
            <div key={area.id} className="bg-[#0c0620]/70 border border-purple-500/10 hover:border-purple-500/30 rounded-2xl p-5 flex justify-between items-start transition-all group">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-fuchsia-400" />
                  <h4 className="font-bold text-white text-sm">{area.name}</h4>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {area.floor_number !== null && area.floor_number !== undefined && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      Piso {area.floor_number}
                    </span>
                  )}
                  {area.area_type && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      {area.area_type}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => deleteArea(area.id)}
                className="opacity-0 group-hover:opacity-100 text-rose-400/60 hover:text-rose-400 transition-all p-1.5 rounded-lg hover:bg-rose-500/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ╔════════════════════════╗
  // ║  Vista Lista Edificios ║
  // ╚════════════════════════╝
  return (
    <div className='text-zinc-300 relative z-10 space-y-8 pb-20'>
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h2 className='text-3xl font-bold tracking-tight text-white mb-2'>Gestión Topográfica</h2>
          <p className='text-purple-200/50 font-medium'>Control maestro de Sedes, Edificios y Sub-zonas clínicas ETHER.</p>
        </div>
        <button onClick={() => setShowBuildForm(!showBuildForm)}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-5 py-3 rounded-xl font-bold tracking-wide flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]">
          <Plus className="w-5 h-5" /> {showBuildForm ? 'Cancelar' : 'Nueva Sede'}
        </button>
      </div>

      {/* Formulario Crear Edificio */}
      {showBuildForm && (
        <div className="bg-[#0a0118]/80 backdrop-blur-3xl border border-fuchsia-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(217,70,239,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
            <Building2 className="text-fuchsia-400" /> Parametrizar Nuevo Edificio
          </h3>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10" onSubmit={handleCreateBuilding}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-purple-200/60 uppercase tracking-wider">Nombre del Recinto *</label>
              <input required type="text" value={buildName} onChange={e => setBuildName(e.target.value)}
                placeholder="Ej. Hospital Santa Clara"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-fuchsia-500/50 transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-purple-200/60 uppercase tracking-wider">Ubicación / Región</label>
              <input type="text" value={buildLocation} onChange={e => setBuildLocation(e.target.value)}
                placeholder="Ej. Zona Norte Metropolitana"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-fuchsia-500/50 transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-purple-200/60 uppercase tracking-wider">Total de Pisos</label>
              <input type="number" value={buildFloors} onChange={e => setBuildFloors(e.target.value)}
                placeholder="Ej. 5"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-fuchsia-500/50 transition-all font-medium" />
            </div>
            <div className="md:col-span-3 flex justify-end mt-2">
              <button type="submit" disabled={submitting}
                className="bg-emerald-900/50 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-400 hover:text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50">
                {submitting ? 'Registrando...' : 'Confirmar Operación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Edificios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-white/5 rounded-3xl bg-black/20 backdrop-blur-md">
            <AlertCircle className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
            <p className="text-purple-200/50 font-medium text-lg">La matriz topográfica está vacía.</p>
            <p className="text-zinc-500 text-sm mt-1">Registra la primera sede con el botón superior.</p>
          </div>
        ) : (
          buildings.map((b) => (
            <div key={b.id} onClick={() => openBuilding(b)}
              className="bg-[#12072e]/60 hover:bg-[#1a0b3b]/80 transition-all backdrop-blur-xl border border-purple-500/20 hover:border-fuchsia-500/40 p-6 rounded-3xl group relative overflow-hidden flex flex-col justify-between min-h-[220px] cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] group-hover:bg-fuchsia-500/20 transition-colors pointer-events-none" />

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <Building2 className="w-6 h-6 text-purple-300" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {b.status || 'Operativo'}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); deleteBuilding(b.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight pr-4">{b.name}</h3>
                <p className="text-purple-200/60 font-medium text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {b.location || 'Ubicación no asignada'}
                </p>
                {b.total_floors && (
                  <p className="text-indigo-400 text-xs mt-1 font-semibold">{b.total_floors} pisos</p>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-400 group-hover:text-white transition-colors">Ver Áreas y Zonas →</span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Building2, MapPin, Download, Cpu, Layers, Copy, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import QRCode from 'qrcode';

// ─── Canvas QR Branded ────────────────────────────────────────────────────────

async function buildBrandedQR(
  reportUrl: string,
  buildingName: string,
  subtitle: string
): Promise<string> {
  const W = 480, H = 620;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // Fondo
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#08010f');
  bg.addColorStop(1, '#110524');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Borde sutil
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.35;
  roundRect(ctx, 1, 1, W - 2, H - 2, 22);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Línea superior gradiente
  const accent = ctx.createLinearGradient(0, 0, W, 0);
  accent.addColorStop(0, '#c026d3');
  accent.addColorStop(0.5, '#a855f7');
  accent.addColorStop(1, '#6366f1');
  ctx.fillStyle = accent;
  roundRect(ctx, 20, 0, W - 40, 4, 2);
  ctx.fill();

  // Logo
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = '#c084fc';
  ctx.globalAlpha = 0.9;
  ctx.fillText('✦', 26, 50);
  ctx.globalAlpha = 1;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ETHER', 46, 52);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#a855f770';
  ctx.fillText('Mesa de Ayuda Inteligente', 46, 68);

  // Chip sede + área
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px system-ui, sans-serif';
  const chipW = Math.min(ctx.measureText(buildingName).width + 32, W - 60);
  const chipX = (W - chipW) / 2;
  ctx.fillStyle = '#a855f718';
  ctx.strokeStyle = '#a855f745';
  ctx.lineWidth = 1;
  roundRect(ctx, chipX, 84, chipW, 28, 14);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText(buildingName, W / 2, 103);

  if (subtitle) {
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#a855f780';
    ctx.fillText(subtitle, W / 2, 124);
  }

  // QR Code
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, reportUrl, {
    width: 270, margin: 1,
    color: { dark: '#ffffff', light: '#0a0118' },
  });
  const qrSize = 270;
  const qrX = (W - qrSize) / 2;
  const qrY = 148;

  ctx.fillStyle = '#0a0118';
  roundRect(ctx, qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 18);
  ctx.fill();
  ctx.strokeStyle = '#a855f728';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Texto inferior
  const txtY = qrY + qrSize + 38;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Escanea y reporta al instante', W / 2, txtY);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#71717a';
  ctx.fillText('Sin login · Gratis · Directo al equipo técnico', W / 2, txtY + 20);

  // Pie
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = '#3f3f46';
  ctx.fillText('Powered by ETHER · Mesa de Ayuda IA', W / 2, H - 16);

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function QrPage() {
  const supabase = createClient();

  const [buildings, setBuildings] = useState<any[]>([]);
  const [areas,     setAreas]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [baseUrl,   setBaseUrl]   = useState('');

  // Selección
  const [selBuilding, setSelBuilding] = useState<any>(null);
  const [selFloor,    setSelFloor]    = useState<number | null>(null);
  const [selArea,     setSelArea]     = useState<any>(null);

  // QR generado
  const [qrDataUrl,  setQrDataUrl]  = useState('');
  const [reportUrl,  setReportUrl]  = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied,     setCopied]     = useState(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
      if (profile?.org_id) {
        const { data: b } = await supabase.from('buildings').select('*').eq('org_id', profile.org_id).order('name');
        if (b) setBuildings(b);
        const { data: a } = await supabase.from('areas').select('*').eq('org_id', profile.org_id).order('floor_number').order('name');
        if (a) setAreas(a);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Pisos disponibles del edificio seleccionado
  const floors = selBuilding
    ? [...new Set(
        areas
          .filter(a => a.building_id === selBuilding.id && a.floor_number != null)
          .map(a => a.floor_number as number)
      )].sort((a, b) => a - b)
    : [];

  // Áreas del piso seleccionado
  const areasInFloor = selBuilding && selFloor != null
    ? areas.filter(a => a.building_id === selBuilding.id && a.floor_number === selFloor)
    : [];

  // Reset cascada
  const pickBuilding = (b: any) => {
    setSelBuilding(b); setSelFloor(null); setSelArea(null); setQrDataUrl(''); setReportUrl('');
  };
  const pickFloor = (f: number) => {
    setSelFloor(f); setSelArea(null); setQrDataUrl(''); setReportUrl('');
  };
  const pickArea = (a: any) => {
    setSelArea(a === selArea ? null : a); setQrDataUrl(''); setReportUrl('');
  };

  // Descripción del destino seleccionado
  const targetLabel = selArea
    ? selArea.name
    : selFloor != null
    ? `Piso ${selFloor}`
    : selBuilding
    ? 'Toda la sede'
    : null;

  const canGenerate = !!selBuilding;

  const generateQr = async () => {
    if (!selBuilding) return;
    setGenerating(true);

    const params = new URLSearchParams({ building_id: selBuilding.id });
    if (selArea)          params.set('area_id', selArea.id);
    else if (selFloor != null) params.set('floor', String(selFloor));

    const url = `${baseUrl}/report?${params.toString()}`;
    setReportUrl(url);

    const subtitle = selArea
      ? `Piso ${selArea.floor_number ?? ''} · ${selArea.name}`
      : selFloor != null
      ? `Piso ${selFloor}`
      : '';

    const branded = await buildBrandedQR(url, selBuilding.name, subtitle);
    setQrDataUrl(branded);
    setGenerating(false);
  };

  const downloadQr = () => {
    const suffix = selArea ? `-${selArea.name}` : selFloor != null ? `-Piso${selFloor}` : '';
    const link = document.createElement('a');
    link.download = `QR-ETHER-${selBuilding.name}${suffix}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(reportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-fuchsia-400 animate-pulse">
      <Cpu className="w-10 h-10" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <QrCode className="text-fuchsia-400" /> Generador de Códigos QR
        </h2>
        <p className="text-purple-200/40 mt-1 text-sm">Crea QR por sede, piso o área específica. Imprime y pega donde corresponde.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── CONFIGURADOR (3 pasos) ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* PASO 1 — SEDE */}
          <div className="bg-[#0a0118]/80 border border-purple-500/20 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-purple-300/60 uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Paso 1 — Sede / Edificio
            </p>
            {buildings.length === 0 ? (
              <p className="text-zinc-600 text-sm">No hay sedes registradas. Crea una en "Edificios".</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {buildings.map(b => (
                  <button key={b.id} onClick={() => pickBuilding(b)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      selBuilding?.id === b.id
                        ? 'border-fuchsia-500/60 bg-fuchsia-900/20 text-white'
                        : 'border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                    }`}>
                    <Building2 className={`w-4 h-4 mb-1.5 ${selBuilding?.id === b.id ? 'text-fuchsia-400' : 'text-zinc-500'}`} />
                    <p className="text-xs font-bold truncate">{b.name}</p>
                    {b.location && <p className="text-[10px] text-zinc-600 truncate mt-0.5">{b.location}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PASO 2 — PISO */}
          {selBuilding && (
            <div className="bg-[#0a0118]/80 border border-purple-500/20 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-purple-300/60 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Paso 2 — Piso
              </p>
              {floors.length === 0 ? (
                <p className="text-zinc-600 text-sm">Esta sede no tiene pisos configurados en las áreas.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => pickFloor(selFloor as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selFloor === null
                        ? 'border-purple-500/50 bg-purple-900/20 text-purple-300'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}>
                    Toda la sede
                  </button>
                  {floors.map(f => (
                    <button key={f} onClick={() => pickFloor(f)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selFloor === f
                          ? 'border-fuchsia-500/60 bg-fuchsia-900/20 text-fuchsia-300'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}>
                      Piso {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASO 3 — ÁREA */}
          {selBuilding && selFloor != null && areasInFloor.length > 0 && (
            <div className="bg-[#0a0118]/80 border border-purple-500/20 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-purple-300/60 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Paso 3 — Área específica (opcional)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {areasInFloor.map(a => (
                  <button key={a.id} onClick={() => pickArea(a)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      selArea?.id === a.id
                        ? 'border-emerald-500/60 bg-emerald-900/20 text-white'
                        : 'border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                    }`}>
                    <MapPin className={`w-4 h-4 mb-1.5 ${selArea?.id === a.id ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <p className="text-xs font-bold truncate">{a.name}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">Piso {a.floor_number}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RESUMEN + GENERAR */}
          {selBuilding && (
            <div className="bg-[#0a0118]/80 border border-fuchsia-500/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-500">Destino:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold">{selBuilding.name}</span>
                  {selFloor != null && <>
                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-fuchsia-300 font-bold">Piso {selFloor}</span>
                  </>}
                  {selArea && <>
                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-emerald-300 font-bold">{selArea.name}</span>
                  </>}
                  {!selFloor && !selArea && (
                    <span className="text-zinc-500 text-xs">· Toda la sede</span>
                  )}
                </div>
              </div>

              <button onClick={generateQr} disabled={!canGenerate || generating}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center justify-center gap-2">
                {generating
                  ? <><Cpu className="w-5 h-5 animate-pulse" /> Generando...</>
                  : <><Zap className="w-5 h-5" /> Generar QR Ahora</>}
              </button>
            </div>
          )}
        </div>

        {/* ── PREVIEW ── */}
        <div className="lg:col-span-2 bg-[#0a0118]/80 border border-fuchsia-500/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-5 sticky top-8 self-start">
          {qrDataUrl ? (
            <>
              <div className="w-full max-w-[240px] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(217,70,239,0.2)] border border-fuchsia-500/20">
                <img src={qrDataUrl} alt="QR Branded" className="w-full" />
              </div>

              <div className="w-full space-y-2">
                <button onClick={downloadQr}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] text-sm">
                  <Download className="w-4 h-4" /> Descargar PNG
                </button>
                <button onClick={copyLink}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold px-5 py-3 rounded-xl transition-all text-sm">
                  {copied ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar enlace</>}
                </button>
              </div>

              <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
                Imprime y pega donde corresponde.<br />
                Cualquier persona con cámara puede escanearlo.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 opacity-20">
              <div className="border-2 border-dashed border-fuchsia-500/50 rounded-2xl p-10">
                <QrCode className="w-20 h-20 text-fuchsia-400" />
              </div>
              <p className="text-zinc-500 text-sm font-medium">El QR aparecerá aquí</p>
            </div>
          )}
        </div>

      </div>

      {/* ── TABLA RÁPIDA POR PISO ── */}
      {selBuilding && floors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white border-t border-white/5 pt-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-fuchsia-400" /> Generación rápida por área
          </h3>
          <div className="bg-[#0a0118]/60 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Área</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Piso</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {areas.filter(a => a.building_id === selBuilding.id).map(a => (
                  <tr key={a.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 text-white font-medium flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" /> {a.name}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {a.floor_number != null ? `Piso ${a.floor_number}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelFloor(a.floor_number);
                          setSelArea(a);
                          setQrDataUrl(''); setReportUrl('');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-fuchsia-500/10 border border-transparent hover:border-fuchsia-500/20">
                        Seleccionar →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

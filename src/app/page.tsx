'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, CheckCircle2, ShieldAlert, PlayCircle, FileText, Activity, Layers, 
  Terminal, Bot, Target, XCircle, Zap, ShieldCheck, Database, QrCode, BrainCircuit, 
  ActivitySquare, AlertTriangle, Workflow, Wrench, TrendingDown, ArrowUpRight, BarChart3, Clock, LineChart, Cpu, Network, ShieldClose 
} from 'lucide-react';

// --- LOGO SVG PARAMÉTRICO ---
const EtherLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="ether-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#9333ea" />
        <stop offset="100%" stopColor="#4c1d95" />
      </linearGradient>
      <filter id="inner-glow">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feOffset dx="-2" dy="-2" />
        <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
        <feFlood floodColor="white" floodOpacity="0.6" />
        <feComposite in2="shadowDiff" operator="in" />
        <feComposite in2="SourceGraphic" operator="over" />
      </filter>
      <filter id="drop-shadow">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#7e22ce" floodOpacity="0.4"/>
      </filter>
    </defs>
    <g filter="url(#drop-shadow)">
      <path d="M 20 50 L 20 20 Q 20 10 35 15 L 85 15 L 75 25 L 35 25 Q 30 25 30 30 L 30 50 Z" fill="url(#ether-grad)" filter="url(#inner-glow)"/>
      <path d="M 80 50 L 80 80 Q 80 90 65 85 L 15 85 L 25 75 L 65 75 Q 70 75 70 70 L 70 50 Z" fill="url(#ether-grad)" filter="url(#inner-glow)"/>
      <path d="M 42 35 L 58 35 L 58 43 L 48 43 L 48 47 L 55 47 L 55 53 L 48 53 L 48 57 L 58 57 L 58 65 L 42 65 Z" fill="url(#ether-grad)" filter="url(#inner-glow)"/>
    </g>
  </svg>
);

const MarqueeText = () => (
  <div className="relative flex overflow-x-hidden w-full border-y border-white/[0.04] bg-[#1a0b2e]/20 backdrop-blur-3xl py-3 z-10">
    <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-[13px] text-purple-200/40 font-medium uppercase tracking-[0.2em] px-6">
      <span className="flex items-center gap-3"><Sparkles className="w-4 h-4"/> Monitoreo Predictivo en Tiempo Real</span>
      <span className="flex items-center gap-3"><Activity className="w-4 h-4"/> Detección de Fallas Antes del Colapso</span>
      <span className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4"/> Cumple 100% Resolución 3100</span>
      <span className="flex items-center gap-3"><FileText className="w-4 h-4"/> Sistematiza Trazabilidad y Subida de Obras</span>
      <span className="flex items-center gap-3"><ShieldCheck className="w-4 h-4"/> Defensa Total para Visitas Sanitarias</span>
      <span className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4"/> Ayuda Total en Auditorías Clínicas</span>
      
      <span className="flex items-center gap-3"><Sparkles className="w-4 h-4"/> Monitoreo Predictivo en Tiempo Real</span>
      <span className="flex items-center gap-3"><Activity className="w-4 h-4"/> Detección de Fallas Antes del Colapso</span>
      <span className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4"/> Cumple 100% Resolución 3100</span>
      <span className="flex items-center gap-3"><FileText className="w-4 h-4"/> Sistematiza Trazabilidad y Subida de Obras</span>
      <span className="flex items-center gap-3"><ShieldCheck className="w-4 h-4"/> Defensa Total para Visitas Sanitarias</span>
      <span className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4"/> Ayuda Total en Auditorías Clínicas</span>
    </div>
  </div>
);

// --- SECCIÓN 7 CAPACIDADES (NATIVE STICKY LIMPÍSIMO) ---
const featureList = [
  { icon: QrCode, title: "Códigos QR Inteligentes", num: "01", desc: "Genera códigos QR únicos por área, piso o equipo. Reporta fallas en < 30s con ubicación automática." },
  { icon: Layers, title: "Priorización IA", num: "02", desc: "Asignación inteligente según criticidad del área, reincidencias y SLA histórico para máxima eficiencia." },
  { icon: BrainCircuit, title: "IA Predictiva de Fallas", num: "03", desc: "Anticipa el riesgo a 30/60/90 días basándose en historial, recurrencia y edad del activo." },
  { icon: ActivitySquare, title: "Detección de Patrones", num: "04", desc: "Identifica tendencias negativas, aumentos inusuales y tickets crónicos con deterioro acelerado." },
  { icon: Workflow, title: "Simulación de Escenarios", num: "05", desc: "Visualiza rápidamente qué pasaría con tu banco de dinero si reduces preventivos o postergas obras." },
  { icon: Bot, title: "IA Conversacional", num: "06", desc: "Solo pregunta: ¿Qué área falló más hoy en general? y recibe gráficos y análisis limpios al instante." },
  { icon: Wrench, title: "UX Técnica en Campo", num: "07", desc: "Checklists automáticos dictados, recomendaciones al instante de solución y contexto pleno desde el móvil." }
];

const NativeStickyScroll = () => {
  return (
    <div className="relative w-full py-24 pb-40">
      <div className="absolute top-1/2 right-0 w-[50vw] h-[50vw] bg-[#6d28d9]/10 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-16 lg:gap-24 items-start relative z-10 w-full">
        <div className="w-full lg:w-5/12 lg:sticky lg:top-40 flex flex-col pt-10">
           <div className="inline-flex px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-xs font-semibold uppercase tracking-widest text-purple-400 mb-6 backdrop-blur-md w-fit shadow-[0_0_20px_rgba(139,92,246,0.1)]">
            Arquitectura del Sistema
          </div>
          <h2 className="text-4xl md:text-6xl font-semibold text-white tracking-tight mb-8 leading-[1.1]">
            El Modelo Integral <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">Hospitalario.</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed mb-12">
            La plataforma cuenta con 7 capacidades tecnológicas operativas que aseguran el control total de tu infraestructura a medida que exploras hacia abajo.
          </p>
          
          <div className="hidden lg:flex flex-col gap-4">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-10 bg-gradient-to-b from-purple-500 to-fuchsia-500 rounded-full" />
               <p className="text-sm text-purple-300/60 uppercase tracking-widest font-mono">Desliza para descubrir</p>
             </div>
          </div>
        </div>

        <div className="w-full lg:w-7/12 flex flex-col gap-8 md:gap-12 pb-20">
          {featureList.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                key={i}
                className="w-full p-8 md:p-14 rounded-[2.5rem] md:rounded-[3rem] bg-[#0a0118]/80 backdrop-blur-2xl border border-purple-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group hover:border-purple-500/50 hover:shadow-[0_20px_60px_rgba(168,85,247,0.15)] transition-all"
              >
                <div className="absolute top-0 right-0 w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[60px]" />
                <div className="flex justify-between items-start mb-8 md:mb-10 relative z-10 w-full">
                   <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.2rem] md:rounded-[1.5rem] bg-[#1a0b3b] border border-purple-500/30 flex items-center justify-center shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]">
                      <Icon className="w-8 h-8 md:w-10 md:h-10 text-purple-300" />
                   </div>
                   <span className="text-5xl md:text-6xl font-black text-white/5 tracking-tighter drop-shadow-md">{f.num}</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6 tracking-tight relative z-10">{f.title}</h3>
                <p className="text-base md:text-xl text-purple-100/70 font-light leading-relaxed relative z-10 pr-4">{f.desc}</p>
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-4 flex-wrap relative z-10">
                   <span className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-emerald-900/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/20">+ Rendimiento Inmediato</span>
                   <span className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-white/5 text-purple-200/50 text-xs font-semibold uppercase tracking-wider border border-white/10">Aprobado Opex</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

// === MAIN PAGE COMPONENT === //
export default function EtherProLanding() {
  const [activos, setActivos] = useState<number>(300);
  const [costoActivo, setCostoActivo] = useState<number>(1500000);
  const [porcentajeAhorro, setPorcentajeAhorro] = useState<number>(18);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', minimumFractionDigits: 0}).format(val);

  const costoMensualTotal = activos * costoActivo;
  const ahorroMensual = costoMensualTotal * (porcentajeAhorro / 100);
  const ahorroAnual = ahorroMensual * 12;

  // Calculadora ROI Refinada
  const Slider = ({ label, val, max, min, step, set, unit, color }: any) => {
    const percentage = ((val - min) / (max - min)) * 100;
    return (
      <div className="mb-12 relative w-full group/slider select-none z-50">
         <div className="flex justify-between mb-5">
           <label className="text-sm md:text-base text-zinc-300 font-medium tracking-wide">{label}</label>
           <span className={`text-transparent bg-clip-text bg-gradient-to-r from-${color}-400 to-${color}-200 font-bold text-xl md:text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]`}>
              {unit === "$" ? formatCurrency(val) : `${val}${unit}`}
           </span>
         </div>
         <div className="relative w-full h-8 flex items-center cursor-pointer">
             <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="absolute w-full h-full opacity-0 cursor-pointer z-30 m-0" style={{ touchAction: 'none' }} />
             <div className="w-full h-3 rounded-full bg-[#1c0b3b] border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden absolute z-10 pointer-events-none">
                  <div className="h-full bg-gradient-to-r from-purple-700 to-fuchsia-500 transition-all duration-75 ease-linear shadow-[0_0_15px_rgba(168,85,247,0.5)]" style={{ width: `${percentage}%` }}/>
             </div>
             <div className="w-7 h-7 bg-white border-[4px] border-fuchsia-500 rounded-full shadow-[0_0_20px_rgba(217,70,239,0.9)] absolute z-20 pointer-events-none group-hover/slider:scale-110 transition-transform duration-100 flex items-center justify-center pointer-events-none" style={{ left: `calc(${percentage}% - 14px)` }}></div>
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#030008] text-zinc-300 font-sans selection:bg-fuchsia-500/30 overflow-x-hidden relative">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-flex; animation: marquee 60s linear infinite; min-width: 200%; }
        .moving-gradient-bg { background: linear-gradient(120deg, #9333ea, #4f46e5, #c026d3, #9333ea); background-size: 300% 300%; animation: gradient-shift 4s ease infinite; }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .scan-line { width: 100%; height: 2px; background: rgba(168,85,247,0.3); position: absolute; top: 0; left: 0; animation: scan 3s linear infinite; box-shadow: 0 0 10px rgba(168,85,247,0.5); }
        @keyframes scan { 0% { top: -10%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 110%; opacity: 0; } }
      `}} />

      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#030008]">
        <div className="absolute inset-0 w-full h-[300vh]">
          <div className="absolute top-[5%] left-[-10%] w-[70vw] h-[70vw] bg-[#6d28d9]/15 rounded-full blur-[140px] animate-[pulse_12s_ease-in-out_infinite]" />
          <div className="absolute top-[30%] right-[-10%] w-[60vw] h-[60vw] bg-[#4c1d95]/20 rounded-full blur-[150px] animate-[pulse_16s_ease-in-out_infinite_alternate]" />
          <div className="absolute top-[60%] left-[10%] w-[50vw] h-[50vw] bg-[#c026d3]/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(76,29,149,0.03)_0%,_rgba(0,0,0,0.9)_100%)]" />
        </div>
      </div>

      <nav className="fixed w-full top-6 z-50 px-6 lg:px-12 pointer-events-none">
        <div className="max-w-[1400px] mx-auto flex justify-between sm:justify-center items-center pointer-events-auto">
          <div className="w-full h-16 rounded-full sm:rounded-[2rem] bg-black/40 backdrop-blur-3xl border border-white/[0.08] shadow-[0_15px_40px_rgb(0,0,0,0.8)] flex items-center justify-between px-6 sm:px-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-transparent opacity-50" />
            <div className="flex items-center gap-3 cursor-pointer group relative z-10">
              <div className="bg-white/5 p-1.5 rounded-full border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <EtherLogo className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-[0.15em] text-white leading-tight mt-0.5">ETHER</span>
            </div>
            <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-3 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-300 tracking-widest uppercase">IA PREDICTIVA EN LINEA</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium relative z-10">
              <Link href="/auth" className="text-zinc-400 hover:text-white transition-colors tracking-wide text-sm font-medium">Login</Link>
              <a href="https://calendar.app.google/vUAqxb3XAExu5dNQ9" target="_blank" rel="noopener noreferrer" className="relative group/btn rounded-full overflow-hidden p-[1px] shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-[#4c1d95] to-fuchsia-400 rounded-full animate-[spin_4s_linear_infinite]" />
                <div className="relative h-full w-full rounded-full bg-black flex items-center justify-center px-4 sm:px-6 py-1.5 sm:py-2 overflow-hidden">
                  <div className="absolute inset-0 moving-gradient-bg opacity-30 mix-blend-screen scale-110" />
                  <span className="relative text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider text-center">Hablar Ventas</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 sm:pt-40 pb-20 w-full relative z-10">
        <section className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-16 items-center mb-24 min-h-[75vh]">
          <div className="flex flex-col items-start pt-10 sm:pt-0">
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.02] border border-purple-500/20 backdrop-blur-md text-xs font-medium mb-8 shadow-[0_0_30px_rgba(139,92,246,0.15)] overflow-hidden relative"
            >
              <div className="absolute inset-0 moving-gradient-bg opacity-20" />
              <Sparkles className="w-4 h-4 text-fuchsia-400 relative z-10" />
              <span className="text-purple-100 uppercase tracking-widest text-[9px] sm:text-xs relative z-10 font-bold">Plataforma Predictiva de Opex</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter leading-[1.1] drop-shadow-2xl max-w-4xl"
            >
              Revolucionamos la gestión de mantenimiento usando <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-300 drop-shadow-[0_0_20px_rgba(192,132,252,0.4)] transition-all duration-700">inteligencia artificial.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-lg sm:text-2xl text-purple-200/60 mb-12 max-w-xl font-light leading-relaxed"
            >
              Mapea, predice y gobierna toda tu infraestructura técnica desde una sola pantalla. Cero sorpresas financieras, 100% control operativo.
            </motion.p>
            <div className="flex flex-col gap-3 mb-12">
               <div className="flex items-center gap-3 bg-gradient-to-r from-fuchsia-900/40 to-transparent p-3.5 rounded-xl border-l-[2px] border-fuchsia-500 text-sm md:text-base text-purple-100 font-semibold shadow-[0_5px_15px_rgba(217,70,239,0.1)]">
                 <TrendingDown className="w-5 h-5 text-fuchsia-400"/> ↓ 45% Reducción garantizada en costos por mantenimientos correctivos.
               </div>
               <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-900/40 to-transparent p-3.5 rounded-xl border-l-[2px] border-emerald-500 text-sm md:text-base text-purple-100 font-semibold shadow-[0_5px_15px_rgba(16,185,129,0.1)]">
                 <ShieldCheck className="w-5 h-5 text-emerald-400"/> ↑ Control preventivo absoluto e historial en la nube al instante.
               </div>
               <div className="flex items-center gap-3 bg-gradient-to-r from-purple-900/40 to-transparent p-3.5 rounded-xl border-l-[2px] border-purple-500 text-sm md:text-base text-purple-100 font-semibold shadow-[0_5px_15px_rgba(168,85,247,0.1)]">
                 <Target className="w-5 h-5 text-purple-400"/> ↓ Eliminación total de tiempos colapsados mitigando multas y hallazgos.
               </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
              <Link href="/auth" className="w-full sm:w-auto block">
                <div className="relative w-full sm:w-auto rounded-full overflow-hidden p-[1px] group shadow-[0_0_50px_rgba(147,51,234,0.5)] hover:shadow-[0_0_80px_rgba(147,51,234,0.7)] transition-shadow duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent rounded-full animate-[spin_3s_linear_infinite]" />
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-black/40 backdrop-blur-3xl border border-white/5">
                    <div className="absolute inset-0 moving-gradient-bg opacity-40 mix-blend-screen scale-110" />
                    <div className="relative px-10 sm:px-12 py-4 sm:py-5 flex items-center justify-center gap-4">
                      <span className="text-[1.15rem] sm:text-[1.35rem] font-bold text-white tracking-wide">Desplegar ETHER</span>
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
              <button className="group px-8 py-5 rounded-full flex items-center justify-center gap-3 text-zinc-400 font-medium hover:text-white transition-all bg-white/[0.02] border border-transparent hover:border-white/10 hover:bg-white/[0.05]">
                <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-fuchsia-400 transition-colors"/><span className="text-base sm:text-lg">Recorrido técnico</span>
              </button>
            </div>
          </div>

          <div className="relative w-full h-[600px] md:h-[700px] flex items-center justify-center mt-12 xl:mt-0 px-4 md:px-0">
            <div className="w-full h-full bg-[#0a0118]/60 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] border border-white/[0.1] p-6 md:p-8 flex flex-col justify-between shadow-[0_0_60px_rgba(139,92,246,0.15)] relative overflow-hidden group">
              <div className="absolute top-[-20%] right-[-20%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-indigo-600/30 rounded-full blur-[100px] group-hover:bg-fuchsia-500/20 transition-all duration-700" />
              <div className="scan-line" />
              <div className="flex items-center justify-between relative z-10 mb-8 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-[1rem] md:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    <Activity className="text-white w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm md:text-xl tracking-tight">Centro de Mando Predictivo</h4>
                    <p className="text-[10px] md:text-xs text-purple-200/50 font-medium uppercase tracking-[0.2em]">Live Operation Mode</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse"></div>
                   <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                   <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>

              <div className="z-10 grid grid-cols-2 gap-3 md:gap-4 flex-1 content-start">
                <div className="col-span-1 bg-black/40 backdrop-blur-xl p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-white/5 relative overflow-hidden group/card shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500" />
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[9px] md:text-[11px] text-purple-100/60 font-bold uppercase tracking-wider">ROI Opex</p>
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tighter">$842k</p>
                  <div className="flex items-center gap-1.5 text-[9px] md:text-xs text-emerald-400 bg-emerald-400/10 w-fit px-2 md:px-3 py-1 md:py-1.5 rounded-md border border-emerald-500/20 font-semibold shadow-inner"> +14.2% mitigado </div>
                </div>

                <div className="col-span-1 bg-black/40 backdrop-blur-xl p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-white/5 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] scale-150"><BrainCircuit className="w-16 h-16 md:w-20 md:h-20 text-white"/></div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[9px] md:text-[11px] text-purple-100/60 font-bold uppercase tracking-wider">Precisión</p>
                  </div>
                  <p className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-purple-300 mb-3 md:mb-5 tracking-tighter">99.8%</p>
                  <div className="w-full bg-white/10 h-1.5 md:h-2 rounded-full overflow-hidden shadow-inner flex shrink-0">
                     <div className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.9)] relative" style={{ width: "99.8%" }}></div>
                  </div>
                </div>

                <div className="col-span-1 bg-[#120524]/60 backdrop-blur-xl p-4 md:p-5 border border-purple-500/20 rounded-2xl md:rounded-[2rem] relative flex flex-col justify-center">
                  <div className="absolute top-3 right-3"><LineChart className="w-4 h-4 text-fuchsia-500/40" /></div>
                  <p className="text-[9px] md:text-[11px] text-fuchsia-400 font-bold uppercase tracking-wider mb-1">MTTR (Resolución)</p>
                  <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none">18</span>
                    <span className="text-[10px] md:text-sm font-medium text-purple-200/50">min</span>
                  </div>
                  <p className="text-[9px] md:text-xs text-emerald-400 mt-1 md:mt-2 font-medium break-words">↓ 86% vs tiempo manual</p>
                </div>

                <div className="col-span-1 bg-[#1a110a]/60 backdrop-blur-xl p-4 md:p-5 border border-orange-500/20 rounded-2xl md:rounded-[2rem] relative flex flex-col justify-center overflow-hidden">
                   <div className="absolute top-2 right-2 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
                   <p className="text-[9px] md:text-[11px] text-orange-400 font-bold uppercase tracking-wider mb-1 mt-1">Status Auditoría</p>
                   <p className="text-2xl md:text-3xl font-bold text-white tracking-tighter mt-0.5">100%</p>
                   <div className="flex items-center gap-1.5 mt-2 md:mt-3">
                    <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
                    <p className="text-[8px] md:text-[10px] text-emerald-500 font-semibold uppercase leading-tight">Sin hallazgos<br className="sm:hidden"/> técnicos</p>
                   </div>
                </div>

                <div className="col-span-2 bg-[#0a0118]/80 backdrop-blur-xl p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-emerald-500/20 relative flex items-center justify-between shadow-[inset_0_0_30px_rgba(16,185,129,0.05)]">
                  <div className="absolute left-0 top-0 h-full w-[2px] md:w-[3px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <div className="flex items-center gap-3 md:gap-4 pl-2 md:pl-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-[1rem] md:rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                      <BarChart3 className="text-emerald-400 w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs text-emerald-400/60 font-bold uppercase tracking-wider leading-tight">Carga Operativa</p>
                      <p className="text-lg md:text-2xl font-bold text-white tracking-tighter leading-tight mt-1">Óptima</p>
                    </div>
                  </div>
                  <div className="h-full py-1 md:py-2 flex items-end gap-1 md:gap-1.5 pr-2">
                     {[4, 7, 5, 8, 9, 6, 10, 12, 10].map((h, i) => (
                       <div key={i} className="w-1.5 md:w-2 bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.4)] rounded-t-sm" style={{ height: `${h * 3}px` }} />
                     ))}
                  </div>
                </div>
              </div>

              <div className="z-10 bg-gradient-to-r from-rose-950/40 to-rose-900/10 border border-rose-500/30 p-4 md:p-5 rounded-2xl md:rounded-3xl mt-4 md:mt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-2xl shadow-[inset_0_0_30px_rgba(225,29,72,0.1)] cursor-pointer">
                 <div className="flex items-center gap-3 md:gap-4">
                   <div className="relative flex shrink-0 h-4 md:h-5 w-4 md:w-5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-4 md:h-5 w-4 md:w-5 bg-rose-500"></span>
                   </div>
                   <div>
                      <p className="text-sm md:text-base font-bold text-white tracking-tight break-words pr-2">Riesgo Quirúrgico Automático Evitado</p>
                      <p className="text-[10px] md:text-xs text-rose-200/80 font-medium tracking-wide">Falla de enfriamiento bloqueada - Cero Daños</p>
                   </div>
                 </div>
                 <button className="w-full md:w-auto text-[11px] md:text-sm bg-rose-500/20 border border-rose-500 hover:bg-rose-500 hover:text-white text-rose-300 font-bold px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] text-center">
                   Dictar Acción Automática
                 </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 relative z-20">
          <MarqueeText />
        </section>

        {/* === 2. SECCIÓN STICKY NATIVE SCROLL WOW === */}
        <NativeStickyScroll />

        {/* === 3. NUEVA SECCIÓN ESCENARIOS CONTRASTANTE === */}
        <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tighter">La Realidad de tu Operación</h2>
            <p className="text-lg md:text-xl text-purple-200/60 max-w-2xl mx-auto font-light">¿En qué bando te encuentras hoy? El mantenimiento que controla el dinero frente al caos reactivo.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
             <motion.div
               initial={{ opacity: 1, x: 0 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="bg-[#100318]/90 border border-rose-500/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/5 rounded-full blur-[80px]" />
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-rose-500/20 bg-rose-500/10 text-xs font-semibold text-rose-300 mb-8 w-fit mx-auto lg:mx-0">
                  <ShieldAlert className="w-4 h-4" /> La Enfermedad: Sin ETHER
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Mantenimiento ahogado en emergencias diarias.</h3>
                <div className="flex flex-col gap-6 mt-10">
                   {["Capital asfixiado en reemplazos reactivos impredecibles.", "Horas tiradas a la basura reparando equipos que debieron descartearse hace años.", "Personal de mantenimiento frustrado, corriendo detrás del daño que ya sucedió.", "Auditorías en caos absoluto por falta de trazabilidad, papeles desordenados e historial perdido."].map((pain, i) => (
                     <div key={i} className="flex gap-4 items-start">
                        <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-base md:text-lg text-rose-200/70 font-light">{pain}</p>
                     </div>
                    ))}
                 </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 1, x: 0 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-gradient-to-br from-[#12072e] to-[#0a0118] border border-fuchsia-500/30 rounded-[3rem] p-10 md:p-14 shadow-[0_0_60px_rgba(217,70,239,0.1)] relative overflow-hidden group hover:border-fuchsia-500/60 transition-colors duration-500"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-600/10 rounded-full blur-[80px]" />
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-400 mb-8 w-fit mx-auto lg:mx-0">
                  <ShieldCheck className="w-4 h-4" /> La Cura: Con ETHER Operativo
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-100 to-fuchsia-200 mb-6 drop-shadow-md">Dominio Absoluto. Cero sorpresas financieras.</h3>
                <div className="flex flex-col gap-6 mt-10">
                   {["Disminución masiva del mantenimiento correctivo. La Inteligencia Artificial ataca el daño 30 días antes de ocurrir.", "Aumenta proyecciones de SLA a la perfección y automatiza todos tus indicativos con reportajes perfectos.", "Sube fotografías, firmas, todo el seguimiento de las obras hechas al hospital y genera reportes consolidados sin esfuerzo al instante.", "Libertad mental: Todo el control, seguimiento y dinero preservado al toque de una app técnica que coordina solita."].map((growth, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-base md:text-lg text-purple-100/90 font-light">{growth}</p>
                       </div>
                   ))}
                 </div>
              </motion.div>
           </div>
        </section>

        {/* Separador brillante sutil */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        {/* === 4. CALCULADORA ROI === */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-24" id="normativa">
          <div className="p-6 sm:p-10 md:p-14 lg:p-20 rounded-[2.5rem] lg:rounded-[3.5rem] bg-[#0a0118]/80 border border-purple-500/20 backdrop-blur-3xl mb-10 premium-glow relative overflow-hidden group shadow-2xl">
            <div className="absolute top-[-30%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[3px] md:h-[5px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tighter">El retorno es puramente matemático.</h3>
            <p className="text-base md:text-lg lg:text-xl text-purple-200/60 mb-12 lg:mb-16 max-w-2xl font-light">
               Desliza los parámetros inferiores asimilándolos a tu reality operativa actual. Descubre la suma colosal que estarás liberando mensualmente de tu presupuesto de reparaciones de emergencia.
            </p>
            <div className="space-y-10 lg:space-y-12 mb-16 relative z-10 w-full mx-auto">
              <Slider label="Inventario de Activos Críticos" val={activos} min={10} max={2000} step={10} set={setActivos} unit="" color="fuchsia" />
              <Slider label="Coste de Mantenimiento Promedio Anual" val={costoActivo} min={100000} max={5000000} step={50000} set={setCostoActivo} unit="$" color="fuchsia" />
              <Slider label="% Mitigación gracias a ETHER IA" val={porcentajeAhorro} min={1} max={50} step={1} set={setPorcentajeAhorro} unit="%" color="fuchsia" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 relative z-10 w-full mt-10 border-t border-white/5 pt-12">
               <div className="p-8 lg:p-10 rounded-[2rem] bg-black/50 border border-white/5 flex flex-col justify-center shadow-lg">
                <p className="text-[11px] lg:text-sm text-zinc-500 mb-2 font-bold uppercase tracking-wider">Fuga Operativa Anual actual</p>
                <div className="w-full break-words">
                   <p className="font-bold text-zinc-100 text-4xl xl:text-4xl tracking-tighter">{formatCurrency(costoMensualTotal * 12)}</p>
                </div>
              </div>
              <div className="p-8 lg:p-10 rounded-[2rem] bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden flex flex-col justify-center">
                <Zap className="absolute top-6 right-6 w-8 h-8 text-emerald-500 opacity-20" />
                <p className="text-[11px] lg:text-sm text-emerald-400 mb-2 font-bold uppercase tracking-wider relative z-10">Sangrado Detenido (Dólares Frescos/Mes)</p>
                <div className="w-full break-words">
                   <p className="font-bold text-emerald-300 text-4xl xl:text-4xl tracking-tighter relative z-10">{formatCurrency(ahorroMensual)}</p>
                </div>
              </div>
              <div className="p-8 lg:p-10 rounded-[2rem] bg-gradient-to-b from-[#1c0836] to-[#0d021c] border-2 border-fuchsia-500/50 flex flex-col justify-center shadow-[0_0_50px_rgba(217,70,239,0.2)]">
                <p className="text-[11px] lg:text-sm text-fuchsia-300 mb-2 font-bold uppercase tracking-wider drop-shadow-md">Capital Recuperado para Innovación (1 Año)</p>
                <div className="w-full break-words">
                   <p className="font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-fuchsia-200 text-5xl tracking-tighter drop-shadow-[0_0_20px_rgba(217,70,239,0.4)] block pb-1">{formatCurrency(ahorroAnual)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === 5. CIERRE UNICORNIO === */}
        <section className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20 md:py-32 text-center relative mt-10 md:mt-16 overflow-hidden md:overflow-visible">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[70vw] h-[400px] md:h-[500px] bg-gradient-to-r from-fuchsia-700/20 to-indigo-700/20 blur-[100px] md:blur-[150px] rounded-full pointer-events-none -z-10" />
          <div className="inline-flex items-center gap-2 px-5 md:px-6 py-2 md:py-2.5 rounded-full border border-purple-500/30 bg-purple-900/30 text-xs md:text-sm text-purple-100 tracking-wider mb-6 md:mb-8 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.3)] mx-auto">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-fuchsia-400 shrink-0" /> Control Quirúrgico y Financiero
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-[6rem] font-bold text-white mb-6 md:mb-8 tracking-tighter leading-[1.05] drop-shadow-2xl px-2">
            Deja de apagar incendios. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-indigo-300 to-white drop-shadow-[0_0_25px_rgba(217,70,239,0.6)]">Empieza a gobernar.</span>
          </h2>
          <p className="text-lg md:text-[1.35rem] text-purple-200/60 max-w-3xl mx-auto mb-12 md:mb-16 font-light leading-relaxed px-4">
            Las juntas directivas de los hospitales de Categoría 1 ya no piden reportes de mantenimiento repletos de quejas. Piden revisar su Centro de Mando Predictivo ETHER.
          </p>
          <a href="https://calendar.app.google/vUAqxb3XAExu5dNQ9" target="_blank" rel="noopener noreferrer" className="inline-block relative group px-10 md:px-16 py-5 md:py-7 rounded-full bg-white text-[#1a0b2e] font-bold text-xl md:text-2xl overflow-hidden shadow-[0_0_80px_rgba(255,255,255,0.4)] hover:shadow-[0_0_120px_rgba(255,255,255,0.6)] transition-all transform hover:scale-105 active:scale-95 duration-300 w-[90%] sm:w-auto">
            <span className="relative z-10 flex items-center justify-center gap-3">Agendar Visita de Despliegue <ArrowRight className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-x-2 transition-transform shrink-0"/></span>
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-200 to-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
        </section>
      </main>

      <footer className="w-full border-t border-purple-500/20 py-12 md:py-16 bg-[#030008] relative z-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row gap-10 items-center justify-between">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-3 cursor-pointer group w-fit">
              <EtherLogo className="w-8 h-8 md:w-10 md:h-10 opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              <span className="text-2xl md:text-3xl font-bold tracking-widest text-white leading-tight">ETHER</span>
            </div>
            <p className="text-sm md:text-base text-purple-200/40 font-light text-center md:text-left">La infraestructura vista a través de Inteligencia Artificial. © 2026</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 md:gap-x-10 gap-y-4 text-xs md:text-sm font-medium">
            <a href="#" className="text-purple-200/50 hover:text-purple-300 transition-colors uppercase tracking-wider">Normativa 3100</a>
            <a href="#" className="text-purple-200/50 hover:text-purple-300 transition-colors uppercase tracking-wider">Seguridad de Datos</a>
            <a href="#" className="text-purple-200/50 hover:text-purple-300 transition-colors uppercase tracking-wider">Agendar Demo</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

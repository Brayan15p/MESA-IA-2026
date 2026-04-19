'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface AuraVoiceEngineProps {
  onReportGenerated: (issue: string, location: string) => void;
  userName?: string;
  currentSede?: string;
  availableSedes?: string[];
  currentPiso?: string;
  currentArea?: string;
  compact?: boolean;
  fullCard?: boolean;
}

type AuraState = 'IDLE' | 'WAKING' | 'LISTENING_ISSUE' 
| 'ASKING_SEDE' | 'LISTENING_SEDE' 
| 'ASKING_PISO' | 'LISTENING_PISO' 
| 'ASKING_AREA' | 'LISTENING_AREA' 
| 'CONFIRMING' | 'LISTENING_CONFIRM' | 'PROCESSING';

export default function AuraVoiceEngine({ 
  onReportGenerated, 
  userName = 'parce', 
  currentSede, 
  availableSedes = [],
  currentPiso,
  currentArea,
  compact = false,
  fullCard = false
}: AuraVoiceEngineProps) {
  const [state, setState] = useState<AuraState>('IDLE');
  const [isActive, setIsActive] = useState(false); // Master switch
  const [transcript, setTranscript] = useState('');
  
  // Data recolectada
  const [gatheredIssue, setGatheredIssue] = useState('');
  const [gatheredSede, setGatheredSede] = useState(currentSede || '');
  const [gatheredPiso, setGatheredPiso] = useState(currentPiso || '');
  const [gatheredArea, setGatheredArea] = useState(currentArea || '');

  const recognitionRef = useRef<any>(null);

  // ---------- TTS (Text to Speech) ENGINE ----------
  const speak = (text: string, onEndCallback: () => void) => {
    if (!('speechSynthesis' in window)) {
        alert('Tu navegador no soporta sintetizador de voz nativo.');
        onEndCallback();
        return;
    }
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CO'; // Forzar idioma colombiano
    utterance.rate = 0.95; // Ligeramente más pausado para intonación
    utterance.pitch = 1.15; // Un poco más femenina

    const voices = window.speechSynthesis.getVoices();
    // Prioridad: Voces femeninas latinas naturales
    let bestVoice = voices.find(v => v.lang.includes('es-CO') && (v.name.includes('Google') || v.name.includes('Natural')));
    if (!bestVoice) bestVoice = voices.find(v => v.lang.includes('es') && v.name.includes('Natural') && v.name.includes('Female'));
    if (!bestVoice) bestVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Helena') || v.name.includes('Monica') || v.name.includes('Google')));
    
    if (bestVoice) utterance.voice = bestVoice;

    utterance.onend = () => { setTimeout(onEndCallback, 300); };
    window.speechSynthesis.speak(utterance);
  };

  // ---------- STT (Speech to Text) ENGINE ----------
  const initSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = 'es-CO';
    rec.continuous = true;
    rec.interimResults = false;
    return rec;
  };

  useEffect(() => {
    if (!isActive) {
        if (recognitionRef.current) recognitionRef.current.stop();
        setState('IDLE');
        window.speechSynthesis.cancel();
        return;
    }

    const rec = initSTT();
    if (!rec) { alert('No hay soporte de voz STT.'); setIsActive(false); return; }
    recognitionRef.current = rec;

    // EVENTO RESULTADOS DEL MICRÓFONO
    rec.onresult = (e: any) => {
      const last = e.results.length - 1;
      const text = e.results[last][0].transcript.trim();
      setTranscript(text);

      setState((currentState) => {
          const t = text.toLowerCase();
          const isAuraHotword = t.includes('aura') || t.includes('ahora') || t.includes('laura') || t.includes('maura') || t.includes('hola aura');

          if (currentState === 'IDLE' && isAuraHotword) {
             rec.stop();
             return 'WAKING';
          }
          
          if (currentState === 'LISTENING_ISSUE') {
             setGatheredIssue(text);
             rec.stop();
             return (currentSede ? 'ASKING_PISO' : 'ASKING_SEDE');
          }

          if (currentState === 'LISTENING_SEDE') {
             setGatheredSede(text);
             rec.stop();
             return 'ASKING_PISO';
          }

          if (currentState === 'LISTENING_PISO') {
             setGatheredPiso(text);
             rec.stop();
             return 'ASKING_AREA';
          }

          if (currentState === 'LISTENING_AREA') {
             setGatheredArea(text);
             rec.stop();
             return 'CONFIRMING';
          }

          if (currentState === 'LISTENING_CONFIRM') {
             const lowerVal = text.toLowerCase();
             if (lowerVal.includes('sí') || lowerVal.includes('si') || lowerVal.includes('correcto') || lowerVal.includes('hágale') || lowerVal.includes('ok') || lowerVal.includes('de una')) {
                rec.stop();
                return 'PROCESSING';
             } else if (lowerVal.includes('no') || lowerVal.includes('cancelar') || lowerVal.includes('incorrecto')) {
                speak("¡Eh Ave María! No se me preocupe, mijo. AURA cancela esto de una en ETHER. Ahí me queda la orejita parada por si me desatrasa con algo más luego.", () => {
                    if (recognitionRef.current) recognitionRef.current.start();
                });
                return 'IDLE';
             } else {
                rec.stop();
                return 'CONFIRMING'; 
             }
          }

          return currentState;
      });
    };

    rec.onerror = (e: any) => {
       if (e.error === 'not-allowed') { setIsActive(false); alert("Permiso de micrófono denegado."); }
       if (e.error !== 'no-speech') console.error("Mic error:", e.error);
    };

    rec.onend = () => {
       setState((curr) => {
           if (curr === 'IDLE' || curr.startsWith('LISTENING_')) {
               try { rec.start(); } catch (e) {}
           }
           return curr;
       });
    };

    rec.start();

    return () => {
       rec.stop();
       window.speechSynthesis.cancel();
    };
  }, [isActive, currentSede]);


  // ---------- STATE MACHINE ROUTER ----------
  useEffect(() => {
     if (state === 'WAKING') {
         const greeting = `¡Qué más pues, ${userName}! Mi nombre es AURA, el alma de ETHER. ¿Cómo me le va el día de hoy? Cuénteme con confianza... ¿qué problemita o avería le está pasando pa' reportar?`;
         speak(greeting, () => {
             setState('LISTENING_ISSUE');
             if (recognitionRef.current) { try { recognitionRef.current.start(); } catch(e){} }
         });
     }
     if (state === 'ASKING_SEDE') {
         const options = availableSedes.length > 0 ? `AURA sabe que tenemos ${availableSedes.join(', ')}.` : '';
         speak(`¡Listo pues! Ya lo anoté aquí en ETHER. Ahora dígame mi patrón, ¿en cuál sede de la clínica se encuentra ubicado usted? ${options}`, () => {
             setState('LISTENING_SEDE');
             if (recognitionRef.current) { try { recognitionRef.current.start(); } catch(e){} }
         });
     }
     if (state === 'ASKING_PISO') {
         const currentLocInfo = currentSede ? `Como AURA ve que usted está en la sede de ${currentSede}, ` : '';
         speak(`${currentLocInfo} Dígame en qué piso se encuentra pa' mandar al técnico de ETHER directico sin que se me pierda.`, () => {
             setState('LISTENING_PISO');
             if (recognitionRef.current) { try { recognitionRef.current.start(); } catch(e){} }
         });
     }
     if (state === 'ASKING_AREA') {
         speak("¡Eso es una elegancia! ¿Y en qué parte o cuarto exacto está usted, y bajo qué nombre dejo el reporte aquí en el sistema de ETHER?", () => {
             setState('LISTENING_AREA');
             if (recognitionRef.current) { try { recognitionRef.current.start(); } catch(e){} }
         });
     }
     if (state === 'CONFIRMING') {
         speak(`Vea pues cómo quedó el reporte de AURA: Un daño de "${gatheredIssue}". Usted está en la sede de ${gatheredSede}, en el piso ${gatheredPiso}, en la zona de ${gatheredArea}. ¿Estamos bien o qué? Dígame un "Sí" pa' radicarlo de una en ETHER, o diga "No" si lo borramos.`, () => {
             setState('LISTENING_CONFIRM');
             if (recognitionRef.current) { try { recognitionRef.current.start(); } catch(e){} }
         });
     }
     if (state === 'PROCESSING') {
         speak("¡Hágale pues! AURA ya generó la solicitud en el centro de mando de ETHER ahora mismito. Quedó una machera, usted es un sol.", () => {
             const finalLocation = `Sede: ${gatheredSede} | Piso: ${gatheredPiso} | Área/Nombre: ${gatheredArea}`;
             onReportGenerated(gatheredIssue, finalLocation);
             setState('IDLE');
             setIsActive(false); 
         });
     }
  }, [state, gatheredIssue, gatheredSede, gatheredPiso, gatheredArea, onReportGenerated, userName, currentSede, availableSedes]);

  const toggleAura = (on: boolean) => {
    setIsActive(on);
    if (on) {
        setState('WAKING'); // Waking up immediately on click
    } else {
        setState('IDLE');
        window.speechSynthesis.cancel();
    }
  };

  // Gráficas Dinámicas de Estado
  const isActiveListening = state.startsWith('LISTENING_');
  const isSpeakingStatus = state === 'WAKING' || state.startsWith('ASKING_') || state === 'CONFIRMING' || state === 'PROCESSING';

  if (!isActive) {
      if (compact) {
          return (
            <button onClick={() => toggleAura(true)} className="p-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all group shadow-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
            </button>
          );
      }
      if (fullCard) {
          return (
            <button onClick={() => toggleAura(true)} className="bg-gradient-to-br from-[#0a0118] to-fuchsia-900/10 border border-fuchsia-500/30 hover:border-fuchsia-500/60 p-8 rounded-[2rem] transition-all shadow-[0_0_30px_rgba(217,70,239,0.15)] hover:shadow-[0_0_50px_rgba(217,70,239,0.25)] flex flex-col items-center justify-center text-center gap-4 group w-full h-full">
                <div className="bg-fuchsia-500/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                    <Mic className="w-10 h-10 text-fuchsia-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">A.U.R.A. VOZ</h3>
                    <p className="text-xs text-fuchsia-200/50 max-w-xs mx-auto">Reporta cualquier avería usando solo tu voz con el alma de ETHER.</p>
                </div>
            </button>
          );
      }
      return (
         <button onClick={() => toggleAura(true)} className="border p-6 rounded-[2rem] transition-all flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden bg-[#0a0118]/60 border-fuchsia-500/20 hover:border-fuchsia-500/60 shadow-[0_0_20px_rgba(217,70,239,0.05)] w-full h-full min-h-[140px]">
             <div className="p-4 rounded-full bg-fuchsia-500/10 group-hover:scale-110 transition-transform">
                 <Mic className="w-8 h-8 text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors" />
             </div>
             <div className="relative z-10">
                 <h3 className="text-sm font-bold mb-1 text-fuchsia-100">A.U.R.A. Asistente</h3>
                 <p className="text-[10px] text-fuchsia-200/50">Toca para encender micro</p>
             </div>
         </button>
      );
  }

  return (
    <div className="border border-fuchsia-500/50 rounded-[2rem] transition-all flex flex-col items-center justify-center text-center p-6 bg-fuchsia-900/10 relative overflow-hidden w-full h-full min-h-[140px]">
      
      {/* Fondo Expansivo Animado */}
      <div className="absolute inset-0 bg-fuchsia-500/10 animate-ping opacity-20"></div>

      {/* Orbe Flotante Interactivo */}
      <div className="relative w-16 h-16 flex items-center justify-center mb-3">
         <div className={`absolute inset-0 rounded-full transition-all duration-700 ${isSpeakingStatus ? 'bg-fuchsia-500/30 animate-pulse' : ''} ${state === 'IDLE' ? 'bg-fuchsia-500/20 animate-pulse' : ''} ${isActiveListening ? 'bg-fuchsia-500/40 animate-pulse scale-150 blur-md' : ''}`}></div>
         
         <button onClick={() => toggleAura(false)} className={`relative w-12 h-12 rounded-full border-2 border-fuchsia-400 flex items-center justify-center shadow-[0_0_30px_rgba(217,70,239,0.5)] backdrop-blur-md z-20 transition-all ${isActiveListening ? 'bg-fuchsia-600 border-white' : 'bg-[#0a0118]'}`}>
            <Mic className={`w-5 h-5 transition-colors ${isActiveListening ? 'text-white' : 'text-fuchsia-400'}`} />
         </button>
      </div>

      {/* Textos de Estado */}
      <div className="relative z-10 w-full">
          <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-600 font-black tracking-widest text-xs mb-1">A.U.R.A. ACTIVADA</h3>
          
          {state === 'IDLE' && <p className="text-fuchsia-200/70 text-[10px]">Micrófono abierto. Di "Aura".</p>}
          {isSpeakingStatus && <p className="text-fuchsia-300 font-medium text-[10px] animate-pulse">Hablando...</p>}
          {isActiveListening && (
             <div className="flex flex-col items-center w-full">
                 <p className="text-white text-[10px] italic mb-1">Escuchando...</p>
                 {transcript && <p className="text-[9px] text-fuchsia-200/50 line-clamp-1 w-full italic">"{transcript}"</p>}
             </div>
          )}
          {state === 'PROCESSING' && <p className="text-emerald-400 font-bold text-[10px]"><Loader2 className="w-3 h-3 animate-spin inline mr-1"/> Procesando...</p>}
      </div>
      
      {/* Botón Stop */}
      <button onClick={() => toggleAura(false)} className="absolute top-4 right-4 bg-black/40 hover:bg-rose-900 border border-zinc-700/50 rounded-full p-1.5 z-30 transition-colors">
         <X className="w-3 h-3 text-zinc-400" />
      </button>

    </div>
  );
}

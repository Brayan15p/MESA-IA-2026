'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RatingModalProps {
  ticket: any;
  onSuccess: () => void;
  onClose: () => void; // Optional if we want to allow dismiss
}

export default function ClosingRatingModal({ ticket, onSuccess, onClose }: RatingModalProps) {
  const [quality, setQuality] = useState(0);
  const [presentation, setPresentation] = useState(0);
  const [solution, setSolution] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (quality === 0 || presentation === 0 || solution === 0) {
      alert("Por favor, califica los 3 aspectos para cerrar el expediente.");
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('maintenance_incidents')
      .update({
        rating_quality: quality,
        rating_presentation: presentation,
        rating_solution: solution
      })
      .eq('id', ticket.id);

    setIsSubmitting(false);

    if (!error) {
      onSuccess();
    } else {
      alert("Error al enviar la calificación: " + error.message);
    }
  };

  const StarRow = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
      <span className="text-sm font-bold text-zinc-300">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`transition-all ${value >= star ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-zinc-600 hover:text-amber-400/50'}`}
          >
            <Star className="w-8 h-8" fill={value >= star ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-gradient-to-b from-[#1a0b36] to-[#0a0118] border border-purple-500/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] relative my-8 animate-in fade-in zoom-in duration-300">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-tr from-amber-400 to-amber-600 p-4 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.4)]">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        <div className="text-center mt-6 mb-6">
          <h3 className="text-2xl font-bold text-white tracking-tight">Cierre de Servicio</h3>
          <p className="text-xs text-purple-200/60 mt-2">El ticket <span className="font-mono text-purple-400">#{ticket.id.substring(0,8)}</span> fue marcado como finalizado. Ayúdanos a evaluar el trabajo de nuestro operario.</p>
        </div>

        <div className="space-y-3 mb-8">
          <StarRow label="Calidad (Amabilidad y Trato)" value={quality} onChange={setQuality} />
          <StarRow label="Presentación (Higiene y Uniforme)" value={presentation} onChange={setPresentation} />
          <StarRow label="Resolución (¿El daño ya no existe?)" value={solution} onChange={setSolution} />
        </div>

        <div className="flex gap-3">
          <button 
             onClick={onClose}
             className="px-6 py-4 rounded-2xl text-zinc-400 font-bold hover:text-white transition-all text-sm w-1/3"
          >
            Ahora no
          </button>
          <button 
             onClick={handleSubmit} 
             disabled={isSubmitting} 
             className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 w-2/3 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)]"
          >
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin"/> Validando...</> : <><CheckCircle2 className="w-5 h-5"/> Enviar Evaluación</>}
          </button>
        </div>
      </div>
    </div>
  );
}

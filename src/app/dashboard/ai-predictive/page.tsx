import React from 'react';
import { Brain } from 'lucide-react';

export default function AiPredictivePage() {
  return (
    <div className='p-8 text-white relative z-10'>
      <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'><Brain className="text-indigo-400 w-8 h-8"/> ETHER Brain Predictivo</h2>
      <p className='text-zinc-400 mt-2 font-medium'>Simulador de riesgos algorítmico en desarrollo.</p>
    </div>
  );
}

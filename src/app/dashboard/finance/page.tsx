import React from 'react';
import { DollarSign } from 'lucide-react';

export default function FinancePage() {
  return (
    <div className='p-8 text-white relative z-10'>
      <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'><DollarSign className="text-emerald-400 w-8 h-8"/> Gestión de Costos</h2>
      <p className='text-zinc-400 mt-2 font-medium'>Centro analítico de finanzas operativas en desarrollo.</p>
    </div>
  );
}

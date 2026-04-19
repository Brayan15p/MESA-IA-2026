import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className='p-8 text-white relative z-10'>
      <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'><ShieldCheck className="text-zinc-400 w-8 h-8"/> Cumplimiento 3100</h2>
      <p className='text-zinc-400 mt-2 font-medium'>Interfaz de Auditoría en desarrollo.</p>
    </div>
  );
}

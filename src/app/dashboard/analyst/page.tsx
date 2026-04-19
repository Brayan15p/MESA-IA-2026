import React from 'react';
import { LayoutDashboard, FileText, Download } from 'lucide-react';

export default function AnalystDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <LayoutDashboard className="text-emerald-400" /> Visor de Datos (Analista)
        </h1>
        <p className="text-zinc-400 mt-2">Bienvenido al HUB de inteligencia de negocios de ETHER.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-2xl md:col-span-2">
           <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2"><FileText className="w-5 h-5"/> Reportes Globales</h3>
           <p className="text-sm text-zinc-300">Usa el menú lateral para acceder a Finanzas y Cumplimiento 3100.</p>
        </div>
      </div>
    </div>
  );
}

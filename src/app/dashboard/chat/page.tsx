import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className='p-8 text-white relative z-10'>
      <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'><MessageSquare className="text-indigo-400 w-8 h-8"/> Asistente Operativo</h2>
      <p className='text-zinc-400 mt-2 font-medium'>IA Conversacional (LLM Interactivo) en desarrollo.</p>
    </div>
  );
}

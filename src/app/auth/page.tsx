'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock, Sparkles, Building, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const HOME_BY_ROLE: Record<string, string> = {
      ORG_ADMIN:        '/dashboard',
      BUILDING_MANAGER: '/dashboard/incidents',
      ANALYST:          '/dashboard/analyst',
      TECHNICIAN:       '/dashboard/technician',
      REQUESTER:        '/dashboard/requester',
    };

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(`Error: ${error.message}`);
          return;
        }
        setMessage('Identidad confirmada. Entrando...');
        const role = data.user?.user_metadata?.role || 'REQUESTER';
        window.location.href = HOME_BY_ROLE[role] ?? '/dashboard/requester';
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, organization, role: 'ORG_ADMIN' } },
        });
        if (error) {
          setMessage(`Error registro: ${error.message}`);
          return;
        }
        if (data.session) {
          setMessage('¡Organización creada! Entrando...');
          window.location.href = '/dashboard';
        } else {
          setMessage('¡Registrado! Confirma el correo para continuar.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setMessage(`Error inesperado: ${err?.message ?? 'intenta de nuevo'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030008] text-zinc-300 font-sans selection:bg-fuchsia-500/30 overflow-hidden relative flex items-center justify-center">
      
      {/* Fondo Premium */}
      <div className="absolute top-[10%] left-[-10%] w-[50vw] h-[50vw] bg-[#6d28d9]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] bg-[#c026d3]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(76,29,149,0.03)_0%,_rgba(0,0,0,0.9)_100%)] pointer-events-none" />

      {/* Botón Flotante Volver */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-purple-200/50 hover:text-white transition-colors group z-50">
        <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="font-semibold uppercase tracking-wider text-xs">Volver</span>
      </Link>

      <div className="w-full max-w-md relative z-10 px-6">
        
        <div className="flex justify-center mb-8">
           <div className="flex items-center gap-3 relative">
             <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 p-2.5 rounded-xl border border-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                <Sparkles className="w-8 h-8 text-fuchsia-300" />
             </div>
             <span className="text-3xl font-bold tracking-[0.15em] text-white">ETHER</span>
           </div>
        </div>

        <motion.div
          initial={{ opacity: 1, scale: 1, y: 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-[#0a0118]/80 backdrop-blur-3xl border border-purple-500/20 p-8 md:p-10 rounded-[2rem] shadow-[0_30px_80px_rgba(109,40,217,0.15)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500" />
          
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {isLogin ? 'Acceso Operativo' : 'Despliegue ETHER'}
          </h2>
          <p className="text-purple-200/50 text-sm font-light mb-8">
            {isLogin ? 'Ingresa tus credenciales para acceder al Centro de Mando.' : 'Configura las llaves de tu organización hospitalaria.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-200/30" />
                  <input type="text" placeholder="Nombre completo" required value={name} onChange={e => setName(e.target.value)}
                         className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-purple-200/30 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-medium" />
                </div>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-200/30" />
                  <input type="text" placeholder="Organización / Hospital" required value={organization} onChange={e => setOrganization(e.target.value)}
                         className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-purple-200/30 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-medium" />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-200/30" />
              <input type="email" placeholder="Correo Corporativo" required value={email} onChange={e => setEmail(e.target.value)}
                     className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-purple-200/30 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-medium" />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-200/30" />
              <input type="password" placeholder="Código Fuerte" required value={password} onChange={e => setPassword(e.target.value)}
                     className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-purple-200/30 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-medium" />
            </div>

            {isLogin && (
              <div className="flex justify-end mt-1">
                <a href="#" className="text-xs text-fuchsia-400/80 hover:text-fuchsia-300 font-semibold transition-colors">¿Extraviaste la llave?</a>
              </div>
            )}

            {message && (
              <div className={`mt-2 p-3 rounded-lg text-xs font-semibold ${message.toLowerCase().includes('error') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {message}
              </div>
            )}

            <button disabled={loading} type="submit" className="w-full mt-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all disabled:opacity-50">
              {loading ? 'Sincronizando...' : (isLogin ? 'Abrir Centro de Mando' : 'Crear Organización')}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-white/5 pt-6">
             <p className="text-sm text-zinc-500">
               {isLogin ? "¿Tu hospital no tiene ETHER?" : "¿Ya posees un ecosistema ETHER?"}
               <button onClick={() => { setIsLogin(!isLogin); setMessage(''); }} className="ml-2 text-fuchsia-400 font-bold hover:underline underline-offset-4">
                 {isLogin ? "Desplegar ahora" : "Acceder"}
               </button>
             </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

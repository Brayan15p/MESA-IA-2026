'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Clock, User, CheckCircle2, Wrench, ShieldAlert, ChevronDown, Image as ImageIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TicketSidebarViewProps {
  ticket: any;
  onClose: () => void;
  currentUser: any;
  onStatusChange?: () => void;
}

const STATUS_FLOW: Record<string, { label: string; next: string | null; color: string }> = {
  'Abierto':   { label: 'Abierto',    next: 'En Taller', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  'En Taller': { label: 'En Taller',  next: 'Mitigado',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'Mitigado':  { label: 'Mitigado',   next: null,         color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

const CAN_MANAGE = ['ORG_ADMIN', 'BUILDING_MANAGER', 'TECHNICIAN'];

export default function TicketSidebarView({ ticket, onClose, currentUser, onStatusChange }: TicketSidebarViewProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localStatus, setLocalStatus] = useState(ticket.status);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const canManage = CAN_MANAGE.includes(currentUser?.role);
  const statusMeta = STATUS_FLOW[localStatus] || STATUS_FLOW['Abierto'];

  const loadMessages = async () => {
    const { data } = await supabase
      .from('incident_comments')
      .select('*, author:author_id(name, role)')
      .eq('incident_id', ticket.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [ticket.id]);

  const handleStatusChange = async (newStatus: string) => {
    setIsChangingStatus(true);
    const { error } = await supabase
      .from('maintenance_incidents')
      .update({ status: newStatus })
      .eq('id', ticket.id);

    if (!error) {
      setLocalStatus(newStatus);
      // Post system comment
      await supabase.from('incident_comments').insert([{
        incident_id: ticket.id,
        author_id: currentUser.id,
        comment: `[SISTEMA] Estado cambiado a "${newStatus}" por ${currentUser.name}`
      }]);
      loadMessages();
      onStatusChange?.();
    }
    setIsChangingStatus(false);
  };

  const handleEvidenceUpload = async () => {
    if (!evidenceFile) return;
    setUploadingEvidence(true);
    const ext = evidenceFile.name.split('.').pop();
    const path = `${currentUser.id}/evidence-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('incidents-media').upload(path, evidenceFile);
    if (!error) {
      const { data: pub } = supabase.storage.from('incidents-media').getPublicUrl(path);
      await supabase.from('incident_comments').insert([{
        incident_id: ticket.id,
        author_id: currentUser.id,
        comment: `[EVIDENCIA] ${pub.publicUrl}`
      }]);
      setEvidenceFile(null);
      loadMessages();
    }
    setUploadingEvidence(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSending(true);
    await supabase.from('incident_comments').insert([{
      incident_id: ticket.id,
      author_id: currentUser.id,
      comment: newMessage.trim()
    }]);
    setNewMessage('');
    setIsSending(false);
    loadMessages();
  };

  const calculateTimeRemaining = () => {
    if (!ticket.sla_deadline) return null;
    const diff = new Date(ticket.sla_deadline).getTime() - Date.now();
    if (diff <= 0) return 'SLA Vencido';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0118] border-l border-purple-500/20 w-full max-w-md h-full flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">

        {/* HEADER */}
        <div className="p-6 border-b border-white/5 bg-[#120726]">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Expediente <span className="text-purple-400 font-mono text-sm">#{ticket.id.substring(0, 8)}</span>
              </h2>
              <div className="mt-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${statusMeta.color}`}>
                  {localStatus === 'Abierto' && <ShieldAlert className="w-3 h-3 inline mr-1" />}
                  {localStatus === 'En Taller' && <Wrench className="w-3 h-3 inline mr-1" />}
                  {localStatus === 'Mitigado' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {localStatus.toUpperCase()}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-zinc-400 hover:text-white" />
            </button>
          </div>

          {/* BOTÓN CAMBIO DE ESTADO */}
          {canManage && statusMeta.next && (
            <button
              onClick={() => handleStatusChange(statusMeta.next!)}
              disabled={isChangingStatus}
              className="mt-4 w-full bg-gradient-to-r from-purple-700 to-fuchsia-700 hover:from-purple-600 hover:to-fuchsia-600 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
            >
              {isChangingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
              {isChangingStatus ? 'Actualizando...' : `Mover a → ${statusMeta.next}`}
            </button>
          )}
        </div>

        {/* METADATA */}
        <div className="p-5 border-b border-white/5 space-y-3">
          <h3 className="text-white font-bold">{ticket.requirement_type}</h3>
          <p className="text-sm text-zinc-400 line-clamp-3">{ticket.description}</p>

          {ticket.media_url && (
            <img src={ticket.media_url} alt="Evidencia" className="w-full h-32 object-cover rounded-xl border border-white/10" />
          )}

          {ticket.sla_deadline && localStatus !== 'Mitigado' && (
            <div className="flex items-center gap-2 text-xs font-bold bg-amber-950/30 text-amber-400 border border-amber-500/20 rounded-lg p-2 w-fit">
              <Clock className="w-4 h-4" /> SLA: {calculateTimeRemaining()} restantes
            </div>
          )}

          {/* EVIDENCIA DE CIERRE (técnicos) */}
          {canManage && localStatus === 'En Taller' && (
            <div className="mt-3 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-2">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Subir Evidencia de Trabajo</p>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-zinc-300 bg-black/40 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:border-amber-500/40 transition-colors flex-1">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  {evidenceFile ? evidenceFile.name.substring(0, 20) + '...' : 'Foto/Video del trabajo'}
                  <input type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={e => setEvidenceFile(e.target.files?.[0] || null)} />
                </label>
                {evidenceFile && (
                  <button onClick={handleEvidenceUpload} disabled={uploadingEvidence}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-50">
                    {uploadingEvidence ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subir'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CHAT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">BITÁCORA</span>
          </div>
          {messages.map((msg) => {
            const isMe = msg.author_id === currentUser.id;
            const isSystem = msg.comment?.startsWith('[SISTEMA]');
            const isEvidence = msg.comment?.startsWith('[EVIDENCIA]');
            const evidenceUrl = isEvidence ? msg.comment.replace('[EVIDENCIA] ', '') : null;

            if (isSystem) return (
              <div key={msg.id} className="text-center">
                <span className="text-[10px] text-zinc-500 bg-black/20 px-3 py-1 rounded-full">
                  {msg.comment.replace('[SISTEMA] ', '')}
                </span>
              </div>
            );

            if (isEvidence && evidenceUrl) return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-zinc-500 mb-1">{isMe ? 'Tú' : msg.author?.name}</span>
                <img src={evidenceUrl} alt="Evidencia" className="max-w-[80%] rounded-xl border border-amber-500/30" />
              </div>
            );

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1">
                  {!isMe && <User className="w-3 h-3" />}
                  {isMe ? 'Tú' : msg.author?.name || 'Sistema'}
                </span>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white/10 text-zinc-200 rounded-tl-none border border-white/5'}`}>
                  {msg.comment}
                </div>
                <span className="text-[9px] text-zinc-600 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        {localStatus !== 'Mitigado' ? (
          <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-[#120726] flex gap-2 items-center">
            <input
              type="text"
              placeholder="Mensaje a la central..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500/50 outline-none"
              disabled={isSending}
            />
            <button type="submit" disabled={isSending || !newMessage.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-3 rounded-xl transition-all">
              <Send className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="p-4 border-t border-white/5 bg-[#120726] text-center">
            <span className="text-xs text-zinc-500">Expediente cerrado.</span>
          </div>
        )}
      </div>
    </div>
  );
}

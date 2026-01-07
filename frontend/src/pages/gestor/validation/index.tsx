import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Check, X, Image as ImageIcon,
  Maximize2, AlertTriangle, XCircle, CheckCircle, Loader2
} from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

interface ActionLog {
  id: string;
  dayNumber: number;
  status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';
  photoUrl?: string;
  notes?: string;
  createdAt: string;
}

export default function GestorValidationPage() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- ESTADOS DOS MODAIS ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  // --- LOGICA DE LIMPEZA DE URL ---
  const getMediaUrl = (path: any) => {
    if (!path) return '';
    let cleanPath = path;
    if (typeof path === 'string' && (path.startsWith('[') || path.startsWith('"'))) {
      try {
        const parsed = JSON.parse(path);
        cleanPath = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        cleanPath = path.replace(/[\[\]"']/g, '');
      }
    }
    cleanPath = cleanPath.replace(/^\/?uploads[\\/]/, '').replace(/\\/g, '/');
    return `http://localhost:3000/uploads/${cleanPath}`;
  };

  // --- QUERIES E MUTATIONS ---
  const { data: logs, isLoading } = useQuery({
    queryKey: ['user-logs', projectId, userId],
    queryFn: async () => {
      const { data } = await api.get<ActionLog[]>(`/projects/${projectId}/users/${userId}/logs`);
      return data;
    },
    enabled: !!projectId && !!userId
  });

  const evaluateMutation = useMutation({
    mutationFn: async ({ logId, status, notes }: { logId: string, status: string, notes?: string }) => {
      await api.patch(`/projects/logs/${logId}/evaluate`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-logs'] });
      toast.success("Ação registrada com sucesso!");
      closeModals();
    },
    onError: () => toast.error("Erro ao processar avaliação.")
  });

  // --- HANDLERS ---
  const closeModals = () => {
    setIsApproveModalOpen(false);
    setIsRejectModalOpen(false);
    setSelectedLogId(null);
    setRejectionNote('');
  };

  const handleOpenApprove = (logId: string) => {
    setSelectedLogId(logId);
    setIsApproveModalOpen(true);
  };

  // ADICIONE ESTA FUNÇÃO AQUI:
  const confirmApprove = () => {
    if (selectedLogId) {
      evaluateMutation.mutate({ logId: selectedLogId, status: 'APROVADO' });
    }
  };

  const handleOpenReject = (logId: string) => {
    setSelectedLogId(logId);
    setIsRejectModalOpen(true);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Validar Atividades</h1>
          <p className="text-xs text-slate-500">Analise as evidências enviadas pelo usuário</p>
        </div>
      </header>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="animate-spin" size={40} />
          <p>Carregando evidências...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {logs?.map((log) => (
          <div key={log.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group transition-all hover:shadow-md">
            {/* AREA DA MIDIA */}
            <div className="h-56 bg-slate-100 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
              {log.photoUrl ? (
                log.photoUrl.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                  <video src={getMediaUrl(log.photoUrl)} controls className="w-full h-full object-cover" />
                ) : (
                  <div className="relative w-full h-full cursor-zoom-in" onClick={() => setSelectedImage(getMediaUrl(log.photoUrl))}>
                    <img
                      src={getMediaUrl(log.photoUrl)}
                      alt="Prova"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="text-white" size={28} />
                    </div>
                  </div>
                )
              ) : (
                <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                  <ImageIcon size={24} />
                  Sem evidência visual
                </div>
              )}

              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm tracking-wider ${log.status === 'EM_ANALISE' ? 'bg-orange-100 text-orange-700' :
                  log.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {log.status.replace('_', ' ')}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-800">Dia {log.dayNumber}</h3>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
              </div>

              {log.notes && (
                <div className="bg-red-50 text-red-700 text-[11px] p-3 rounded-xl mb-4 border border-red-100 leading-relaxed">
                  <span className="font-bold uppercase text-[9px] block mb-1">Observação: </span>
                  "{log.notes}"
                </div>
              )}

              {log.status === 'EM_ANALISE' && (
                <div className="flex gap-3 mt-auto pt-2">
                  <button
                    onClick={() => handleOpenReject(log.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all active:scale-95"
                  >
                    <X size={16} /> REJEITAR
                  </button>
                  <button
                    onClick={() => handleOpenApprove(log.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold text-xs transition-all shadow-lg shadow-green-100 active:scale-95"
                  >
                    <Check size={16} /> APROVAR
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL LIGHTBOX (ZOOM) --- */}
      {selectedImage && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={40} /></button>
          <img src={selectedImage} className="max-w-full max-h-full rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* --- MODAL DE APROVAÇÃO --- */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Aprovar Tarefa?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">O usuário receberá os pontos e a atividade será marcada como concluída.</p>
            </div>
            <div className="flex border-t border-slate-100 bg-slate-50/50 p-4 gap-3">
              <button onClick={closeModals} className="flex-1 px-4 py-3 text-slate-500 font-bold text-sm hover:bg-white rounded-xl transition-all">Cancelar</button>
              <button onClick={confirmApprove} className="flex-1 px-4 py-3 bg-green-600 text-white font-bold text-sm hover:bg-green-700 rounded-xl transition-all shadow-lg shadow-green-100">Sim, Aprovar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE REJEIÇÃO --- */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6 text-red-600">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center"><AlertTriangle size={24} /></div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Reprovar Tarefa</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">Diga ao usuário por que a evidência foi rejeitada. Ele precisará enviar uma nova prova.</p>
              <textarea
                className="w-full p-4 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 h-32 resize-none bg-slate-50/50 transition-all"
                placeholder="Ex: A foto está desfocada ou não comprova a realização do desafio..."
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex border-t border-slate-100 bg-slate-50/50 p-4 gap-3">
              <button onClick={closeModals} className="flex-1 px-4 py-3 text-slate-500 font-bold text-sm hover:bg-white rounded-xl transition-all">Cancelar</button>
              <button
                onClick={() => {
                  if (!rejectionNote.trim()) return toast.warn("Dê um feedback ao usuário!");
                  evaluateMutation.mutate({ logId: selectedLogId!, status: 'REJEITADO', notes: rejectionNote });
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold text-sm hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-100 disabled:opacity-50"
              >
                Confirmar Reprovação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
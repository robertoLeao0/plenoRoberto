import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
// CORREÇÃO AQUI: Apenas 3 níveis para voltar até 'src'
import api from '../../../services/api'; 
import { toast } from 'react-toastify';

// URL do Backend
const API_BASE_URL = 'http://localhost:3000'; 

interface TaskDetail {
  id: string;
  dayNumber: number;
  status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  user: { name: string; avatarUrl?: string };
  project: { name: string };
}

export default function TaskValidationPage() {
  const params = useParams();
  const logId = params.id || params.logId || params.taskId || Object.values(params)[0];

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [mediaIndex, setMediaIndex] = useState(0);

  // Busca detalhes
  const { data: task, isLoading } = useQuery({
    queryKey: ['task-detail', logId],
    queryFn: async () => {
      if (!logId) return null;
      const { data } = await api.get<TaskDetail>(`/projects/logs/${logId}`);
      return data;
    },
    enabled: !!logId,
  });

  // Mutação (Aprovar/Reprovar a TAREFA inteira)
  const evaluateMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string, notes?: string }) => {
      await api.patch(`/projects/logs/${logId}/evaluate`, { status, notes });
    },
    onSuccess: () => {
      toast.success('Avaliação salva!');
      queryClient.invalidateQueries({ queryKey: ['task-detail'] });
      queryClient.invalidateQueries({ queryKey: ['project-team-progress'] });
      navigate(-1);
    }
  });

  // CONTROLE DE TECLADO (Setas Esquerda/Direita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mediaList.length <= 1) return;
      if (e.key === 'ArrowRight') {
        setMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaIndex]); 

  if (isLoading) return <div className="flex h-screen items-center justify-center text-white">Carregando...</div>;
  if (!task) return <div className="flex h-screen items-center justify-center text-white">Tarefa não encontrada.</div>;

  // --- PREPARA AS MÍDIAS ---
  let mediaList: string[] = [];
  try {
    if (task.photoUrl) {
      const parsed = JSON.parse(task.photoUrl);
      if (Array.isArray(parsed)) {
        mediaList = parsed.map((url: string) => url.startsWith('http') ? url : `${API_BASE_URL}${url}`);
      } else {
        mediaList = [parsed.startsWith('http') ? parsed : `${API_BASE_URL}${parsed}`];
      }
    }
  } catch (e) {
    if (task.photoUrl) {
      mediaList = [task.photoUrl.startsWith('http') ? task.photoUrl : `${API_BASE_URL}${task.photoUrl}`];
    }
  }

  const currentMedia = mediaList[mediaIndex];
  const isVideo = currentMedia?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative">
      
      {/* Botão Voltar */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-50 backdrop-blur-md"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="max-w-6xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px] max-h-[90vh]">
        
        {/* === ÁREA VISUAL (ESQUERDA) === */}
        <div className="w-full md:w-3/4 bg-black relative flex items-center justify-center group select-none">
          {mediaList.length > 0 ? (
            <>
              {isVideo ? (
                <video src={currentMedia} controls className="max-w-full max-h-full object-contain" />
              ) : (
                <img src={currentMedia} alt="Evidência" className="max-w-full max-h-full object-contain" />
              )}

              {/* SETAS DE NAVEGAÇÃO (Agora com fundo escuro para ver melhor) */}
              {mediaList.length > 1 && (
                <>
                  <button 
                    onClick={() => setMediaIndex(prev => prev > 0 ? prev - 1 : mediaList.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full hover:bg-black/90 transition-all z-20 shadow-lg border border-white/10"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  
                  <button 
                    onClick={() => setMediaIndex(prev => prev < mediaList.length - 1 ? prev + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full hover:bg-black/90 transition-all z-20 shadow-lg border border-white/10"
                  >
                    <ChevronRight size={32} />
                  </button>

                  {/* Contador de Fotos */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-1.5 rounded-full text-white text-sm font-medium border border-white/20 z-20">
                    {mediaIndex + 1} / {mediaList.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
               <span className="text-4xl mb-2 opacity-30">📷</span>
               <p>Sem evidência visual</p>
            </div>
          )}

           {/* Badge Status */}
           <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg z-10
            ${task.status === 'EM_ANALISE' ? 'bg-orange-500 text-white' : ''}
            ${task.status === 'APROVADO' ? 'bg-green-500 text-white' : ''}
            ${task.status === 'REJEITADO' ? 'bg-red-500 text-white' : ''}
          `}>
            {task.status.replace('_', ' ')}
          </div>
        </div>

        {/* === ÁREA DE DADOS (DIREITA) === */}
        <div className="w-full md:w-1/4 p-6 flex flex-col border-l border-slate-100 bg-white overflow-y-auto">
          
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
             <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {task.user.avatarUrl ? (
                    <img src={task.user.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                    <User className="text-slate-400"/>
                )}
             </div>
             <div>
                <h2 className="font-bold text-slate-800 text-sm">{task.user.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{task.project.name} • Dia {task.dayNumber}</p>
             </div>
          </div>

          <div className="mb-6 flex-1 space-y-4">
             <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data do Envio</h3>
                <p className="text-sm text-slate-700 flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                    <Calendar size={14} className="text-slate-400"/> 
                    {new Date(task.createdAt).toLocaleString()}
                </p>
             </div>

             {task.notes && task.status !== 'EM_ANALISE' && (
                <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Feedback Anterior</h3>
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 italic">
                       "{task.notes}"
                    </div>
                </div>
             )}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100">
               <label className="text-xs font-bold text-slate-500 mb-2 block">Feedback (Opcional)</label>
               <textarea 
                 className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"
                 placeholder="Motivo da recusa ou parabéns..."
                 rows={3}
                 value={comment}
                 onChange={(e) => setComment(e.target.value)}
               />

               <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => evaluateMutation.mutate({ status: 'REJEITADO', notes: comment })}
                    disabled={evaluateMutation.isPending}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold transition-all text-sm active:scale-95"
                  >
                    <X size={16} /> Recusar
                  </button>
                  
                  <button 
                    onClick={() => evaluateMutation.mutate({ status: 'APROVADO', notes: comment })}
                    disabled={evaluateMutation.isPending}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold shadow-lg shadow-green-200 transition-all text-sm active:scale-95"
                  >
                    <Check size={16} /> Aprovar
                  </button>
               </div>
            </div>

        </div>
      </div>
    </div>
  );
}
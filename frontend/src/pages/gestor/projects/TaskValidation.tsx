import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X, Calendar, User } from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

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
  const { logId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  // Busca detalhes da tarefa específica
  const { data: task, isLoading } = useQuery({
    queryKey: ['task-detail', logId],
    queryFn: async () => {
      const { data } = await api.get<TaskDetail>(`/projects/logs/${logId}`);
      return data;
    },
  });

  // Mutação para aprovar/rejeitar
  const evaluateMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string, notes?: string }) => {
      await api.patch(`/projects/logs/${logId}/evaluate`, { status, notes });
    },
    onSuccess: () => {
      toast.success('Avaliação salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['task-detail'] });
      queryClient.invalidateQueries({ queryKey: ['user-journey'] }); // Atualiza a lista anterior
      navigate(-1); // Volta para a lista automaticamente
    }
  });

  if (isLoading) return <div className="p-10 text-center">Carregando tarefa...</div>;
  if (!task) return <div className="p-10 text-center">Tarefa não encontrada.</div>;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative">
      
      {/* Botão Fechar/Voltar */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm z-10"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* LADO ESQUERDO: A FOTO (Grande destaque) */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[400px] relative group">
          {task.photoUrl ? (
            <img src={task.photoUrl} alt="Evidência" className="max-w-full max-h-[600px] object-contain" />
          ) : (
            <div className="text-slate-500">Sem foto anexada</div>
          )}
          
          {/* Badge de Status sobre a foto */}
          <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg
            ${task.status === 'EM_ANALISE' ? 'bg-orange-500 text-white' : ''}
            ${task.status === 'APROVADO' ? 'bg-green-500 text-white' : ''}
            ${task.status === 'REJEITADO' ? 'bg-red-500 text-white' : ''}
          `}>
            {task.status.replace('_', ' ')}
          </div>
        </div>

        {/* LADO DIREITO: CONTROLES */}
        <div className="w-full md:w-96 p-8 flex flex-col border-l border-slate-100 bg-slate-50">
          
          {/* Info do Usuário */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
             <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                {task.user.avatarUrl ? <img src={task.user.avatarUrl} className="w-full h-full object-cover" /> : <User className="p-2 text-slate-400"/>}
             </div>
             <div>
                <h2 className="font-bold text-slate-800">{task.user.name}</h2>
                <p className="text-xs text-slate-500">{task.project.name} • Dia {task.dayNumber}</p>
             </div>
          </div>

          <div className="mb-6 flex-1">
             <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Detalhes</h3>
             <p className="text-sm text-slate-600 flex items-center gap-2">
                <Calendar size={14}/> Enviado em: {new Date(task.createdAt).toLocaleString()}
             </p>
             
             {/* Se já foi rejeitado, mostra o motivo antigo */}
             {task.notes && task.status !== 'EM_ANALISE' && (
                <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
                   <span className="font-bold block text-xs text-slate-400 uppercase">Observação Anterior:</span>
                   {task.notes}
                </div>
             )}
          </div>

          {/* ÁREA DE AÇÃO (Só aparece se puder avaliar) */}
          {task.status === 'EM_ANALISE' || task.status === 'REJEITADO' || task.status === 'APROVADO' ? (
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Comentário / Motivo (Opcional)</label>
                  <textarea 
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Escreva algo para o usuário..."
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => evaluateMutation.mutate({ status: 'REJEITADO', notes: comment })}
                    disabled={evaluateMutation.isPending}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-bold transition-all"
                  >
                    <X size={18} /> Recusar
                  </button>
                  
                  <button 
                    onClick={() => evaluateMutation.mutate({ status: 'APROVADO', notes: comment })}
                    disabled={evaluateMutation.isPending}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold shadow-lg shadow-green-200 transition-all"
                  >
                    <Check size={18} /> Aprovar
                  </button>
               </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
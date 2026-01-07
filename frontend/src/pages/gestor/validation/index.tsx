import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X, Image as ImageIcon } from 'lucide-react';
import api from '../../../services/api';

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

  // 1. Função de Limpeza de URL (Crucial para resolver a foto quebrada e tela branca)
  const getMediaUrl = (path: any) => {
    if (!path) return '';
    let cleanPath = path;

    // Remove colchetes e aspas do formato JSON ["path"]
    if (typeof path === 'string' && (path.startsWith('[') || path.startsWith('"'))) {
      try {
        const parsed = JSON.parse(path);
        cleanPath = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        cleanPath = path.replace(/[\[\]"']/g, '');
      }
    }

    // Garante que o caminho aponte para o servidor na porta 3000
    cleanPath = cleanPath.replace(/^\/?uploads[\\/]/, '');
    return `http://localhost:3000/uploads/${cleanPath}`;
  };

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
    }
  });

  const handleApprove = (logId: string) => {
    if (confirm('Aprovar atividade?')) evaluateMutation.mutate({ logId, status: 'APROVADO' });
  };

  const handleReject = (logId: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (reason !== null) evaluateMutation.mutate({ logId, status: 'REJEITADO', notes: reason });
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Validar Atividades</h1>
      </header>

      {isLoading && <div className="text-center py-10">Carregando...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {logs?.map((log) => (
          <div key={log.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="h-56 bg-slate-100 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
              {log.photoUrl ? (
                // Lógica para Foto ou Vídeo
                log.photoUrl.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                  <video 
                    src={getMediaUrl(log.photoUrl)} 
                    controls 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <img 
                    src={getMediaUrl(log.photoUrl)} 
                    alt="Prova" 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90" 
                    // Abre em nova aba para evitar tela branca no sistema
                    onClick={() => window.open(getMediaUrl(log.photoUrl), '_blank')} 
                  />
                )
              ) : (
                <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                  <ImageIcon size={24} />
                  Sem evidência visual
                </div>
              )}
              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${log.status === 'EM_ANALISE' ? 'bg-orange-100 text-orange-700' : log.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {log.status}
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-slate-800 mb-1">Dia {log.dayNumber}</h3>
              <p className="text-xs text-slate-500 mb-4">{new Date(log.createdAt).toLocaleDateString()}</p>
              {log.notes && <div className="bg-red-50 text-red-600 text-xs p-3 rounded mb-4 border border-red-100"><strong>Motivo:</strong> {log.notes}</div>}
              
              {log.status === 'EM_ANALISE' && (
                <div className="flex gap-3 mt-auto">
                  <button onClick={() => handleReject(log.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium"><X size={18} /> Rejeitar</button>
                  <button onClick={() => handleApprove(log.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"><Check size={18} /> Aprovar</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {logs?.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">Nenhuma atividade para validar.</div>}
      </div>
    </div>
  );
}
import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Clock, XCircle, Circle, ChevronRight, ImageIcon } from 'lucide-react';
import api from '../../../services/api';

interface JourneyItem {
  dayNumber: number;
  title: string;
  description: string;
  status: 'NAO_INICIADO' | 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';
  logId: string | null;
}

interface UserJourneyResponse {
  user: { name: string; avatarUrl?: string };
  journey: JourneyItem[];
}

export default function UserHistoryPage() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['user-journey', projectId, userId],
    queryFn: async () => {
      const { data } = await api.get<UserJourneyResponse>(`/projects/${projectId}/users/${userId}/journey`);
      return data;
    },
    enabled: !!projectId && !!userId
  });

  if (isLoading) return <div className="p-10 text-center">Carregando histórico...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Jornada de {data?.user.name}</h1>
          <p className="text-sm text-slate-500">Clique em uma tarefa enviada para avaliar.</p>
        </div>
      </header>

      <div className="space-y-3 max-w-3xl mx-auto">
        {data?.journey.map((item) => {
          // Só é clicável se tiver um logId (ou seja, o usuário enviou algo)
          const isClickable = !!item.logId;

          return (
            <div 
              key={item.dayNumber}
              onClick={() => isClickable && navigate(`/dashboard/gestor/tarefa/${item.logId}`)}
              className={`
                relative bg-white p-4 rounded-xl border transition-all flex items-center justify-between
                ${isClickable ? 'cursor-pointer hover:border-blue-300 hover:shadow-md' : 'opacity-70 border-slate-100'}
                ${item.status === 'EM_ANALISE' ? 'border-orange-300 bg-orange-50/30' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                {/* Ícone do Dia */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border
                  ${item.status === 'APROVADO' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                  ${item.status === 'EM_ANALISE' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
                  ${item.status === 'REJEITADO' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                  ${item.status === 'NAO_INICIADO' ? 'bg-slate-50 text-slate-400 border-slate-200' : ''}
                `}>
                  Dia {item.dayNumber}
                </div>

                <div>
                  <h3 className="font-bold text-slate-700">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase
                        ${item.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 
                          item.status === 'EM_ANALISE' ? 'bg-orange-100 text-orange-700' : 
                          item.status === 'REJEITADO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}
                     `}>
                        {item.status.replace('_', ' ')}
                     </span>
                     {/* Mostra ícone se tiver foto */}
                     {item.logId && <div className="flex items-center gap-1 text-xs text-blue-600"><ImageIcon size={12}/> <span>Ver Prova</span></div>}
                  </div>
                </div>
              </div>

              {isClickable && <ChevronRight className="text-slate-300" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
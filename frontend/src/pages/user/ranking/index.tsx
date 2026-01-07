import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Users, Building2, Crown, ChevronDown, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

interface OrgRanking {
  organizationId: string;
  name: string;
  points: number; 
  membersCount: number;
}

export default function RankingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // 1. Busca a lista de projetos do usuário
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['my-projects-list'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!isLoadingProjects && projects) {
      // Se tiver só 1 projeto e estiver na página "vazia", vai direto para ele
      if (projects.length === 1 && !projectId) {
        navigate(`/dashboard/user/ranking/${projects[0].id}`, { replace: true });
      }
    }
  }, [projects, isLoadingProjects, projectId, navigate]);

  // 2. Busca o Ranking (só ativa se houver projectId)
  const { data: ranking, isLoading: isLoadingRanking } = useQuery<OrgRanking[]>({
    queryKey: ['ranking-organizations', projectId], 
    queryFn: async () => {
      if (!projectId) return [];
      const response = await api.get(`/projects/${projectId}/ranking`);
      return response.data.map((item: any) => ({
        ...item,
        points: item.points || 0,
        membersCount: item.membersCount || 0
      }));
    },
    enabled: !!projectId,
  });

  const handleProjectChange = (id: string) => {
    if (!id) return;
    navigate(`/dashboard/user/ranking/${id}`);
  };

  if (isLoadingProjects || (projectId && isLoadingRanking)) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400 gap-2">
        <Trophy className="animate-bounce text-yellow-500" />
        <span>Carregando ranking...</span>
      </div>
    );
  }

  // --- ESTADO: NENHUM PROJETO ---
  if (!projects || projects.length === 0) {
    return (
      <div className="p-6 text-center h-[70vh] flex flex-col items-center justify-center">
        <AlertCircle className="text-slate-300 mb-4" size={60} />
        <h2 className="text-2xl font-bold text-slate-800">Você ainda não participa de nenhum projeto</h2>
        <p className="text-slate-500 mt-2">Os rankings aparecerão aqui assim que você for vinculado a um projeto.</p>
      </div>
    );
  }

  // --- ESTADO: MAIS DE UM PROJETO (SEM SELEÇÃO) ---
  if (projects.length > 1 && !projectId) {
    return (
      <div className="p-6 text-center h-[70vh] flex flex-col items-center justify-center">
        <Trophy className="text-blue-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-slate-800">Selecione um Projeto</h2>
        <div className="mt-6 w-full max-w-xs mx-auto">
          <select 
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full p-4 border-2 border-slate-200 rounded-2xl bg-white font-bold text-slate-700 shadow-lg"
          >
            <option value="">Escolher...</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
    );
  }

  const top3 = ranking?.slice(0, 3) || [];
  const rest = ranking?.slice(3) || [];

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 animate-in fade-in">
      <div className="flex flex-col items-center mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-800 flex justify-center gap-3">
           <Trophy className="text-yellow-500" fill="currentColor" /> Ranking
        </h1>
        {/* Se houver mais de um, mostra o seletor para trocar rápido */}
        {projects.length > 1 && (
          <div className="relative w-full max-w-xs mt-6">
            <select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-blue-500"
            >
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
        )}
      </div>

      {top3.length > 0 ? (
        <>
          {/* PÓDIO */}
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12">
            {top3[1] && (
              <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3">
                <div className="mb-2 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">2º</div>
                <div className="bg-white w-full p-4 rounded-t-xl border-b-4 border-slate-300 h-40 flex flex-col items-center justify-center shadow-sm">
                  <h3 className="font-bold text-slate-700 text-center truncate w-full">{top3[1].name}</h3>
                  <span className="text-3xl font-black text-slate-400">{top3[1].points}</span>
                </div>
              </div>
            )}
            {top3[0] && (
              <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 z-10">
                <Crown className="text-yellow-500 mb-2" fill="currentColor" />
                <div className="bg-yellow-50 w-full p-6 rounded-t-2xl border-b-4 border-yellow-400 h-52 flex flex-col items-center justify-center shadow-xl transform scale-105 border border-yellow-100">
                  <h3 className="font-bold text-slate-800 text-lg text-center truncate w-full">{top3[0].name}</h3>
                  <span className="text-5xl font-black text-yellow-600">{top3[0].points}</span>
                </div>
              </div>
            )}
            {top3[2] && (
              <div className="order-3 flex flex-col items-center w-full md:w-1/3">
                <div className="mb-2 w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center font-bold text-orange-400">3º</div>
                <div className="bg-white w-full p-4 rounded-t-xl border-b-4 border-orange-200 h-32 flex flex-col items-center justify-center shadow-sm">
                  <h3 className="font-bold text-slate-700 text-center truncate w-full">{top3[2].name}</h3>
                  <span className="text-2xl font-black text-slate-400">{top3[2].points}</span>
                </div>
              </div>
            )}
          </div>

          {/* LISTA RESTANTE */}
          {rest.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {rest.map((org, index) => (
                <div key={org.organizationId} className="flex items-center justify-between p-5 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-5">
                    <span className="font-bold text-slate-300 w-8 text-lg">#{index + 4}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{org.name}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><Users size={10} /> {org.membersCount} participantes</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl text-slate-700">{org.points}</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase">pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-100 text-center">
          <Users className="mx-auto text-slate-200 mb-2" size={40} />
          <p className="text-slate-400 font-medium">Nenhum município pontuou neste projeto ainda.</p>
        </div>
      )}
    </div>
  );
}
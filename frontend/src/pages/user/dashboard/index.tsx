import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { 
  Trophy, Star, Bell, ListTodo, 
  Target, TrendingUp, LayoutDashboard,
  ChevronDown
} from 'lucide-react';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // 1. Busca dados do usuário (Auth)
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
  });

  // 2. Busca lista de projetos (Mesma lógica da RankingPage)
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['my-projects-list'], // Chave mantida igual ao Ranking para usar cache
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // 3. Efeito para definir o projeto inicial
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // 4. Busca ranking do projeto selecionado para calcular posição
  const { data: rankingData, isFetching: loadingRanking } = useQuery({
    queryKey: ['ranking-organizations', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data } = await api.get(`/projects/${selectedProjectId}/ranking`);
      return data;
    },
    enabled: !!selectedProjectId,
  });

  // 5. Cálculo dinâmico da posição da Organização
  const myOrgRanking = rankingData ? rankingData.findIndex(
    (item: any) => item.organizationId === user?.organizationId
  ) + 1 : 0;

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Sincronizando seu painel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 px-4 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <LayoutDashboard size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Painel de Atividades</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Olá, {user?.name?.split(' ')[0]}!
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-xl border border-indigo-100">
          <div className="text-right">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sua Pontuação</p>
            <p className="text-3xl font-black text-indigo-700 leading-none">
              {user?.totalPoints || user?.points || 0}
            </p>
          </div>
          <Star size={32} className="text-indigo-600 fill-indigo-200" />
        </div>
      </div>

      {/* SELETOR DE PROJETO - Só aparece se tiver mais de um */}
      {projects && projects.length > 1 && (
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[240px]">
            <Target size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <select 
              value={selectedProjectId || ''} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-10 pr-10 py-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm appearance-none"
            >
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2 px-1">
            <Bell size={18} className="text-indigo-500" /> Feed de Atividades
          </h2>

          {/* Banner de Top 3 dinâmico */}
          {myOrgRanking <= 3 && myOrgRanking > 0 && !loadingRanking && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-xl text-white shadow-md flex items-center gap-4 animate-in slide-in-from-left-4">
              <TrendingUp size={24} />
              <div>
                <p className="font-bold text-sm">Sua organização está no TOP 3!</p>
                <p className="text-xs opacity-90">Excelente desempenho no projeto atual.</p>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex gap-4 text-amber-900 shadow-sm">
            <div className="bg-amber-200 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <ListTodo size={24} />
            </div>
            <div>
              <p className="text-sm font-bold">Atenção às tarefas!</p>
              <p className="text-xs opacity-80">Verifique suas atividades diárias e envie as evidências.</p>
              <button 
                onClick={() => navigate('/dashboard/user/tarefas')}
                className="mt-2 text-xs font-black underline uppercase tracking-tight hover:text-amber-700 transition-colors"
              >
                Acessar Minhas Tarefas
              </button>
            </div>
          </div>
        </div>

        {/* RANKING DA ORGANIZAÇÃO */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Trophy size={80} />
            </div>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Posição no Ranking</p>
            
            <div className={`relative inline-flex items-center justify-center mb-6 transition-all duration-500 ${loadingRanking ? 'scale-90 opacity-50' : 'scale-100 opacity-100'}`}>
               <div className="w-24 h-24 rounded-full border-8 border-slate-50 flex items-center justify-center bg-white shadow-inner">
                  <span className="text-4xl font-black text-slate-800">
                    {myOrgRanking > 0 ? `${myOrgRanking}º` : '--'}
                  </span>
               </div>
            </div>
            
            <h3 className="font-bold text-slate-700 leading-tight px-2">
              {user?.organization?.name || 'Sua Organização'}
            </h3>
            
            <div className="mt-8 pt-6 border-t border-slate-50">
               <button 
                 onClick={() => navigate(selectedProjectId ? `/dashboard/user/ranking/${selectedProjectId}` : '/dashboard/user/ranking')}
                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-indigo-100 hover:-translate-y-0.5"
               >
                  Ver Ranking Geral
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
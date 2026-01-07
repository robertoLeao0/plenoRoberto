import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { 
  Trophy, Star, Bell, X, ListTodo, 
  ChevronDown, TrendingUp, Target
} from 'lucide-react';

export default function UserDashboard() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // 1. BUSCA DADOS DO USUÁRIO (Incluindo Pontos e Organização)
  const { data: user } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
  });

  // 2. BUSCA PROJETOS DO USUÁRIO (Para o Select se ele tiver + de 1)
  const { data: projects } = useQuery({
    queryKey: ['user-projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects/my-projects');
      return data;
    },
  });

  // 3. BUSCA RANKING ESPECÍFICO DO PROJETO SELECIONADO
  const { data: rankingData } = useQuery({
    queryKey: ['ranking', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const { data } = await api.get(`/projects/${selectedProjectId}/ranking`);
      return data;
    },
    enabled: !!selectedProjectId,
  });

  // Define o primeiro projeto como padrão ao carregar
  useEffect(() => {
    if (projects?.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  // Encontra a posição da organização do usuário no ranking
  const myOrgRanking = rankingData?.findIndex((item: any) => item.organizationId === user?.organizationId) + 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 px-4">
      
      {/* CABEÇALHO COM PONTUAÇÃO REAL */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Olá, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-slate-500 text-sm">Sua pontuação acumulada em todos os projetos.</p>
        </div>
        <div className="text-right flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-xl border border-indigo-100">
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sua Pontuação</p>
            <p className="text-3xl font-black text-indigo-700 leading-none">{user?.points || 0}</p>
          </div>
          <Star size={32} className="text-indigo-600 fill-indigo-200" />
        </div>
      </div>

      {/* SELECT DE PROJETO (Aparece se houver mais de um) */}
      {projects?.length > 1 && (
        <div className="flex items-center gap-3 bg-white w-fit p-2 rounded-lg border border-slate-200 shadow-sm">
          <Target size={18} className="text-slate-400 ml-2" />
          <select 
            value={selectedProjectId || ''} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none pr-8 cursor-pointer"
          >
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FEED DE NOTIFICAÇÕES (DINÂMICO) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2 px-1">
            <Bell size={18} /> Feed de Atividades
          </h2>

          {/* Card de Subida de Posição (Exemplo Reativo) */}
          {myOrgRanking <= 3 && myOrgRanking > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-xl text-white shadow-md flex items-center gap-4 animate-bounce-short">
              <TrendingUp size={24} />
              <div>
                <p className="font-bold text-sm">Sua organização está no TOP 3!</p>
                <p className="text-xs opacity-90">Parabéns pelo excelente desempenho no projeto.</p>
              </div>
            </div>
          )}

          {/* ALERTA DE TAREFA PENDENTE */}
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-4 text-amber-900">
            <div className="bg-amber-200 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
              <ListTodo size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">Não esqueça de fazer sua tarefa!</p>
              <p className="text-xs">Você ainda tem 3 atividades aguardando evidências para hoje.</p>
              <button className="mt-2 text-xs font-black underline uppercase tracking-tight">Ir para tarefas</button>
            </div>
          </div>
        </div>

        {/* RANKING DA ORGANIZAÇÃO */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Trophy size={80} />
            </div>
            
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Ranking do Projeto</p>
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-slate-100">
              <span className="text-4xl font-black text-slate-800">
                {myOrgRanking > 0 ? `${myOrgRanking}º` : '--'}
              </span>
            </div>
            
            <h3 className="font-bold text-slate-700 leading-tight">
              {user?.organization?.name || 'Sua Organização'}
            </h3>
            
            <div className="mt-6 pt-6 border-t border-slate-50">
               <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all">
                 Ver Ranking Completo
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, FolderKanban, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

// Interface para tipar o retorno da API
interface DashboardStats {
  users: number;
  organizations: number;
  projects: number;
}

export default function AdminDashboard() {
  
  // Busca os dados reais do backend
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/dashboard/stats');
      return response.data;
    },
    // Tenta recarregar a cada 1 minuto
    refetchInterval: 60000, 
    // Se der erro, não tenta infinitamente
    retry: 1
  });

  // Tela de Carregamento
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-gray-500 animate-pulse">Carregando indicadores...</p>
      </div>
    );
  }

  // Tela de Erro (caso o backend esteja off ou endpoint não exista)
  if (isError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-red-500 gap-2 h-full">
        <AlertCircle size={32} />
        <p>Não foi possível carregar os dados do painel.</p>
        <p className="text-sm text-gray-400">Verifique se o backend está rodando.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Painel Principal</h1>
        <p className="text-gray-500">Visão geral e métricas do sistema Pleno.</p>
      </div>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Usuários */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total de Usuários</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats?.users || 0}</h3>
          </div>
        </div>

        {/* Card Organizações */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-purple-500">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Building2 size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Organizações</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats?.organizations || 0}</h3>
          </div>
        </div>

        {/* Card Projetos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-green-500">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <FolderKanban size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Projetos Ativos</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats?.projects || 0}</h3>
          </div>
        </div>
      </div>

      {/* Placeholder de Gráfico */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center text-gray-400 min-h-[300px]">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
            <TrendingUp size={48} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-600">Gráficos de Desempenho</h3>
        <p className="text-sm max-w-sm mt-2">
            Em breve você verá aqui gráficos detalhados sobre o engajamento e evolução das tarefas.
        </p>
      </div>

    </div>
  );
}
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

// --- INTERFACES ---
interface Organization {
  id: string;
  name: string;
}

interface UserProfile {
  name: string;
  organization?: Organization;
}

interface RankingItem {
  userId: string;
  user: UserProfile;
  totalPoints: number;
  completedDays: number;
  completionRate: number;
}

interface OrganizationRank {
  id: string;
  name: string;
  totalPoints: number;
  membersCount: number;
}

export default function GestorDashboard() {
  
  // 1. Busca dados do Ranking
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['ranking-full'],
    queryFn: async () => {
      const { data } = await api.get<RankingItem[]>('/projects/sample/ranking/full');
      return data;
    },
  });

  // 2. Busca dados do Gestor (Simulação para pegar o nome e organização dele)
  const { data: gestorProfile } = useQuery({
    queryKey: ['gestor-profile'],
    queryFn: async () => {
      // Ajuste a rota para a real do seu backend, ex: '/auth/me' ou '/users/me'
      // Aqui simulo um retorno caso a API não exista ainda
      try {
        const { data } = await api.get('/auth/me'); 
        return data;
      } catch {
        return { name: 'Gestor', organization: { name: 'Minha Organização' } };
      }
    },
  });

  // 3. Lógica para Agrupar o Top 3 Organizações
  const topOrganizations = useMemo(() => {
    if (!ranking) return [];

    const orgMap: Record<string, OrganizationRank> = {};

    ranking.forEach((item) => {
      const orgId = item.user.organization?.id || 'unknown';
      const orgName = item.user.organization?.name || 'Sem Organização';

      if (!orgMap[orgId]) {
        orgMap[orgId] = { id: orgId, name: orgName, totalPoints: 0, membersCount: 0 };
      }

      orgMap[orgId].totalPoints += item.totalPoints;
      orgMap[orgId].membersCount += 1;
    });

    return Object.values(orgMap)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3);
  }, [ranking]);

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      
      {/* --- CABEÇALHO --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Olá, {gestorProfile?.name || 'Gestor'} 👋
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            Gerenciando: 
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
              {gestorProfile?.organization?.name || 'Carregando...'}
            </span>
          </p>
        </div>
      </header>

      {/* --- CARDS DE RANKING (TOP 3) --- */}
      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">🏆 Ranking das Organizações</h2>
        
        {isLoading ? (
          <div className="p-4 text-slate-500">Carregando ranking...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topOrganizations.map((org, index) => {
              // Cores baseadas na posição
              const colors = [
                { border: 'border-yellow-400', text: 'text-yellow-600', icon: '🥇', label: '1º Lugar' },
                { border: 'border-slate-400', text: 'text-slate-600', icon: '🥈', label: '2º Lugar' },
                { border: 'border-orange-600', text: 'text-orange-700', icon: '🥉', label: '3º Lugar' }
              ];
              const style = colors[index] || colors[1];

              return (
                <div key={org.id} className={`bg-white p-6 rounded-lg shadow-sm border-t-4 ${style.border}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{style.label}</span>
                    <span className="text-2xl">{style.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{org.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${style.text}`}>{org.totalPoints}</span>
                    <span className="text-slate-500 text-sm">pontos</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">{org.membersCount} membros pontuando</p>
                </div>
              );
            })}
            
            {topOrganizations.length === 0 && (
              <div className="col-span-3 bg-white p-6 rounded text-center text-slate-400">
                Nenhuma organização pontuou ainda.
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- TABELA DETALHADA --- */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">📊 Desempenho da Equipe</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Organização</th>
                <th className="px-6 py-4">Pontos</th>
                <th className="px-6 py-4">Dias Concluídos</th>
                <th className="px-6 py-4">Taxa de Conclusão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(ranking ?? []).map((row) => (
                <tr key={row.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">{row.user?.name || 'Desconhecido'}</td>
                  <td className="px-6 py-4 text-slate-500">{row.user?.organization?.name || '-'}</td>
                  <td className="px-6 py-4 font-bold text-blue-600">{row.totalPoints}</td>
                  <td className="px-6 py-4 text-slate-600">{row.completedDays}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      row.completionRate >= 80 ? 'bg-green-100 text-green-700' : 
                      row.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {row.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
              {(!ranking || ranking.length === 0) && (
                 <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                     Nenhum dado encontrado.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
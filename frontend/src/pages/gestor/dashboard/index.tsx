import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

// Interface para os dados do ranking
interface RankingItem {
  userId: string;
  user: {
    name: string;
  };
  totalPoints: number;
  completedDays: number;
  completionRate: number;
}

export default function GestorDashboard() {
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['ranking-full'],
    queryFn: async () => {
      // Ajuste a rota conforme seu backend real
      const { data } = await api.get<RankingItem[]>('/projects/sample/ranking/full');
      return data;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Visão do Gestor</h1>
        <p className="text-slate-500">Acompanhe a adesão e o ranking da sua equipe.</p>
      </header>
      
      <div className="bg-white rounded shadow-sm p-4 border border-gray-100">
        <h2 className="font-semibold text-slate-700 mb-4 text-lg">Ranking Municipal</h2>
        
        {isLoading ? (
          <p className="text-gray-500 p-4">Carregando ranking...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-slate-500">
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-4 font-medium">Usuario</th>
                  <th className="py-3 px-4 font-medium">Pontos</th>
                  <th className="py-3 px-4 font-medium">Dias</th>
                  <th className="py-3 px-4 font-medium">Conclusão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(ranking ?? []).map((row, index) => (
                  <tr key={row.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-400">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{row.user?.name || 'Desconhecido'}</td>
                    <td className="py-3 px-4 text-blue-600 font-bold">{row.totalPoints}</td>
                    <td className="py-3 px-4">{row.completedDays}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
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
                     <td colSpan={5} className="py-6 text-center text-gray-400">
                       Nenhum dado encontrado no ranking.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
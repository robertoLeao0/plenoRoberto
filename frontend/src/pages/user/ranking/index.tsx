import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

export default function UserRanking() {
  // Vamos usar um ProjectId fixo ("sample") por enquanto, até implementarmos a seleção de projeto.
  const PROJECT_ID = 'sample'; 
  
  const { data: ranking, isLoading, isError } = useQuery({
    queryKey: ['ranking-top-ten', PROJECT_ID],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${PROJECT_ID}/ranking`);
      return data;
    },
  });

  if (isLoading) {
    return <div className="p-6">Carregando Ranking...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-600">Erro ao carregar o ranking.</div>;
  }
  
  const top10 = ranking?.top10 ?? [];
  const userPosition = ranking?.position;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Ranking da Jornada</h1>
        <p className="text-slate-500">Acompanhe sua posição e o Top 10 da jornada ativa.</p>
      </header>

      {userPosition && (
          <div className="bg-white rounded shadow-sm p-4 border-l-4 border-indigo-500">
            <h2 className="font-semibold text-slate-700">Sua Posição</h2>
            <p className="text-3xl text-indigo-600 font-bold mt-1">
              {userPosition}º lugar
            </p>
          </div>
      )}

      <div className="bg-white rounded shadow-sm p-4 overflow-x-auto">
        <h2 className="font-semibold text-slate-700 mb-2">Top 10 Participantes</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 px-2">#</th>
              <th>Nome</th>
              <th>Pontos</th>
              <th>Dias Concluídos</th>
            </tr>
          </thead>
          <tbody>
            {(top10).map((row: any, index: number) => (
              <tr 
                key={row.userId} 
                className={`border-t ${row.position === userPosition ? 'bg-indigo-50' : ''}`}
              >
                <td className="py-2 px-2">{index + 1}</td>
                <td>{row.user?.name}</td>
                <td>{row.totalPoints}</td>
                <td>{row.completedDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
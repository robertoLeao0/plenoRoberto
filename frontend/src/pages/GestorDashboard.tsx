import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function GestorDashboard() {
  const { data: ranking } = useQuery({
    queryKey: ['ranking-full'],
    queryFn: async () => {
      const { data } = await api.get('/projects/sample/ranking/full');
      return data as { user?: { name: string }; totalPoints: number; completedDays: number; completionRate: number }[];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Visão do gestor</h1>
        <p className="text-slate-500">Acompanhe adesão, ranking e comunicações automáticas do município.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ title: 'Adesão', value: '82%' }, { title: 'Conclusão total', value: '35%' }, { title: 'Mensagens enviadas', value: '12' }].map((card) => (
          <div key={card.title} className="bg-white p-4 rounded shadow-sm">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="text-2xl font-semibold text-slate-800">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded shadow-sm p-4">
        <h2 className="font-semibold text-slate-700 mb-2">Ranking municipal</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">#</th>
                <th>Servidor</th>
                <th>Pontos</th>
                <th>Dias</th>
                <th>Conclusão</th>
              </tr>
            </thead>
            <tbody>
              {(ranking ?? []).map((row, index) => (
                <tr key={row.userId ?? index} className="border-t">
                  <td className="py-2">{index + 1}</td>
                  <td>{row.user?.name ?? 'Servidor'}</td>
                  <td>{row.totalPoints}</td>
                  <td>{row.completedDays}</td>
                  <td>{Math.round(row.completionRate)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded shadow-sm p-4">
        <h2 className="font-semibold text-slate-700">Mensagens automáticas</h2>
        <p className="text-slate-500 text-sm mb-3">Agende comunicados por município ou projeto. O node-cron buscará mensagens pendentes e enviará pelo WhatsApp Cloud API.</p>
        <div className="space-y-2 text-sm text-slate-600">
          <p>✔️ Mensagem diária "Bom dia" — status: PENDING</p>
          <p>✔️ Alerta de fechamento da jornada — status: SENT</p>
        </div>
      </div>
    </div>
  );
}

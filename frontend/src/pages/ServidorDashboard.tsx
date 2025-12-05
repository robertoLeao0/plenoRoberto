import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function ServidorDashboard() {
  const { data: progress } = useQuery({
    queryKey: ['my-progress'],
    queryFn: async () => {
      const { data } = await api.get('/projects/sample/my-progress');
      return data as { dayNumber: number; status: string; points: number }[];
    },
  });

  const completed = useMemo(() => progress?.filter((p) => p.status === 'CONCLUIDO').length ?? 0, [progress]);
  const completionRate = Math.round(((completed || 0) / 21) * 100);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Meu progresso</h1>
        <p className="text-slate-500">Microações do dia e acompanhamento de pontos.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(21)].map((_, idx) => {
          const status = progress?.find((p) => p.dayNumber === idx + 1)?.status ?? 'PENDENTE';
          const color = status === 'CONCLUIDO' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200';
          return (
            <div key={idx} className={`border rounded p-3 ${color}`}>
              <p className="text-sm text-slate-500">Dia {idx + 1}</p>
              <button className="mt-2 text-sm text-indigo-600 underline">Marcar como concluída</button>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold text-slate-700">Resumo</h2>
          <p className="text-slate-500 text-sm">Dias concluídos: {completed} / 21</p>
          <div className="w-full bg-slate-200 h-2 rounded mt-2">
            <div className="h-2 bg-indigo-500 rounded" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">Taxa de conclusão: {completionRate}%</p>
        </div>
        <div>
          <h2 className="font-semibold text-slate-700">Mensagens motivacionais</h2>
          <p className="text-sm text-slate-500">Receba lembretes automáticos enviados pelo WhatsApp Cloud API.</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Dica diária agendada para hoje.</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Parabéns pelo progresso! Continue registrando suas microações.</li>
          </ul>
        </div>
      </div>
      <div className="bg-white rounded shadow-sm p-4">
        <h2 className="font-semibold text-slate-700">Ranking TOP 10</h2>
        <p className="text-slate-500 text-sm mb-2">Veja como você está avançando em relação aos colegas.</p>
        <div className="border rounded p-3 text-sm text-slate-600">
          <p>O ranking é calculado por pontos e dias concluídos. A seção pode ser ligada à rota `/projects/:id/ranking`.</p>
        </div>
      </div>
    </div>
  );
}

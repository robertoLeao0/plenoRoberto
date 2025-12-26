import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Users, Building2, Crown } from 'lucide-react';
import api from '../../../services/api';

interface OrgRanking {
  id: string;
  name: string;
  totalPoints: number;
  averagePoints: number;
  usersCount: number;
}

export default function RankingPage() {
  const { data: ranking, isLoading } = useQuery<OrgRanking[]>({
    queryKey: ['ranking-organizations'],
    queryFn: async () => {
      // CORREÇÃO: A rota deve ser exatamente esta
      const response = await api.get('/ranking/organizations');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400 gap-2">
        <Trophy className="animate-bounce text-yellow-500" />
        <span>Calculando o pódio...</span>
      </div>
    );
  }

  const top3 = ranking?.slice(0, 3) || [];
  const rest = ranking?.slice(3) || [];

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800 flex justify-center gap-3">
           <Trophy className="text-yellow-500" fill="currentColor" /> Ranking
        </h1>
        <p className="text-slate-500">Pontuação geral das empresas</p>
      </div>

      {/* TOP 3 */}
      {top3.length > 0 && (
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12">
          {/* 2º Lugar */}
          {top3[1] && (
            <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3">
              <div className="mb-2 w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">2º</div>
              <div className="bg-white w-full p-4 rounded-t-xl border-b-4 border-slate-300 h-40 flex flex-col items-center justify-center shadow-sm">
                <h3 className="font-bold text-slate-700 text-center">{top3[1].name}</h3>
                <span className="text-2xl font-black text-slate-400">{top3[1].totalPoints}</span>
              </div>
            </div>
          )}
          {/* 1º Lugar */}
          {top3[0] && (
            <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 z-10">
               <Crown className="text-yellow-500 mb-2 animate-pulse" fill="currentColor" />
               <div className="bg-yellow-50 w-full p-6 rounded-t-xl border-b-4 border-yellow-400 h-52 flex flex-col items-center justify-center shadow-lg transform scale-105">
                 <Trophy className="text-yellow-400 mb-2" size={32} />
                 <h3 className="font-bold text-slate-800 text-lg text-center">{top3[0].name}</h3>
                 <span className="text-4xl font-black text-yellow-600">{top3[0].totalPoints}</span>
                 <span className="text-xs text-slate-400 mt-1">{top3[0].usersCount} membros</span>
               </div>
            </div>
          )}
          {/* 3º Lugar */}
          {top3[2] && (
            <div className="order-3 flex flex-col items-center w-full md:w-1/3">
              <div className="mb-2 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">3º</div>
              <div className="bg-white w-full p-4 rounded-t-xl border-b-4 border-orange-300 h-32 flex flex-col items-center justify-center shadow-sm">
                <h3 className="font-bold text-slate-700 text-center">{top3[2].name}</h3>
                <span className="text-2xl font-black text-slate-400">{top3[2].totalPoints}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LISTA RESTANTE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {rest.map((org, index) => (
          <div key={org.id} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50">
             <div className="flex items-center gap-4">
                <span className="font-bold text-slate-400 w-6">#{index + 4}</span>
                <span className="font-semibold text-slate-700">{org.name}</span>
             </div>
             <div className="text-right">
                <span className="font-bold text-slate-800">{org.totalPoints}</span>
                <span className="text-xs text-slate-400 ml-1">pts</span>
             </div>
          </div>
        ))}
        {ranking?.length === 0 && <div className="p-8 text-center text-slate-400">Nenhum dado encontrado.</div>}
      </div>
    </div>
  );
}
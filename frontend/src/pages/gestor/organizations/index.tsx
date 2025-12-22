import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

export default function GestorOrganizacaoPage() {
  // Simula busca dos dados da organização
  const { data: org, isLoading } = useQuery({
    queryKey: ['gestor-org-details'],
    queryFn: async () => {
      // Ajuste para sua rota real. Ex: /organization/my-org
      // return api.get('/organization/me').then(res => res.data);
      
      // MOCK (Dados falsos para teste visual)
      return {
        name: 'Tech Solutions Ltda',
        plan: 'Enterprise',
        membersCount: 48,
        totalPoints: 1250,
        rankingPosition: 2,
        createdAt: '2023-05-20'
      };
    }
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Minha Organização</h1>
        <p className="text-slate-500 mt-1">Detalhes e métricas da sua empresa.</p>
      </header>

      {isLoading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Cartão Principal */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                🏢
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{org?.name}</h2>
                <span className="text-sm text-slate-500">Plano {org?.plan}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Colaboradores</p>
                <p className="text-2xl font-bold text-slate-700">{org?.membersCount}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Pontuação Total</p>
                <p className="text-2xl font-bold text-blue-600">{org?.totalPoints}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Ranking Atual</p>
                <p className="text-2xl font-bold text-yellow-600">{org?.rankingPosition}º Lugar</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
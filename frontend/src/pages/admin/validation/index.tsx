import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckSquare, 
  User, 
  Building2, 
  Search, 
  Filter,
  Eye,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import api from '../../../services/api';

export default function AdminGlobalValidationPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Busca TODOS os usuários e seus respectivos status de tarefas de forma global
  const { data: globalUsers, isLoading } = useQuery({
    queryKey: ['admin-global-validation-list'],
    queryFn: async () => {
      // Esta rota precisará retornar a lista de usuários com um resumo de suas tarefas
      const { data } = await api.get('/tasks/admin/global-status');
      return data;
    }
  });

  const filteredData = globalUsers?.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || item.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare className="text-blue-600" /> 
          Controle Global de Atividades
        </h1>
        <p className="text-slate-500">Visualize quem concluiu as tarefas e valide as pendências de todos os projetos.</p>
      </header>

      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="pl-4 pr-10 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="EM_ANALISE">Aguardando Validação</option>
            <option value="PENDENTE">Não Realizado</option>
            <option value="APROVADO">Concluído</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500">Carregando dados globais...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Organização</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status Geral</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData?.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Building2 size={14} />
                      {user.organization?.name || 'Sem Organização'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm
                      ${user.overallStatus === 'EM_ANALISE' ? 'bg-orange-100 text-orange-700' : 
                        user.overallStatus === 'APROVADO' ? 'bg-green-100 text-green-700' : 
                        user.overallStatus === 'REJEITADO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.overallStatus === 'EM_ANALISE' && <Clock size={12} />}
                      {user.overallStatus === 'APROVADO' && <CheckCircle2 size={12} />}
                      {user.overallStatus === 'REJEITADO' && <XCircle size={12} />}
                      {user.overallStatus || 'PENDENTE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/dashboard/admin/validation/${user.id}?projectId=${user.currentProjectId}`)}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm"
                    >
                      <Eye size={16} /> Ver Atividades
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData?.length === 0 && (
            <div className="text-center py-12 text-slate-400">Nenhum registro encontrado com esses filtros.</div>
          )}
        </div>
      )}
    </div>
  );
}
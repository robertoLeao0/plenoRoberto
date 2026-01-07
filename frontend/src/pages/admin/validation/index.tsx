import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckSquare, User, Building2, Search,
  Eye, Clock, CheckCircle2, Send, Loader2, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

export default function AdminGlobalValidationPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // 1. Função de Tratamento de URL (Garante que a foto apareça e limpa caracteres JSON)
  const getMediaUrl = (path: any) => {
    if (!path) return '';
    let cleanPath = path;
    if (typeof path === 'string' && (path.startsWith('[') || path.startsWith('"'))) {
      try {
        const parsed = JSON.parse(path);
        cleanPath = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        cleanPath = path.replace(/[\[\]"']/g, '');
      }
    }
    cleanPath = cleanPath.replace(/^\/?uploads[\\/]/, '');
    return `http://localhost:3000/uploads/${cleanPath}`;
  };

  // 2. Busca dados globais de usuários e status
  const { data: globalUsers, isLoading } = useQuery({
    queryKey: ['admin-global-validation-list'],
    queryFn: async () => {
      const { data } = await api.get('/tasks/admin/global-status');
      return data;
    }
  });

  // 3. Envio de Mensagem para o Feed
  const broadcastMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post('/messages/broadcast', { content });
    },
    onSuccess: () => {
      toast.success("Mensagem enviada para o feed de todos os usuários!");
      setBroadcastMessage('');
    },
    onError: () => toast.error("Erro ao enviar mensagem.")
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
          <CheckSquare className="text-blue-600" /> Controle Global de Atividades
        </h1>
        <p className="text-slate-500 text-sm">Gerencie as validações e envie comunicados para todos os municípios.</p>
      </header>

      {/* SEÇÃO DE COMUNICADO AO FEED */}
      <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm mb-8">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Send size={16} className="text-blue-500" /> Enviar Comunicado ao Feed
        </h3>
        <div className="flex gap-3">
          <textarea
            className="flex-1 p-3 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 bg-slate-50/50"
            placeholder="Digite aqui a mensagem que todos os usuários verão no Dashboard..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
          />
          <button
            onClick={() => broadcastMessage && broadcastMutation.mutate(broadcastMessage)}
            disabled={!broadcastMessage || broadcastMutation.isPending}
            className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex flex-col items-center justify-center gap-1 transition-all shadow-md active:scale-95 min-w-[100px]"
          >
            {broadcastMutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            <span className="text-[10px] uppercase tracking-widest">Enviar</span>
          </button>
        </div>
      </div>

      {/* FILTROS */}
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
        <select
          className="pl-4 pr-10 py-2 border border-slate-200 rounded-lg bg-white outline-none cursor-pointer text-slate-600 font-medium"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="EM_ANALISE">EM ANALISE</option>
          <option value="PENDENTE">PENDENTE</option>
          <option value="APROVADO">CONCLUÍDA</option>
          <option value="REJEITADO">REJEITADO</option>
        </select>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Organização</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Carregando dados globais...</td></tr>
            ) : filteredData?.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
            ) : (
              filteredData?.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-bold text-slate-800">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Building2 size={14} className="text-slate-400" />
                      {user.organization?.name || '---'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm
                      ${user.overallStatus === 'EM_ANALISE' ? 'bg-orange-100 text-orange-700' :
                        user.overallStatus === 'APROVADO' ? 'bg-green-100 text-green-700' :
                          user.overallStatus === 'REJEITADO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.overallStatus === 'EM_ANALISE' && <Clock size={10} />}
                      {user.overallStatus === 'APROVADO' && <CheckCircle2 size={10} />}
                      {user.overallStatus === 'REJEITADO' && <XCircle size={10} />}
                      {user.overallStatus || 'PENDENTE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/dashboard/admin/validation/${user.id}?projectId=${user.currentProjectId}`)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1 ml-auto group"
                    >
                      <Eye size={16} className="group-hover:scale-110 transition-transform" /> Detalhes
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, User as UserIcon, AlertCircle, Circle, ChevronRight } from 'lucide-react';
import api from '../../../services/api';

// Interfaces de Tipagem
interface MemberData {
  id: string;
  name: string;
  email: string;
  cpf: string;
  avatarUrl?: string;
  pendingCount: number;
  approvedCount: number;
  totalTasks: number;
  statusLabel: 'NAO_REALIZADO' | 'PENDENTE_VALIDACAO' | 'EM_ANDAMENTO' | 'COMPLETA';
}

interface ProjectDetails {
  project: {
    id: string;
    name: string;
    status: string;
  };
  members: MemberData[];
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Busca dados do backend
  const { data, isLoading } = useQuery({
    queryKey: ['project-details', id],
    queryFn: async () => {
      const { data } = await api.get<ProjectDetails>(`/projects/${id}/team-progress`);
      return data;
    },
  });

  // Renderiza a coluna de Status
  const renderStatusColumn = (member: MemberData) => {
    switch (member.statusLabel) {
      case 'PENDENTE_VALIDACAO':
        return (
          <button 
            // Atalho: Se clicar no botão laranja, vai direto para o Histórico também
            // (Você pode mudar para ir direto validar se preferir)
            onClick={(e) => {
              e.stopPropagation(); // Evita ativar o clique da linha 2 vezes
              navigate(`/dashboard/gestor/historico/${member.id}?projectId=${id}`);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium text-xs border border-orange-200"
          >
            <AlertCircle size={14} />
            <span>{member.pendingCount} pendente(s)</span>
          </button>
        );
      case 'COMPLETA':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium text-xs border border-green-200">
            <CheckCircle size={14} />
            <span>Completa</span>
          </div>
        );
      case 'EM_ANDAMENTO':
        return (
          <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <span>Em andamento ({member.approvedCount}/{member.totalTasks})</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
             <Circle size={10} />
             <span>Não iniciado</span>
          </div>
        );
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando equipe...</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Cabeçalho com botão de voltar */}
      <header className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button 
          onClick={() => navigate('/dashboard/gestor/projetos')} 
          className="p-2 hover:bg-white rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{data?.project.name}</h1>
          <p className="text-sm text-slate-500">Selecione um membro para ver as tarefas.</p>
        </div>
      </header>

      {/* Tabela de Membros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4">Nome / Email</th>
                        <th className="px-6 py-4">CPF</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4"></th> {/* Coluna da setinha */}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data?.members.map((member) => (
                        <tr 
                            key={member.id} 
                            // AQUI ESTÁ A MÁGICA: Clicar na linha leva para o Histórico do Usuário
                            onClick={() => navigate(`/dashboard/gestor/historico/${member.id}?projectId=${data.project.id}`)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={20} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">{member.name}</p>
                                        <p className="text-xs text-slate-400">{member.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-600">
                                {member.cpf}
                            </td>
                            <td className="px-6 py-4">
                                {renderStatusColumn(member)}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-300">
                                <ChevronRight className="group-hover:text-slate-500 transition-colors" size={20} />
                            </td>
                        </tr>
                    ))}
                    
                    {data?.members.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400">
                                Ninguém nesta equipe.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
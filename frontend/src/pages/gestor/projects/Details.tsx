import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, User as UserIcon, AlertCircle, Circle } from 'lucide-react';
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
            // Botão que leva para a validação
            onClick={() => navigate(`/dashboard/gestor/validacao/${member.id}?projectId=${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium text-xs border border-orange-200"
          >
            <AlertCircle size={14} />
            <span>{member.pendingCount} para validar</span>
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

  if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando detalhes...</div>;

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
          <p className="text-sm text-slate-500">Acompanhamento e validação da equipe.</p>
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
                        <th className="px-6 py-4">Status de Realização</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data?.members.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50 transition-colors">
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
                        </tr>
                    ))}
                    
                    {data?.members.length === 0 && (
                        <tr>
                            <td colSpan={3} className="p-8 text-center text-slate-400">
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
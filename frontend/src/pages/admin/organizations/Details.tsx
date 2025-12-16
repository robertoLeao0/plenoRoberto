import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  UserCheck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  UserPlus 
} from 'lucide-react';
import api from '../../../services/api';

interface OrganizationDetails {
  id: string;
  name: string;
  description?: string;
  location?: string;
  cnpj?: string;
  active: boolean;
  manager?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    avatarUrl?: string;
    todayStatus?: 'CONCLUIDO' | 'PENDENTE' | 'NAO_REALIZADO';
    todayPoints?: number;
  }>;
}

export default function OrganizationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Buscar dados da Organização + Usuários + Status do Dia
  const { data: org, isLoading } = useQuery<OrganizationDetails>({
    queryKey: ['organization-details', id],
    queryFn: async () => {
      const response = await api.get(`/organizations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="p-10 text-center text-gray-500">Carregando detalhes...</div>;
  if (!org) return <div className="p-10 text-center text-red-500">Organização não encontrada.</div>;

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER COM VOLTAR E INFO PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="text-blue-600" />
              {org.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {org.description || 'Sem descrição'} • {org.location || 'Local não definido'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${org.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               {org.active ? 'Ativa' : 'Inativa'}
           </span>
        </div>
      </div>

      {/* CARD DO GESTOR RESPONSÁVEL */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
        <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm">
           <UserCheck size={24} />
        </div>
        <div>
           <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Gestor Responsável</p>
           <p className="text-gray-800 font-medium">
             {org.manager ? org.manager.name : 'Nenhum gestor definido'}
           </p>
           {org.manager && <p className="text-xs text-blue-600">{org.manager.email}</p>}
        </div>
      </div>

      {/* SEÇÃO DE MEMBROS (TABELA) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Header da Tabela */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Membros e Acompanhamento</h2>
            <p className="text-sm text-gray-500">Status das tarefas de hoje.</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <UserPlus size={16} />
            Gerenciar
          </button>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Tarefa (Hoje)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {org.users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                    Nenhum usuário vinculado a esta organização.
                  </td>
                </tr>
              ) : (
                org.users.map((user) => (
                  <tr 
                    key={user.id} 
                    // AQUI ESTÃO AS MUDANÇAS: cursor-pointer e onClick
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/dashboard/admin/organizations/${org.id}/users/${user.id}`)}
                  >
                    
                    {/* COLUNA 1: NOME E AVATAR */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs overflow-hidden group-hover:ring-2 group-hover:ring-blue-100 transition-all">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            user.role === 'GESTOR_ORGANIZACAO' 
                              ? 'bg-purple-50 text-purple-700 border-purple-100' 
                              : 'bg-gray-50 text-gray-600 border-gray-100'
                          }`}>
                            {user.role === 'GESTOR_ORGANIZACAO' ? 'Gestor' : 'Usuário'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* COLUNA 2: CONTATO */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center gap-2">
                           <Mail size={14} className="text-gray-400"/> {user.email}
                        </div>
                        <div className="flex items-center gap-2">
                           <Phone size={14} className="text-gray-400"/> {user.phone || '-'}
                        </div>
                      </div>
                    </td>

                    {/* COLUNA 3: STATUS (BADGES) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        switch (user.todayStatus) {
                          case 'CONCLUIDO':
                            return (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                <CheckCircle size={12} className="mr-1.5" />
                                Aprovado (+{user.todayPoints || 0}pts)
                              </span>
                            );
                          case 'PENDENTE':
                            return (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                <Clock size={12} className="mr-1.5" />
                                Pendente Aprovação
                              </span>
                            );
                          case 'NAO_REALIZADO':
                          default:
                            return (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                <XCircle size={12} className="mr-1.5" />
                                Não Realizado
                              </span>
                            );
                        }
                      })()}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
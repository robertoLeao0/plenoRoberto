import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Mail, Shield, Trash2, Building2 } from 'lucide-react';
import api from '../../../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface OrganizationDetails {
  id: string;
  name: string;
  description?: string;
  location?: string;
  cnpj?: string;
  active: boolean;
  users: User[];
}

export default function OrganizationDetails() {
  const { id } = useParams(); // Pega o ID da URL
  const navigate = useNavigate();

  // Buscar dados da Organização + Usuários
  const { data: org, isLoading } = useQuery<OrganizationDetails>({
    queryKey: ['organization', id],
    queryFn: async () => {
      const response = await api.get(`/organizations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="p-10 text-center">Carregando detalhes...</div>;
  if (!org) return <div className="p-10 text-center text-red-500">Organização não encontrada.</div>;

  return (
    <div className="space-y-8">
      
      {/* HEADER COM VOLTAR */}
      <div className="flex items-center justify-between">
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
            <p className="text-gray-500 text-sm">
              {org.location} • {org.cnpj || 'Sem CNPJ'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${org.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {org.active ? 'Ativa' : 'Inativa'}
            </span>
        </div>
      </div>

      {/* SEÇÃO DE MEMBROS (USUÁRIOS) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Equipe & Acessos</h2>
            <p className="text-sm text-gray-500">Gerencie quem tem acesso a esta organização.</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <UserPlus size={18} />
            Adicionar Membro
          </button>
        </div>

        {/* LISTA DE USUÁRIOS */}
        <div className="divide-y divide-gray-100">
          {org.users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum usuário vinculado a esta organização.
            </div>
          ) : (
            org.users.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-500">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm">{user.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div>
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail size={12} /> {user.email}
                    </div>
                  </div>
                </div>

                {/* Role e Ações */}
                <div className="flex items-center gap-6">
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium
                    ${user.role === 'GESTOR_ORGANIZACAO' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}
                  `}>
                    <Shield size={12} />
                    {user.role === 'GESTOR_ORGANIZACAO' ? 'Gestor' : 'Usuário'}
                  </span>

                  <button 
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover da organização"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
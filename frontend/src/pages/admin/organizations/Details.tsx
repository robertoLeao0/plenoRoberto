import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Building2, MapPin, Mail, Phone, 
  Ban, RefreshCcw, Trash2, ShieldAlert, AlertTriangle, X 
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../services/api';

// Interface compatível com o novo Schema
interface OrganizationDetails {
  id: string;
  name: string;
  description?: string;
  location?: string;
  cnpj?: string;
  type: 'SYSTEM' | 'CUSTOMER';
  deletedAt: string | null; // NULL = Ativo, DATA = Inativo
  managerId?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  }[];
}

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // === ESTADOS DOS MODAIS DE CONFIRMAÇÃO ===
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // === 1. BUSCAR DETALHES ===
  const { data: org, isLoading, isError } = useQuery<OrganizationDetails>({
    queryKey: ['organization', id],
    queryFn: async () => {
      const response = await api.get(`/organizations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // === 2. MUTAÇÕES ===
  
  // INATIVAR
  const inactivateMutation = useMutation({
    mutationFn: () => api.delete(`/organizations/${id}`),
    onSuccess: () => {
      toast.success('Organização inativada com sucesso!');
      setIsInactivateModalOpen(false); // Fecha o modal
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: () => toast.error('Erro ao inativar.'),
  });

  // REATIVAR
  const reactivateMutation = useMutation({
    mutationFn: () => api.patch(`/organizations/${id}/reactivate`),
    onSuccess: () => {
      toast.success('Organização reativada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: () => toast.error('Erro ao reativar.'),
  });

  // EXCLUIR PERMANENTEMENTE
  const deletePermanentMutation = useMutation({
    mutationFn: () => api.delete(`/organizations/${id}/permanent`),
    onSuccess: () => {
      toast.success('Organização excluída definitivamente.');
      setIsDeleteModalOpen(false); // Fecha o modal
      navigate('/dashboard/admin/organizations'); // Volta para a lista
    },
    onError: () => toast.error('Erro ao excluir.'),
  });

  if (isLoading) return <div className="p-10 text-center text-gray-500">Carregando detalhes...</div>;
  if (isError || !org) return <div className="p-10 text-center text-red-500">Organização não encontrada.</div>;

  const isActive = !org.deletedAt;

  return (
    <div className="space-y-6 relative">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* CABEÇALHO COM BOTÃO VOLTAR */}
      <div className="flex items-center gap-4 text-gray-500 mb-2">
        <Link 
          to="/dashboard/admin/organizations" 
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar para Organizações
        </Link>
      </div>

      {/* CARD PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Info Básica */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
              org.type === 'SYSTEM' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                {org.name}
                <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wide ${
                  isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isActive ? 'Ativo' : 'Inativo'}
                </span>
              </h1>
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <span>{org.type === 'SYSTEM' ? 'Matriz do Sistema' : 'Cliente / Parceiro'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                   <MapPin size={14} /> {org.location || 'Local não informado'}
                </span>
              </div>
            </div>
          </div>

          {/* AÇÕES (Botões no canto direito) */}
          <div className="flex items-center gap-2">
            {isActive ? (
              // BOTÃO INATIVAR (Abre Modal)
              <button 
                onClick={() => setIsInactivateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors text-sm font-medium"
              >
                <Ban size={16} /> Inativar Acesso
              </button>
            ) : (
              <>
                {/* BOTÃO REATIVAR (Direto via Toast) */}
                <button 
                  onClick={() => reactivateMutation.mutate()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors text-sm font-medium"
                >
                  <RefreshCcw size={16} /> Reativar
                </button>
                
                {/* BOTÃO EXCLUIR (Abre Modal) */}
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} /> Excluir
                </button>
              </>
            )}
          </div>
        </div>

        {/* ÁREA DO GESTOR */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Gestor Responsável</h3>
          {org.manager ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {org.manager.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-800">{org.manager.name}</p>
                <p className="text-sm text-gray-500">{org.manager.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 italic text-sm">
              <ShieldAlert size={16} />
              Nenhum gestor definido.
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DE MEMBROS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Membros e Acesso</h2>
            <p className="text-sm text-gray-500">Gerencie quem tem acesso a esta organização.</p>
          </div>
          <button className="text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50">
            Gerenciar Membros
          </button>
        </div>

        <div className="space-y-4">
          {org.users.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum membro cadastrado.</p>
          ) : (
            org.users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-gray-400">
                   <Mail size={16} className="cursor-pointer hover:text-blue-600"/>
                   <Phone size={16} className="cursor-pointer hover:text-green-600"/>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL DE CONFIRMAÇÃO: INATIVAR */}
      {/* ========================================================= */}
      {isInactivateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <button onClick={() => setIsInactivateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2">Inativar Acesso?</h3>
            <p className="text-sm text-gray-500 mb-6">
              A organização será movida para a aba "Inativos". Os usuários vinculados perderão o acesso ao sistema temporariamente.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsInactivateModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => inactivateMutation.mutate()}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
              >
                Sim, Inativar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE CONFIRMAÇÃO: EXCLUIR */}
      {/* ========================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2">Excluir Permanentemente?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-bold text-red-600">Atenção:</span> Esta ação não pode ser desfeita. Todos os dados, projetos e históricos serão apagados.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => deletePermanentMutation.mutate()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
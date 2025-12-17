// src/pages/Organizations/details.tsx

import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Building2, MapPin, Mail, Ban, RefreshCcw, Trash2, 
  ShieldAlert, X, Pencil, FileSpreadsheet, Key, Copy, Eye, EyeOff, 
  UserPlus, Search, UserCog, Check
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../services/api';

// === INTERFACES ===

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  avatarUrl?: string;
}

interface OrganizationDetails {
  id: string;
  name: string;
  description?: string;
  location?: string;
  cnpj?: string;
  type: 'SYSTEM' | 'CUSTOMER';
  deletedAt: string | null;
  createdAt?: string;
  importToken?: string; // <--- CORRIGIDO: O nome correto vindo do back é importToken
  managerId?: string;
  manager?: User;
  users: User[];
}

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // === ESTADOS ===
  const [activeTab, setActiveTab] = useState<'overview' | 'members'>('overview');
  const [showToken, setShowToken] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados dos Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Novos Modais
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  // === 1. BUSCAR DETALHES ===
  const { data: org, isLoading, isError } = useQuery<OrganizationDetails>({
    queryKey: ['organization', id],
    queryFn: async () => {
      const response = await api.get(`/organizations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // === 2. BUSCAR USUÁRIOS ===
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users'); 
      return response.data;
    },
    enabled: isAddMemberModalOpen || isManagerModalOpen
  });

  // === 3. MUTAÇÕES ===

  // GERAR TOKEN (Ajustado para importToken)
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/organizations/${id}/token`);
      console.log('RESPOSTA BACKEND:', response.data); 
      return response.data;
    },
    onSuccess: () => {
      toast.success('Token gerado com sucesso!');
      // Força recarregar os dados da tela
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
    },
    onError: (error) => {
      console.error('ERRO:', error);
      toast.error('Erro ao gerar token.');
    },
  });

  // Outras mutações...
  const setManagerMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/organizations/${id}/manager`, { managerId: userId }),
    onSuccess: () => {
      toast.success('Gestor atualizado!');
      setIsManagerModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
    },
    onError: () => toast.error('Erro ao definir gestor.'),
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/organizations/${id}/users`, { userId }),
    onSuccess: () => {
      toast.success('Membro adicionado!');
      setIsAddMemberModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
    },
    onError: () => toast.error('Erro ao adicionar membro.'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/organizations/${id}/users/${userId}`),
    onSuccess: () => {
      toast.success('Membro removido.');
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
    },
  });

  const inactivateMutation = useMutation({
    mutationFn: () => api.delete(`/organizations/${id}`),
    onSuccess: () => {
      toast.success('Organização inativada!');
      setIsInactivateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => api.patch(`/organizations/${id}/reactivate`),
    onSuccess: () => {
      toast.success('Organização reativada!');
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
    },
  });

  const deletePermanentMutation = useMutation({
    mutationFn: () => api.delete(`/organizations/${id}/permanent`),
    onSuccess: () => {
      toast.success('Excluída definitivamente.');
      setIsDeleteModalOpen(false);
      navigate('/dashboard/admin/organizations');
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Conecte ao endpoint de update.');
    setIsEditModalOpen(false);
  };

  // === FILTROS ===
  const potentialManagers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => 
      (u.role === 'ADMIN' || u.role === 'MANAGER') && 
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  const potentialMembers = useMemo(() => {
    if (!allUsers || !org) return [];
    const existingIds = org.users.map(u => u.id);
    return allUsers.filter(u => 
      !existingIds.includes(u.id) && 
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, org, searchTerm]);


  // === RENDERIZAÇÃO ===
  if (isLoading) return <div className="p-10 text-center text-gray-500">Carregando detalhes...</div>;
  if (isError || !org) return <div className="p-10 text-center text-red-500">Erro ao carregar organização.</div>;

  const isActive = !org.deletedAt;

  return (
    <div className="space-y-6 relative max-w-6xl mx-auto p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* HEADER NAV */}
      <div className="flex items-center justify-between mb-2">
        <Link 
          to="/dashboard/admin/organizations" 
          className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={18} /> Voltar
        </Link>
        <span className="text-xs text-gray-400">ID: {org.id}</span>
      </div>

      {/* CARD PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 ${
              org.type === 'SYSTEM' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <Building2 size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">{org.name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full uppercase border ${
                  isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-gray-500 mt-1">{org.description || 'Sem descrição.'}</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                {org.location && <span className="flex items-center gap-1"><MapPin size={14} /> {org.location}</span>}
                {org.cnpj && <span className="flex items-center gap-1"><FileSpreadsheet size={14} /> {org.cnpj}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isActive && (
              <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 text-sm font-medium shadow-sm transition-colors">
                <Pencil size={16} /> Editar
              </button>
            )}
            {isActive ? (
              <button onClick={() => setIsInactivateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-amber-700 rounded-lg hover:bg-amber-50 border border-amber-200 text-sm font-medium transition-colors">
                <Ban size={16} /> Inativar
              </button>
            ) : (
              <>
                <button onClick={() => reactivateMutation.mutate()} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm font-medium hover:bg-blue-50">
                  <RefreshCcw size={16} /> Reativar
                </button>
                <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium hover:bg-red-50">
                  <Trash2 size={16} /> Excluir
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ABAS */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('overview')} className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Visão Geral
          </button>
          <button onClick={() => setActiveTab('members')} className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Membros <span className="bg-gray-100 text-gray-600 px-2 rounded-full text-xs">{org.users.length}</span>
          </button>
        </nav>
      </div>

      {/* CONTEÚDO */}
      <div className="animate-in fade-in duration-300">
        
        {/* ABA 1: VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* GESTOR RESPONSÁVEL */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                    <ShieldAlert size={16} className="text-blue-500"/> Gestor Responsável
                  </h3>
                  <button onClick={() => { setSearchTerm(''); setIsManagerModalOpen(true); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline">
                    {org.manager ? 'Alterar' : 'Definir'}
                  </button>
                </div>
                {org.manager ? (
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {org.manager.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-gray-800 truncate">{org.manager.name}</p>
                      <p className="text-sm text-gray-500 truncate">{org.manager.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-sm mt-2 border border-dashed border-gray-300 rounded-lg p-3 text-center">
                    Nenhum gestor definido.
                  </div>
                )}
              </div>
            </div>


            {/* TOKEN DE INTEGRAÇÃO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-3">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                     <Key size={16} className="text-amber-500"/> Token de Integração
                   </h3>
                   <p className="text-xs text-gray-500 mt-1">
                     Utilize este token para autenticar requisições na API externa.
                   </p>
                </div>
                <button 
                  onClick={() => {
                    // Verifica org.importToken em vez de org.apiKey
                    if(!org.importToken || window.confirm('Gerar um novo token invalidará o anterior. Continuar?')) {
                      generateTokenMutation.mutate();
                    }
                  }}
                  disabled={generateTokenMutation.isPending}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                >
                  <RefreshCcw size={12} className={generateTokenMutation.isPending ? 'animate-spin' : ''} />
                  {org.importToken ? 'Redefinir Chave' : 'Gerar Chave'}
                </button>
              </div>

              {/* Renderiza org.importToken aqui */}
              {org.importToken ? (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex-1 font-mono text-sm text-gray-600 truncate">
                    {showToken ? org.importToken : '•'.repeat(40)}
                  </div>
                  <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                    <button onClick={() => setShowToken(!showToken)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="Visualizar">
                      {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(org.importToken!);
                        toast.success('Copiado!');
                      }} 
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Copiar"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-amber-800 font-medium">Nenhum token ativo.</p>
                  <p className="text-xs text-amber-600 mb-3">Clique no botão acima para gerar seu primeiro token.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 2: MEMBROS */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Usuários Vinculados</h3>
                <button onClick={() => { setSearchTerm(''); setIsAddMemberModalOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
                  <UserPlus size={14} /> Adicionar Membro
                </button>
             </div>
             <div className="divide-y divide-gray-100">
              {org.users.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center text-gray-500">
                  <div className="bg-gray-100 p-3 rounded-full mb-3"><UserCog size={24} /></div>
                  <p>Nenhum membro vinculado.</p>
                </div>
              ) : (
                org.users.map(user => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">{user.name.charAt(0)}</div>
                      <div><p className="text-sm font-medium text-gray-900">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{user.role}</span>
                      <button onClick={() => { if(window.confirm('Remover usuário?')) removeMemberMutation.mutate(user.id); }} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
             </div>
          </div>
        )}
      </div>

      {/* --- MODAIS DE SELEÇÃO E CRUD (Mantidos iguais) --- */}

      {isManagerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Selecionar Gestor</h3>
              <button onClick={() => setIsManagerModalOpen(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            <div className="p-4 border-b bg-gray-50 relative">
               <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input type="text" placeholder="Buscar por nome..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
            </div>
            <div className="overflow-y-auto p-2 space-y-1 flex-1 min-h-[200px]">
              {potentialManagers.length === 0 ? <p className="p-4 text-center text-sm text-gray-500">Nenhum gestor encontrado.</p> :
                potentialManagers.map(user => (
                  <button key={user.id} onClick={() => setManagerMutation.mutate(user.id)} className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div>
                      <div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-gray-500">{user.role}</p></div>
                    </div>
                    {org.managerId === user.id && <Check size={16} className="text-blue-600"/>}
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Adicionar Membro</h3>
              <button onClick={() => setIsAddMemberModalOpen(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            <div className="p-4 border-b bg-gray-50 relative">
               <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input type="text" placeholder="Buscar usuário..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
            </div>
            <div className="overflow-y-auto p-2 space-y-1 flex-1 min-h-[200px]">
              {potentialMembers.length === 0 ? <p className="p-4 text-center text-sm text-gray-500">Nenhum usuário disponível.</p> :
                potentialMembers.map(user => (
                  <button key={user.id} onClick={() => addMemberMutation.mutate(user.id)} className="w-full flex items-center justify-between p-3 hover:bg-green-50 rounded-lg text-left group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-green-100 flex items-center justify-center font-bold text-xs text-gray-600 group-hover:text-green-700">{user.name.charAt(0)}</div>
                      <div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
                    </div>
                    <UserPlus size={16} className="text-gray-300 group-hover:text-green-600"/>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Modais de Edição/Inativar/Excluir (Mantidos simplificados) */}
      {isEditModalOpen && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-lg"><h3 className="font-bold mb-4">Editar</h3><form onSubmit={handleEditSubmit}><input className="border w-full p-2 rounded mb-4" defaultValue={org.name} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button><button className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button></div></form></div></div>}
      {isInactivateModalOpen && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-sm"><h3 className="font-bold mb-2">Inativar?</h3><div className="flex gap-2"><button onClick={() => setIsInactivateModalOpen(false)} className="flex-1 border p-2 rounded">Cancelar</button><button onClick={() => inactivateMutation.mutate()} className="flex-1 bg-amber-600 text-white p-2 rounded">Sim</button></div></div></div>}
      {isDeleteModalOpen && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-sm"><h3 className="font-bold text-red-600 mb-2">Excluir?</h3><div className="flex gap-2"><button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 border p-2 rounded">Cancelar</button><button onClick={() => deletePermanentMutation.mutate()} className="flex-1 bg-red-600 text-white p-2 rounded">Sim</button></div></div></div>}

    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, MapPin, Users, FolderKanban, Building2, X, 
  MoreVertical, Ban, RefreshCcw, Trash2, AlertTriangle 
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

// === INTERFACES ===
interface Organization {
  id: string;
  name: string;
  location?: string;
  type: 'SYSTEM' | 'CUSTOMER';
  deletedAt: string | null;
  _count?: {
    users: number;
    projects: number;
  };
}

export default function OrganizationsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // === ESTADOS ===
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState<'active' | 'inactive'>('active');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // Menu Dropdown

  // Estados dos Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orgToEdit, setOrgToEdit] = useState<Organization | null>(null); // Guarda a org selecionada para ação

  // === 1. BUSCAR DADOS ===
  const { data: organizations = [], isLoading, isError } = useQuery<Organization[]>({
    queryKey: ['organizations', { status: currentTab }],
    queryFn: async () => {
      const response = await api.get('/organizations', {
        params: { status: currentTab }
      });
      return response.data;
    },
  });

  // === 2. MUTAÇÕES ===

  // CRIAR
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/organizations', data),
    onSuccess: () => {
      toast.success('Organização criada!');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsCreateModalOpen(false);
    },
    onError: () => toast.error('Erro ao criar.'),
  });

  // INATIVAR
  const inactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/${id}`),
    onSuccess: () => {
      toast.success('Organização inativada (movida para Inativos).');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setOpenMenuId(null);
      setIsInactivateModalOpen(false);
      setOrgToEdit(null);
    },
    onError: () => toast.error('Erro ao inativar.'),
  });

  // REATIVAR
  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/organizations/${id}/reactivate`),
    onSuccess: () => {
      toast.success('Organização reativada (movida para Ativos).');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setOpenMenuId(null);
    },
    onError: () => toast.error('Erro ao reativar.'),
  });

  // EXCLUIR PERMANENTEMENTE
  const deletePermanentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/${id}/permanent`),
    onSuccess: () => {
      toast.success('Organização excluída definitivamente.');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setOpenMenuId(null);
      setIsDeleteModalOpen(false);
      setOrgToEdit(null);
    },
    onError: () => toast.error('Erro ao excluir (verifique vínculos).'),
  });

  // === FUNÇÕES DE AÇÃO ===
  const handleOpenInactivate = (org: Organization) => {
    setOrgToEdit(org);
    setIsInactivateModalOpen(true);
    setOpenMenuId(null); // Fecha o menu
  };

  const handleOpenDelete = (org: Organization) => {
    setOrgToEdit(org);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null); // Fecha o menu
  };

  // Filtro
  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-10 text-center text-gray-500">Carregando lista...</div>;
  if (isError) return <div className="p-10 text-center text-red-500">Erro de conexão.</div>;

  return (
    <div className="space-y-6 relative">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Organizações</h1>
          <p className="text-gray-500">Gerencie as prefeituras e empresas clientes.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus size={20} /> Nova Organização
        </button>
      </div>

      {/* ABAS + BUSCA */}
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-gray-200 gap-4">
        <div className="flex space-x-6">
          <button
            onClick={() => setCurrentTab('active')}
            className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
              currentTab === 'active' 
                ? 'text-blue-600 border-blue-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setCurrentTab('inactive')}
            className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
              currentTab === 'inactive' 
                ? 'text-blue-600 border-blue-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Inativos
          </button>
        </div>

        <div className="relative w-full sm:w-72 mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrgs.map((org) => {
          const isActive = !org.deletedAt;

          return (
            <div key={org.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative group">
              
              {/* TOPO DO CARD */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${org.type === 'SYSTEM' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 line-clamp-1" title={org.name}>{org.name || 'Sem Nome'}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                {/* MENU DROP DOWN */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === org.id ? null : org.id);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {openMenuId === org.id && (
                    <>
                      <div className="fixed inset-0 z-10 cursor-default" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-4 py-2 border-b border-gray-50 bg-gray-50 text-xs font-medium text-gray-400">
                          AÇÕES
                        </div>

                        {currentTab === 'active' ? (
                          <button 
                            onClick={() => handleOpenInactivate(org)} // <--- Abre Modal
                            className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                          >
                            <Ban size={16} /> Inativar
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => reactivateMutation.mutate(org.id)} // Reativar pode ser direto (sem modal)
                              className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                            >
                              <RefreshCcw size={16} /> Reativar
                            </button>
                            <button 
                              onClick={() => handleOpenDelete(org)} // <--- Abre Modal
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                            >
                              <Trash2 size={16} /> Excluir
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* CORPO DO CARD */}
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                 <div className="flex items-center gap-2">
                   <MapPin size={16} className="text-gray-400" />
                   <span className="truncate">{org.location || 'Local não definido'}</span>
                 </div>
              </div>

              {/* RODAPÉ DO CARD */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1" title="Usuários">
                    <Users size={16} /> {org._count?.users ?? 0}
                  </div>
                  <div className="flex items-center gap-1" title="Projetos">
                    <FolderKanban size={16} /> {org._count?.projects ?? 0}
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/dashboard/admin/organizations/${org.id}`)}
                  className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  Detalhes →
                </button>
              </div>
            </div>
          );
        })}

        {filteredOrgs.length === 0 && (
          <div className="col-span-full py-16 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">
              Nenhuma organização encontrada em <strong>{currentTab === 'active' ? 'Ativos' : 'Inativos'}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: CRIAR ORGANIZAÇÃO */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
             <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg">Nova Organização</h3>
                <button onClick={() => setIsCreateModalOpen(false)}><X size={20}/></button>
             </div>
             <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createMutation.mutate({ 
                    name: fd.get('name'), 
                    location: fd.get('location'), 
                    cnpj: fd.get('cnpj'),
                    type: 'CUSTOMER' 
                });
             }} className="space-y-4">
                <input name="name" required placeholder="Nome da Organização" className="w-full border border-gray-300 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                <input name="location" placeholder="Cidade - UF" className="w-full border border-gray-300 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                <input name="cnpj" placeholder="CNPJ" className="w-full border border-gray-300 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded-lg disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INATIVAR */}
      {/* ========================================================= */}
      {isInactivateModalOpen && orgToEdit && (
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
            
            <h3 className="text-lg font-bold text-gray-800 mb-2">Inativar {orgToEdit.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">
              A organização será movida para a aba "Inativos". O acesso será suspenso temporariamente.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsInactivateModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => inactivateMutation.mutate(orgToEdit.id)}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
              >
                Sim, Inativar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EXCLUIR */}
      {/* ========================================================= */}
      {isDeleteModalOpen && orgToEdit && (
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
            
            <h3 className="text-lg font-bold text-gray-800 mb-2">Excluir {orgToEdit.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-bold text-red-600">Atenção:</span> Esta ação é irreversível. Todos os dados serão apagados permanentemente.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => deletePermanentMutation.mutate(orgToEdit.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
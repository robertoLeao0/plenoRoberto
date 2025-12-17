import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FaFolder, FaSearch, FaTasks, FaCalendarAlt, FaPlus, 
  FaBuilding, FaArchive, FaFolderOpen, FaEllipsisV, 
  FaBan, FaTrash, FaRedo 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../../services/api';

interface Organization {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  deletedAt: string | null; // NULL = Ativo, DATA = Inativo
  organizations: Organization[];
  _count?: {
    tasks: number;
  };
}

export default function AdminProjectsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  
  // Estado para controlar qual menu de qual card está aberto
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // === BUSCA ===
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects-list'],
    queryFn: async () => {
      // O backend agora deve retornar TODOS (ativos e inativos)
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // === MUTAÇÕES (Ações do Menu) ===
  
  // 1. Inativar (Soft Delete)
  const inactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      toast.success('Projeto inativado!');
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      setOpenMenuId(null);
    },
    onError: () => toast.error('Erro ao inativar projeto.')
  });

  // 2. Reativar
  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/projects/${id}/reactivate`),
    onSuccess: () => {
      toast.success('Projeto reativado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      setOpenMenuId(null);
    },
    onError: () => toast.error('Erro ao reativar projeto.')
  });

  // 3. Excluir Permanentemente
  const deletePermanentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}/permanent`),
    onSuccess: () => {
      toast.success('Projeto excluído permanentemente.');
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      setOpenMenuId(null);
    },
    onError: () => toast.error('Erro ao excluir projeto.')
  });

  // === FILTRO ===
  const filteredProjects = Array.isArray(projects) 
    ? projects.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const isActive = !p.deletedAt;
        const matchesTab = activeTab === 'active' ? isActive : !isActive;
        return matchesSearch && matchesTab;
      })
    : [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para abrir/fechar menu
  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Impede que o clique no menu abra os detalhes do projeto
    e.preventDefault();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando projetos...</div>;

  return (
    // Ao clicar em qualquer lugar da tela, fecha o menu
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300" onClick={() => setOpenMenuId(null)}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Projetos</h1>
          <p className="text-slate-500">Gerencie as jornadas e fluxos de mensagens das organizações.</p>
        </div>
        <Link 
          to="/dashboard/admin/projects/create" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all"
        >
          <FaPlus /> Novo Projeto
        </Link>
      </div>

      {/* Busca */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-3.5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar projeto por nome..." 
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Abas */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'active' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <FaFolderOpen /> Em Andamento
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'inactive' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <FaArchive /> Inativos
          </button>
        </nav>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const isActive = !project.deletedAt;
          const isMenuOpen = openMenuId === project.id;

          return (
            <div key={project.id} className="relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-full group">
              
              {/* Botão de Menu (3 Pontinhos) */}
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={(e) => toggleMenu(e, project.id)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                >
                  <FaEllipsisV />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {isActive ? (
                      // Opções para ATIVOS
                      <button 
                        onClick={(e) => { e.stopPropagation(); inactivateMutation.mutate(project.id); }}
                        className="w-full text-left px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <FaBan /> Inativar
                      </button>
                    ) : (
                      // Opções para INATIVOS
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); reactivateMutation.mutate(project.id); }}
                          className="w-full text-left px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                        >
                          <FaRedo /> Reativar
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            if(window.confirm('Tem certeza? Isso apagará o projeto permanentemente.')) {
                                deletePermanentMutation.mutate(project.id);
                            }
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50"
                        >
                          <FaTrash /> Excluir
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Conteúdo do Card */}
              <div>
                <div className="flex items-start mb-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-2 pr-8 line-clamp-1" title={project.name}>
                  {project.name}
                </h3>
                
                {/* Organizações */}
                <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2">
                     <FaBuilding className="text-slate-400" size={12}/>
                     <p className="text-xs font-bold text-slate-400 uppercase">Organizações</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.organizations && project.organizations.length > 0 ? (
                      <>
                        {project.organizations.slice(0, 3).map((org) => (
                          <span key={org.id} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                            {org.name}
                          </span>
                        ))}
                        {project.organizations.length > 3 && (
                           <span className="text-xs text-slate-400 self-center">+{project.organizations.length - 3}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Nenhuma vinculada</span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-2 mb-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-slate-400" /> 
                    <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <FaTasks className="text-slate-400" /> 
                      <span className="font-medium text-slate-700">{project._count?.tasks || 0} Tarefas</span>
                  </div>
                </div>
              </div>

              {/* Botão Detalhes */}
              <button 
                onClick={() => navigate(`/dashboard/admin/projects/${project.id}`)}
                className="w-full mt-auto py-2.5 rounded-lg border border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-50 flex items-center justify-center gap-2 transition-colors"
              >
                Ver Detalhes
              </button>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FaFolderOpen size={48} className="mb-4 opacity-30" />
            <p className="font-medium">Nenhum projeto encontrado nesta aba.</p>
          </div>
        )}
      </div>
    </div>
  );
}
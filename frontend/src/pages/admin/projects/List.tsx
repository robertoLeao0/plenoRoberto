import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Folder, Search, Calendar, Plus, 
  Building2, Archive, FolderOpen, MoreVertical, 
  Ban, Trash2, RotateCcw, CheckSquare, X 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  deletedAt: string | null;
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
  
  // Controle do Menu Dropdown
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // === NOVO: ESTADO PARA O MODAL DE EXCLUSÃO ===
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // === BUSCA ===
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // === 1. INATIVAR ===
  const inactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      toast.success('Projeto inativado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      setOpenMenuId(null);
    },
    onError: () => toast.error('Erro ao inativar projeto.')
  });

  // === 2. REATIVAR ===
  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/projects/${id}/reactivate`),
    onSuccess: () => {
      toast.success('Projeto reativado!');
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      setOpenMenuId(null);
    },
    onError: () => toast.error('Erro ao reativar projeto.')
  });

  // === 3. EXCLUIR PERMANENTE ===
  const deletePermanentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}/permanent`),
    onSuccess: () => {
      toast.success('Projeto excluído permanentemente.');
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      setOpenMenuId(null);
      setProjectToDelete(null); // Fecha o modal
    },
    onError: (error: any) => {
      setProjectToDelete(null); // Fecha o modal mesmo com erro
      if (error.response?.status === 409 || error.response?.status === 400 || error.response?.status === 500) {
        toast.warning('⚠️ Não é possível excluir: O projeto possui tarefas vinculadas.');
      } else {
        toast.error('Erro ao excluir projeto.');
      }
    }
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Filtros
  const filteredProjects = Array.isArray(projects) 
    ? projects.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const isActive = !p.deletedAt;
        const matchesTab = activeTab === 'active' ? isActive : !isActive;
        return matchesSearch && matchesTab;
      })
    : [];

  if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando projetos...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Projetos</h1>
          <p className="text-slate-500">Gerencie as jornadas e fluxos de mensagens.</p>
        </div>
        <Link 
          to="/dashboard/admin/projects/create" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all"
        >
          <Plus size={20} /> Novo Projeto
        </Link>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
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
          <button onClick={() => setActiveTab('active')} className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'active' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <FolderOpen size={18} /> Em Andamento
          </button>
          <button onClick={() => setActiveTab('inactive')} className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'inactive' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Archive size={18} /> Inativos
          </button>
        </nav>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" onClick={() => setOpenMenuId(null)}>
        {filteredProjects.map((project) => {
          const isActive = !project.deletedAt;
          const isMenuOpen = openMenuId === project.id;

          return (
            <div key={project.id} className="relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-full group">
              
              {/* Menu 3 Pontinhos */}
              <div className="absolute top-4 right-4 z-10">
                <button onClick={(e) => toggleMenu(e, project.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                  <MoreVertical size={20} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {isActive ? (
                      <button onClick={(e) => { e.stopPropagation(); inactivateMutation.mutate(project.id); }} className="w-full text-left px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                        <Ban size={16} /> Inativar Projeto
                      </button>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); reactivateMutation.mutate(project.id); }} className="w-full text-left px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2">
                          <RotateCcw size={16} /> Reativar
                        </button>
                        
                        {/* BOTÃO QUE ABRE O MODAL */}
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setProjectToDelete(project); // <--- AQUI A MÁGICA
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50"
                        >
                          <Trash2 size={16} /> Excluir Definitivo
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Infos do Projeto (Mantive igual) */}
              <div>
                <div className="flex items-start mb-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 pr-8 line-clamp-1">{project.name}</h3>
                <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2">
                      <Building2 className="text-slate-400" size={14}/>
                      <p className="text-xs font-bold text-slate-400 uppercase">Organizações</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.organizations && project.organizations.length > 0 ? (
                      <>
                        {project.organizations.slice(0, 3).map((org) => (
                          <span key={org.id} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{org.name}</span>
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
                    <Calendar className="text-slate-400" size={14} /> 
                    <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <CheckSquare className="text-slate-400" size={14} /> 
                      <span className="font-medium text-slate-700">{project._count?.tasks || 0} Tarefas</span>
                  </div>
                </div>
              </div>

              <button onClick={() => navigate(`/dashboard/admin/projects/${project.id}`)} className="w-full mt-auto py-2.5 rounded-lg border border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-50 flex items-center justify-center gap-2 transition-colors">
                Ver Detalhes
              </button>
            </div>
          );
        })}
      </div>

      {/* ========================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (PADRONIZADO) */}
      {/* ========================================================== */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Botão Fechar no Topo */}
            <div className="flex justify-end p-4">
              <button 
                onClick={() => setProjectToDelete(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pb-6 text-center">
              {/* Ícone de Lixeira Vermelha */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>

              {/* Título */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Excluir {projectToDelete.name}?
              </h3>

              {/* Descrição */}
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                <span className="font-bold text-red-600">Atenção:</span> Esta ação é irreversível. 
                Todos os dados do projeto, incluindo tarefas e históricos, serão apagados permanentemente.
              </p>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deletePermanentMutation.mutate(projectToDelete.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-lg shadow-red-200"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
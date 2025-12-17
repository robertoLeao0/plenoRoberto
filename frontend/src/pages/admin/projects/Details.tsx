import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Calendar, Building2, Plus, 
  Trash2, Ban, RefreshCcw, MoreVertical, CheckCircle2, Circle, 
  LayoutDashboard, Clock 
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../services/api';

// === INTERFACES ===
interface Organization {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'DONE';
  startAt: string;
  endAt: string;
  organizations: Organization[]; // Lista de orgs vinculadas
}

interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  deletedAt: string | null;
  organizations: Organization[];
  tasks: Task[];
  _count?: {
    tasks: number;
    organizations: number;
  }
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'orgs'>('tasks');
  
  // Modais
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // === ESTADOS DO FORMULÁRIO DE TAREFA (NOVOS) ===
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [newTaskOrgIds, setNewTaskOrgIds] = useState<string[]>([]); // Array Múltiplo
  const [newTaskRequireMedia, setNewTaskRequireMedia] = useState(false);

  // Buscar Dados do Projeto
  const { data: project, isLoading, isError } = useQuery<ProjectDetails>({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // === MUTAÇÕES ===

  // Criar Tarefa (Agora envia todos os campos novos)
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!newTaskTitle || !newTaskStart || !newTaskEnd || newTaskOrgIds.length === 0) {
          throw new Error("Preencha todos os campos obrigatórios.");
      }

      return api.post('/tasks', {
        projectId: id,
        organizationIds: newTaskOrgIds, // Array
        title: newTaskTitle,
        description: newTaskDescription,
        startAt: new Date(newTaskStart).toISOString(), // ISO String
        endAt: new Date(newTaskEnd).toISOString(),     // ISO String
        requireMedia: newTaskRequireMedia
      });
    },
    onSuccess: () => {
      toast.success('Tarefa criada com sucesso!');
      setIsTaskModalOpen(false);
      // Limpar form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskStart('');
      setNewTaskEnd('');
      setNewTaskOrgIds([]);
      
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (err: any) => {
        console.error(err);
        const msg = err.response?.data?.message || err.message || 'Erro ao criar tarefa.';
        toast.error(msg);
    }
  });

  // Outras mutações (Inativar/Reativar) mantidas...
  const inactivateMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      toast.success('Projeto inativado.');
      setIsInactivateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => api.patch(`/projects/${id}/reactivate`),
    onSuccess: () => {
      toast.success('Projeto reativado!');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const deletePermanentMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}/permanent`),
    onSuccess: () => {
      toast.success('Projeto excluído.');
      navigate('/dashboard/admin/projects');
    },
  });

  if (isLoading) return <div className="p-10 text-center text-gray-500">Carregando...</div>;
  if (isError || !project) return <div className="p-10 text-center text-red-500">Projeto não encontrado.</div>;

  const isActive = !project.deletedAt;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6 animate-in fade-in duration-300">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard/admin/projects" className="flex items-center text-gray-500 hover:text-blue-600">
          <ArrowLeft size={18} className="mr-1" /> Voltar para Projetos
        </Link>
        <span className="text-xs text-gray-400">ID: {project.id}</span>
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
             <div className="p-4 bg-blue-100 text-blue-600 rounded-xl h-16 w-16 flex items-center justify-center">
                <LayoutDashboard size={32} />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  {project.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </h1>
                <p className="text-gray-500 mt-1">{project.description || 'Sem descrição.'}</p>
             </div>
          </div>
          <div className="flex gap-2">
            {isActive ? (
              <button onClick={() => setIsInactivateModalOpen(true)} className="px-4 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 flex gap-2 items-center text-sm font-medium">
                <Ban size={16} /> Inativar
              </button>
            ) : (
              <>
                 <button onClick={() => reactivateMutation.mutate()} className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 flex gap-2 items-center text-sm font-medium">
                    <RefreshCcw size={16}/> Reativar
                 </button>
                 <button onClick={() => setIsDeleteModalOpen(true)} className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 flex gap-2 items-center text-sm font-medium">
                    <Trash2 size={16}/> Excluir
                 </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('overview')} className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('tasks')} className={`pb-4 px-1 border-b-2 font-medium text-sm flex gap-2 ${activeTab === 'tasks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Tarefas <span className="bg-gray-100 px-2 rounded-full text-xs">{project.tasks?.length || 0}</span></button>
          <button onClick={() => setActiveTab('orgs')} className={`pb-4 px-1 border-b-2 font-medium text-sm flex gap-2 ${activeTab === 'orgs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Organizações <span className="bg-gray-100 px-2 rounded-full text-xs">{project.organizations?.length || 0}</span></button>
        </nav>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="min-h-[300px]">
        
        {/* ABA TAREFAS */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <h3 className="font-bold text-gray-700">Lista de Atividades</h3>
               <button 
                 onClick={() => setIsTaskModalOpen(true)}
                 disabled={!isActive}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
               >
                 <Plus size={16} /> Nova Tarefa
               </button>
             </div>

             <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {(!project.tasks || project.tasks.length === 0) ? (
                   <div className="p-10 text-center text-gray-400">Nenhuma tarefa cadastrada.</div>
                ) : (
                   <div className="divide-y divide-gray-100">
                      {project.tasks.map(task => (
                        <div key={task.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                           <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-full ${task.status === 'DONE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                 {task.status === 'DONE' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                              </div>
                              <div>
                                 <h4 className={`font-bold text-gray-800 ${task.status === 'DONE' ? 'line-through opacity-50' : ''}`}>{task.title}</h4>
                                 <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><Clock size={12}/> {new Date(task.startAt).toLocaleString()}</span>
                                    {/* Exibe badges das organizações vinculadas */}
                                    <div className="flex gap-1">
                                      {task.organizations?.map(org => (
                                        <span key={org.id} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                           {org.name}
                                        </span>
                                      ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <button className="text-gray-300 hover:text-gray-600"><MoreVertical size={16}/></button>
                        </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
        )}

        {/* OUTRAS ABAS (Resumidas) */}
        {activeTab === 'orgs' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {project.organizations.map(org => (
                 <div key={org.id} className="bg-white p-4 border rounded-xl flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded"><Building2 size={20} className="text-gray-500"/></div>
                    <span className="font-bold text-gray-700">{org.name}</span>
                 </div>
              ))}
           </div>
        )}
      </div>

      {/* === MODAL NOVA TAREFA (CORRIGIDO E COMPLETO) === */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-800">Nova Tarefa da Jornada</h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="space-y-5">
                 
                 {/* 1. Título e Descrição */}
                 <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Título da Tarefa <span className="text-red-500">*</span></label>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Ex: DIA 1 - Boas Vindas"
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Descrição detalhada</label>
                      <textarea 
                        rows={3}
                        placeholder="O que deve ser feito?"
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={newTaskDescription}
                        onChange={e => setNewTaskDescription(e.target.value)}
                      />
                    </div>
                 </div>

                 {/* 2. Datas */}
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Início (Liberação)</label>
                      <input 
                        type="datetime-local" 
                        className="w-full border border-gray-300 rounded-lg p-2.5"
                        value={newTaskStart}
                        onChange={e => setNewTaskStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Fim (Bloqueio)</label>
                      <input 
                        type="datetime-local" 
                        className="w-full border border-gray-300 rounded-lg p-2.5"
                        value={newTaskEnd}
                        onChange={e => setNewTaskEnd(e.target.value)}
                      />
                    </div>
                 </div>

                 {/* 3. Organizações (Checkbox Múltiplo) */}
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Atribuir às Organizações <span className="text-red-500">*</span></label>
                    <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-gray-50 p-2 space-y-1">
                       <label className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-3 w-4 h-4"
                            onChange={(e) => {
                               if (e.target.checked) setNewTaskOrgIds(project.organizations.map(o => o.id));
                               else setNewTaskOrgIds([]);
                            }}
                            checked={newTaskOrgIds.length === project.organizations.length && project.organizations.length > 0}
                          />
                          <span className="text-sm font-bold">Selecionar Todas</span>
                       </label>
                       <hr className="border-gray-200 my-1"/>
                       {project.organizations.map(org => (
                         <label key={org.id} className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="mr-3 w-4 h-4"
                              checked={newTaskOrgIds.includes(org.id)}
                              onChange={() => {
                                 if (newTaskOrgIds.includes(org.id)) setNewTaskOrgIds(prev => prev.filter(id => id !== org.id));
                                 else setNewTaskOrgIds(prev => [...prev, org.id]);
                              }}
                            />
                            <span className="text-sm">{org.name}</span>
                         </label>
                       ))}
                    </div>
                 </div>

                 {/* 4. Mídia Obrigatória */}
                 <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <input 
                      type="checkbox" 
                      id="requireMedia"
                      className="w-4 h-4"
                      checked={newTaskRequireMedia}
                      onChange={e => setNewTaskRequireMedia(e.target.checked)}
                    />
                    <label htmlFor="requireMedia" className="text-sm font-medium text-blue-800 cursor-pointer">
                       Exigir foto ou vídeo para concluir?
                    </label>
                 </div>

                 <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={() => setIsTaskModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                    <button 
                      onClick={() => createTaskMutation.mutate()} 
                      disabled={createTaskMutation.isPending}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                      {createTaskMutation.isPending ? 'Criando...' : 'Criar Tarefa'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Outros Modais (Inativar/Excluir) */}
      {isInactivateModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm">
               <h3 className="font-bold text-lg mb-2">Inativar Projeto?</h3>
               <div className="flex gap-2 mt-4">
                  <button onClick={() => setIsInactivateModalOpen(false)} className="flex-1 border p-2 rounded-lg">Cancelar</button>
                  <button onClick={() => inactivateMutation.mutate()} className="flex-1 bg-amber-600 text-white p-2 rounded-lg">Confirmar</button>
               </div>
            </div>
         </div>
      )}
      
      {isDeleteModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm">
               <h3 className="font-bold text-lg text-red-600 mb-2">Excluir Permanentemente?</h3>
               <p className="text-sm text-gray-500">Isso apagará todas as tarefas vinculadas.</p>
               <div className="flex gap-2 mt-4">
                  <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 border p-2 rounded-lg">Cancelar</button>
                  <button onClick={() => deletePermanentMutation.mutate()} className="flex-1 bg-red-600 text-white p-2 rounded-lg">Excluir</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
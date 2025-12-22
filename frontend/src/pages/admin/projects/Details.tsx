import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Building2, Plus, 
  Trash2, Ban, RefreshCcw, MoreVertical, CheckCircle2, Circle, 
  LayoutDashboard, Clock, Pencil, Save, X, Edit 
} from 'lucide-react';
import { toast } from 'react-toastify'; 
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
  organizations: Organization[];
  requireMedia?: boolean;
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

export default function AdminProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'orgs'>('orgs'); // Começa na aba Orgs para facilitar seu teste
  
  // === ESTADOS DOS MODAIS ===
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false); 
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false); 
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 
  
  // === NOVO: MODAL DE GERENCIAR ORGS ===
  const [isManageOrgsModalOpen, setIsManageOrgsModalOpen] = useState(false);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]); // Para controlar a seleção no modal

  // === ESTADOS DE TAREFA ===
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null); 
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null); 

  // === ESTADOS DO FORMULÁRIO DE NOVA TAREFA ===
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [newTaskOrgIds, setNewTaskOrgIds] = useState<string[]>([]);
  const [newTaskRequireMedia, setNewTaskRequireMedia] = useState(false);

  // === 1. BUSCAR DADOS DO PROJETO ===
  const { data: project, isLoading, isError } = useQuery<ProjectDetails>({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // === 2. BUSCAR TODAS AS ORGANIZAÇÕES (Para o Modal de Seleção) ===
  const { data: allOrganizations } = useQuery<Organization[]>({
    queryKey: ['all-organizations'],
    queryFn: async () => {
      const response = await api.get('/organizations');
      return response.data;
    },
    enabled: isManageOrgsModalOpen // Só busca quando abrir o modal
  });

  // === EFEITO: Preencher organizações selecionadas quando abrir o modal ===
  useEffect(() => {
    if (isManageOrgsModalOpen && project) {
      setSelectedOrgIds(project.organizations.map(org => org.id));
    }
  }, [isManageOrgsModalOpen, project]);


  // === 3. MUTATION: ATUALIZAR ORGANIZAÇÕES DO PROJETO ===
  const updateProjectOrgsMutation = useMutation({
    mutationFn: async () => {
      // Envia apenas os IDs selecionados para atualizar o vínculo
      return api.patch(`/projects/${id}`, {
        organizationIds: selectedOrgIds
      });
    },
    onSuccess: () => {
      toast.success('Organizações atualizadas com sucesso!');
      setIsManageOrgsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: () => toast.error('Erro ao atualizar organizações.')
  });


  // === 4. CRIAR TAREFA ===
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!newTaskTitle || !newTaskStart || !newTaskEnd || newTaskOrgIds.length === 0) {
          throw new Error("Preencha todos os campos obrigatórios.");
      }
      return api.post('/tasks', {
        projectId: id,
        organizationIds: newTaskOrgIds,
        title: newTaskTitle,
        description: newTaskDescription,
        startAt: new Date(newTaskStart).toISOString(),
        endAt: new Date(newTaskEnd).toISOString(),
        requireMedia: newTaskRequireMedia
      });
    },
    onSuccess: () => {
      toast.success('Tarefa criada com sucesso!');
      setIsTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskStart('');
      setNewTaskEnd('');
      setNewTaskOrgIds([]);
      setNewTaskRequireMedia(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Erro ao criar tarefa.';
        toast.error(msg);
    }
  });

  // === 5. EDITAR/EXCLUIR TAREFA ===
  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => api.patch(`/tasks/${data.id}`, data),
    onSuccess: () => {
      toast.success('Tarefa atualizada!');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setTaskToEdit(null);
    },
    onError: () => toast.error('Erro ao atualizar tarefa.')
  });

  const handleEditTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskToEdit) {
      updateTaskMutation.mutate({
        id: taskToEdit.id,
        title: taskToEdit.title,
        description: taskToEdit.description,
        startAt: new Date(taskToEdit.startAt).toISOString(),
        endAt: new Date(taskToEdit.endAt).toISOString()
      });
    }
  };

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      toast.success('Tarefa excluída!');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setTaskToDelete(null);
    },
    onError: () => toast.error('Erro ao excluir tarefa.')
  });

  // === 6. AÇÕES DE PROJETO ===
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
                        <div key={task.id} className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-colors">
                           <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-full ${task.status === 'DONE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                 {task.status === 'DONE' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                              </div>
                              <div>
                                 <h4 className={`font-bold text-gray-800 ${task.status === 'DONE' ? 'line-through opacity-50' : ''}`}>{task.title}</h4>
                                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><Clock size={12}/> {new Date(task.startAt).toLocaleString()}</span>
                                    <div className="flex flex-wrap gap-1">
                                      {task.organizations?.map(org => (
                                        <span key={org.id} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                           {org.name}
                                        </span>
                                      ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 self-end sm:self-center">
                              <button onClick={() => setTaskToEdit(task)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Pencil size={18}/></button>
                              <button onClick={() => setTaskToDelete(task)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18}/></button>
                           </div>
                        </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
        )}

        {/* ABA ORGANIZAÇÕES (COM EDIÇÃO) */}
        {activeTab === 'orgs' && (
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="font-bold text-gray-700">Organizações Vinculadas</h3>
                 <button 
                   onClick={() => setIsManageOrgsModalOpen(true)}
                   disabled={!isActive}
                   className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                 >
                   <Edit size={16} /> Gerenciar Organizações
                 </button>
              </div>

              {project.organizations.length === 0 ? (
                 <div className="p-10 text-center text-gray-400 border border-dashed rounded-xl bg-gray-50">
                    Nenhuma organização vinculada a este projeto.
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {project.organizations.map(org => (
                       <div key={org.id} className="bg-white p-4 border rounded-xl flex items-center gap-3 shadow-sm">
                          <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Building2 size={24}/></div>
                          <span className="font-bold text-gray-700">{org.name}</span>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL GERENCIAR ORGANIZAÇÕES (NOVO) */}
      {/* ========================================================== */}
      {isManageOrgsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Gerenciar Organizações</h3>
              <button onClick={() => setIsManageOrgsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">Selecione as organizações que participarão deste projeto.</p>

            <div className="border border-gray-200 rounded-lg overflow-y-auto flex-1 p-2 bg-gray-50 space-y-1">
               {/* Opção Selecionar Todas */}
               <label className="flex items-center p-3 bg-white hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100 shadow-sm transition-all">
                  <input 
                    type="checkbox" 
                    className="mr-3 w-5 h-5 accent-blue-600" 
                    checked={allOrganizations && allOrganizations.length > 0 && selectedOrgIds.length === allOrganizations.length}
                    onChange={(e) => {
                       if(e.target.checked && allOrganizations) setSelectedOrgIds(allOrganizations.map(o => o.id));
                       else setSelectedOrgIds([]);
                    }}
                  />
                  <span className="text-sm font-bold text-gray-800">Selecionar Todas</span>
               </label>
               
               <hr className="border-gray-200 my-2"/>

               {/* Lista de Organizações */}
               {allOrganizations?.map(org => (
                 <label key={org.id} className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${selectedOrgIds.includes(org.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-gray-100'}`}>
                    <input 
                      type="checkbox" 
                      className="mr-3 w-5 h-5 accent-blue-600" 
                      checked={selectedOrgIds.includes(org.id)}
                      onChange={() => {
                         if (selectedOrgIds.includes(org.id)) setSelectedOrgIds(prev => prev.filter(id => id !== org.id));
                         else setSelectedOrgIds(prev => [...prev, org.id]);
                      }}
                    />
                    <span className={`text-sm ${selectedOrgIds.includes(org.id) ? 'font-bold text-blue-800' : 'text-gray-700'}`}>{org.name}</span>
                 </label>
               ))}
            </div>

            <div className="pt-4 flex gap-3 mt-auto">
               <button onClick={() => setIsManageOrgsModalOpen(false)} className="flex-1 py-3 border rounded-lg hover:bg-gray-50 font-medium">Cancelar</button>
               <button 
                 onClick={() => updateProjectOrgsMutation.mutate()} 
                 disabled={updateProjectOrgsMutation.isPending}
                 className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2"
               >
                 {updateProjectOrgsMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ... Demais Modais (Task, Edit, Delete) mantidos iguais ... */}
      {/* Vou recolocar aqui para o código ficar completo e você só copiar/colar */}
      
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-800">Nova Tarefa</h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                 <input type="text" placeholder="Título" className="w-full border p-2 rounded" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                 <textarea placeholder="Descrição" className="w-full border p-2 rounded" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="datetime-local" className="w-full border p-2 rounded" value={newTaskStart} onChange={e => setNewTaskStart(e.target.value)} />
                    <input type="datetime-local" className="w-full border p-2 rounded" value={newTaskEnd} onChange={e => setNewTaskEnd(e.target.value)} />
                 </div>
                 {/* Seleção de Orgs na Tarefa */}
                 <div className="border p-2 max-h-32 overflow-y-auto bg-gray-50 rounded">
                     {project.organizations.map(org => (
                        <label key={org.id} className="flex items-center p-1"><input type="checkbox" className="mr-2" checked={newTaskOrgIds.includes(org.id)} onChange={() => { if(newTaskOrgIds.includes(org.id)) setNewTaskOrgIds(prev=>prev.filter(i=>i!==org.id)); else setNewTaskOrgIds(prev=>[...prev, org.id])}}/> {org.name}</label>
                     ))}
                 </div>
                 <div className="flex justify-end gap-2"><button onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button><button onClick={() => createTaskMutation.mutate()} className="px-4 py-2 bg-blue-600 text-white rounded">Criar</button></div>
              </div>
           </div>
        </div>
      )}

      {taskToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">Editar Tarefa</h3>
            <form onSubmit={handleEditTaskSubmit} className="space-y-4">
              <input type="text" value={taskToEdit.title} onChange={e => setTaskToEdit({...taskToEdit, title: e.target.value})} className="w-full border p-2 rounded" />
              <textarea value={taskToEdit.description || ''} onChange={e => setTaskToEdit({...taskToEdit, description: e.target.value})} className="w-full border p-2 rounded" />
              <div className="grid grid-cols-2 gap-4">
                  <input type="datetime-local" value={taskToEdit.startAt ? new Date(taskToEdit.startAt).toISOString().slice(0, 16) : ''} onChange={e => setTaskToEdit({...taskToEdit, startAt: new Date(e.target.value).toISOString()})} className="w-full border p-2 rounded" />
                  <input type="datetime-local" value={taskToEdit.endAt ? new Date(taskToEdit.endAt).toISOString().slice(0, 16) : ''} onChange={e => setTaskToEdit({...taskToEdit, endAt: new Date(e.target.value).toISOString()})} className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setTaskToEdit(null)} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button></div>
            </form>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
              <Trash2 className="mx-auto h-10 w-10 text-red-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Excluir Tarefa?</h3>
              <p className="text-sm text-gray-500 mb-4">Tem certeza que deseja apagar "{taskToDelete.title}"?</p>
              <div className="flex gap-2">
                 <button onClick={() => setTaskToDelete(null)} className="flex-1 border p-2 rounded">Cancelar</button>
                 <button onClick={() => deleteTaskMutation.mutate(taskToDelete.id)} className="flex-1 bg-red-600 text-white p-2 rounded">Excluir</button>
              </div>
           </div>
        </div>
      )}

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
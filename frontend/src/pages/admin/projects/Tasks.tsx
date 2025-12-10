import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaCheckCircle, FaBan, FaClock, FaUsers, FaTasks } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';

// --- COMPONENTE DE TAREFAS ---
function TasksList({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', date: '', time: '09:00', isActive: true });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => (await api.get(`/tasks?projectId=${projectId}`)).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/tasks', payload),
    onSuccess: () => {
      toast.success('Tarefa criada!');
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      setIsFormOpen(false);
      setFormData({ title: '', content: '', date: '', time: '09:00', isActive: true });
    },
    onError: () => toast.error('Erro ao criar tarefa.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      toast.success('Tarefa apagada!');
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return toast.warn('Preencha os campos.');
    
    const isoDate = `${formData.date}T${formData.time}:00`;
    createMutation.mutate({
      title: formData.title,
      content: formData.content,
      sendAt: new Date(isoDate).toISOString(),
      projectId,
      status: formData.isActive ? 'AGENDADO' : 'RASCUNHO'
    });
  };

  const displayedTasks = tasks.filter((t: any) => {
    const isActive = ['AGENDADO', 'ENVIANDO', 'CONCLUIDO'].includes(t.status);
    return activeTab === 'active' ? isActive : !isActive;
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando tarefas...</div>;

  return (
    <div>
      {/* Botão Nova Tarefa */}
      {!isFormOpen && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2 font-medium">
            <FaPlus /> Nova Tarefa
          </button>
        </div>
      )}

      {/* Formulário */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded shadow border border-indigo-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Nova Mensagem</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <input type="text" placeholder="Título Interno" className="w-full border p-2 rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <textarea placeholder="Texto da mensagem" rows={3} className="w-full border p-2 rounded" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
            <div className="flex gap-4">
              <input type="date" className="border p-2 rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <input type="time" className="border p-2 rounded" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
            <div className="flex justify-between items-center pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                Ativar envio automático
              </label>
              <div className="space-x-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 text-white px-4 py-2 rounded">Salvar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-4 border-b mb-4">
        <button onClick={() => setActiveTab('active')} className={`pb-2 px-2 ${activeTab === 'active' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>Ativos</button>
        <button onClick={() => setActiveTab('inactive')} className={`pb-2 px-2 ${activeTab === 'inactive' ? 'border-b-2 border-orange-500 text-orange-600 font-bold' : 'text-gray-500'}`}>Inativos</button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {displayedTasks.map((t: any) => (
          <div key={t.id} className="bg-white p-4 rounded shadow-sm border border-gray-100 flex justify-between items-center hover:bg-gray-50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-800">{t.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${t.status === 'CONCLUIDO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{t.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><FaClock /> {new Date(t.sendAt).toLocaleString()}</span>
                <span className="truncate max-w-md">{t.content}</span>
              </div>
            </div>
            <button onClick={() => deleteMutation.mutate(t.id)} className="text-red-400 hover:text-red-600 p-2"><FaTrash /></button>
          </div>
        ))}
        {displayedTasks.length === 0 && <p className="text-center text-gray-400 py-8">Nenhuma tarefa aqui.</p>}
      </div>
    </div>
  );
}

// --- COMPONENTE DE MEMBROS (Placeholder) ---
function MembersList({ projectId }: { projectId: string }) {
  // Aqui futuramente faremos o fetch dos inscritos no projeto
  // Como ainda não criamos a rota específica de "listar inscritos", vou deixar o esqueleto
  return (
    <div className="text-center py-12 bg-white rounded shadow-sm border border-gray-200">
      <FaUsers className="mx-auto text-4xl text-gray-300 mb-3" />
      <h3 className="text-lg font-medium text-gray-600">Gestão de Membros</h3>
      <p className="text-gray-400 mb-6">Em breve você poderá ver e adicionar participantes neste projeto.</p>
      <button className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded hover:bg-indigo-100 disabled:opacity-50" disabled>
        + Adicionar Membro (Em breve)
      </button>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function ProjectDetails() {
  const { projectId } = useParams();
  const [view, setView] = useState<'tasks' | 'members'>('tasks');

  if (!projectId) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard/admin/projects" className="p-2 hover:bg-slate-200 rounded-full transition">
          <FaArrowLeft className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gerenciar Projeto</h1>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => setView('tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${view === 'tasks' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              <FaTasks /> Tarefas
            </button>
            <button 
              onClick={() => setView('members')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${view === 'members' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              <FaUsers /> Membros
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      {view === 'tasks' ? <TasksList projectId={projectId} /> : <MembersList projectId={projectId} />}
    </div>
  );
}
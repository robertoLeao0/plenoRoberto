import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, Unlock, ChevronRight, Calendar, FolderOpen, ArrowLeft, CheckCircle2 
} from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import api from '../../../services/api';

interface MyTask {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  status: string;
  project: {
    name: string;
  };
}

export default function UserTasks() {
  const navigate = useNavigate();
  // Estado para controlar qual projeto está selecionado (se null, mostra a lista de projetos)
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);

  // Busca tarefas da API
  const { data: tasks, isLoading } = useQuery<MyTask[]>({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/my-tasks');
      return response.data;
    },
    refetchInterval: 60000, 
  });

  // === 1. AGRUPAR TAREFAS POR PROJETO ===
  const projectsList = useMemo(() => {
    if (!tasks) return [];
    // Cria uma lista única de nomes de projetos
    const uniqueProjects = Array.from(new Set(tasks.map(t => t.project?.name || 'Geral')));
    return uniqueProjects;
  }, [tasks]);

  // === 2. FILTRAR TAREFAS DO PROJETO SELECIONADO ===
  const filteredTasks = useMemo(() => {
    if (!tasks || !selectedProjectName) return [];
    
    return tasks
      .filter(t => (t.project?.name || 'Geral') === selectedProjectName)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()); // Garante ordem por data
  }, [tasks, selectedProjectName]);

  // Função de Clique na Tarefa
  const handleTaskClick = (task: MyTask) => {
    const startDate = parseISO(task.startAt);
    
    if (isFuture(startDate)) {
      const dateString = format(startDate, "dd 'de' MMMM", { locale: ptBR });
      toast.info(`🔒 Tarefa liberada apenas dia ${dateString}.`);
      return;
    }
    
    navigate(`/dashboard/user/tasks/${task.id}`); 
  };

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">Carregando jornada...</div>;
  }

  // === VISÃO 1: LISTA DE PROJETOS (PASTAS) ===
  if (!selectedProjectName) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Meus Projetos</h1>
          <p className="text-gray-500">Selecione uma jornada para ver suas tarefas.</p>
        </div>

        <div className="space-y-4">
          {(!tasks || tasks.length === 0) && (
             <div className="py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                <p>Nenhuma tarefa atribuída à sua organização ainda.</p>
             </div>
          )}

          {projectsList.map((projectName) => {
            // Conta quantas tarefas tem nesse projeto
            const count = tasks?.filter(t => (t.project?.name || 'Geral') === projectName).length;

            return (
              <div 
                key={projectName}
                onClick={() => setSelectedProjectName(projectName)}
                className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FolderOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{projectName}</h3>
                    <p className="text-sm text-gray-500">{count} tarefas disponíveis</p>
                  </div>
                </div>
                
                <ChevronRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // === VISÃO 2: LISTA DE TAREFAS DO PROJETO (ARQUIVOS) ===
  return (
    <div className="p-6 max-w-4xl mx-auto animate-in slide-in-from-right duration-500">
      
      {/* Botão Voltar */}
      <button 
        onClick={() => setSelectedProjectName(null)}
        className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors group"
      >
        <div className="p-1 rounded-full group-hover:bg-blue-50 mr-2">
          <ArrowLeft size={20} />
        </div>
        <span className="font-medium">Voltar para Projetos</span>
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{selectedProjectName}</h1>
          <p className="text-gray-500">Cronograma de atividades</p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const startDate = parseISO(task.startAt);
          const isLocked = isFuture(startDate);
          
          // Formatação simples: "10 de dezembro"
          const dateString = format(startDate, "dd 'de' MMMM", { locale: ptBR });

          return (
            <div 
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className={`
                relative flex items-center p-4 rounded-xl border transition-all duration-200
                ${isLocked 
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-75' 
                  : 'bg-white border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer'
                }
              `}
            >
              {/* Ícone Lateral */}
              <div className={`
                h-10 w-10 rounded-lg flex items-center justify-center mr-4 shrink-0 border
                ${isLocked 
                  ? 'bg-gray-100 border-gray-200 text-gray-400' 
                  : 'bg-blue-50 border-blue-100 text-blue-600'
                }
              `}>
                {isLocked ? <Lock size={18} /> : <CheckCircle2 size={20} />}
              </div>

              {/* Informações */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wide ${isLocked ? 'text-gray-400' : 'text-blue-600'}`}>
                    {isLocked ? 'Em Breve' : 'Disponível'}
                  </span>
                  
                  {/* Data formatada simplificada */}
                  <div className="flex items-center text-xs text-gray-400 font-medium">
                    <Calendar size={12} className="mr-1" />
                    {dateString}
                  </div>
                </div>

                <h3 className={`text-base font-semibold truncate ${isLocked ? 'text-gray-500' : 'text-gray-800'}`}>
                  {task.title}
                </h3>
              </div>

              {/* Seta se liberado */}
              {!isLocked && (
                <div className="text-gray-300">
                  <ChevronRight size={20} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
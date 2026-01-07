import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Lock, ChevronRight, FolderOpen, ArrowLeft, CheckCircle2, Circle, Clock, XCircle, Calendar, Ban 
} from 'lucide-react';
import { format, isFuture, isToday, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import api from '../../../services/api';

// --- INTERFACES ---
interface Project {
  id: string;
  name: string;
  _count?: {
    dayTemplates: number;
  };
}


interface JourneyItem {
  dayNumber: number;
  title: string;
  description: string;
  points: number;
  status: 'NAO_INICIADO' | 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';
  logId: string | null;
  date: string;
}

interface UserJourneyResponse {
  user: { name: string };
  journey: JourneyItem[];
}

export default function UserTasks() {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para ler o estado da navegação
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // 1. Busca Projetos
  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['my-projects-list'],
    queryFn: async () => {
      const response = await api.get('/projects', { params: { isActive: true } }); 
      return response.data;
    },
  });

  // 2. Efeito para restaurar o projeto aberto se voltar da tela de detalhes
  useEffect(() => {
    if (location.state && location.state.openProject) {
      setSelectedProjectId(location.state.openProject);
      // Limpa o estado para não afetar futuras navegações
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Encontra o nome do projeto selecionado para exibir no título
  const activeProject = projects?.find(p => p.id === selectedProjectId);

  // 3. Busca Jornada
  const { data: journeyData, isLoading: loadingTasks } = useQuery<UserJourneyResponse>({
    queryKey: ['project-journey', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      // Precisamos do ID do usuário, vamos pegar do endpoint /me rapidinho ou assumir que o backend resolve com o token
      const userRes = await api.get('/auth/me'); 
      const userId = userRes.data.id;
      
      const response = await api.get(`/projects/${selectedProjectId}/users/${userId}/journey`);
      return response.data;
    },
    enabled: !!selectedProjectId, 
  });

  // Lógica de Clique (Bloqueio)
  const handleTaskClick = (task: JourneyItem) => {
    const taskDate = parseISO(task.date);
    
    // Se já fez ou está em análise, libera visualização
    if (task.status === 'APROVADO' || task.status === 'EM_ANALISE') {
        navigate(`/dashboard/user/projeto/${selectedProjectId}/dia/${task.dayNumber}`);
        return;
    }

    // Regra Rigorosa: Só libera Hoje
    if (!isToday(taskDate)) {
        if (isFuture(taskDate)) {
             const dateStr = format(taskDate, "dd 'de' MMMM", { locale: ptBR });
             toast.info(`🔒 Em breve: Liberada dia ${dateStr}.`);
        } else {
             toast.error(`🚫 Tarefa expirada. Data limite: ${format(taskDate, "dd/MM")}.`);
        }
        return; 
    }

    navigate(`/dashboard/user/projeto/${selectedProjectId}/dia/${task.dayNumber}`); 
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProjectId(project.id);
  };

  const getStatusIcon = (status: string, isLocked: boolean, isExpired: boolean) => {
    if (status === 'APROVADO') return <CheckCircle2 size={20} />;
    if (isExpired) return <Ban size={20} />; 
    if (isLocked) return <Lock size={18} />; 
    
    switch (status) {
      case 'EM_ANALISE': return <Clock size={20} />;
      case 'REJEITADO': return <XCircle size={20} />;
      default: return <Circle size={20} />;
    }
  };

  if (loadingProjects) return <div className="p-10 text-center text-gray-500">Carregando projetos...</div>;

  // === TELA 1: LISTA DE PROJETOS ===
  if (!selectedProjectId) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Meus Projetos</h1>
          <p className="text-gray-500">Selecione uma jornada ativa.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects?.map((project) => (
            <div 
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FolderOpen size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
                  <p className="text-sm text-gray-500">
                    {project._count?.dayTemplates || 0} atividades
                  </p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
            </div>
          ))}
          {projects?.length === 0 && <p className="col-span-full text-center text-gray-400">Nenhum projeto encontrado.</p>}
        </div>
      </div>
    );
  }

  // === TELA 2: LISTA DE TAREFAS ===
  return (
    <div className="p-6 max-w-4xl mx-auto animate-in slide-in-from-right duration-500">
      <button 
        onClick={() => setSelectedProjectId(null)}
        className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors group"
      >
        <div className="p-1 rounded-full group-hover:bg-blue-50 mr-2"><ArrowLeft size={20} /></div>
        <span className="font-medium">Voltar para Projetos</span>
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{activeProject?.name || 'Projeto'}</h1>
        <p className="text-gray-500">Cronograma de atividades</p>
      </div>

      {loadingTasks ? (
        <div className="text-center py-10 text-gray-400">Carregando jornada...</div>
      ) : (
        <div className="space-y-4">
          {journeyData?.journey.map((task) => {
            const taskDate = parseISO(task.date);
            const isTodayDate = isToday(taskDate);
            const isFutureDate = isFuture(taskDate) && !isTodayDate;
            const isPastDate = isPast(taskDate) && !isTodayDate;
            
            const isCompleted = task.status === 'APROVADO';
            const isLocked = isFutureDate; 
            const isExpired = isPastDate && !isCompleted;
            
            const dateString = format(taskDate, "dd 'de' MMMM", { locale: ptBR });
            
            let containerClass = 'bg-white border-blue-100 shadow-sm hover:shadow-md cursor-pointer';
            let iconClass = 'bg-blue-50 border-blue-100 text-blue-600';
            let textClass = 'text-blue-600';
            let statusText = 'Disponível';

            if (isCompleted) {
                containerClass = 'bg-white border-green-200 shadow-sm';
                iconClass = 'bg-green-100 border-green-200 text-green-600';
                textClass = 'text-green-600';
                statusText = 'Concluído';
            } else if (isFutureDate) {
                containerClass = 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60';
                iconClass = 'bg-gray-100 border-gray-200 text-gray-400';
                textClass = 'text-gray-400';
                statusText = 'Em Breve';
            } else if (isExpired) {
                containerClass = 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-70 grayscale';
                iconClass = 'bg-slate-200 border-slate-300 text-slate-500';
                textClass = 'text-slate-500';
                statusText = 'Expirado';
            } else if (task.status === 'EM_ANALISE') {
                iconClass = 'bg-orange-100 border-orange-200 text-orange-600';
                textClass = 'text-orange-600';
                statusText = 'Em Análise';
            }

            return (
              <div 
                key={task.dayNumber}
                onClick={() => handleTaskClick(task)}
                className={`relative flex items-center p-4 rounded-xl border transition-all duration-200 ${containerClass}`}
              >
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center mr-4 shrink-0 border ${iconClass}`}>
                  {getStatusIcon(task.status, isLocked, isExpired)}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wide ${textClass}`}>
                       {statusText}
                    </span>
                    <div className="flex items-center text-xs font-medium text-gray-400">
                        <Calendar size={12} className="mr-1"/>
                        {dateString}
                    </div>
                  </div>

                  <h3 className={`text-base font-semibold truncate ${isLocked || isExpired ? 'text-gray-500' : 'text-gray-800'}`}>
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                      {(isLocked || isExpired) && !isCompleted ? 'Atividade indisponível' : task.description}
                  </p>
                </div>

                {(!isLocked && !isExpired || isCompleted) && (
                    <div className="text-gray-300"><ChevronRight size={20} /></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
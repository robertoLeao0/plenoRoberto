import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Lock, Unlock, Clock, FileText, ChevronRight, Calendar 
} from 'lucide-react';
// IMPORTANTE: Ajuste a quantidade de "../" até achar a pasta services
// Se estiver em src/pages/user/tasks/index.tsx, são 3 níveis:
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
  const [now] = useState(new Date());

  // Busca tarefas da API
  const { data: tasks, isLoading } = useQuery<MyTask[]>({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/my-tasks');
      return response.data;
    },
    refetchInterval: 60000, // Atualiza a cada 1 min
  });

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">Carregando jornada...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Minha Jornada</h1>
        <p className="text-gray-500">Acompanhe suas atividades diárias.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Caso a lista esteja vazia */}
        {(!tasks || tasks.length === 0) && (
           <div className="col-span-full py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
              <p>Nenhuma tarefa atribuída à sua organização ainda.</p>
           </div>
        )}

        {tasks?.map((task) => {
          const startDate = new Date(task.startAt);
          // Lógica: Se a data de início for maior que AGORA, está BLOQUEADO
          const isLocked = startDate > now;
          
          const dateString = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
          const timeString = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          return (
            <div 
              key={task.id} 
              className={`
                relative rounded-2xl p-6 transition-all duration-300 border flex flex-col justify-between min-h-[180px]
                ${isLocked 
                  ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-80' 
                  : 'bg-white border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer group'
                }
              `}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                   <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${isLocked ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                      {task.project.name}
                   </span>
                   <div className={`p-2 rounded-full ${isLocked ? 'bg-gray-200 text-gray-400' : 'bg-green-100 text-green-600'}`}>
                      {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                   </div>
                </div>

                <h3 className={`font-bold text-lg mb-2 ${isLocked ? 'text-gray-500' : 'text-gray-800 group-hover:text-blue-700'}`}>
                  {task.title}
                </h3>
              </div>

              {/* RODAPÉ DO CARD */}
              {isLocked ? (
                // === BLOQUEADO ===
                <div className="mt-4 pt-4 border-t border-gray-200">
                   <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Clock size={16} />
                      <span className="text-sm font-medium">Disponível em:</span>
                   </div>
                   <p className="text-sm font-bold text-gray-700 pl-6">
                      {dateString} às {timeString}
                   </p>
                </div>
              ) : (
                // === LIBERADO ===
                <div className="mt-4 space-y-3">
                   <p className="text-sm text-gray-500 line-clamp-2">
                      Toque para ver os detalhes e enviar sua comprovação.
                   </p>
                   <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-blue-600">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <FileText size={14}/> Acessar
                      </span>
                      <ChevronRight size={18}/>
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
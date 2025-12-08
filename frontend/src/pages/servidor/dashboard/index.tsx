import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
// Se você tiver um componente de Layout, mantenha o import dele, 
// mas geralmente o Layout já vem do DashboardWrapper no App.tsx.

interface Task {
  id: number;
  nome: string;
  descricao?: string;
  dataPrevista: string;
  ativo: boolean;
}

export default function ServidorDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca as tarefas ATIVAS do Backend
  const fetchTasks = async () => {
    try {
      // Importante: Usando o /api/tasks que configuramos
      const response = await fetch('http://localhost:3000/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar suas tarefas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Formata a data para ficar legível (Ex: 08/12/2025)
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 text-lg animate-pulse">Carregando sua jornada...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Minha Jornada</h1>
        <p className="text-gray-500 mt-2">
          Aqui estão as tarefas liberadas pelo administrador para você.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-medium text-gray-800">Tudo limpo!</h3>
          <p className="text-gray-500 mt-2">Nenhuma tarefa pendente para hoje.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
            >
              {/* Faixa lateral colorida */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>

              <div className="flex justify-between items-start mb-3 pl-2">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                  Tarefa
                </span>
                <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100">
                  📅 {formatDate(task.dataPrevista)}
                </span>
              </div>

              <div className="pl-2">
                <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">
                  {task.nome}
                </h3>
                
                <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                  {task.descricao || 'Sem descrição adicional.'}
                </p>

                <button 
                  className="w-full py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors text-sm flex items-center justify-center gap-2"
                  onClick={() => toast.info('Em breve: funcionalidade de concluir tarefa!')}
                >
                  <span>Ver Detalhes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
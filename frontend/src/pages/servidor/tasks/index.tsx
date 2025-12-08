import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface Task {
  id: number;
  nome: string;
  descricao?: string;
  dataPrevista: string;
  ativo: boolean;
}

export default function ServerTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca apenas as tarefas ATIVAS (rota padrão /api/tasks)
  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      toast.error('Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(date);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando jornada...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Minha Jornada</h1>
        <p className="text-gray-500 mt-2">Confira suas atividades programadas.</p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">Nenhuma tarefa ativa no momento. 🎉</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-3">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Tarefa</span>
                <span className="text-xs text-gray-400 font-medium">{formatDate(task.dataPrevista)}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{task.nome}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{task.descricao || 'Sem descrição.'}</p>
              
              <div className="pt-4 border-t border-gray-100 mt-auto">
                 <span className="text-xs font-medium text-gray-400">Status: Pendente</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
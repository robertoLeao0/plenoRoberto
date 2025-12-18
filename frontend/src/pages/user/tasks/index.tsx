import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Task {
  id: number;
  nome: string;
  descricao?: string;
  dataPrevista: string;
  ativo: boolean;
  status: 'PENDENTE' | 'CONCLUIDA' | 'ATRASADA';
}

export default function UserTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await api.get('/tasks'); 
        setTasks(response.data);
      } catch (error) {
        console.error("Erro ao carregar tarefas", error);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Minhas Tarefas</h1>
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarefa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.dataPrevista).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pendente
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900">Detalhes</button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                 <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        Nenhuma tarefa encontrada.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
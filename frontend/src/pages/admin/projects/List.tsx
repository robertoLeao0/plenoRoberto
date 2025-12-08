import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface Task {
  id: number;
  nome: string;
  dataPrevista: string;
  ativo: boolean;
}

export default function ProjectsList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'inactive'>('active');
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  
  // --- NOVOS STATES PARA OS FILTROS ---
  const [busca, setBusca] = useState('');
  const [dataFiltro, setDataFiltro] = useState('');

  // States do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState<number | null>(null);

  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tasks/admin');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      toast.error('Erro ao carregar lista.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const novoStatus = !task.ativo;
    try {
      await fetch(`http://localhost:3000/api/tasks/${task.id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoStatus }) 
      });
      toast.success(novoStatus ? 'Tarefa reativada! 🚀' : 'Tarefa inativada. 💤');
      fetchTasks();
      setMenuOpenId(null);
    } catch (error) {
      toast.error('Erro ao alterar status.');
    }
  };

  const confirmarExclusao = (id: number) => {
    setTarefaParaExcluir(id);
    setModalAberto(true);
    setMenuOpenId(null);
  };

  const executarExclusaoReal = async () => {
    if (tarefaParaExcluir === null) return;
    try {
      await fetch(`http://localhost:3000/api/tasks/${tarefaParaExcluir}`, { method: 'DELETE' });
      toast.success('Tarefa excluída permanentemente! 🗑️');
      fetchTasks();
    } catch (error) {
      toast.error('Erro ao excluir tarefa.');
    } finally {
      setModalAberto(false);
      setTarefaParaExcluir(null);
    }
  };

  // --- LÓGICA DE FILTRAGEM ATUALIZADA ---
  const filteredTasks = tasks.filter(task => {
    // 1. Filtro da Aba (Ativo/Inativo)
    const matchesTab = filter === 'active' ? task.ativo === true : task.ativo === false;

    // 2. Filtro de Texto (Nome)
    const matchesBusca = task.nome.toLowerCase().includes(busca.toLowerCase());

    // 3. Filtro de Data (Se tiver data selecionada)
    let matchesData = true;
    if (dataFiltro) {
      // Pega apenas a parte YYYY-MM-DD da data da tarefa para comparar
      const taskDate = task.dataPrevista.split('T')[0]; 
      matchesData = taskDate === dataFiltro;
    }

    return matchesTab && matchesBusca && matchesData;
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="p-6" onClick={() => setMenuOpenId(null)}>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Tarefas</h1>
          <p className="text-gray-500">Gerencie suas tarefas diárias.</p>
        </div>
        <Link to="create" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium">
          + Nova Tarefa
        </Link>
      </div>

      {/* ABAS */}
      <div className="flex space-x-6 border-b mb-6">
        <button onClick={(e) => { e.stopPropagation(); setFilter('active'); }} className={`pb-2 px-1 ${filter === 'active' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>
          Ativos ({tasks.filter(t => t.ativo).length})
        </button>
        <button onClick={(e) => { e.stopPropagation(); setFilter('inactive'); }} className={`pb-2 px-1 ${filter === 'inactive' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>
          Inativos ({tasks.filter(t => !t.ativo).length})
        </button>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Buscar por nome</label>
          <input 
            type="text" 
            placeholder="Digite o nome da tarefa..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Filtrar por Data</label>
          <div className="flex gap-2">
            <input 
              type="date" 
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
            {dataFiltro && (
              <button 
                onClick={() => setDataFiltro('')}
                className="text-gray-500 hover:text-red-600 text-sm font-medium px-2"
                title="Limpar data"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-lg shadow overflow-visible min-h-[300px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Prevista</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Carregando...</td></tr>
            ) : filteredTasks.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Nenhuma tarefa encontrada com esses filtros.</td></tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(task.dataPrevista).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {task.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === task.id ? null : task.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 text-xl font-bold px-2"
                    >
                      ⋮
                    </button>
                    
                    {menuOpenId === task.id && (
                      <div className="absolute right-8 top-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-50">
                        <button onClick={() => navigate(`edit/${task.id}`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Editar
                        </button>

                        {task.ativo ? (
                          <button 
                            onClick={() => handleToggleStatus(task)}
                            className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-gray-100"
                          >
                            Inativar
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleToggleStatus(task)}
                              className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                            >
                              Ativar
                            </button>
                            <button 
                              onClick={() => confirmarExclusao(task.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t"
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir permanentemente?</h3>
            <p className="text-gray-500 mb-6">
              Esta tarefa será apagada do banco de dados e não poderá ser recuperada.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={executarExclusaoReal} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
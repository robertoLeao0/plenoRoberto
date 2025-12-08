import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateTask() {
  const navigate = useNavigate();
  
  // 1. Estados para guardar os dados do formulário
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [ativo, setAtivo] = useState(true); // Começa ativo (true)
  const [loading, setLoading] = useState(false);

  // 2. Função que envia os dados para o Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      nome,
      descricao,
      dataPrevista: new Date(dataPrevista).toISOString(), // Formata a data para o banco
      ativo
    };

    try {
      // --- CORREÇÃO PRINCIPAL AQUI: Adicionado /api na URL ---
      const response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Tarefa criada com sucesso!');
        // Volta para a lista de tarefas
        navigate('/dashboard/admin/projects'); 
      } else {
        alert('Erro ao criar tarefa. Verifique o console.');
        const errorData = await response.json();
        console.error('Erro detalhado:', errorData);
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      alert('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md mt-6">
      {/* Cabeçalho */}
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Nova Tarefa</h2>
        <p className="text-gray-500 mt-1">
          Crie uma nova tarefa e adicione uma descrição.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Campo: Nome da Tarefa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Tarefa
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Atualizar relatório financeiro"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Campo: Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição da Tarefa
          </label>
          <textarea
            rows={4}
            placeholder="Descreva os detalhes do que precisa ser feito..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Campo: Data Prevista e Switch Ativo/Inativo na mesma linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Prevista
            </label>
            <input
              type="date"
              required
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Switch / Interruptor */}
          <div className="flex flex-col justify-end">
             <label className="block text-sm font-medium text-gray-700 mb-2">
              Status da Tarefa
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              {/* O visual do botão */}
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              
              {/* Texto ao lado do switch */}
              <span className="ml-3 text-sm font-medium text-gray-900">
                {ativo ? 'Ativo' : 'Inativo'}
              </span>
            </label>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end pt-6 border-t space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)} // Volta para a página anterior
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 bg-white font-medium"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Salvando...' : 'Criar Tarefa'}
          </button>
        </div>

      </form>
    </div>
  );
}
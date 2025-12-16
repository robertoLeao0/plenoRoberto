import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

interface Organization {
  id: string;
  name: string;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Estados do Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Estados para Múltiplas Organizações
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);

  // 1. Carrega todas as organizações ativas ao abrir a tela
  useEffect(() => {
    api.get('/organizations?active=true')
      .then(res => setAllOrgs(res.data))
      .catch(err => console.error("Erro ao carregar organizações", err));
  }, []);

  // 2. Função para selecionar/desmarcar organizações
  const toggleOrg = (id: string) => {
    if (selectedOrgIds.includes(id)) {
      setSelectedOrgIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedOrgIds(prev => [...prev, id]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedOrgIds.length === 0) {
      return toast.warn('Por favor, selecione pelo menos uma organização.');
    }

    setLoading(true);
    try {
      // Envia o array de IDs para o backend
      await api.post('/projects', {
        name,
        description,
        startDate,
        endDate,
        organizationIds: selectedOrgIds, // <--- Aqui vai a lista
      });
      
      toast.success('Projeto criado com sucesso!');
      navigate('/dashboard/admin/projects');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar projeto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Botão Voltar */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-500 mb-6 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
           <Plus size={24} />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Novo Projeto (Jornada)</h1>
           <p className="text-gray-500 text-sm">Crie uma nova jornada e vincule às organizações.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
        
        {/* === SELEÇÃO MÚLTIPLA DE ORGANIZAÇÕES === */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Organizações Participantes <span className="text-red-500">*</span>
          </label>
          
          <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
            {allOrgs.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma organização ativa encontrada.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allOrgs.map(org => (
                    <label 
                        key={org.id} 
                        className={`
                            flex items-center p-3 rounded-lg border cursor-pointer transition-all select-none
                            ${selectedOrgIds.includes(org.id) 
                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                                : 'bg-white border-gray-200 hover:border-blue-300'}
                        `}
                    >
                        <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mr-3 accent-blue-600"
                        checked={selectedOrgIds.includes(org.id)}
                        onChange={() => toggleOrg(org.id)}
                        />
                        <span className="text-sm text-gray-700 font-medium">{org.name}</span>
                    </label>
                    ))}
                </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Você pode selecionar várias empresas ou prefeituras para participarem desta mesma jornada.
          </p>
        </div>

        {/* NOME DO PROJETO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Jornada</label>
          <input 
            required
            type="text" 
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Ex: Jornada de Liderança 2025"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* DATAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim (Previsão)</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* DESCRIÇÃO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea 
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Detalhes sobre o objetivo desta jornada..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* RODAPÉ DO FORM */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? 'Criando...' : 'Criar Projeto'}
          </button>
        </div>

      </form>
    </div>
  );
}
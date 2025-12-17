import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Building2 } from 'lucide-react';
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
  
  // Múltiplas Organizações (Array de strings)
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]); // Array

  useEffect(() => {
    api.get('/organizations?active=true')
      .then((res: any) => setAllOrgs(res.data))
      .catch((err: any) => {
        console.error(err);
        toast.error("Erro ao carregar lista de organizações.");
      });
  }, []);

  // Função para marcar/desmarcar várias
  const toggleOrg = (id: string) => {
    setSelectedOrgIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return toast.warn('O nome do projeto é obrigatório.');
    if (selectedOrgIds.length === 0) return toast.warn('Selecione pelo menos uma organização.');

    setLoading(true);

    try {
      const formattedStart = startDate ? new Date(startDate).toISOString() : null;
      const formattedEnd = endDate ? new Date(endDate).toISOString() : null;

      // ATENÇÃO: Enviando "organizationIds" (plural/lista)
      const payload = {
        name,
        description,
        startDate: formattedStart,
        endDate: formattedEnd,
        organizationIds: selectedOrgIds, 
      };

      console.log("Enviando Payload Múltiplo:", payload);

      await api.post('/projects', payload);
      
      toast.success('Projeto criado com sucesso!');
      setTimeout(() => navigate('/dashboard/admin/projects'), 1000);

    } catch (err: any) {
      console.error("Erro detalhado:", err);
      
      const serverError = err.response?.data?.message 
        || JSON.stringify(err.response?.data)
        || 'Erro ao criar projeto.';
        
      // Se der erro 400 aqui, é porque o Backend ainda não foi atualizado
      toast.error(`Erro do Servidor: ${serverError}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-500 mb-6 hover:text-blue-600 transition-colors font-medium"
      >
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
           <Plus size={28} />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Novo Projeto (Jornada)</h1>
           <p className="text-gray-500 text-sm mt-1">Crie uma nova jornada para múltiplas organizações.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Seleção Múltipla */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Building2 size={16} className="text-gray-400"/>
            Organizações Participantes <span className="text-red-500">*</span>
          </label>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
            {allOrgs.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic">Nenhuma organização encontrada.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allOrgs.map(org => {
                      const isSelected = selectedOrgIds.includes(org.id);
                      return (
                        <div 
                            key={org.id} 
                            onClick={() => toggleOrg(org.id)}
                            className={`
                                relative flex items-center p-3 rounded-lg border cursor-pointer transition-all select-none group
                                ${isSelected 
                                    ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' 
                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}
                            `}
                        >
                            <div className={`
                              w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors
                              ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}
                            `}>
                                {isSelected && <Check size={14} className="text-white" />}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                              {org.name}
                            </span>
                        </div>
                      );
                    })}
                </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-1">
            * Selecione todas as empresas que participarão desta jornada.
          </p>
        </div>

        <hr className="border-gray-100" />

        {/* Inputs de Texto e Data (Iguais ao anterior) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Jornada <span className="text-red-500">*</span></label>
          <input required type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Jornada 2025" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Data de Início</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Previsão de Fim</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
          <textarea rows={4} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Detalhes..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50">
            {loading ? 'Salvando...' : 'Criar Projeto'}
          </button>
        </div>

      </form>
    </div>
  );
}
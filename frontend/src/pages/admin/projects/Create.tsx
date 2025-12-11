import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaSave, FaFolderPlus } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

export default function AdminProjectCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Busca organizações para preencher o Select
  const { data: organizations } = useQuery({
    queryKey: ['organizations-list-simple'],
    queryFn: async () => (await api.get('/organizations')).data
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    organizationId: '',
    totalDays: 21,
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.organizationId || !formData.startDate) {
      return toast.warn('Preencha os campos obrigatórios.');
    }

    setLoading(true);
    try {
      await api.post('/projects', formData);
      toast.success('Projeto criado com sucesso!');
      navigate('/dashboard/admin/projects');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar projeto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition">
          <FaArrowLeft className="text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Novo Projeto (Jornada)</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md border border-slate-200 space-y-6">
        
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
          <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <FaFolderPlus size={24} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-800">Dados da Jornada</h3>
            <p className="text-sm text-slate-500">Configure a duração e a organização responsável.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Organização */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Organização (Cliente)</label>
            <select
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={formData.organizationId}
              onChange={e => setFormData({...formData, organizationId: e.target.value})}
              required
            >
              <option value="">Selecione uma organização...</option>
              {Array.isArray(organizations) && organizations.map((org: any) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          {/* Nome */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Projeto</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Jornada de Integração 2025"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          {/* Datas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.startDate}
              onChange={e => setFormData({...formData, startDate: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim (Previsão)</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.endDate}
              onChange={e => setFormData({...formData, endDate: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dias de Duração</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.totalDays}
              onChange={e => setFormData({...formData, totalDays: Number(e.target.value)})}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea
              rows={3}
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-bold disabled:opacity-50"
          >
            <FaSave />
            {loading ? 'Criando...' : 'Criar Projeto'}
          </button>
        </div>

      </form>
    </div>
  );
}
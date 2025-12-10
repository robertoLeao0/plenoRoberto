import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaSave, FaBuilding } from 'react-icons/fa';
import api from '../../../services/api';

export default function AdminOrganizationCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    type: 'CUSTOMER', // Padrão é cliente
    active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.warn('Nome é obrigatório.');

    setLoading(true);
    try {
      await api.post('/organizations', formData);
      toast.success('Organização cadastrada com sucesso!');
      navigate('/dashboard/admin/organizations');
    } catch (error) {
      toast.error('Erro ao cadastrar organização.');
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
        <h1 className="text-2xl font-bold text-slate-800">Nova Organização</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md border border-slate-200 space-y-6">
        
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
          <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <FaBuilding size={24} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-800">Dados da Entidade</h3>
            <p className="text-sm text-slate-500">Cadastre prefeituras ou empresas parceiras.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Organização</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Prefeitura de Cajamar"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Localização (Cidade/UF)</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: São Paulo - SP"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="CUSTOMER">Cliente (Prefeitura/Empresa)</option>
              <option value="SYSTEM">Sistema Interno (Admin)</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea
              rows={3}
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Informações adicionais..."
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
            {loading ? 'Salvando...' : 'Cadastrar Organização'}
          </button>
        </div>

      </form>
    </div>
  );
}
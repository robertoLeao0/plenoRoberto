import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaBuilding, FaSearch, FaToggleOn, FaToggleOff, FaTrash } from 'react-icons/fa';
import api from '../../../services/api';

interface Organization {
  id: string;
  name: string;
  location: string;
  type: 'SYSTEM' | 'CUSTOMER';
  active: boolean;
  createdAt: string;
}

export default function OrganizationsList() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/organizations');
      setOrgs(response.data);
    } catch (error) {
      toast.error('Erro ao carregar organizações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleToggleStatus = async (org: Organization) => {
    try {
      await api.patch(`/organizations/${org.id}`, { active: !org.active });
      toast.success('Status atualizado!');
      fetchOrgs();
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Organizações</h1>
          <p className="text-slate-500 mt-1">Gerencie as prefeituras e empresas clientes.</p>
        </div>
        <Link 
          to="/dashboard/admin/organizations/create" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md"
        >
          + Nova Organização
        </Link>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="relative w-full">
          <FaSearch className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar organização..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Local</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500">Carregando...</td></tr>
            ) : filteredOrgs.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      <FaBuilding />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">{org.name}</div>
                      <div className="text-xs text-slate-500">Cadastro: {new Date(org.createdAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {org.location || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    org.type === 'SYSTEM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {org.type === 'SYSTEM' ? 'Sistema (Admin)' : 'Cliente'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleToggleStatus(org)} className="focus:outline-none">
                    {org.active 
                      ? <FaToggleOn size={24} className="text-green-500 hover:text-green-600" /> 
                      : <FaToggleOff size={24} className="text-slate-400 hover:text-slate-600" />
                    }
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Você pode adicionar edição aqui depois */}
                  <span className="text-slate-400 cursor-not-allowed">Editar</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
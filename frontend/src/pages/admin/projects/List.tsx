import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaFolder, FaSearch, FaTasks, FaCalendarAlt, FaPlus } from 'react-icons/fa';
import api from '../../../services/api';

export default function AdminProjectsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  const filteredProjects = Array.isArray(projects) 
    ? projects.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando projetos...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Projetos</h1>
          <p className="text-slate-500">Gerencie as jornadas e fluxos de mensagens das organizações.</p>
        </div>
        <Link 
          to="/dashboard/admin/projects/create" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all"
        >
          <FaPlus /> Novo Projeto
        </Link>
      </div>

      {/* Busca */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-3.5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar projeto..." 
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid de Projetos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project: any) => (
          <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-full group">
            
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <FaFolder size={20} />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${project.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {project.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1" title={project.name}>
                {project.name}
              </h3>
              
              <p className="text-sm text-indigo-600 font-medium mb-3">
                {project.organization?.name || 'Sem organização'}
              </p>

              <div className="text-xs text-slate-500 space-y-1 mb-4">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt /> 
                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <FaTasks /> {project._count?.tasks ?? 0} Tarefas
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate(`/dashboard/admin/projects/${project.id}/tasks`)}
              className="w-full mt-auto py-2.5 rounded-lg border border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-50 flex items-center justify-center gap-2 transition-colors"
            >
              <FaTasks /> Gerenciar Tarefas
            </button>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            Nenhum projeto encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
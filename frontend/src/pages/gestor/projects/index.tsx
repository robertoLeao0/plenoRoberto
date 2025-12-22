import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

// Interface do Projeto
interface Project {
  id: string;
  name: string;
  status: 'active' | 'planning' | 'completed';
  deadline: string;
  teamSize: number;
  progress: number;
  description?: string;
}

export default function GestorProjetosPage() {
  
  // --- AQUI ESTÁ A MUDANÇA ---
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['gestor-projects-list'],
    queryFn: async () => {
      // Tenta buscar os dados reais
      console.log('🔍 Tentando buscar projetos na API...');
      
      // IMPORTANTE: Verifique se essa rota '/gestor/projects' existe no seu Backend.
      // Se no seu backend a rota for '/projects' ou '/users/me/projects', mude aqui!
      const { data } = await api.get<Project[]>('/gestor/projects'); 
      
      console.log('✅ Projetos recebidos:', data);
      return data;
    },
    retry: 1, // Tenta apenas 1 vez se der erro
  });

  // Função auxiliar para cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Em Andamento';
      case 'planning': return 'Planejamento';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Meus Projetos</h1>
        <p className="text-slate-500 mt-1">Gerencie o andamento e a equipe de cada iniciativa.</p>
      </header>

      {/* Exibir Erro se houver */}
      {error && (
        <div className="bg-red-50 p-4 rounded text-red-600 border border-red-200">
          Erro ao carregar projetos. Verifique o console (F12).
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-500 animate-pulse">Carregando projetos da API...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">
                    {project.name}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {project.description || 'Sem descrição definida.'}
                </p>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>Entrega: <span className="font-semibold text-slate-800">{new Date(project.deadline).toLocaleDateString()}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>Equipe: <span className="font-semibold text-slate-800">{project.teamSize} membros</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Progresso</span>
                  <span className="font-bold text-slate-700">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <button className="w-full mt-4 py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-sm transition-colors border border-slate-200">
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}

          {(!projects || projects.length === 0) && (
            <div className="col-span-full py-12 text-center bg-white rounded-lg border border-dashed border-slate-300">
              <p className="text-slate-500 text-lg">Você ainda não tem projetos ativos.</p>
              <p className="text-sm text-slate-400 mt-2">Verifique se o backend está retornando dados na rota correta.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
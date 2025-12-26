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
  
  // Busca os projetos na API
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['gestor-projects-list'],
    queryFn: async () => {
      console.log('🔍 [FRONTEND] Buscando projetos na rota /projects...');
      
      // CORREÇÃO PRINCIPAL: Chamando a rota padrão '/projects'
      // O Backend vai decidir o que retornar baseado no token do usuário.
      const { data } = await api.get<Project[]>('/projects'); 
      
      console.log('✅ [FRONTEND] Projetos recebidos:', data);
      return data;
    },
    retry: 1, // Tenta apenas 1 vez se der erro para não flodar o console
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
        <div className="bg-red-50 p-4 rounded text-red-600 border border-red-200 flex flex-col gap-2">
          <strong>Erro ao carregar projetos.</strong>
          <span className="text-sm">Verifique se você está logado corretamente e se o backend está rodando.</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[1, 2, 3].map(i => (
             <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
           ))}
        </div>
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
                    <span>Equipe: <span className="font-semibold text-slate-800">{project.teamSize || 0} membros</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Progresso</span>
                  <span className="font-bold text-slate-700">{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
                
                <button className="w-full mt-4 py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-sm transition-colors border border-slate-200 cursor-pointer">
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}

          {(!projects || projects.length === 0) && !error && (
            <div className="col-span-full py-12 text-center bg-white rounded-lg border border-dashed border-slate-300">
              <p className="text-slate-500 text-lg">Você ainda não tem projetos ativos nesta organização.</p>
              <p className="text-sm text-slate-400 mt-2">Se você acabou de ser adicionado, tente sair e logar novamente.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
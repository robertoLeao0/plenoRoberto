import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Image,
  ChevronDown, ChevronRight, AlertTriangle, X
} from 'lucide-react';
import api from '../../../services/api'; // Ajuste o caminho conforme sua estrutura
import { toast } from 'react-toastify';


const getMediaUrl = (path: any) => {
  if (!path) return '';
  let cleanPath = path;

  // Limpa formato JSON ["path"] ou "path"
  if (typeof path === 'string' && (path.startsWith('[') || path.startsWith('"'))) {
    try {
      const parsed = JSON.parse(path);
      cleanPath = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e) {
      cleanPath = path.replace(/[\[\]"']/g, '');
    }
  }

  // Garante o prefixo correto para o backend (porta 3000)
  cleanPath = cleanPath.replace(/^\/?uploads[\\/]/, '');
  return `http://localhost:3000/uploads/${cleanPath}`;
};

export default function UserProgress() {
  const { orgId, userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados da Tela
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Estados do Modal de Rejeição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  // 1. Busca dados básicos do usuário
  const { data: user } = useQuery({
    queryKey: ['user-audit', userId],
    queryFn: async () => (await api.get(`/users/${userId}`)).data
  });

  // 2. Busca a Jornada (Projetos + Tarefas + Status)
  const { data: projects, isLoading } = useQuery({
    queryKey: ['user-jornada', userId, orgId],
    queryFn: async () => (await api.get(`/tasks/audit/user/${userId}/org/${orgId}`)).data,
    enabled: !!userId && !!orgId
  });

  // 3. Mutation para Aprovar/Reprovar
  const evaluateMutation = useMutation({
    mutationFn: async (data: { logId: string, status: 'APROVADO' | 'REJEITADO', notes?: string }) => {
      return api.patch(`/tasks/audit/${data.logId}`, data);
    },
    onSuccess: () => {
      toast.success('Avaliação registrada!');
      queryClient.invalidateQueries({ queryKey: ['user-jornada'] });
      closeModal();
    },
    onError: () => toast.error('Erro ao avaliar.')
  });

  // Funções Auxiliares
  const handleApprove = (logId: string) => {
    if (confirm('Confirmar aprovação desta tarefa? (+10 pontos)')) {
      evaluateMutation.mutate({ logId, status: 'APROVADO' });
    }
  };

  const openRejectionModal = (logId: string) => {
    setSelectedLogId(logId);
    setRejectionNote(''); // Limpa nota anterior
    setIsModalOpen(true);
  };

  const confirmRejection = () => {
    if (!selectedLogId) return;
    if (!rejectionNote.trim()) return toast.warn('Por favor, escreva o motivo da rejeição.');

    evaluateMutation.mutate({
      logId: selectedLogId,
      status: 'REJEITADO',
      notes: rejectionNote
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLogId(null);
  };

  if (isLoading) return <div className="p-10 text-center text-gray-500">Carregando jornada...</div>;

  return (
    <div className="p-6 space-y-6 relative">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Auditoria de Tarefas</h1>
          <p className="text-gray-500">Analisando: <span className="font-semibold text-blue-600">{user?.name}</span></p>
        </div>
      </div>

      {/* LISTA DE PROJETOS (ACCORDION) */}
      <div className="space-y-4">
        {projects?.length === 0 && (
          <div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500">
            Este usuário não está inscrito em nenhum projeto desta organização.
          </div>
        )}

        {projects?.map((proj: any) => (
          <div key={proj.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Cabeçalho do Projeto */}
            <div
              className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100"
              onClick={() => setExpandedProject(expandedProject === proj.id ? null : proj.id)}
            >
              <div className="flex items-center gap-3">
                {expandedProject === proj.id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                <span className="font-bold text-gray-700">{proj.name}</span>
              </div>

              {/* Contador de Pendências (Opcional) */}
              <div className="flex gap-2">
                <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-500">
                  {proj.timeline.filter((t: any) => t.status === 'EM_ANALISE').length} para analisar
                </span>
              </div>
            </div>

            {/* Lista de Tarefas (Timeline) */}
            {expandedProject === proj.id && (
              <div className="divide-y divide-gray-100">
                {proj.timeline.map((task: any) => (
                  <div key={task.dayNumber} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6">

                    {/* ESQUERDA: Info da Tarefa e Status */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                          DIA {task.dayNumber}
                        </span>
                        <h4 className="font-medium text-gray-800">{task.title}</h4>
                        {getStatusBadge(task.status)}
                      </div>

                      <p className="text-sm text-gray-500">{task.description}</p>

                      {/* Exibição da Prova (Foto) */}
                      {task.photoUrl ? (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                            <Image size={12} /> Anexo do Usuário:
                          </p>
                          <div className="relative w-40 h-40 group">
                            {/* Detecção de Vídeo vs Foto */}
                            {task.photoUrl.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                              <video
                                src={getMediaUrl(task.photoUrl)}
                                controls
                                className="w-full h-full object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <img
                                src={getMediaUrl(task.photoUrl)}
                                alt="Prova"
                                className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer group-hover:shadow-lg transition-all"
                                onClick={() => window.open(getMediaUrl(task.photoUrl), '_blank')}
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        task.status !== 'PENDENTE' && (
                          <div className="mt-2 p-3 bg-gray-100 rounded text-sm text-gray-500 italic">
                            Nenhuma imagem anexada.
                          </div>
                        )
                      )}

                      {/* Exibição da Nota de Rejeição (Se houver) */}
                      {task.notes && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                          <span className="font-bold block mb-1">Feedback do Gestor:</span>
                          "{task.notes}"
                        </div>
                      )}
                    </div>

                    {/* DIREITA: Botões de Ação */}
                    <div className="flex flex-col justify-center items-end min-w-[180px] gap-2 border-l border-gray-100 pl-6">

                      {/* Só mostra botões se estiver EM ANÁLISE (ou quiser permitir reavaliar PENDENTE/REJEITADO) */}
                      {(task.status === 'EM_ANALISE' || task.status === 'PENDENTE' || task.status === 'REJEITADO') && (
                        <>
                          <button
                            onClick={() => handleApprove(task.logId)}
                            disabled={!task.logId} // Só pode aprovar se o usuário já enviou algo (logId existe)
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={16} /> Aprovar
                          </button>

                          <button
                            onClick={() => openRejectionModal(task.logId)}
                            disabled={!task.logId}
                            className="w-full bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle size={16} /> Reprovar
                          </button>
                        </>
                      )}

                      {task.status === 'APROVADO' && (
                        <div className="text-center">
                          <p className="text-green-600 font-bold text-lg">+10 pts</p>
                          <p className="text-xs text-gray-400">Aprovado em {new Date(task.updatedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* === MODAL DE REJEIÇÃO === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            {/* Header Modal */}
            <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
              <h3 className="text-red-800 font-bold flex items-center gap-2">
                <AlertTriangle size={20} />
                Reprovar Tarefa
              </h3>
              <button onClick={closeModal} className="text-red-400 hover:text-red-700">
                <X size={20} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Por favor, explique ao usuário por que esta tarefa está sendo rejeitada. Ele receberá esta mensagem para corrigir o envio.
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none h-32 resize-none"
                placeholder="Ex: A foto está muito escura ou não corresponde ao desafio do dia..."
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                autoFocus
              />
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRejection}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                Confirmar Reprovação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper Visual
function getStatusBadge(status: string) {
  switch (status) {
    case 'APROVADO':
      return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Aprovado</span>;
    case 'REJEITADO':
      return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Rejeitado</span>;
    case 'EM_ANALISE':
      return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1"><Clock size={10} /> Em Análise</span>;
    case 'PENDENTE':
      return <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Pendente</span>;
    default:
      return null;
  }
}
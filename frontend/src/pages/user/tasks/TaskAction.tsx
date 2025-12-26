import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, CheckCircle2, Clock, UploadCloud, Info, X, PlayCircle, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

// URL DO BACKEND (Importante para carregar imagens)
const API_BASE_URL = 'http://localhost:3000';

interface TaskDetail {
  dayNumber: number;
  title: string;
  description: string;
  points: number;
  status: 'NAO_INICIADO' | 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';
  logId?: string;
  photoUrl?: string;
  notes?: string;
}

interface UserProfile {
    id: string;
    name: string;
    points: number; // Pontos totais do usuário
}

export default function TaskActionPage() {
  const { projectId, dayNumber } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string, type: 'image' | 'video' }[]>([]);
  const [uploading, setUploading] = useState(false);

  // 1. Busca Dados do Usuário (Para mostrar os pontos no topo)
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['user-me'],
    queryFn: async () => (await api.get('/auth/me')).data
  });

  // 2. Busca Detalhes da Tarefa
  const { data: task, isLoading } = useQuery<TaskDetail>({
    queryKey: ['task-detail', projectId, dayNumber],
    queryFn: async () => {
        if(!user?.id) return null;
        const response = await api.get(`/projects/${projectId}/users/${user.id}/tasks/${dayNumber}/status`);
        return response.data;
    },
    enabled: !!projectId && !!dayNumber && !!user?.id
  });

  // --- CORREÇÃO DAS MÍDIAS (FOTOS/VÍDEOS) ---
  const getSavedMedia = () => {
    if (!task?.photoUrl) return [];
    let list = [];
    try {
        const parsed = JSON.parse(task.photoUrl);
        list = Array.isArray(parsed) ? parsed : [task.photoUrl];
    } catch (e) {
        list = [task.photoUrl];
    }
    // Adiciona o localhost:3000 se faltar
    return list.map(url => url.startsWith('http') ? url : `${API_BASE_URL}${url}`);
  };

  const savedMedia = getSavedMedia();

  // Envio Múltiplo
  const submitMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const formData = new FormData();
      formData.append('dayNumber', String(dayNumber));
      if (notes) formData.append('notes', notes);
      selectedFiles.forEach((file) => formData.append('files', file));

      await api.post(`/projects/${projectId}/tasks/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Atividade enviada!');
      queryClient.invalidateQueries({ queryKey: ['project-journey'] });
      queryClient.invalidateQueries({ queryKey: ['task-detail'] });
      queryClient.invalidateQueries({ queryKey: ['user-me'] }); // Atualiza pontos
      navigate('/dashboard/user/tarefas', { state: { openProject: projectId } });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar.');
      setUploading(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
      const newPreviews = filesArr.map(file => ({
          url: URL.createObjectURL(file),
          type: file.type.startsWith('video') ? 'video' : 'image'
      })) as { url: string, type: 'image' | 'video' }[];
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Carregando...</div>;
  if (!task) return <div className="p-10 text-center text-red-500">Erro.</div>;

  const isCompleted = task.status === 'APROVADO';
  const isPending = task.status === 'EM_ANALISE';
  const userPoints = user?.points || 0;
  
  // Exemplo de Barra de Progresso (Baseado em Níveis de 100 pontos ou meta fixa)
  // Vamos supor que cada nível são 100 pontos para dar efeito visual
  const progressPercent = (userPoints % 100); 

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* --- HEADER COM PONTOS E PROGRESSO --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/dashboard/user/tarefas', { state: { openProject: projectId } })} 
                className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
            >
            <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 hidden md:block">Dia {task.dayNumber}</h1>
        </div>

        {/* ÁREA DE PONTOS (NOVO) */}
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meus Pontos</span>
                <div className="flex items-center gap-1 text-blue-600 font-black text-xl">
                    <Trophy size={18} />
                    {userPoints}
                </div>
            </div>
            {/* Barra de Progresso Visual */}
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
      </div>

      <div className="flex-1 p-6 pb-24 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Card Principal */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <div className="flex items-start justify-between mb-4">
             <div className="flex items-center gap-3">
                {isCompleted ? <CheckCircle2 className="text-green-500" size={28} /> :
                 isPending ? <Clock className="text-orange-500" size={28} /> :
                 <div className="h-4 w-4 rounded-full bg-blue-600 shrink-0" />}
                <h2 className="text-xl font-bold text-slate-800 leading-tight">{task.title}</h2>
             </div>
             <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Até 25 Pontos
             </span>
          </div>
          <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{task.description}</div>
        </div>

        {/* --- CORREÇÃO VISUAL: GALERIA DE EVIDÊNCIAS JÁ ENVIADAS --- */}
        {(isPending || isCompleted) && savedMedia.length > 0 && (
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Suas Evidências:</h3>
                <div className="grid grid-cols-2 gap-2">
                    {savedMedia.map((url, idx) => {
                        const isVideo = url.match(/\.(mp4|webm|mov)$/i);
                        return (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black">
                                {isVideo ? (
                                    <video src={url} controls className="w-full h-full object-contain" />
                                ) : (
                                    <img src={url} alt="Evidência" className="w-full h-full object-cover" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Status de Análise */}
        {isPending && (
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-3 text-orange-700 mb-6">
                <Clock size={20} />
                <span className="font-medium">Sua atividade está em análise.</span>
            </div>
        )}

        {/* Formulário de Envio */}
        {!isCompleted && !isPending && (
          <div className="space-y-5">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-800">
                <Info size={20} className="shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-bold">Pontuação:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>📸 Com Foto/Vídeo: <span className="font-bold">25 Pontos</span></li>
                        <li>📝 Só Texto: <span className="font-bold">10 Pontos</span></li>
                    </ul>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Camera size={18} /> Galeria (Fotos e Vídeos)
                 </h3>
                 
                 {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {previews.map((file, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                {file.type === 'video' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-black/10">
                                        <PlayCircle size={32} className="text-white" />
                                    </div>
                                ) : (
                                    <img src={file.url} alt="Preview" className="w-full h-full object-cover" />
                                )}
                                <button 
                                    onClick={() => removeFile(idx)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                 )}

                 <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer bg-blue-50/50 hover:bg-blue-50 transition-colors">
                    <div className="flex flex-col items-center justify-center text-blue-400">
                        <UploadCloud size={32} className="mb-2" />
                        <p className="text-sm font-medium">Adicionar Fotos ou Vídeos</p>
                    </div>
                    <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
                 </label>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <label className="font-semibold text-slate-800 mb-2 block text-sm">Comentário (Opcional)</label>
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 className="w-full p-3 rounded-xl border border-slate-200 outline-none resize-none text-sm"
                 placeholder="Como foi a experiência?"
                 rows={3}
               />
            </div>

            <button
                onClick={() => submitMutation.mutate()}
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
            >
                {uploading ? 'Enviando...' : <><CheckCircle2 size={20} /> Enviar Atividade</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
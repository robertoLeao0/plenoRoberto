import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Camera, CheckCircle2, Clock, UploadCloud,
  Info, X, PlayCircle, Trophy, CheckSquare, Check
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const API_BASE_URL = 'http://localhost:3000';

interface ChecklistItem {
  id: string;
  text: string;
}

interface TaskDetail {
  dayNumber: number;
  title: string;
  description: string;
  points: number;
  status: 'NAO_INICIADO' | 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';
  logId?: string;
  photoUrl?: string;
  notes?: string;
  checklist?: ChecklistItem[];
}

interface UserProfile {
  id: string;
  name: string;
  points: number;
}

export default function TaskActionPage() {
  const { projectId, dayNumber } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string, type: 'image' | 'video' }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Estado para controlar a checklist marcada pelo usuário
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // 1. Busca Dados do Usuário
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['user-me'],
    queryFn: async () => (await api.get('/auth/me')).data
  });

  // 2. Busca Detalhes da Tarefa
  const { data: task, isLoading } = useQuery<TaskDetail>({
    queryKey: ['task-detail', projectId, dayNumber],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await api.get(`/projects/${projectId}/users/${user.id}/tasks/${dayNumber}/status`);
      return response.data;
    },
    enabled: !!projectId && !!dayNumber && !!user?.id
  });

  // Lógica de validação da Checklist
  const toggleCheck = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Verifica se todos os itens da checklist que vieram do banco foram marcados
  const allChecked = task?.checklist?.every(item => checkedItems[item.id]) ?? true;

  // Lógica de Pontuação Dinâmica
  const hasFiles = selectedFiles.length > 0;
  const currentPotentialPoints = hasFiles ? 25 : 10;

  const getSavedMedia = () => {
    if (!task?.photoUrl) return [];
    let list = [];
    try {
      const parsed = JSON.parse(task.photoUrl);
      list = Array.isArray(parsed) ? parsed : [task.photoUrl];
    } catch (e) {
      list = [task.photoUrl];
    }
    return list.map(url => url.startsWith('http') ? url : `${API_BASE_URL}${url}`);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const formData = new FormData();
      formData.append('dayNumber', String(dayNumber));
      if (notes) formData.append('notes', notes);
      selectedFiles.forEach((file) => formData.append('files', file));
      // Adiciona a pontuação final calculada ao payload (garantia frontend)
      formData.append('pointsEarned', String(currentPotentialPoints));

      await api.post(`/projects/${projectId}/tasks/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.info("Tarefa enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['user-jornada'] });
      navigate(-1);
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

  if (isLoading) return <div className="p-10 text-center text-slate-500 font-medium">Carregando detalhes...</div>;
  if (!task) return <div className="p-10 text-center text-red-500">Atividade não encontrada.</div>;

  const isCompleted = task.status === 'APROVADO';
  const isPending = task.status === 'EM_ANALISE';
  const userPoints = user?.points || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/user/tarefas', { state: { openProject: projectId } })}
            className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score Total</span>
            <div className="flex items-center gap-1 text-blue-600 font-black text-xl">
              <Trophy size={18} className="text-amber-500" />
              {userPoints}
            </div>
          </div>
        </div> */}
      </div>

      <div className="flex-1 p-6 pb-24 max-w-2xl mx-auto w-full">

        {/* REGRAS DE PONTUAÇÃO */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 flex gap-3 items-start animate-in fade-in duration-500">
          <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-blue-900 font-bold text-sm">Regras de Pontuação</h4>
            <p className="text-blue-800/80 text-xs mt-1 leading-relaxed">
              Marque todos os itens da <b>Checklist</b> para ganhar <b>10 pontos</b>.
              Ao anexar <b>fotos ou vídeos</b>, sua recompensa sobe para <b>25 pontos</b>!
            </p>
          </div>
        </div>

        {/* CARD INFORMATIVO */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {isCompleted ? <CheckCircle2 className="text-green-500" size={28} /> :
                isPending ? <Clock className="text-orange-500" size={28} /> :
                  <div className="h-5 w-5 rounded-full bg-blue-600 animate-pulse shadow-md" />}
              <h2 className="text-xl font-extrabold text-slate-800">{task.title}</h2>
            </div>

            {/* BADGE DE PONTOS DINÂMICO */}
            <div className="flex flex-col items-end">
              <span className={`transition-all duration-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${hasFiles ? 'bg-green-100 text-green-700 scale-110 shadow-sm' : 'bg-blue-50 text-blue-700'
                }`}>
                +{currentPotentialPoints} PTS
              </span>
              {hasFiles && <span className="text-[9px] text-green-600 font-bold mt-1">Bônus Ativado!</span>}
            </div>
          </div>
          <div className="text-slate-600 text-sm italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
            "{task.description}"
          </div>
        </div>

        {/* CHECKLIST INTERATIVA */}
        {!isCompleted && !isPending && task.checklist && task.checklist.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-900 uppercase">Checklist Obrigatória</h3>
              </div>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">
                {Object.values(checkedItems).filter(Boolean).length} / {task.checklist.length}
              </span>
            </div>
            <div className="p-4 space-y-2">
              {task.checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${checkedItems[item.id] ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-slate-50/50 border-transparent hover:border-indigo-200'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedItems[item.id]}
                    onChange={() => toggleCheck(item.id)}
                    className="w-5 h-5 rounded-lg text-green-600 focus:ring-green-500 cursor-pointer border-slate-300"
                  />
                  <span className={`font-semibold text-sm transition-all ${checkedItems[item.id] ? 'text-green-700 line-through opacity-60' : 'text-slate-700'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* EVIDÊNCIAS E FORMULÁRIO */}
        {!isCompleted && !isPending && (
          <div className="space-y-6">
            {/* ÁREA DE UPLOAD */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Camera size={18} className="text-blue-500" /> Capturar Evidência
              </h3>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {previews.map((file, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-blue-100 bg-slate-50">
                      {file.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                          <PlayCircle size={32} className="text-white" />
                        </div>
                      ) : (
                        <img src={file.url} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      <button onClick={() => removeFile(idx)} className="absolute top-1.5 right-1.5 bg-white text-red-500 rounded-xl p-1.5 shadow-sm">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer bg-slate-50/50 hover:bg-blue-50 transition-all">
                <UploadCloud size={32} className="text-slate-400 mb-2" />
                <p className="text-[10px] font-bold uppercase text-slate-400">Selecionar arquivos</p>
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {/* RELATÓRIO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <label className="font-bold text-slate-400 uppercase text-[10px] mb-3 block">Relatório da Missão</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border-none outline-none resize-none text-slate-700 font-medium"
                placeholder="Como foi realizar essa tarefa?"
                rows={3}
              />
            </div>

            {/* BOTÃO FINAL COM LÓGICA DE PONTOS */}
            <button
              onClick={() => submitMutation.mutate()}
              disabled={uploading || !allChecked} // 👈 Apenas estas duas travas
              className={`w-full py-5 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${!allChecked
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                }`}
            >
              {uploading ? "Enviando..." : !allChecked ? "Conclua a Checklist" : `Concluir e Ganhar ${hasFiles ? 25 : 10} PTS`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
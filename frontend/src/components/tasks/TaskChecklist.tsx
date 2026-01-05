import { CheckSquare, Check } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
}

interface TaskChecklistProps {
  items: ChecklistItem[];
  checkedItems: Record<string, boolean>; // Estado vindo da página pai
  onToggle: (id: string) => void;        // Função para atualizar o estado na pai
}

export function TaskChecklist({ items, checkedItems, onToggle }: TaskChecklistProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header do Cartão */}
      <div className="bg-indigo-50/50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <CheckSquare size={16} />
          </div>
          <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-tight">
            Sua Lista de Tarefas
          </h3>
        </div>
        {/* Contador Visual */}
        <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">
          {Object.values(checkedItems).filter(Boolean).length} / {items.length}
        </span>
      </div>

      {/* Lista de Itens */}
      <div className="p-4 space-y-2">
        {items.map((item) => (
          <label 
            key={item.id} 
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
              checkedItems[item.id] 
                ? 'bg-green-50 border-green-100' 
                : 'bg-gray-50/30 border-transparent hover:border-indigo-100 hover:bg-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={!!checkedItems[item.id]}
                onChange={() => onToggle(item.id)}
                className="peer hidden" 
              />
              
              {/* Custom Checkbox UI */}
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                checkedItems[item.id] 
                  ? 'bg-green-500 border-green-500' 
                  : 'bg-white border-gray-300 group-hover:border-indigo-400'
              }`}>
                {checkedItems[item.id] && <Check size={14} className="text-white stroke-[4px]" />}
              </div>
            </div>

            <span className={`font-bold text-sm transition-all ${
              checkedItems[item.id] 
                ? 'text-green-700 line-through opacity-50' 
                : 'text-gray-700'
            }`}>
              {item.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
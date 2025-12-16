import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FolderKanban, 
  Plug, 
  LogOut, 
  Menu, 
  X,
  Trophy,
  LifeBuoy,
  CheckSquare,
  Settings,
  UserCircle
} from 'lucide-react';

// === TIPAGEM DO USUÁRIO ===
interface User {
  id: string;
  name: string;
  email: string;
  // Garante que os tipos batem com o que vem do Banco/Login
  role: 'ADMIN' | 'GESTOR_ORGANIZACAO' | 'USUARIO';
  avatarUrl?: string | null;
  organization?: {
    name: string;
  } | null;
}

interface MainLayoutProps {
  children: React.ReactNode;
  user: User;
}

// === TIPAGEM DO MENU ===
interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  exact?: boolean; // Define se a rota deve ser exata para o botão ficar azul
}

// === DEFINIÇÃO DOS MENUS ===
// As chaves aqui (ADMIN, GESTOR_ORGANIZACAO, USUARIO) devem ser idênticas ao banco de dados
const MENUS: Record<string, MenuItem[]> = {
  ADMIN: [
    { label: 'Painel Principal', path: '/dashboard/admin', icon: LayoutDashboard, exact: true },
    { label: 'Organizações', path: '/dashboard/admin/organizations', icon: Building2 },
    { label: 'Usuários', path: '/dashboard/admin/users', icon: Users },
    { label: 'Projetos', path: '/dashboard/admin/projects', icon: FolderKanban },
    { label: 'Integrações', path: '/dashboard/admin/integrations', icon: Plug },
  ],
  GESTOR_ORGANIZACAO: [
    { label: 'Painel Gestor', path: '/dashboard/gestor', icon: LayoutDashboard, exact: true },
    { label: 'Meus Projetos', path: '/dashboard/gestor/projetos', icon: FolderKanban },
    { label: 'Minha Equipe', path: '/dashboard/gestor/equipe', icon: Users },
  ],
  USUARIO: [
    { label: 'Minha Jornada', path: '/dashboard/user', icon: LayoutDashboard, exact: true },
    { label: 'Tarefas', path: '/dashboard/user/tarefas', icon: CheckSquare },
    { label: 'Ranking', path: '/dashboard/user/ranking', icon: Trophy },
    { label: 'Suporte', path: '/dashboard/user/support', icon: LifeBuoy },
  ]
};

export default function MainLayout({ children, user }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Seleciona o menu com base no cargo do usuário logado
  const currentMenu = MENUS[user.role] || [];

  const handleLogout = () => {
    // Limpa dados de autenticação
    localStorage.removeItem('token'); 
    localStorage.removeItem('user'); // Se você salva o user também
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* === SIDEBAR (Barra Lateral) === */}
      <aside 
        className={`
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          bg-[#111827] text-white flex flex-col transition-all duration-300 shadow-xl z-20
          fixed md:relative h-full
        `}
      >
        {/* LOGO */}
        <div className="h-16 flex items-center justify-between px-6 bg-[#1f2937] border-b border-gray-700 shrink-0">
          {isSidebarOpen ? (
            <span className="text-xl font-bold tracking-wider text-white">PLENO</span>
          ) : (
            <span className="text-xl font-bold text-white">P</span>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* NAVEGAÇÃO (Lista de Menus) */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700">
          <ul className="space-y-1 px-3">
            {currentMenu.map((item) => {
              
              // Verifica se o item atual está ativo
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                    `}
                  >
                    <div className={`${!isActive && 'group-hover:text-white'} transition-colors`}>
                        <item.icon size={20} />
                    </div>
                    
                    {/* Só mostra o texto se a sidebar estiver aberta */}
                    {isSidebarOpen && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* RODAPÉ DA SIDEBAR (Config e Sair) */}
        <div className="p-3 border-t border-gray-800 bg-[#0f1522] shrink-0">
          <ul className="space-y-1">
            <li>
              <Link
                to="/dashboard/configuracoes"
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                  ${location.pathname.startsWith('/dashboard/configuracoes')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
              >
                <Settings size={20} />
                {isSidebarOpen && <span className="text-sm font-medium">Configurações</span>}
              </Link>
            </li>
            
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
              >
                <LogOut size={20} />
                {isSidebarOpen && <span className="text-sm font-medium">Sair</span>}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* === ÁREA DE CONTEÚDO PRINCIPAL === */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        {/* HEADER (Cabeçalho Superior) */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 shrink-0">
          {/* Botão de abrir/fechar sidebar */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Área do Usuário (Lado Direito) */}
          <div className="flex items-center gap-4">
            {/* Nome do Usuário */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">
                {user.name || 'Usuário'}
              </p>
              {/* Removido o cargo/organização daqui conforme solicitado */}
            </div>
            
            {/* Avatar */}
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
               {user.avatarUrl ? (
                 <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <UserCircle size={28} />
               )}
            </div>
          </div>
        </header>

        {/* CONTEÚDO DAS PÁGINAS (Children) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 w-full">
          <div className="max-w-7xl mx-auto h-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
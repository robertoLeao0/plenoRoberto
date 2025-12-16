import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useQuery } from '@tanstack/react-query'; 

// Auth
import LoginPage from './pages/auth/Login';

// Layouts
import MainLayout from './components/layouts/MainLayout'; 

// Páginas - Servidor / Usuário Comum
import ServidorDashboard from './pages/servidor/dashboard';
import ServidorRanking from './pages/servidor/ranking';
import ServidorSettings from './pages/servidor/settings';
import Support from './pages/servidor/support';
import ServerTasks from './pages/servidor/tasks';

// Páginas - Gestor
import GestorDashboard from './pages/gestor/dashboard';

// Páginas - Admin
import AdminDashboard from './pages/admin/dashboard';
import AdminUsersList from './pages/admin/users/List';
import AdminCreateUser from './pages/admin/users/Create';
import AdminProjectsList from './pages/admin/projects/List';
import AdminProjectCreate from './pages/admin/projects/Create';
import EditTask from './pages/admin/projects/Edit';
import ProjectTasks from './pages/admin/projects/Tasks';
import Integrations from './pages/admin/integrations';
import UserProfile from './pages/common/UserProfile'; 

// Páginas - Organizações e Auditoria
import OrganizationsList from './pages/admin/organizations/List';
import OrganizationDetails from './pages/admin/organizations/Details';
import UserProgress from './pages/admin/users/UserProgress';

// Serviços
import api from './services/api'; 

// Tipagem do Usuário
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'GESTOR_ORGANIZACAO' | 'USUARIO';
  avatarUrl?: string;
}

function DashboardWrapper() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    retry: false, 
  });

  if (isLoading) {
    return <div className="p-6 text-center">Carregando sistema...</div>;
  }
  
  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }
  
  // === LÓGICA DE REDIRECIONAMENTO ===
  const getDashboardPath = (role: string) => {
    switch(role) {
      case 'ADMIN': return '/dashboard/admin';
      case 'GESTOR_ORGANIZACAO': return '/dashboard/gestor';
      case 'USUARIO': return '/dashboard/servidor'; 
      default: return '/dashboard/servidor';
    }
  };

  const userBaseRoute = getDashboardPath(user.role);
  // Verifica se estamos na raiz do dashboard para redirecionar
  const isExactDashboard = window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/';

  return (
    // Passamos o objeto USER para o MainLayout
    <MainLayout user={user}>
      <Routes>
        <Route path="configuracoes" element={<UserProfile />} />

        {/* Rotas de Usuário (Antigo Servidor) */}
        <Route path="servidor" element={<ServidorDashboard />} />
        <Route path="servidor/ranking" element={<ServidorRanking />} />
        <Route path="servidor/settings" element={<ServidorSettings />} />
        <Route path="servidor/support" element={<Support />} />
        <Route path="servidor/tarefas" element={<ServerTasks />} />

        {/* Rotas de Admin */}
        <Route path="admin" element={<AdminDashboard />} />
        
        {/* Admin - Usuários */}
        <Route path="admin/users" element={<AdminUsersList />} />
        <Route path="admin/users/create" element={<AdminCreateUser />} />
        
        {/* Admin - Projetos */}
        <Route path="admin/projects" element={<AdminProjectsList />} /> 
        <Route path="admin/projects/create" element={<AdminProjectCreate />} />
        <Route path="admin/projects/edit/:id" element={<EditTask />} />
        <Route path="admin/projects/:projectId/tasks" element={<ProjectTasks />} />
        
        {/* Admin - Integrações */}
        <Route path="admin/integrations" element={<Integrations />} />

        {/* === ROTAS DE ORGANIZAÇÃO === */}
        <Route path="admin/organizations" element={<OrganizationsList />} />
        <Route path="admin/organizations/:id" element={<OrganizationDetails />} />
        
        {/* ✅ ROTA CORRIGIDA PARA A AUDITORIA/PROGRESSO DO USUÁRIO ✅ */}
        <Route path="admin/organizations/:orgId/users/:userId" element={<UserProgress />} />

        {/* Rotas de Gestor */}
        <Route path="gestor" element={<GestorDashboard />} />

        {/* Redirecionamento Automático */}
        {isExactDashboard && <Route path="/" element={<Navigate to={userBaseRoute} replace />} />}
        
      </Routes>
    </MainLayout>
  );
}

function App() {
  return (
    <>
      <ToastContainer autoClose={3000} position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/*" element={<DashboardWrapper />} /> 
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;
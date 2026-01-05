import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useQuery } from '@tanstack/react-query';

// Auth
import LoginPage from './pages/auth/Login';

// Layouts
import MainLayout from './components/layouts/MainLayout';

// Páginas - Usuário Comum
import UserDashboard from './pages/user/dashboard';
import UserRanking from './pages/user/ranking';
import UserSettings from './pages/user/settings';
import Support from './pages/user/support';
import ServerTasks from './pages/user/tasks';
import TaskActionPage from './pages/user/tasks/TaskAction';

// Páginas - Gestor
import GestorDashboard from './pages/gestor/dashboard';
import GestorProjetosPage from './pages/gestor/projects';
import GestorOrganizacaoPage from './pages/gestor/organizations';
import GestorProjectDetailsPage from './pages/gestor/projects/Details';
import GestorValidationPage from './pages/gestor/validation';
import GestorEquipePage from './pages/gestor/equipe';
import UserHistoryPage from './pages/gestor/projects/UserHistory';
import TaskValidationPage from './pages/gestor/projects/TaskValidation';

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
import ProjectDetails from './pages/admin/projects/Details';

// Páginas - Organizações e Auditoria (Admin)
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

  // Lógica de Redirecionamento Baseado no Cargo
  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'ADMIN': return '/dashboard/admin';
      case 'GESTOR_ORGANIZACAO': return '/dashboard/gestor';
      case 'USUARIO': return '/dashboard/user';
      default: return '/dashboard/user';
    }
  };

  const userBaseRoute = getDashboardPath(user.role);
  const isExactDashboard = window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/';

  return (
    <MainLayout user={user}>
      <Routes>
        <Route path="configuracoes" element={<UserProfile />} />

        {/* --- ROTAS DE USUÁRIO --- */}
        <Route path="user" element={<UserDashboard />} />
        <Route path="user/ranking/:projectId" element={<UserRanking />} />
        <Route path="user/ranking" element={<UserRanking />} />
        <Route path="user/settings" element={<UserSettings />} />
        <Route path="user/support" element={<Support />} />
        <Route path="user/tarefas" element={<ServerTasks />} />

        {/* --- ROTAS DE ADMIN --- */}
        <Route path="admin" element={<AdminDashboard />} />

        {/* Admin - Usuários */}
        <Route path="admin/users" element={<AdminUsersList />} />
        <Route path="admin/users/create" element={<AdminCreateUser />} />
        <Route path="user/projeto/:projectId/dia/:dayNumber" element={<TaskActionPage />} />

        {/* Admin - Projetos */}
        <Route path="admin/projects" element={<AdminProjectsList />} />
        <Route path="admin/projects/create" element={<AdminProjectCreate />} />
        <Route path="admin/projects/edit/:id" element={<EditTask />} />
        <Route path="admin/projects/:projectId/tasks" element={<ProjectTasks />} />
        <Route path="admin/projects/:id" element={<ProjectDetails />} />

        {/* Admin - Integrações */}
        <Route path="admin/integrations" element={<Integrations />} />

        {/* Admin - Organizações */}
        <Route path="admin/organizations" element={<OrganizationsList />} />
        <Route path="admin/organizations/:id" element={<OrganizationDetails />} />
        <Route path="admin/organizations/:orgId/users/:userId" element={<UserProgress />} />

        {/* --- ROTAS DE GESTOR  --- */}
        <Route path="gestor" element={<GestorDashboard />} />
        <Route path="gestor/organizacao" element={<GestorOrganizacaoPage />} />
        <Route path="gestor/equipe" element={<GestorEquipePage />} />

        {/* Gestão de Projetos e Validação */}
        <Route path="gestor/projects" element={<GestorProjetosPage />} />
        <Route path="gestor/projetos" element={<GestorProjetosPage />} />
        <Route path="gestor/historico/:userId" element={<UserHistoryPage />} />
        <Route path="gestor/tarefa/:logId" element={<TaskValidationPage />} />

        {/* === AS ROTAS QUE FALTAVAM === */}
        <Route path="gestor/projetos/:id" element={<GestorProjectDetailsPage />} />
        <Route path="gestor/validacao/:userId" element={<GestorValidationPage />} />

        {/* Redirecionamento Automático na Raiz */}
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
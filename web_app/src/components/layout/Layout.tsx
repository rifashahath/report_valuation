import { ReactNode, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FolderTree,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/upload', label: 'Upload & Process', icon: <Upload size={20} /> },
  { path: '/files', label: 'File Management', icon: <FolderTree size={20} />, roles: ['admin'] },
  { path: '/users', label: 'Users', icon: <Users size={20} />, roles: ['admin'] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const navigate = useNavigate();
  const { user, logout, loginLoading, isAuthenticated, isLoadingUser } = useAuth();

  useEffect(() => {
    if (!isLoadingUser && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoadingUser, isAuthenticated, navigate]);

  const initials =
    user?.first_name
      ? user.first_name[0].toUpperCase()
      : 'U'; // Default callback

  const performLogout = async () => {
    await logout();
    navigate('/login');
    setLogoutModalOpen(false);
  };

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  if (isLoadingUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((role) => user?.roles?.includes(role));
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-20'}
          bg-white border-r flex flex-col
          fixed lg:static h-full z-40 transition-all duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen ? (
            <div>
              <h1 className="text-xl font-bold">Valuation System</h1>
              <p className="text-sm text-gray-500">AI-Powered Reports</p>
            </div>
          ) : (
            <h1 className="text-xl font-bold mx-auto">VS</h1>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `
                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'}
                ${!sidebarOpen ? 'justify-center' : ''}
              `
              }
            >
              {item.icon}
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Profile + Logout */}
        <div className={`p-4 border-t ${!sidebarOpen ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'flex-col' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
              {initials}
            </div>

            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}

            {sidebarOpen && (
              <button
                onClick={handleLogoutClick}
                disabled={loginLoading}
                title="Logout"
                className="p-2 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-50"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={performLogout}
              isLoading={loginLoading}
            >
              Logout
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to log out?
        </p>
      </Modal>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

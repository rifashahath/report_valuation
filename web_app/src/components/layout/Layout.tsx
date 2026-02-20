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
  ChevronRight,
  Building2
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
  { path: '/files', label: 'File Management', icon: <FolderTree size={20} /> },
  { path: '/users', label: 'Users', icon: <Users size={20} /> },
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

  return (
    <div className="flex h-screen bg-secondary-50">
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
              <h1 className="text-xl font-bold text-secondary-900">Valuation System</h1>
              <p className="text-sm text-secondary-500">AI-Powered Reports</p>
            </div>
          ) : (
            <h1 className="text-xl font-bold mx-auto text-secondary-900">VS</h1>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-secondary-100 text-secondary-600"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `
                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                ${isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-secondary-700 hover:bg-secondary-50'}
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
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-medium shadow-sm">
              {initials}
            </div>

            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-secondary-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}

            {sidebarOpen && (
              <button
                onClick={handleLogoutClick}
                disabled={loginLoading}
                title="Logout"
                className="p-2 rounded-md hover:bg-secondary-100 text-secondary-600 disabled:opacity-50"
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
        <p className="text-secondary-600">
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

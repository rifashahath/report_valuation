import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FolderTree,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../app/providers';
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
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loginLoading, isAuthenticated, isLoadingUser } = useAuth();
  const { theme, toggleTheme } = useAppContext();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => user?.roles?.includes(role));
  });

  useEffect(() => {
    if (!isLoadingUser && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoadingUser, isAuthenticated, navigate]);

  useEffect(() => {
    const handleScroll = (e: any) => {
      setScrolled(e.target.scrollTop > 10);
    };
    const mainEl = document.getElementById('main-content');
    mainEl?.addEventListener('scroll', handleScroll);
    return () => mainEl?.removeEventListener('scroll', handleScroll);
  }, []);

  const initials = user?.first_name ? user.first_name[0].toUpperCase() : 'U';

  const performLogout = async () => {
    await logout();
    navigate('/login');
    setLogoutModalOpen(false);
  };

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside
        className={`
          flex flex-col h-full z-40 transition-all duration-300 ease-in-out
          border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          fixed lg:static
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-100">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-white leading-none">Valuation</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Systems AI</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar mt-4">
          <div className={`px-3 mb-2 ${!sidebarOpen ? 'hidden' : ''}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu</span>
          </div>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-slate-900 dark:bg-brand-600 text-white shadow-xl shadow-slate-200 dark:shadow-brand-900/20 translate-x-1'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }
                  ${!sidebarOpen ? 'justify-center px-0' : ''}
                `}
              >
                <div className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {React.cloneElement(item.icon as React.ReactElement, {
                    size: 20,
                    strokeWidth: isActive ? 2.5 : 2
                  })}
                </div>
                {sidebarOpen && <span className="text-sm font-semibold truncate">{item.label}</span>}
                {isActive && sidebarOpen && (
                  <div className="absolute right-2 w-1.5 h-1.5 bg-brand-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'flex-col' : ''}`}>
            <div className="relative group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 transition-all group-hover:shadow-md">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate tracking-tight">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">{user?.email}</p>
              </div>
            )}

            {sidebarOpen && (
              <button
                onClick={() => setLogoutModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:border-red-100 dark:hover:border-red-900"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:flex hidden absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-md text-slate-400 hover:text-brand-600 transition-all z-50 hover:scale-110"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className={`
          h-16 flex items-center justify-between px-6 transition-all duration-300 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm
        `}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <Menu size={20} className="dark:text-white" />
            </button>
            {(
              <span className="font-bold text-slate-900 dark:text-white animate-in fade-in slide-in-from-left-2 duration-300">
                Valuation System AI
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-brand-400" />}
            </button>

            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-white dark:border-slate-900" />
            </button>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto md:p-2"
        >
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Logout Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setLogoutModalOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={performLogout}
              isLoading={loginLoading}
              className="px-6 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100"
            >
              Logout
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
            <LogOut size={32} />
          </div>
          <p className="text-slate-600 font-medium">
            Are you sure you want to log out of your session?
          </p>
        </div>
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

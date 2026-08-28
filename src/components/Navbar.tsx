import React, { useState } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  FolderKanban, 
  Box, 
  Radio, 
  MessageSquare, 
  Users, 
  FileText, 
  Bell, 
  ShieldCheck, 
  ChevronDown, 
  Check, 
  Volume2, 
  HardHat, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { User, AppNotification } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  users: User[];
  activeUser: User;
  onSwitchUser: (user: User) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  onOpenNewProjectModal: () => void;
  onRequestPush: () => void;
  isPushEnabled: boolean;
  iotAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  users,
  activeUser,
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  onOpenNewProjectModal,
  onRequestPush,
  isPushEnabled,
  iotAlertCount
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<string, { label: string; color: string }> = {
    ADMIN: { label: 'Administrador Geral', color: 'bg-rose-500 text-white' },
    ENGINEER_CHIEF: { label: 'Engenheiro Chefe', color: 'bg-blue-600 text-white' },
    SITE_INSPECTOR: { label: 'Fiscal de Obra', color: 'bg-amber-500 text-white' },
    ARCHITECT: { label: 'Arquiteta Coordenadora', color: 'bg-purple-600 text-white' },
    AUDITOR: { label: 'Auditora Técnica', color: 'bg-emerald-600 text-white' },
    CLIENT: { label: 'Cliente / Visualizador', color: 'bg-slate-500 text-white' }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projetos', label: 'Projetos & Workflow', icon: FolderKanban },
    { id: 'asbuilt', label: 'As-Built IFC / DWG', icon: Box },
    { id: 'iot', label: 'Telemetria IoT', icon: Radio, badge: iotAlertCount > 0 ? `${iotAlertCount} Alertas` : undefined },
    { id: 'chat', label: 'Chat Integrado', icon: MessageSquare },
    { id: 'admin', label: 'Usuários & RBAC', icon: Users },
  ];

  return (
    <header className="bg-slate-950/70 backdrop-blur-xl border-b border-white/10 text-white sticky top-0 z-40 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 group text-left focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition border border-white/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white drop-shadow-sm">RegulaPro</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30 backdrop-blur-md">
                    BIM & IoT v4.2
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Engenharia & Regularização</p>
              </div>
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/10">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition relative cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40 shadow-sm backdrop-blur-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-rose-500 text-white rounded-full font-bold animate-pulse shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* New Project Quick Button */}
            {activeUser.role !== 'CLIENT' && (
              <button
                id="btn-quick-new-proj"
                onClick={onOpenNewProjectModal}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 backdrop-blur-md text-xs font-bold px-3 py-2 rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Projeto</span>
              </button>
            )}

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                id="btn-notification-bell"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition focus:outline-none cursor-pointer"
                title="Notificações Push e Avisos"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Menu */}
              {showNotifMenu && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 text-slate-100 z-50 overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-3.5 bg-slate-950/80 border-b border-white/10 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-sm">Central de Notificações</span>
                      <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full font-semibold">
                        {unreadCount} novas
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={onClearAllNotifications}
                        className="text-xs text-sky-300 hover:text-sky-200 underline font-medium cursor-pointer"
                      >
                        Marcar todas lidas
                      </button>
                    )}
                  </div>

                  {/* Browser Push Permission Banner */}
                  <div className="p-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Notificações Push no Navegador:</span>
                    <button
                      onClick={onRequestPush}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                        isPushEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 cursor-default'
                          : 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-sm'
                      }`}
                    >
                      {isPushEnabled ? (
                        <>
                          <Check className="w-3 h-3" /> Ativadas
                        </>
                      ) : (
                        'Ativar Push'
                      )}
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        Nenhuma notificação recente.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className={`p-3 text-xs transition cursor-pointer hover:bg-white/5 flex items-start gap-2.5 ${
                            !notif.read ? 'bg-sky-500/10 font-semibold text-slate-100' : 'opacity-70 text-slate-300'
                          }`}
                        >
                          <div className={`mt-0.5 p-1.5 rounded-lg border ${
                            notif.type === 'alert' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                            notif.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            notif.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          }`}>
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold">{notif.title}</p>
                            <p className="text-slate-300 text-[11px] font-normal leading-relaxed mt-0.5">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active User Avatar & Role Switcher */}
            <div className="relative">
              <button
                id="btn-user-profile-menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/20">
                  {activeUser.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left pr-1">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                    {activeUser.name}
                  </div>
                  <div className="text-[10px] text-sky-400 font-semibold truncate max-w-[140px]">
                    {roleLabels[activeUser.role]?.label || activeUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Switcher Dropdown (Simulating different RBAC roles) */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 text-slate-100 z-50 overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-3 bg-slate-950/80 border-b border-white/10 text-white">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Perfil Autenticado</p>
                    <p className="font-bold text-sm text-white">{activeUser.name}</p>
                    <p className="text-xs text-sky-300 font-medium">{activeUser.department}</p>
                    {activeUser.creaCau && (
                      <span className="inline-block mt-1 text-[10px] bg-white/5 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                        {activeUser.creaCau}
                      </span>
                    )}
                  </div>

                  <div className="p-2 border-b border-white/10 bg-white/5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase px-2 py-1">
                      Alternar Perfil Técnico (RBAC):
                    </p>
                    <div className="space-y-1">
                      {users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                            u.id === activeUser.id 
                              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30 font-bold' 
                              : 'hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[10px] text-slate-400">{roleLabels[u.role]?.label}</div>
                          </div>
                          {u.id === activeUser.id && (
                            <Check className="w-4 h-4 text-sky-400 font-bold" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 text-center">
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-xs font-bold text-sky-300 hover:text-white p-2 hover:bg-white/10 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Gerenciar Matriz de Permissões
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-white/10 overflow-x-auto gap-1 text-xs">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium text-xs cursor-pointer ${
                  isActive ? 'bg-sky-500/30 text-sky-200 border border-sky-400/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};

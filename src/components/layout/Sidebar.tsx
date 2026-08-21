import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserProfileModal } from '@/components/common/UserProfileModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LayoutDashboard, 
  Kanban, 
  Inbox, 
  Target, 
  CalendarDays, 
  Users2, 
  Building2, 
  BarChart3, 
  ShieldAlert, 
  MailCheck, 
  Sparkles,
  Settings,
  X,
  MessageSquare,
  Clock,
  Cake,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNotifications: () => void;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onSelectTab, 
  onOpenNotifications,
  onCloseMobileDrawer 
}) => {
  const { currentUser, users, tasks, notifications, loginAsUser, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  if (!currentUser) return null;

  const submittedCount = tasks.filter(t => t.status === 'Submitted').length;
  const pendingAdminCount = tasks.filter(t => t.status === 'Pending Admin').length;

  const handlePersonaSwitch = (newUserId: string) => {
    loginAsUser(newUserId);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const isAdmin = currentUser.roleTier === 'admin';
  const isReviewer = currentUser.roleTier === 'reviewer';

  const navItems = [
    {
      group: 'OPERATIONS',
      items: [
        ...(isAdmin ? [{ id: 'executive-overview', label: 'Executive Analytics Hub', icon: LayoutDashboard }] : []),
        { id: 'tasks', label: 'Tasks & Workflow', icon: Kanban },
        ...((isAdmin || isReviewer) ? [{ 
          id: 'review-queue', 
          label: isReviewer ? 'Reviewer Queue' : 'Admin Queue', 
          icon: Inbox, 
          badge: isReviewer ? submittedCount : pendingAdminCount 
        }] : []),
        { id: 'chat', label: 'Team Messages', icon: MessageSquare },
        { id: 'attendance', label: isReviewer || isAdmin ? 'Intern Shift Board' : 'Shift Check-In', icon: Clock },
        { id: 'projects', label: 'Projects & Deadlines', icon: Target },
        { id: 'meetings', label: 'Scheduled Meetings', icon: CalendarDays },
      ]
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { id: 'hr-hub', label: 'Personnel & Employee Hub', icon: Cake },
        ...((isAdmin || isReviewer) ? [{ id: 'project-mgmt', label: 'Project Directory', icon: Building2 }] : []),
        ...(isAdmin ? [
          { id: 'chat-logs', label: 'Chat Compliance Logs', icon: MessageSquare },
          { id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert }
        ] : [])
      ]
    }
  ];

  return (
    <aside className="w-64 h-full bg-white dark:bg-slate-900 border-r border-purple-100 dark:border-purple-950 flex flex-col justify-between p-4 shadow-xs">
      
      <div className="space-y-5">
        
        {/* App Logo & Subdomain Badge */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80" 
                alt="ERP Product Logo" 
                className="w-8 h-8 rounded-xl object-cover border border-purple-300 shadow-2xs"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-600 text-[8px] text-white">
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            </div>
            <div>
              <span className="font-extrabold text-sm text-purple-950 dark:text-slate-100 block tracking-tight">Task Tracker</span>
              <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold uppercase tracking-wider block">Company ERP</span>
            </div>
          </div>

          {onCloseMobileDrawer && (
            <button onClick={onCloseMobileDrawer} className="md:hidden text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Role Impersonation Selector */}
        <div className="px-2 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Persona
          </label>
          <Select value={currentUser.id} onValueChange={handlePersonaSwitch}>
            <SelectTrigger className="h-9 text-xs border-purple-100 bg-purple-50/50 font-medium text-purple-950 rounded-xl focus:ring-purple-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id} className="text-xs font-medium">
                  {u.fullName} ({u.roleTier})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigation Group Links with Professional Icon Pack */}
        <div className="space-y-4 pt-1">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {group.group}
              </h4>
              <nav className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobileDrawer) onCloseMobileDrawer();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                        isActive 
                          ? 'bg-purple-600 text-white shadow-2xs font-bold' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 ? (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-white text-purple-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

      </div>

      {/* Footer Profile Section */}
      <div className="space-y-2 pt-3 border-t border-purple-50 dark:border-purple-950">
        
        {/* User Card */}
        <div 
          onClick={() => setIsProfileModalOpen(true)}
          className="p-2.5 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100/80 dark:border-purple-900/60 flex items-center justify-between cursor-pointer hover:bg-purple-100/60 transition-colors group"
          title="Click to edit profile & avatar"
        >
          <div className="flex items-center space-x-2.5">
            <Avatar className="h-8 w-8 border border-purple-300">
              {currentUser.avatarUrl ? <AvatarImage src={currentUser.avatarUrl} alt={currentUser.fullName} /> : null}
              <AvatarFallback className="bg-purple-600 text-white font-bold text-xs">
                {getInitials(currentUser.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-bold text-xs text-purple-950 dark:text-slate-100 block leading-tight group-hover:text-purple-700">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium capitalize block">
                {currentUser.roleTier}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="User Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
              title="Logout of ERP"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* User Profile Modal */}
      <UserProfileModal 
        open={isProfileModalOpen} 
        onOpenChange={setIsProfileModalOpen} 
      />

    </aside>
  );
};

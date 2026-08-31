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
  LogOut,
  CalendarOff
} from 'lucide-react';

import { BuildicyLogo } from '@/components/common/BuildicyLogo';

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
  const { currentUser, users, tasks, notifications, chatMessages, leaveRequests, loginAsUser, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  if (!currentUser) return null;

  const submittedCount = tasks.filter(t => t.status === 'Submitted').length;
  const pendingAdminCount = tasks.filter(t => t.status === 'Pending Admin').length;

  const isAdmin = currentUser.roleTier === 'admin';
  const isReviewer = currentUser.roleTier === 'reviewer';

  const pendingLeaveCount = (leaveRequests || []).filter(r => {
    if (isReviewer) return r.status === 'pending_reviewer';
    if (isAdmin) return r.status === 'pending_admin' || r.status === 'pending_reviewer';
    return false;
  }).length;

  const unreadChatCount = chatMessages.filter(msg => {
    if (!currentUser) return false;
    if (msg.senderId === currentUser.id) return false;
    if ((msg.readBy || []).includes(currentUser.id)) return false;
    if (msg.recipientId) {
      return msg.recipientId === currentUser.id;
    }
    return true;
  }).length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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
        { id: 'chat', label: 'Team Messages', icon: MessageSquare, badge: unreadChatCount, isChat: true },
        ...((isAdmin || isReviewer) ? [{ id: 'attendance', label: 'Intern Shift Board', icon: Clock }] : []),
        { id: 'leave-management', label: 'Leave & Permissions', icon: CalendarOff, badge: pendingLeaveCount },
        { id: 'projects', label: 'Projects & Deadlines', icon: Target },
        { id: 'meetings', label: 'Scheduled Meetings', icon: CalendarDays },
      ]
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { id: 'hr-hub', label: 'Personnel & Employee Hub', icon: Cake },
        ...(isAdmin ? [
          { id: 'sent-emails', label: 'Sent Emails Log', icon: MailCheck },
          { id: 'chat-logs', label: 'Chat Compliance Logs', icon: MessageSquare }
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
            <div className="relative flex items-center justify-center">
              <BuildicyLogo size={36} />
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 block tracking-tight">Buildicy</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">Enterprise ERP</span>
            </div>
          </div>

          {onCloseMobileDrawer && (
            <button onClick={onCloseMobileDrawer} className="md:hidden text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          )}
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
                  const isUnreadChat = item.id === 'chat' && unreadChatCount > 0;

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
                          : isUnreadChat
                          ? 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200/70 dark:border-rose-900/60'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isUnreadChat ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.id === 'chat' && unreadChatCount > 0 ? (
                        <span className="flex items-center space-x-1.5 shrink-0">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-md transition-all ${
                            isActive 
                              ? 'bg-white text-rose-600' 
                              : 'bg-rose-500 text-white shadow-rose-500/40'
                          }`}>
                            {unreadChatCount} NEW
                          </span>
                        </span>
                      ) : item.badge && item.badge > 0 ? (
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { todayIso } from '@/lib/date';
import { NotificationLog } from '@/components/common/NotificationLog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Menu, Layers, Bell, Sun, Moon, Play, Square, Clock } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeTab, onSelectTab }) => {
  const { currentUser, notifications, tasks, attendanceRecords, checkIn, checkOut } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('erp_theme') === 'dark';
  });

  const [elapsedTimeStr, setElapsedTimeStr] = useState<string>('0h 0m');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('erp_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('erp_theme', 'light');
    }
  }, [isDarkMode]);

  if (!currentUser) return <>{children}</>;

  const todayStr = todayIso();
  const isIntern = currentUser.roleTier === 'contributor';

  // Active check-in record for current intern user
  const activeRecord = attendanceRecords.find(r => 
    r.userId === currentUser.id && 
    r.date === todayStr && 
    r.status === 'checked_in'
  );

  const activeSession = activeRecord?.sessions?.find(s => !s.checkOutTime);

  // Real-time live stopwatch timer calculation for checked-in intern
  useEffect(() => {
    if (!activeRecord || activeRecord.status !== 'checked_in') {
      setElapsedTimeStr('0m 0s');
      return;
    }

    const updateTimer = () => {
      let startMs = Date.now();
      const currentActiveSess = activeRecord.sessions?.find(s => !s.checkOutTime);

      if (currentActiveSess?.sessionStartTimestamp) {
        startMs = new Date(currentActiveSess.sessionStartTimestamp).getTime();
      } else if (currentActiveSess?.checkInTime) {
        const [timePart, modifier] = currentActiveSess.checkInTime.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const d = new Date();
        d.setHours(hours || 0, minutes || 0, 0, 0);
        startMs = d.getTime();
      }

      // Sum duration of all completed sessions today
      const completedSessionsMs = (activeRecord.sessions || [])
        .filter(s => !!s.checkOutTime)
        .reduce((sum, s) => sum + (s.durationHours || 0) * 3600 * 1000, 0);

      const activeSessionDiffMs = Math.max(0, Date.now() - startMs);
      const totalCumulativeMs = completedSessionsMs + activeSessionDiffMs;
      const totalSecs = Math.floor(totalCumulativeMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');

      if (hours > 0) {
        setElapsedTimeStr(`${hours}h ${pad(mins)}m ${pad(secs)}s`);
      } else {
        setElapsedTimeStr(`${mins}m ${pad(secs)}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRecord]);

  const pendingReviewTasks = tasks.filter(t => 
    (currentUser.roleTier === 'reviewer' && t.status === 'Submitted') ||
    (currentUser.roleTier === 'admin' && t.status === 'Pending Admin')
  );

  const totalUnreadAlerts = notifications.length + pendingReviewTasks.length;

  const getPageTitle = (tabKey: string) => {
    switch (tabKey) {
      case 'executive-overview': return 'Executive Analytics Hub';
      case 'tasks': return 'Tasks & Workflow';
      case 'review-queue': return 'Reviewer First-Pass Queue';
      case 'approval-queue': return 'Admin Final Approval Queue';
      case 'chat': return 'Team Messages';
      case 'attendance': return 'Intern Shift Board';
      case 'projects': return 'Projects & Target Deadlines';
      case 'meetings': return 'Scheduled Team Meetings';
      case 'hr-hub': return 'Zoho People HR & Employee Hub';
      case 'people': return 'Personnel Directory';
      case 'project-mgmt': return 'Project Directory';
      case 'analytics': return 'Executive Analytics Hub';
      case 'chat-logs': return 'Chat Compliance Logs';
      case 'sent-emails': return 'Sent Outbound Emails Log';
      case 'audit-logs': return 'System Audit Logs';
      default: return 'Tasks & Workflow';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50/60 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar 
          activeTab={activeTab} 
          onSelectTab={onSelectTab} 
          onOpenNotifications={() => setIsNotificationsOpen(true)} 
        />
      </div>

      {/* Main Right Content Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Clean Aligned Top Header Bar */}
        <header className="flex h-14 items-center justify-between px-6 border-b border-purple-100 dark:border-purple-950 bg-white dark:bg-slate-900 shrink-0">
          
          {/* Left: Mobile Menu Toggle & Page Title */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden h-8 w-8 text-slate-700 dark:text-slate-200"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {getPageTitle(activeTab)}
              </h2>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/80">
                ERP
              </span>
            </div>
          </div>

          {/* Right Controls: Check-In/Out Button with Real-Time Hours/Minutes Timer */}
          <div className="flex items-center space-x-3">
            
            {/* Prominent Navbar Check-In / Check-Out Widget with Real-Time Elapsed Time */}
            {isIntern && (
              <div className="flex items-center space-x-2">
                {activeRecord ? (
                  <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <div className="flex items-center space-x-1.5 text-[11px] font-extrabold text-emerald-950 dark:text-emerald-300">
                      <span>In: {activeSession?.checkInTime || 'Active'}</span>
                      <span className="bg-emerald-200/80 dark:bg-emerald-900/80 px-1.5 py-0.2 rounded text-[10px] text-emerald-900 dark:text-emerald-100 font-mono">
                        ⏱️ {elapsedTimeStr} active
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={checkOut}
                      className="h-7 text-[10px] font-bold px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs ml-1 shrink-0"
                    >
                      <Square className="w-2.5 h-2.5 mr-1 fill-current" /> Check Out
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={checkIn}
                    className="h-8 px-3 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs"
                  >
                    <Play className="w-3 h-3 fill-current" /> Check In
                  </Button>
                )}
              </div>
            )}

            {/* Sun/Moon Theme Switcher */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </button>

            {/* Notification Bell Button with Live Counter Badge */}
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              title="Open Notification Center"
            >
              <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              {totalUnreadAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white shadow-xs animate-pulse">
                  {totalUnreadAlerts}
                </span>
              )}
            </button>

          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

      </div>

      {/* Mobile Sidebar Navigation Drawer Dialog */}
      <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-[260px] h-full left-0 translate-x-0 rounded-none">
          <div className="h-full w-full relative">
            <Sidebar 
              activeTab={activeTab} 
              onSelectTab={onSelectTab} 
              onOpenNotifications={() => {
                setIsMobileMenuOpen(false);
                setIsNotificationsOpen(true);
              }}
              onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Real-time Email Notification & Action Center Modal */}
      <NotificationLog 
        open={isNotificationsOpen} 
        onOpenChange={setIsNotificationsOpen} 
      />

    </div>
  );
};

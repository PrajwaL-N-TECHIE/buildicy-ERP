import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ExecutiveOverview } from '@/components/admin/ExecutiveOverview';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { ProjectList } from '@/components/projects/ProjectList';
import { MeetingList } from '@/components/meetings/MeetingList';
import { PeopleManagement } from '@/components/admin/PeopleManagement';
import { ChatLogsViewer } from '@/components/admin/ChatLogsViewer';
import { SentEmailsLogViewer } from '@/components/admin/SentEmailsLogViewer';
import { TeamChatView } from '@/components/chat/TeamChatView';
import { AttendanceTracker } from '@/components/attendance/AttendanceTracker';
import { LeaveManagementView } from '@/components/leave/LeaveManagementView';
import { HRHubView } from '@/components/hr/HRHubView';
import { LoginView } from '@/views/LoginView';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShieldCheck, Send, Plus, Sparkles } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (!currentUser) return 'tasks';
    if (currentUser.roleTier === 'admin') return 'executive-overview';
    return 'tasks';
  });

  const [isTaskFormOpen, setIsTaskFormOpen] = useState<boolean>(false);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm font-medium">
        Loading workspace…
      </div>
    );
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'executive-overview':
        return <ExecutiveOverview />;
      case 'tasks':
        return <TaskList onOpenCreateTask={() => setIsTaskFormOpen(true)} />;
      case 'chat':
        return <TeamChatView />;
      case 'attendance':
        return <AttendanceTracker />;
      case 'leave-management':
        return <LeaveManagementView />;
      case 'review-queue':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1">
              <h3 className="text-xs font-semibold text-purple-950 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-purple-600" /> Reviewer First Pass Queue
              </h3>
              <p className="text-xs text-slate-600 font-normal">
                Tasks submitted by contributors awaiting your first-pass review.
              </p>
            </div>
            <TaskList onOpenCreateTask={() => setIsTaskFormOpen(true)} />
          </div>
        );
      case 'approval-queue':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
              <h3 className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Founder & Admin Final Sign-Off Queue
              </h3>
              <p className="text-xs text-slate-600 font-normal">
                Tasks approved by reviewers awaiting final founder sign-off.
              </p>
            </div>
            <TaskList onOpenCreateTask={() => setIsTaskFormOpen(true)} />
          </div>
        );
      case 'projects':
        return <ProjectList />;
      case 'meetings':
        return <MeetingList />;
      case 'hr-hub':
      case 'people':
        return <HRHubView />;
      case 'analytics':
        return <ExecutiveOverview />;
      case 'chat-logs':
        return <ChatLogsViewer />;
      case 'sent-emails':
        return <SentEmailsLogViewer />;
      default:
        return <TaskList onOpenCreateTask={() => setIsTaskFormOpen(true)} />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      
      {/* Clean Borderless Page Header with Purple Theme Accents */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-purple-100 dark:border-purple-950">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Buildicy ERP Operations Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Welcome back, <strong className="text-slate-900 dark:text-slate-200">{currentUser.fullName}</strong> ({currentUser.title}).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setIsTaskFormOpen(true)}
            size="sm" 
            className="text-xs h-9 px-4 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs gap-1.5"
          >
            <Plus className="w-4 h-4" /> {currentUser.roleTier === 'contributor' ? 'Log Task Entry' : 'Assign Task'}
          </Button>
        </div>
      </div>

      {/* Main Tab View Rendering */}
      <div className="pt-2">
        {renderActiveTabContent()}
      </div>

      {/* Global Task Creation Form Dialog */}
      <TaskFormDialog 
        open={isTaskFormOpen} 
        onOpenChange={setIsTaskFormOpen} 
      />

    </AppLayout>
  );
};

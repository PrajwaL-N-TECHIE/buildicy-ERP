import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sendDailyOverdueDigestEmail } from '@/firebase/notifications';
import { todayIso } from '@/lib/date';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  CalendarDays, 
  Users, 
  FolderKanban, 
  AlertTriangle,
  Download,
  Mail,
  BarChart3,
  PieChart
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const ExecutiveOverview: React.FC = () => {
  const { tasks, users, projects } = useAuth();
  const [isSendingDigest, setIsSendingDigest] = useState<boolean>(false);
  const [digestSuccessMsg, setDigestSuccessMsg] = useState<string>('');

  const todayStr = todayIso();
  const today = new Date(todayStr);

  // Aggregated Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const submittedTasks = tasks.filter(t => t.status === 'Submitted').length;
  const pendingAdminTasks = tasks.filter(t => t.status === 'Pending Admin').length;
  const notStartedTasks = tasks.filter(t => t.status === 'Not Started').length;

  const pendingReviewTasks = submittedTasks + pendingAdminTasks;
  
  // Overdue Tasks Calculation
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'Completed' || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due < today;
  });

  const totalHoursLogged = tasks.reduce((sum, t) => sum + (t.hours || 0), 0);
  const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart 1 Data: Task Status Breakdown (Doughnut)
  const statusDoughnutData = {
    labels: ['Completed', 'Pending Admin', 'Reviewer Pass', 'In Progress', 'Not Started'],
    datasets: [
      {
        data: [completedTasks, pendingAdminTasks, submittedTasks, inProgressTasks, notStartedTasks],
        backgroundColor: ['#10b981', '#f59e0b', '#9333ea', '#0284c7', '#94a3b8'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Chart 2 Data: Workload & Hours Per Project (Bar)
  const projectNames = projects.map(p => p.name);
  const projectHours = projects.map(p => {
    return tasks.filter(t => t.projectId === p.id).reduce((sum, t) => sum + (t.hours || 0), 0);
  });

  const projectHoursBarData = {
    labels: projectNames,
    datasets: [
      {
        label: 'Total Hours Logged',
        data: projectHours,
        backgroundColor: '#9333ea',
        borderRadius: 8
      }
    ]
  };

  // CSV Export
  const handleExportCSVReport = () => {
    const headers = ['Task ID', 'Contributor', 'Project', 'Priority', 'Status', 'Description', 'Due Date', 'Overdue Status'];
    const rows = tasks.map(t => {
      const contributor = users.find(u => u.id === t.contributorId)?.fullName || '';
      const project = projects.find(p => p.id === t.projectId)?.name || '';
      const isOverdue = t.dueDate && new Date(t.dueDate) < today && t.status !== 'Completed';
      return [
        t.id,
        `"${contributor}"`,
        `"${project}"`,
        t.priority,
        t.status,
        `"${t.description.replace(/"/g, '""')}"`,
        t.dueDate || '',
        isOverdue ? 'OVERDUE' : 'ON_SCHEDULE'
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `executive_analytics_report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dispatch Overdue Email Digest
  const handleSendDailyDigest = async () => {
    setIsSendingDigest(true);
    setDigestSuccessMsg('');
    try {
      const founders = users.filter(u => u.roleTier === 'admin');
      await sendDailyOverdueDigestEmail(overdueTasks, founders);
      setDigestSuccessMsg(`Overdue digest email successfully dispatched to ${founders.length} admin accounts!`);
    } catch (err) {
      console.error('Error dispatching digest:', err);
    } finally {
      setIsSendingDigest(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Executive & Operational Analytics Hub</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">Real-time operational metrics, workload analytics, and overdue escalations.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSVReport}
              className="text-xs h-9 px-3.5 font-medium gap-1.5 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Export CSV Report
            </Button>

            <Button 
              size="sm" 
              onClick={handleSendDailyDigest}
              disabled={isSendingDigest}
              className="text-xs h-9 px-4 font-medium gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5" /> {isSendingDigest ? 'Dispatching...' : 'Dispatch Daily Digest'}
            </Button>
          </div>
        </div>

        {digestSuccessMsg && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {digestSuccessMsg}
          </div>
        )}
      </div>

      {/* 4 High-Level Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Tasks */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tasks</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{totalTasks}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Logged in ERP</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal pt-1 border-t border-slate-100 dark:border-slate-800">
            Across {projects.length} Active Projects &bull; {totalHoursLogged} Total Hrs
          </div>
        </Card>

        {/* Card 2: Overdue Tasks */}
        <Card className="border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 shadow-2xs rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Overdue Tasks</span>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">{overdueTasks.length}</span>
            <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">Requires Action</span>
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-rose-300/80 font-medium pt-1 border-t border-rose-200/60 dark:border-rose-900/50">
            {overdueTasks.length > 0 ? `${overdueTasks.length} task(s) past target deadline` : 'No overdue tasks!'}
          </div>
        </Card>

        {/* Card 3: Pending Review */}
        <Card className="border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30 shadow-2xs rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Pending Review</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-amber-800 dark:text-amber-300">{pendingReviewTasks}</span>
            <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">In Review Queue</span>
          </div>
          <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium pt-1 border-t border-amber-200/60 dark:border-amber-900/50">
            Reviewer & Admin approval chain
          </div>
        </Card>

        {/* Card 4: Completion Rate */}
        <Card className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-2xs rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Completed Tasks</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">{completedTasks}</span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">({overallCompletionRate}% Rate)</span>
          </div>
          <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-medium pt-1 border-t border-emerald-200/60 dark:border-emerald-900/50">
            Final founder sign-off granted
          </div>
        </Card>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Status Breakdown */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Task Status Distribution</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={statusDoughnutData} options={{ maintainAspectRatio: false }} />
          </div>
        </Card>

        {/* Chart 2: Project Workload Hours */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Logged Hours by Project</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Bar data={projectHoursBarData} options={{ maintainAspectRatio: false }} />
          </div>
        </Card>

      </div>

      {/* Overdue Tasks Escalation List */}
      <Card className="border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-slate-900 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="p-5 bg-rose-50/60 dark:bg-rose-950/40 border-b border-rose-200/80 dark:border-rose-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">Overdue Tasks Escalation Table</CardTitle>
            </div>
            <Badge variant="destructive" className="text-[10px] font-extrabold">
              {overdueTasks.length} Overdue
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-400 font-normal pt-0.5">
            Tasks past target completion date requiring immediate follow-up with assignees.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="border-b border-slate-200">
                <TableHead className="py-3 px-4 font-bold text-xs text-slate-800">Contributor</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-slate-800">Project</TableHead>
                <TableHead className="py-3 px-4 font-bold text-xs text-slate-800">Task Description</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-slate-800">Target Due Date</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-slate-800 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {overdueTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-slate-400 text-xs font-normal">
                    🎉 Excellent! No overdue tasks in the system.
                  </TableCell>
                </TableRow>
              ) : (
                overdueTasks.map(t => {
                  const contributor = users.find(u => u.id === t.contributorId);
                  const project = projects.find(p => p.id === t.projectId);
                  const due = new Date(t.dueDate!);
                  const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 3600 * 24));

                  return (
                    <TableRow key={t.id} className="hover:bg-rose-50/30 transition-colors">
                      
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <Avatar className="h-7 w-7 border border-rose-300">
                            {contributor?.avatarUrl ? <AvatarImage src={contributor.avatarUrl} alt={contributor.fullName} /> : null}
                            <AvatarFallback className="bg-rose-600 text-white font-bold text-[10px]">
                              {getInitials(contributor?.fullName || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">{contributor?.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{contributor?.title}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 px-3">
                        <Badge variant="outline" className="text-xs font-bold border-slate-300 text-slate-800">
                          {project?.name}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3.5 px-4">
                        <p className="text-xs font-semibold text-slate-900">{t.description}</p>
                      </TableCell>

                      <TableCell className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-rose-700 block">{t.dueDate}</span>
                          <span className="text-[10px] text-rose-600 font-semibold bg-rose-100 px-1.5 py-0.5 rounded">
                            {diffDays} day{diffDays === 1 ? '' : 's'} late
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 px-3 text-right">
                        <Badge variant="warning" className="text-[10px] font-bold">
                          {t.status}
                        </Badge>
                      </TableCell>

                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Project Completion & Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map(proj => {
          const projTasks = tasks.filter(t => t.projectId === proj.id);
          const projCompleted = projTasks.filter(t => t.status === 'Completed').length;
          const projOverdue = projTasks.filter(t => {
            if (t.status === 'Completed' || !t.dueDate) return false;
            return new Date(t.dueDate) < today;
          }).length;

          const pct = projTasks.length > 0 ? Math.round((projCompleted / projTasks.length) * 100) : 0;

          return (
            <Card key={proj.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{proj.name}</span>
                <Badge variant="purple" className="text-[10px] font-bold">
                  {projTasks.length} Tasks
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Progress</span>
                  <span className="text-purple-700 dark:text-purple-300 font-bold">{pct}% ({projCompleted}/{projTasks.length})</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Target Deadline:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{proj.deadline?.dueDate || 'Not set'}</span>
              </div>

              {projOverdue > 0 && (
                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
                  <span>⚠️ Overdue Tasks:</span>
                  <span>{projOverdue} Task(s)</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

    </div>
  );
};

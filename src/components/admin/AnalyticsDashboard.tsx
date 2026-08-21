import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Send, ShieldCheck, Calendar, Users, BarChart3, TrendingUp, Layers } from 'lucide-react';
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

export const AnalyticsDashboard: React.FC = () => {
  const { tasks, projects, users, meetings } = useAuth();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingReviewer = tasks.filter(t => t.status === 'Submitted').length;
  const pendingAdmin = tasks.filter(t => t.status === 'Pending Admin').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const notStarted = tasks.filter(t => t.status === 'Not Started').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart 1 Data: Task Status Breakdown (Doughnut)
  const statusDoughnutData = {
    labels: ['Completed', 'Pending Admin', 'Submitted for Review', 'In Progress', 'Not Started'],
    datasets: [
      {
        data: [completedTasks, pendingAdmin, pendingReviewer, inProgress, notStarted],
        backgroundColor: [
          '#10b981', // emerald
          '#f59e0b', // amber
          '#a855f7', // purple
          '#0ea5e9', // sky
          '#94a3b8'  // slate
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Chart 2 Data: Tasks by Project (Bar)
  const projectNames = projects.map(p => p.name);
  const projectCompletedCounts = projects.map(p => 
    tasks.filter(t => t.projectId === p.id && t.status === 'Completed').length
  );
  const projectActiveCounts = projects.map(p => 
    tasks.filter(t => t.projectId === p.id && t.status !== 'Completed').length
  );

  const projectBarData = {
    labels: projectNames,
    datasets: [
      {
        label: 'Completed Tasks',
        data: projectCompletedCounts,
        backgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'In-Progress / Pending Tasks',
        data: projectActiveCounts,
        backgroundColor: '#6366f1',
        borderRadius: 4
      }
    ]
  };

  const contributors = users.filter(u => u.roleTier === 'contributor');

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="bg-card p-6 rounded-xl border border-border/80 shadow-2xs space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Org-Wide Executive Dashboard & Operations Analytics
        </h2>
        <p className="text-xs text-muted-foreground font-medium">
          Real-time metrics tracking task completion velocity, review queues, project milestones, and contributor workload distribution.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <Card className="p-6 flex items-center justify-between border-border/80 shadow-2xs hover:shadow-md transition-all rounded-xl">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Logged Tasks</p>
            <h3 className="text-3xl font-extrabold text-foreground">{totalTasks}</h3>
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {completionRate}% Completion Rate
            </p>
          </div>
          <div className="p-3.5 bg-primary/10 rounded-2xl text-primary border border-primary/20">
            <BarChart3 className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between border-purple-200 dark:border-purple-900/60 shadow-2xs hover:shadow-md transition-all rounded-xl">
          <div className="space-y-1">
            <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wider">Reviewer Queue</p>
            <h3 className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{pendingReviewer}</h3>
            <p className="text-xs text-muted-foreground font-medium">Submitted for 1st Pass</p>
          </div>
          <div className="p-3.5 bg-purple-100 dark:bg-purple-950 rounded-2xl text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Send className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between border-amber-200 dark:border-amber-900/60 shadow-2xs hover:shadow-md transition-all rounded-xl">
          <div className="space-y-1">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider">Admin Approval</p>
            <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{pendingAdmin}</h3>
            <p className="text-xs text-muted-foreground font-medium">Awaiting Founder Approval</p>
          </div>
          <div className="p-3.5 bg-amber-100 dark:bg-amber-950 rounded-2xl text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between border-emerald-200 dark:border-emerald-900/60 shadow-2xs hover:shadow-md transition-all rounded-xl">
          <div className="space-y-1">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wider">Completed Tasks</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedTasks}</h3>
            <p className="text-xs text-muted-foreground font-medium">Fully Approved</p>
          </div>
          <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950 rounded-2xl text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </Card>

      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card className="p-6 border-border/80 shadow-2xs rounded-xl">
          <CardHeader className="p-0 pb-5 border-b border-border/50">
            <CardTitle className="text-base font-bold">Task Status Breakdown</CardTitle>
            <CardDescription className="text-xs font-medium">Overall task count distribution across all workflow review stages</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-6 flex items-center justify-center h-72">
            <Doughnut 
              data={statusDoughnutData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 12, weight: 'bold' } } } } 
              }} 
            />
          </CardContent>
        </Card>

        <Card className="p-6 border-border/80 shadow-2xs rounded-xl">
          <CardHeader className="p-0 pb-5 border-b border-border/50">
            <CardTitle className="text-base font-bold">Project Progress Breakdown</CardTitle>
            <CardDescription className="text-xs font-medium">Completed vs in-progress tasks per active project</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-6 flex items-center justify-center h-72">
            <Bar 
              data={projectBarData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 12, weight: 'bold' } } } }
              }} 
            />
          </CardContent>
        </Card>

      </div>

      {/* Contributor Workload & Task Performance Table */}
      <Card className="p-6 border-border/80 shadow-2xs rounded-xl">
        <CardHeader className="p-0 pb-4 border-b border-border/50">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Contributor Workload & Task Performance
          </CardTitle>
          <CardDescription className="text-xs font-medium">Breakdown of total logged hours and task completion rates per intern</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b bg-muted/40 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Contributor</th>
                  <th className="py-3 px-4">Title / Domain</th>
                  <th className="py-3 px-4">Total Tasks</th>
                  <th className="py-3 px-4">Hours Logged</th>
                  <th className="py-3 px-4">Completed Tasks</th>
                  <th className="py-3 px-4">Pending / In Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {contributors.map(c => {
                  const cTasks = tasks.filter(t => t.contributorId === c.id);
                  const cHours = cTasks.reduce((acc, t) => acc + (t.hours || 0), 0);
                  const cCompleted = cTasks.filter(t => t.status === 'Completed').length;
                  const cPending = cTasks.filter(t => t.status !== 'Completed').length;

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">{c.fullName}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{c.title}</td>
                      <td className="py-3.5 px-4 font-extrabold text-foreground">{cTasks.length}</td>
                      <td className="py-3.5 px-4 font-bold text-primary">{cHours} hrs</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-bold">{cCompleted}</td>
                      <td className="py-3.5 px-4 text-amber-600 font-bold">{cPending}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

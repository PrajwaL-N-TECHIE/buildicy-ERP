import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { todayIso } from '@/lib/date';
import { TaskReviewDialog } from './TaskReviewDialog';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { KanbanBoard } from './KanbanBoard';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2, Clock, Send, ShieldCheck, Search, Download, CheckSquare, Calendar, ArrowRight, MessageSquare, ExternalLink, LayoutGrid, Table as TableIcon, Link as LinkIcon, Filter, XCircle, Trash2 } from 'lucide-react';

interface TaskListProps {
  onOpenCreateTask: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({ onOpenCreateTask }) => {
  const { currentUser, tasks, users, projects, updateTaskStatus, deleteTask } = useAuth();
  
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedDateRangeFilter, setSelectedDateRangeFilter] = useState<string>('all');

  const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  if (!currentUser) return null;

  let visibleTasks = tasks;
  if (currentUser.roleTier === 'contributor') {
    visibleTasks = tasks.filter(t => t.contributorId === currentUser.id);
  } else if (currentUser.roleTier === 'reviewer') {
    visibleTasks = tasks.filter(t => 
      t.status === 'Submitted' || 
      currentUser.projectIds.includes(t.projectId)
    );
  }

  // Keyword Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    visibleTasks = visibleTasks.filter(t => {
      const contributor = users.find(u => u.id === t.contributorId);
      const project = projects.find(p => p.id === t.projectId);
      return (
        t.description.toLowerCase().includes(q) ||
        contributor?.fullName.toLowerCase().includes(q) ||
        project?.name.toLowerCase().includes(q)
      );
    });
  }

  // Filters
  if (selectedProjectFilter !== 'all') {
    visibleTasks = visibleTasks.filter(t => t.projectId === selectedProjectFilter);
  }
  if (selectedStatusFilter !== 'all') {
    visibleTasks = visibleTasks.filter(t => t.status === selectedStatusFilter);
  }
  if (selectedPriorityFilter !== 'all') {
    visibleTasks = visibleTasks.filter(t => t.priority === selectedPriorityFilter);
  }

  // Date Range Filter
  if (selectedDateRangeFilter !== 'all') {
    const today = new Date();
    const todayStr = todayIso();
    visibleTasks = visibleTasks.filter(t => {
      const taskD = new Date(t.taskDate);
      if (selectedDateRangeFilter === 'today') {
        return t.taskDate === todayStr;
      } else if (selectedDateRangeFilter === 'week') {
        const diffDays = Math.abs((today.getTime() - taskD.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 7;
      } else if (selectedDateRangeFilter === 'month') {
        return taskD.getMonth() === today.getMonth();
      }
      return true;
    });
  }

  const hasActiveFilters = selectedProjectFilter !== 'all' || selectedStatusFilter !== 'all' || selectedPriorityFilter !== 'all' || selectedDateRangeFilter !== 'all' || searchQuery.trim() !== '';

  const handleClearFilters = () => {
    setSelectedProjectFilter('all');
    setSelectedStatusFilter('all');
    setSelectedPriorityFilter('all');
    setSelectedDateRangeFilter('all');
    setSearchQuery('');
  };

  // 1-Click CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Contributor', 'Project', 'Priority', 'Status', 'Description', 'Hours', 'Logged Date', 'Due Date', 'Reviewer Remark'];
    const rows = visibleTasks.map(t => {
      const contributor = users.find(u => u.id === t.contributorId)?.fullName || '';
      const project = projects.find(p => p.id === t.projectId)?.name || '';
      return [
        t.id,
        `"${contributor}"`,
        `"${project}"`,
        t.priority,
        t.status,
        `"${t.description.replace(/"/g, '""')}"`,
        t.hours,
        t.taskDate,
        t.dueDate || '',
        `"${(t.reviewerRemark || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `erp_tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIndicator = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Completed</span>;
      case 'Pending Admin':
        return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending Admin</span>;
      case 'Submitted':
        return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md"><span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Submitted</span>;
      case 'In Progress':
        return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-md"><span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> In Progress</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Not Started</span>;
    }
  };

  const getPriorityIndicator = (priority?: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Urgent</span>;
      case 'high':
        return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> High</span>;
      case 'medium':
        return <span className="inline-flex items-center gap-1 text-[11px] font-normal text-purple-700"><span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Medium</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-400">Low</span>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleOpenReview = (task: Task) => {
    setSelectedTaskForReview(task);
    setIsReviewOpen(true);
  };

  const handleOpenDrawer = (task: Task) => {
    setSelectedTaskForDrawer(task);
    setIsDrawerOpen(true);
  };

  const handleDeleteTask = async (task: Task) => {
    const contributor = users.find(u => u.id === task.contributorId);
    const confirmMsg = `Are you sure you want to delete task:\n"${task.description}"?\n\nAn automated email notification will be dispatched to ${contributor?.fullName || 'the contributor'} informing them that this assigned task was cancelled/deleted.`;
    if (window.confirm(confirmMsg)) {
      await deleteTask(task.id);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Executive Task Metrics Quick Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-4 rounded-2xl border border-purple-500/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Total Tasks</div>
          <div className="text-2xl font-black mt-1 text-white">{visibleTasks.length}</div>
          <div className="text-[10px] text-purple-200/80 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Active Operations
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">In Progress</div>
          <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
            {visibleTasks.filter(t => t.status === 'In Progress').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span> Active execution
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-purple-100 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Submitted / Review</div>
          <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
            {visibleTasks.filter(t => t.status === 'Submitted' || t.status === 'Pending Admin').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Pending sign-off
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Completed</div>
          <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
            {visibleTasks.filter(t => t.status === 'Completed').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified deliverables
          </div>
        </div>
      </div>

      {/* Clean Structured Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 dark:border-purple-950 shadow-2xs space-y-3">
        
        {/* Row 1: View Toggle, Search, Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white text-purple-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban' ? 'bg-white text-purple-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </button>
            </div>

            {/* Keyword Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-purple-500" />
              <Input 
                placeholder="Search tasks, contributors..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 border-purple-200/80 text-slate-800 placeholder:text-slate-400 focus:ring-purple-500 bg-white rounded-lg font-normal"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              className="h-8 text-xs font-medium gap-1.5 border-purple-200 text-purple-950 hover:bg-purple-50 rounded-lg"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" /> Export CSV
            </Button>
          </div>

        </div>

        {/* Row 2: Structured Filter Select Dropdowns with Explicit Clear Filters Button */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-purple-50">
          
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[11px] font-semibold text-slate-500">Filters:</span>
          </div>

          {/* Date Range Select */}
          <Select value={selectedDateRangeFilter} onValueChange={setSelectedDateRangeFilter}>
            <SelectTrigger className="text-xs h-8 w-[130px] border-purple-200/80 bg-white font-normal text-purple-950 rounded-lg">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Dates</SelectItem>
              <SelectItem value="today" className="text-xs">Logged Today</SelectItem>
              <SelectItem value="week" className="text-xs">This Week</SelectItem>
              <SelectItem value="month" className="text-xs">This Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Project Select */}
          <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
            <SelectTrigger className="text-xs h-8 w-[135px] border-purple-200/80 bg-white font-normal text-purple-950 rounded-lg">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Select */}
          <Select value={selectedPriorityFilter} onValueChange={setSelectedPriorityFilter}>
            <SelectTrigger className="text-xs h-8 w-[125px] border-purple-200/80 bg-white font-normal text-purple-950 rounded-lg">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
              <SelectItem value="urgent" className="text-xs">Urgent</SelectItem>
              <SelectItem value="high" className="text-xs">High</SelectItem>
              <SelectItem value="medium" className="text-xs">Medium</SelectItem>
              <SelectItem value="low" className="text-xs">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Select */}
          <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
            <SelectTrigger className="text-xs h-8 w-[130px] border-purple-200/80 bg-white font-normal text-purple-950 rounded-lg">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="Not Started" className="text-xs">Not Started</SelectItem>
              <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
              <SelectItem value="Submitted" className="text-xs">Submitted</SelectItem>
              <SelectItem value="Pending Admin" className="text-xs">Pending Admin</SelectItem>
              <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Explicit Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 text-xs font-semibold gap-1 text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg ml-auto"
            >
              <XCircle className="w-3.5 h-3.5 text-purple-600" /> Clear Filters
            </Button>
          )}

        </div>

      </div>

      {/* Main View Render: Table vs Kanban Board */}
      {viewMode === 'kanban' ? (
        <KanbanBoard 
          tasks={visibleTasks} 
          onOpenReview={handleOpenReview} 
          onOpenDrawer={handleOpenDrawer} 
        />
      ) : (
        <div className="bg-white border border-purple-100 rounded-xl overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-purple-50/50 border-b border-purple-100">
              <TableRow className="border-b border-purple-100 hover:bg-transparent">
                <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-purple-900/80 uppercase tracking-wider">Contributor</TableHead>
                <TableHead className="w-[120px] py-2.5 px-3 text-[11px] font-semibold text-purple-900/80 uppercase tracking-wider">Project</TableHead>
                <TableHead className="w-[90px] py-2.5 px-3 text-[11px] font-semibold text-purple-900/80 uppercase tracking-wider">Priority</TableHead>
                <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-purple-900/80 uppercase tracking-wider">Task Description & Deliverable Proof</TableHead>
                <TableHead className="w-[120px] py-2.5 px-3 text-[11px] font-semibold text-purple-900/80 uppercase tracking-wider">Status</TableHead>
                <TableHead className="w-[150px] py-2.5 px-4 text-right text-[11px] font-semibold text-purple-900/80 uppercase tracking-wider">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-purple-50">
              {visibleTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 text-xs font-normal">
                    No tasks found matching current filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                visibleTasks.map(task => {
                  const contributor = users.find(u => u.id === task.contributorId);
                  const assigner = task.assignedBy ? users.find(u => u.id === task.assignedBy) : null;
                  const project = projects.find(p => p.id === task.projectId);

                  const isOwnTask = currentUser.id === task.contributorId;
                  const canReviewerReview = currentUser.roleTier === 'reviewer' && task.status === 'Submitted';
                  const canAdminReview = currentUser.roleTier === 'admin' && (task.status === 'Pending Admin' || task.status === 'Submitted');

                  const checklistTotal = task.checklist ? task.checklist.length : 0;
                  const checklistDone = task.checklist ? task.checklist.filter(c => c.completed).length : 0;

                  return (
                    <TableRow 
                      key={task.id} 
                      className="hover:bg-purple-50/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDrawer(task)}
                    >
                      
                      {/* Contributor */}
                      <TableCell className="align-top py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <Avatar className="h-7 w-7 border border-purple-200">
                            {contributor?.avatarUrl ? <AvatarImage src={contributor.avatarUrl} alt={contributor.fullName} /> : null}
                            <AvatarFallback className="bg-purple-600 text-white font-medium text-[10px]">
                              {getInitials(contributor?.fullName || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-xs font-semibold text-purple-950 group-hover:text-purple-700">
                              {contributor?.fullName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal">{contributor?.title}</div>
                            {assigner && (
                              <div className="text-[10px] text-purple-600 font-normal pt-0.5">
                                Assigned by {assigner.fullName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Project */}
                      <TableCell className="align-top py-3 px-3">
                        <span className="text-[11px] font-medium text-purple-900 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded">
                          {project?.name || 'General'}
                        </span>
                      </TableCell>

                      {/* Priority */}
                      <TableCell className="align-top py-3 px-3">
                        {getPriorityIndicator(task.priority)}
                      </TableCell>

                      {/* Task Description & Deliverables */}
                      <TableCell className="align-top py-3 px-4 space-y-1.5">
                        <p className="text-xs font-normal text-slate-800 leading-relaxed">
                          {task.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span>
                            {task.status === 'Not Started' || task.status === 'In Progress'
                              ? `${task.hours} hrs allocated`
                              : `${task.hours} hrs logged`}
                          </span>
                          <span>&bull;</span>
                          <span>
                            {task.status === 'Not Started' || task.status === 'In Progress'
                              ? `Assigned ${new Date(task.createdAt || task.taskDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                              : `Logged ${new Date(task.updatedAt || task.taskDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                          </span>
                          
                          {/* Deliverable Link Badge */}
                          {task.deliverableUrl && (
                            <a 
                              href={task.deliverableUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              onClick={e => e.stopPropagation()} 
                              className="text-purple-700 font-medium flex items-center gap-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded text-[10px] transition-colors"
                            >
                              <LinkIcon className="w-3 h-3 text-purple-600" /> Proof Link <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}

                          {/* Checklist progress badge */}
                          {checklistTotal > 0 && (
                            <span className="text-purple-700 font-medium flex items-center gap-1 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded text-[10px]">
                              <CheckSquare className="w-3 h-3 text-purple-600" /> {checklistDone}/{checklistTotal} Subtasks
                            </span>
                          )}
                        </div>

                        {/* Remarks */}
                        {(task.reviewerRemark || task.adminRemark) && (
                          <div className="mt-1.5 p-2.5 bg-purple-50/70 border-l-2 border-purple-600 rounded-r-md text-xs space-y-1">
                            {task.reviewerRemark && (
                              <div>
                                <span className="text-[11px] font-medium text-purple-900 block">Reviewer Remark:</span>
                                <p className="text-xs text-slate-700 font-normal">{task.reviewerRemark}</p>
                              </div>
                            )}
                            {task.adminRemark && (
                              <div>
                                <span className="text-[11px] font-medium text-purple-900 block">Admin Remark:</span>
                                <p className="text-xs text-slate-700 font-normal">{task.adminRemark}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-top py-3 px-3">
                        {getStatusIndicator(task.status)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="align-top py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {isOwnTask && task.status === 'Not Started' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs font-medium rounded-md border-purple-200 text-purple-900 hover:bg-purple-50"
                              onClick={() => updateTaskStatus(task.id, 'In Progress')}
                            >
                              Start Task
                            </Button>
                          )}

                          {isOwnTask && task.status === 'In Progress' && (
                            <Button 
                              size="sm" 
                              className="h-7 text-xs font-medium gap-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white shadow-2xs"
                              onClick={() => updateTaskStatus(task.id, 'Submitted')}
                            >
                              <Send className="w-3 h-3" /> Submit
                            </Button>
                          )}

                          {canReviewerReview && (
                            <Button 
                              size="sm" 
                              className="h-7 text-xs font-medium gap-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white shadow-2xs"
                              onClick={() => handleOpenReview(task)}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Review
                            </Button>
                          )}

                          {canAdminReview && (
                            <Button 
                              size="sm" 
                              className="h-7 text-xs font-medium gap-1 rounded-md bg-purple-700 hover:bg-purple-800 text-white shadow-2xs"
                              onClick={() => handleOpenReview(task)}
                            >
                              <ShieldCheck className="w-3 h-3" /> Sign Off
                            </Button>
                          )}

                          {/* Delete Button for Admin, Reviewer, or Task Assigner/Contributor */}
                          {(currentUser.roleTier === 'admin' || currentUser.roleTier === 'reviewer' || task.assignedBy === currentUser.id || task.contributorId === currentUser.id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Delete Task (Notifies Contributor via Email)"
                              onClick={() => handleDeleteTask(task)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </Button>
                          )}
                        </div>

                        {isOwnTask && task.status === 'Submitted' && (
                          <span className="text-[11px] text-purple-600 italic block pt-1">In Review</span>
                        )}

                        {isOwnTask && task.status === 'Pending Admin' && (
                          <span className="text-[11px] text-amber-600 font-medium block pt-1">Awaiting Admin</span>
                        )}

                        {task.status === 'Completed' && (
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-end gap-1 pt-1">
                            Approved
                          </span>
                        )}

                      </TableCell>

                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Review Dialog */}
      <TaskReviewDialog 
        task={selectedTaskForReview} 
        open={isReviewOpen} 
        onOpenChange={setIsReviewOpen} 
      />

      {/* Detail Audit Drawer */}
      <TaskDetailDrawer
        task={selectedTaskForDrawer}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onOpenReview={handleOpenReview}
      />

    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  ShieldCheck, 
  ExternalLink, 
  Link as LinkIcon, 
  CheckSquare, 
  MessageSquare,
  AlertTriangle,
  Lock,
  UserCheck
} from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onOpenReview: (task: Task) => void;
  onOpenDrawer: (task: Task) => void;
}

interface ColumnDef {
  id: TaskStatus;
  label: string;
  badge: string;
  border: string;
  bg: string;
  allowedRoles: ('contributor' | 'reviewer' | 'admin')[];
}

const ALL_COLUMNS: ColumnDef[] = [
  { 
    id: 'Not Started', 
    label: 'Not Started', 
    badge: 'Draft',
    border: 'border-slate-200 dark:border-slate-800', 
    bg: 'bg-slate-50/60 dark:bg-slate-950/60',
    allowedRoles: ['contributor', 'reviewer', 'admin']
  },
  { 
    id: 'In Progress', 
    label: 'In Progress', 
    badge: 'Active',
    border: 'border-sky-200 dark:border-sky-900', 
    bg: 'bg-sky-50/40 dark:bg-sky-950/20',
    allowedRoles: ['contributor', 'reviewer', 'admin']
  },
  { 
    id: 'Submitted', 
    label: 'Reviewer First Pass', 
    badge: 'Lead Pass',
    border: 'border-purple-200 dark:border-purple-900', 
    bg: 'bg-purple-50/40 dark:bg-purple-950/20',
    allowedRoles: ['contributor', 'reviewer', 'admin']
  },
  { 
    id: 'Pending Admin', 
    label: 'Admin Sign-Off', 
    badge: 'Admin Queue',
    border: 'border-amber-200 dark:border-amber-900', 
    bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    allowedRoles: ['reviewer', 'admin']
  },
  { 
    id: 'Completed', 
    label: 'Completed & Approved', 
    badge: 'Approved',
    border: 'border-emerald-200 dark:border-emerald-900', 
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    allowedRoles: ['contributor', 'reviewer', 'admin']
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onOpenReview, onOpenDrawer }) => {
  const { currentUser, users, projects, updateTaskStatus } = useAuth();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  if (!currentUser) return null;

  // Filter columns dynamically based on Role-Based Access Control (RBAC) Tier
  const roleColumns = ALL_COLUMNS.filter(col => col.allowedRoles.includes(currentUser.roleTier));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    // RBAC Kanban Drop Enforcement
    if (targetStatus === 'Completed' && currentUser.roleTier !== 'admin') {
      alert('🔒 Founder/Admin Sign-Off is required to move tasks to Completed.');
      return;
    }

    if (targetStatus === 'Pending Admin' && currentUser.roleTier === 'contributor') {
      alert('🔒 Reviewer First-Pass approval is required before moving to Admin Queue.');
      return;
    }

    // Reviewers dropping into Pending Admin opens Reviewer Pass Dialog
    if (targetStatus === 'Pending Admin' && currentUser.roleTier === 'reviewer') {
      onOpenReview(task);
      return;
    }

    // Admins dropping into Completed opens Admin Sign-Off Dialog
    if (targetStatus === 'Completed' && currentUser.roleTier === 'admin') {
      onOpenReview(task);
      return;
    }

    await updateTaskStatus(task.id, targetStatus);
    setDraggedTaskId(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getPriorityTag = (p?: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return <span className="text-[9px] font-bold uppercase text-rose-700 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">Urgent</span>;
      case 'high':
        return <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">High</span>;
      case 'medium':
        return <span className="text-[9px] font-medium uppercase text-purple-700 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">Medium</span>;
      default:
        return <span className="text-[9px] font-normal uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Low</span>;
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${roleColumns.length} gap-4 pt-2`}>
      {roleColumns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);

        return (
          <div 
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.id)}
            className={`flex flex-col h-[640px] rounded-2xl border ${col.border} ${col.bg} p-3 space-y-3 transition-colors`}
          >
            {/* RBAC Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{col.label}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[9px] font-extrabold uppercase bg-purple-100 text-purple-800 dark:bg-slate-800 dark:text-purple-300 px-1.5 py-0.5 rounded-md">
                  {col.badge}
                </span>
                <Badge variant="purple" className="text-[10px] font-bold px-2 py-0.5">
                  {colTasks.length}
                </Badge>
              </div>
            </div>

            {/* Task Cards Stack */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {colTasks.length === 0 ? (
                <div className="h-36 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-400 font-medium">
                  No tasks in {col.label}
                </div>
              ) : (
                colTasks.map(task => {
                  const contributor = users.find(u => u.id === task.contributorId);
                  const project = projects.find(p => p.id === task.projectId);

                  const checklistTotal = task.checklist ? task.checklist.length : 0;
                  const checklistDone = task.checklist ? task.checklist.filter(c => c.completed).length : 0;

                  return (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                      onClick={() => onOpenDrawer(task)}
                      className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all space-y-2.5 cursor-grab active:cursor-grabbing group"
                    >
                      {/* Top Row: Project & Priority */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-purple-200/60 dark:border-slate-700">
                          {project?.name || 'General'}
                        </span>
                        {getPriorityTag(task.priority)}
                      </div>

                      {/* Description */}
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors leading-snug line-clamp-3">
                        {task.description}
                      </p>

                      {/* Deliverable Proof Link Badge */}
                      {task.deliverableUrl && (
                        <a 
                          href={task.deliverableUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-slate-800 hover:bg-purple-100 p-1.5 rounded-lg border border-purple-200/80 dark:border-slate-700 transition-colors w-full truncate"
                        >
                          <LinkIcon className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate">{task.deliverableUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
                        </a>
                      )}

                      {/* Subtasks Progress */}
                      {checklistTotal > 0 && (
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium bg-slate-50 dark:bg-slate-800 p-1.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                          <CheckSquare className="w-3 h-3 text-purple-600" />
                          <span>{checklistDone}/{checklistTotal} Subtasks</span>
                        </div>
                      )}

                      {/* Footer: Avatar & Due Date */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                        <div className="flex items-center space-x-1.5">
                          <Avatar className="h-5 w-5 border border-purple-200">
                            {contributor?.avatarUrl ? <AvatarImage src={contributor.avatarUrl} alt={contributor.fullName} /> : null}
                            <AvatarFallback className="bg-purple-600 text-white font-bold text-[9px]">
                              {getInitials(contributor?.fullName || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{contributor?.fullName}</span>
                        </div>
                        <span className="font-semibold text-purple-700 dark:text-purple-400">{task.hours}h</span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Task } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Calendar, CheckCircle2, Send, ShieldCheck, MessageSquare, History, Link as LinkIcon, ExternalLink, CheckSquare, Square } from 'lucide-react';

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenReview?: (task: Task) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({ task, open, onOpenChange, onOpenReview }) => {
  const { currentUser, users, projects, updateTaskStatus } = useAuth();

  if (!task || !currentUser) return null;

  const contributor = users.find(u => u.id === task.contributorId);
  const assigner = task.assignedBy ? users.find(u => u.id === task.assignedBy) : null;
  const reviewer = task.reviewerId ? users.find(u => u.id === task.reviewerId) : null;
  const admin = task.adminId ? users.find(u => u.id === task.adminId) : null;
  const project = projects.find(p => p.id === task.projectId);

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">Urgent</Badge>;
      case 'high':
        return <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider">High Priority</Badge>;
      case 'medium':
        return <Badge variant="info" className="text-[10px] uppercase font-bold tracking-wider">Medium</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] uppercase font-medium">Low</Badge>;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const hasAction = (currentUser.id === task.contributorId && task.status === 'In Progress') ||
    ((currentUser.roleTier === 'reviewer' && task.status === 'Submitted') || 
     (currentUser.roleTier === 'admin' && (task.status === 'Pending Admin' || task.status === 'Submitted')));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col bg-white border border-slate-200 shadow-xl rounded-2xl">
        
        {/* Modal Header */}
        <DialogHeader className="border-b border-slate-100 pb-3 pr-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs font-bold border-purple-300 text-purple-900 bg-purple-50">{project?.name}</Badge>
              {getPriorityBadge(task.priority)}
            </div>
            <span className="text-[11px] text-slate-500 font-mono font-semibold">ID: {task.id}</span>
          </div>
          <DialogTitle className="text-base font-bold text-slate-900 pt-2 leading-snug">
            {task.description}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1 text-xs">
          
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Contributor</span>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6 border border-purple-300">
                  {contributor?.avatarUrl ? <AvatarImage src={contributor.avatarUrl} alt={contributor.fullName} /> : null}
                  <AvatarFallback className="text-[10px] font-bold bg-purple-600 text-white">
                    {getInitials(contributor?.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-bold text-slate-900 text-xs">{contributor?.fullName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Assigner</span>
              <span className="font-bold text-slate-900 block text-xs">
                {assigner ? assigner.fullName : 'Self-logged'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Target Due Date</span>
              <span className="font-bold text-slate-900 block text-xs">{task.dueDate || 'N/A'}</span>
            </div>
          </div>

          {/* Deliverable Proof Link */}
          {task.deliverableUrl && (
            <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-700 tracking-wider block">
                Deliverable Proof URL (Figma / GitHub PR / Drive Link)
              </span>
              <a 
                href={task.deliverableUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-semibold text-purple-900 hover:text-purple-700 underline flex items-center gap-1.5 break-all"
              >
                <LinkIcon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>{task.deliverableUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}

          {/* Subtask Checklist Items */}
          {task.checklist && task.checklist.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Subtask Checklist ({task.checklist.filter(c => c.completed).length}/{task.checklist.length} Completed)
              </span>
              <div className="space-y-1.5">
                {task.checklist.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2.5 p-2 bg-slate-50 border border-slate-200/80 rounded-lg">
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={`text-xs ${item.completed ? 'line-through text-slate-400' : 'text-slate-900 font-medium'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Remarks Section */}
          {(task.reviewerRemark || task.adminRemark) && (
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-purple-600" /> Reviewer & Admin Remarks
              </h4>

              {task.reviewerRemark && (
                <div className="p-3.5 bg-purple-50 border-l-4 border-purple-600 rounded-r-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-950">
                      Reviewer First Pass ({reviewer?.fullName || 'Reviewer'}):
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{task.reviewedAt ? new Date(task.reviewedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-xs font-semibold pl-2 text-slate-900">{task.reviewerRemark}</p>
                </div>
              )}

              {task.adminRemark && (
                <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950">
                      Founder / Admin Final Sign-Off ({admin?.fullName || 'Admin'}):
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{task.approvedAt ? new Date(task.approvedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-xs font-semibold pl-2 text-slate-900">{task.adminRemark}</p>
                </div>
              )}
            </div>
          )}

          {/* Audit Activity Log Timeline */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-600" /> Activity Timeline & Audit Log
            </h4>

            <div className="space-y-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-8">
              {task.activityLog && task.activityLog.length > 0 ? (
                task.activityLog.map((log) => (
                  <div key={log.id} className="relative space-y-0.5 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="absolute -left-[27px] top-3.5 h-2.5 w-2.5 rounded-full bg-purple-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-bold text-slate-900 text-xs">{log.actorName} <span className="text-[10px] font-semibold text-slate-500">({log.actorRole})</span></span>
                      <span className="text-[10px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900">{log.action}</p>
                    {log.note && <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg mt-1 italic border border-slate-200">{log.note}</p>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No detailed history available.</p>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions if action required */}
        {hasAction && (
          <div className="border-t border-slate-100 pt-3 flex items-center justify-end space-x-2">
            {currentUser.id === task.contributorId && task.status === 'In Progress' && (
              <Button 
                size="sm" 
                className="text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm"
                onClick={() => {
                  updateTaskStatus(task.id, 'Submitted');
                  onOpenChange(false);
                }}
              >
                <Send className="w-3.5 h-3.5" /> Submit for Review
              </Button>
            )}

            {((currentUser.roleTier === 'reviewer' && task.status === 'Submitted') || 
              (currentUser.roleTier === 'admin' && (task.status === 'Pending Admin' || task.status === 'Submitted'))) && (
              <Button 
                size="sm" 
                className="text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm"
                onClick={() => {
                  onOpenChange(false);
                  if (onOpenReview) onOpenReview(task);
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Open Review Action
              </Button>
            )}
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};

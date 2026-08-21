import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Task } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, RotateCcw, MessageSquare, ShieldCheck, Check, Clock, Calendar, User, FileText } from 'lucide-react';

interface TaskReviewDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskReviewDialog: React.FC<TaskReviewDialogProps> = ({ task, open, onOpenChange }) => {
  const { currentUser, users, projects, reviewTaskByReviewer, reviewTaskByAdmin } = useAuth();
  
  const [actionType, setActionType] = useState<'approved' | 'sent_back'>('approved');
  const [remark, setRemark] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!task || !currentUser) return null;

  const contributor = users.find(u => u.id === task.contributorId);
  const project = projects.find(p => p.id === task.projectId);
  const isReviewerStep = task.status === 'Submitted' && currentUser.roleTier === 'reviewer';
  const isAdminStep = (task.status === 'Pending Admin' || task.status === 'Submitted') && currentUser.roleTier === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === 'sent_back' && !remark.trim()) return;

    setIsSubmitting(true);
    try {
      if (isReviewerStep) {
        await reviewTaskByReviewer(task.id, actionType, remark);
      } else if (isAdminStep) {
        await reviewTaskByAdmin(task.id, actionType, remark);
      }
      setRemark('');
      onOpenChange(false);
    } catch (err) {
      console.error('Error reviewing task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
        
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                {isReviewerStep ? 'Reviewer First-Pass Review' : 'Admin Final Sign-Off'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal">
                Review contributor submission and approve or send back for revisions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          
          {/* Task Info Card (Layman Clear Layout) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            
            {/* Contributor & Project Tag Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Avatar className="h-7 w-7 border border-slate-300">
                  <AvatarFallback className="bg-purple-600 text-white font-bold text-[10px]">
                    {getInitials(contributor?.fullName || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-bold text-sm text-slate-900 block leading-tight">{contributor?.fullName}</span>
                  <span className="text-[11px] text-slate-500 font-normal">{contributor?.title}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-bold bg-white border-purple-300 text-purple-900 px-2.5 py-0.5">
                {project?.name || 'General'}
              </Badge>
            </div>

            {/* Task Description in High-Contrast Slate-900 */}
            <div className="pt-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Task Description</span>
              <p className="text-xs font-semibold text-slate-900 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                {task.description}
              </p>
            </div>

            {/* Clean High-Contrast Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-200/80">
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Logged: <strong className="text-slate-900">{task.taskDate}</strong>
              </span>
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Hours: <strong className="text-slate-900">{task.hours} hrs</strong>
              </span>
              {task.dueDate && (
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 font-medium flex items-center gap-1">
                  Due: <strong className="text-slate-900">{task.dueDate}</strong>
                </span>
              )}
            </div>

          </div>

          {/* Previous Reviewer Remarks (if Admin Stage) */}
          {task.reviewerRemark && (
            <div className="p-3.5 bg-purple-50 border-l-4 border-purple-600 rounded-r-xl space-y-1">
              <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" /> Reviewer First Pass Remark:
              </span>
              <p className="text-xs font-medium text-slate-800 pl-5">{task.reviewerRemark}</p>
            </div>
          )}

          {/* Review Decision Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            
            {/* Decision Buttons */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Select Review Action</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl border text-xs font-bold transition-all ${
                    actionType === 'approved'
                      ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActionType('approved')}
                >
                  <Check className={`w-4 h-4 ${actionType === 'approved' ? 'text-white' : 'text-slate-400'}`} />
                  Approve Task
                </button>

                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl border text-xs font-bold transition-all ${
                    actionType === 'sent_back'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActionType('sent_back')}
                >
                  <RotateCcw className="w-4 h-4" />
                  Send Back for Revisions
                </button>
              </div>
            </div>

            {/* Remark Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Reviewer / Admin Notes</span>
                {actionType === 'sent_back' && (
                  <span className="text-[10px] text-rose-600 font-bold">* Required for Send Back</span>
                )}
              </Label>
              <Textarea
                placeholder={actionType === 'sent_back' 
                  ? 'Specify what needs to be revised before resubmitting...'
                  : 'Add optional feedback or approval remarks...'}
                value={remark}
                onChange={e => setRemark(e.target.value)}
                className="text-xs min-h-[85px] border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-purple-600 rounded-xl font-normal"
                required={actionType === 'sent_back'}
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300 text-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSubmitting || (actionType === 'sent_back' && !remark.trim())}
                className={`h-9 px-5 text-xs font-bold rounded-xl shadow-md ${
                  actionType === 'sent_back'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isSubmitting ? 'Processing...' : actionType === 'approved' ? 'Confirm Approval' : 'Send Back Task'}
              </Button>
            </DialogFooter>

          </form>

        </div>
      </DialogContent>
    </Dialog>
  );
};

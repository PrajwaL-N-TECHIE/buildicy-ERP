import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Project } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FolderKanban, Calendar, Clock, Users, Plus, Target, CalendarDays, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';

interface ProjectListProps {
  onOpenProjectManagement?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onOpenProjectManagement }) => {
  const { currentUser, projects, tasks, users, updateProjectDeadline } = useAuth();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDeadlineDialogOpen, setIsDeadlineDialogOpen] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!currentUser) return null;

  const isAdmin = currentUser.roleTier === 'admin' || currentUser.roleTier === 'reviewer';

  const handleOpenDeadlineDialog = (proj: Project) => {
    setSelectedProject(proj);
    setDueDate(proj.deadline?.dueDate || '2026-08-30');
    setNote(proj.deadline?.note || '');
    setIsDeadlineDialogOpen(true);
  };

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !dueDate) return;

    setIsSubmitting(true);
    try {
      await updateProjectDeadline(selectedProject.id, dueDate, note);
      setIsDeadlineDialogOpen(false);
    } catch (err) {
      console.error('Error updating project deadline:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-purple-100 shadow-2xs">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" /> Projects & Target Deadlines
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Track project deliverables, target deadlines, and team member assignments.
          </p>
        </div>

        {onOpenProjectManagement && isAdmin && (
          <Button size="sm" onClick={onOpenProjectManagement} className="text-xs h-9 px-4 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs">
            <FolderKanban className="w-4 h-4 mr-1.5" /> Manage Projects Directory
          </Button>
        )}
      </div>

      {/* Project Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map(proj => {
          const projTasks = tasks.filter(t => t.projectId === proj.id);
          const completedTasks = projTasks.filter(t => t.status === 'Completed').length;
          const pendingTasks = projTasks.filter(t => t.status !== 'Completed').length;
          const members = users.filter(u => proj.memberIds.includes(u.id));

          const pct = projTasks.length > 0 ? Math.round((completedTasks / projTasks.length) * 100) : 0;

          return (
            <Card key={proj.id} className="bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-all rounded-2xl p-5 space-y-4">
              
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{proj.name}</h4>
                  <span className="text-[10px] text-slate-400 font-normal">Created {proj.createdAt ? new Date(proj.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <Badge variant="purple" className="text-[10px] font-bold">
                  {projTasks.length} Tasks
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Completion</span>
                  <span className="text-purple-700 font-bold">{pct}% ({completedTasks}/{projTasks.length})</span>
                </div>
                <div className="w-full h-2 bg-purple-50 rounded-full overflow-hidden border border-purple-100">
                  <div className="h-full bg-purple-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Target Deadline Card */}
              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-purple-700 tracking-wider flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-purple-600" /> Target Deadline
                  </span>
                  {isAdmin && (
                    <button 
                      onClick={() => handleOpenDeadlineDialog(proj)}
                      className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 underline"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-bold text-purple-950">{proj.deadline?.dueDate || 'Not set'}</span>
                  {proj.deadline?.note && (
                    <span className="text-[10px] text-slate-600 italic truncate max-w-[130px]">{proj.deadline.note}</span>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Assigned Team ({members.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {members.map(m => (
                    <Badge key={m.id} variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 bg-slate-50 text-slate-800 border border-slate-200/80 flex items-center gap-1">
                      <Avatar className="h-4 w-4 border border-purple-300">
                        {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt={m.fullName} /> : null}
                        <AvatarFallback className="bg-purple-600 text-white text-[8px] font-bold">
                          {getInitials(m.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{m.fullName}</span>
                    </Badge>
                  ))}
                </div>
              </div>

            </Card>
          );
        })}
      </div>

      {/* Target Deadline Edit Dialog */}
      <Dialog open={isDeadlineDialogOpen} onOpenChange={setIsDeadlineDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100 pr-6">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Update Project Target Deadline
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal">
                  Set target completion date for {selectedProject?.name}. Dispatches team email notifications.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveDeadline} className="space-y-4 py-2 text-xs">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Target Due Date</Label>
              <Input 
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Deadline Context Note / Objective</Label>
              <Textarea 
                placeholder="e.g. Sprint 4 Voice AI Release milestone..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="text-xs min-h-[75px] border-slate-300 rounded-xl font-normal"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDeadlineDialogOpen(false)} className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !dueDate} className="h-9 px-5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                {isSubmitting ? 'Saving...' : 'Update Deadline & Notify Team'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Project } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FolderKanban, 
  CalendarDays, 
  Target, 
  Edit3, 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Archive, 
  CheckCircle2, 
  Users, 
  Plus 
} from 'lucide-react';

import { useToast } from '@/context/ToastContext';
import { SEED_USERS } from '@/firebase/config';

export const ProjectList: React.FC = () => {
  const toast = useToast();
  const { 
    currentUser, 
    projects, 
    tasks, 
    users, 
    addProject, 
    updateProject, 
    deleteProject, 
    updateProjectDeadline 
  } = useAuth();

  // Target Deadline Modal state
  const [selectedProjectForDeadline, setSelectedProjectForDeadline] = useState<Project | null>(null);
  const [isDeadlineDialogOpen, setIsDeadlineDialogOpen] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [deadlineNote, setDeadlineNote] = useState<string>('');
  const [isSubmittingDeadline, setIsSubmittingDeadline] = useState<boolean>(false);

  // Add / Edit Project Directory Modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Delete Project Confirmation state
  const [deleteConfirmProj, setDeleteConfirmProj] = useState<Project | null>(null);

  if (!currentUser) return null;

  const isAdmin = currentUser.roleTier === 'admin' || currentUser.roleTier === 'reviewer';

  // --- Project Directory Management Handlers ---
  const handleOpenCreateProject = () => {
    setEditingProjId(null);
    setProjectName('');
    const availableUsers = users && users.length > 0 ? users : SEED_USERS;
    setSelectedMemberIds(availableUsers.map(u => u.id));
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditingProjId(proj.id);
    setProjectName(proj.name);
    setSelectedMemberIds(proj.memberIds || []);
    setIsProjectModalOpen(true);
  };

  const handleToggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      if (editingProjId) {
        await updateProject(editingProjId, {
          name: projectName,
          memberIds: selectedMemberIds
        });
        toast.success('Project Updated! 📁', `Updated team assignments & details for "${projectName}".`);
      } else {
        await addProject(projectName, selectedMemberIds);
        toast.success('Project Created! 🎉', `Project "${projectName}" created successfully.`);
      }
      setIsProjectModalOpen(false);
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Could not save project.');
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (deleteConfirmProj) {
      const name = deleteConfirmProj.name;
      try {
        await deleteProject(deleteConfirmProj.id);
        toast.success('Project Deleted 🗑️', `Project "${name}" permanently removed.`);
      } catch (err: any) {
        toast.error('Delete Failed', err?.message || 'Could not delete project.');
      }
      setDeleteConfirmProj(null);
    }
  };

  // --- Target Deadline Handlers ---
  const handleOpenDeadlineDialog = (proj: Project) => {
    setSelectedProjectForDeadline(proj);
    setDueDate(proj.deadline?.dueDate || '2026-09-30');
    setDeadlineNote(proj.deadline?.note || '');
    setIsDeadlineDialogOpen(true);
  };

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForDeadline || !dueDate) return;

    setIsSubmittingDeadline(true);
    try {
      await updateProjectDeadline(selectedProjectForDeadline.id, dueDate, deadlineNote);
      toast.success('Target Deadline Set! 📅', `Target due date updated for ${selectedProjectForDeadline.name}.`);
      setIsDeadlineDialogOpen(false);
    } catch (err: any) {
      toast.error('Deadline Update Error', err?.message || 'Could not save deadline.');
      console.error('Error updating project deadline:', err);
    } finally {
      setIsSubmittingDeadline(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Unified Creation Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-purple-100 shadow-2xs">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" /> Projects & Target Deadlines Directory
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Unified workspace to manage projects, assigned team members, progress tracking, and target deadlines.
          </p>
        </div>

        {isAdmin && (
          <Button 
            size="sm" 
            onClick={handleOpenCreateProject} 
            className="text-xs h-9 px-4 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs gap-1.5"
          >
            <FolderPlus className="w-4 h-4" /> Create New Project
          </Button>
        )}
      </div>

      {/* Project Cards Grid */}
      {projects.length === 0 ? (
        <Card className="bg-white border border-purple-100 p-12 text-center rounded-2xl shadow-2xs space-y-3">
          <FolderKanban className="w-12 h-12 text-purple-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-900">No Projects Found</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no active projects created in the directory.
          </p>
          {isAdmin && (
            <Button size="sm" onClick={handleOpenCreateProject} className="text-xs h-9 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs font-bold">
              <FolderPlus className="w-4 h-4 mr-1.5" /> Create Project Now
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(proj => {
            const projTasks = tasks.filter(t => t.projectId === proj.id);
            const completedTasks = projTasks.filter(t => t.status === 'Completed').length;
            const members = users.filter(u => proj.memberIds?.includes(u.id));
            const pct = projTasks.length > 0 ? Math.round((completedTasks / projTasks.length) * 100) : 0;
            const isAssignedToCurrentUser = proj.memberIds?.includes(currentUser.id);

            return (
              <Card key={proj.id} className={`bg-white border transition-all rounded-2xl p-5 space-y-4 flex flex-col justify-between ${
                isAssignedToCurrentUser 
                  ? 'border-purple-300 shadow-xs ring-1 ring-purple-400/30' 
                  : 'border-slate-200/90 shadow-2xs hover:shadow-xs'
              }`}>
                
                <div className="space-y-4">
                  {/* Header & Membership Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{proj.name}</h4>
                        {isAssignedToCurrentUser && (
                          <Badge variant="purple" className="text-[9px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                            ✓ Assigned to You
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Created {proj.createdAt ? new Date(proj.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={proj.active ? 'purple' : 'secondary'} className="text-[10px] font-bold">
                        {proj.active ? `${projTasks.length} Tasks` : 'Archived'}
                      </Badge>
                    </div>
                  </div>

                  {/* Completion Progress Bar */}
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
                        <span className="text-[10px] text-slate-600 italic truncate max-w-[150px]">{proj.deadline.note}</span>
                      )}
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Assigned Team ({members.length})
                      </span>
                      {isAdmin && (
                        <button 
                          onClick={() => handleOpenEditProject(proj)}
                          className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Edit Team
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {members.map(m => {
                        const isMe = m.id === currentUser.id;
                        return (
                          <Badge 
                            key={m.id} 
                            variant="secondary" 
                            className={`text-[10px] font-semibold px-2 py-0.5 flex items-center gap-1 rounded-lg border ${
                              isMe 
                                ? 'bg-purple-100 text-purple-950 border-purple-300 font-extrabold ring-1 ring-purple-400/40' 
                                : 'bg-slate-50 text-slate-800 border-slate-200/80'
                            }`}
                          >
                            <Avatar className="h-4 w-4 border border-purple-300">
                              {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt={m.fullName} /> : null}
                              <AvatarFallback className="bg-purple-600 text-white text-[8px] font-bold">
                                {getInitials(m.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{m.fullName} {isMe ? '(You)' : ''}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Admin Project Directory Controls */}
                {isAdmin && (
                  <div className="pt-3 border-t border-purple-50 flex items-center justify-between gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => updateProject(proj.id, { active: !proj.active })} 
                      className="h-7 text-xs px-2 text-slate-500 hover:bg-purple-50 hover:text-purple-700 rounded-lg"
                    >
                      <Archive className="w-3 h-3 mr-1 text-slate-400" /> {proj.active ? 'Archive' : 'Activate'}
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDeleteConfirmProj(proj)} 
                      className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                )}

              </Card>
            );
          })}
        </div>
      )}

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
                  Set target completion date for {selectedProjectForDeadline?.name}. Dispatches team notifications.
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
                placeholder="e.g. Sprint milestone target..."
                value={deadlineNote}
                onChange={e => setDeadlineNote(e.target.value)}
                className="text-xs min-h-[75px] border-slate-300 rounded-xl font-normal"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDeadlineDialogOpen(false)} className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingDeadline || !dueDate} className="h-9 px-5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                {isSubmittingDeadline ? 'Saving...' : 'Update Deadline & Notify Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Form Modal (Create / Edit) */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl w-[92vw] p-6 bg-white border border-slate-200 shadow-2xl rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100 pr-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {editingProjId ? 'Edit Project & Assign Teammates' : 'Create New Project'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal">
                  Define project name and click teammates to assign or remove them from this project workspace.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveProject} className="space-y-5 py-3 text-xs">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-900">Project Name</Label>
              <Input 
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="E.g., Voice Agent, Markeee, Buildicy CRM..."
                className="h-10 text-sm border-slate-300 rounded-xl font-medium px-3.5 focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="space-y-2.5">
              {(() => {
                const displayUsers = users && users.length > 0 ? users : SEED_USERS;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" /> Select Teammates ({selectedMemberIds.length}/{displayUsers.length} assigned)
                      </Label>
                      <div className="flex items-center space-x-2">
                        <button 
                          type="button" 
                          onClick={() => setSelectedMemberIds(displayUsers.map(u => u.id))} 
                          className="text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors"
                        >
                          Select All
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setSelectedMemberIds([])} 
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Scrollable spacious list of team members */}
                    <div className="max-h-72 sm:max-h-80 overflow-y-auto border border-slate-200 rounded-2xl p-2.5 space-y-2 bg-slate-50/80">
                      {displayUsers.map(u => {
                        const isSelected = selectedMemberIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => handleToggleMember(u.id)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                              isSelected 
                                ? 'bg-purple-50/90 border-purple-300 text-purple-950 shadow-2xs font-semibold' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
                            }`}
                          >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8 border border-purple-200 shrink-0">
                          {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.fullName} /> : null}
                          <AvatarFallback className="bg-purple-600 text-white text-xs font-bold">
                            {getInitials(u.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{u.email} • <span className="capitalize">{u.roleTier}</span></div>
                        </div>
                      </div>
                      <Badge 
                        variant={isSelected ? 'purple' : 'outline'} 
                        className={`text-xs px-3 py-1 font-bold rounded-lg ${
                          isSelected ? 'bg-purple-600 text-white shadow-2xs' : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        {isSelected ? '✓ Assigned' : '+ Click to Add'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

            <DialogFooter className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsProjectModalOpen(false)} className="h-10 px-5 text-xs font-semibold rounded-xl border-slate-300">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-10 px-6 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                {editingProjId ? 'Save Project & Teammates' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmProj} onOpenChange={(open) => !open && setDeleteConfirmProj(null)}>
        <DialogContent className="sm:max-w-sm p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Project
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1">
              Are you sure you want to delete project <strong className="text-slate-900">{deleteConfirmProj?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" className="text-xs h-8 rounded-xl" onClick={() => setDeleteConfirmProj(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-xl" onClick={handleConfirmDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

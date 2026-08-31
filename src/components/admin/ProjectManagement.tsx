import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Project } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus, Edit2, Plus, Users, Calendar, Trash2 } from 'lucide-react';

export const ProjectManagement: React.FC = () => {
  const { currentUser, projects, users, addProject, updateProject, deleteProject } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [deleteConfirmProj, setDeleteConfirmProj] = useState<Project | null>(null);

  if (currentUser?.roleTier !== 'admin') {
    return null;
  }

  const handleOpenNew = () => {
    setEditingProjId(null);
    setName('');
    setSelectedMemberIds(users.map(u => u.id));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditingProjId(proj.id);
    setName(proj.name);
    setSelectedMemberIds(proj.memberIds || []);
    setIsModalOpen(true);
  };

  const handleToggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProjId) {
      updateProject(editingProjId, {
        name,
        memberIds: selectedMemberIds
      });
    } else {
      addProject(name, selectedMemberIds);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmProj) {
      await deleteProject(deleteConfirmProj.id);
      setDeleteConfirmProj(null);
    }
  };

  return (
    <div className="space-y-4">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            Project Directory Management
          </h2>
          <p className="text-xs text-muted-foreground">
            Create projects, modify details, and assign member teams.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenNew} className="text-xs h-8">
          <FolderPlus className="w-3.5 h-3.5 mr-1" /> Add New Project
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Team Members</TableHead>
                <TableHead>Current Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(proj => {
                const members = users.filter(u => proj.memberIds?.includes(u.id));

                return (
                  <TableRow key={proj.id} className="hover:bg-muted/40 text-xs">
                    <TableCell className="font-bold text-foreground">
                      {proj.name}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {members.map(m => (
                          <Badge key={m.id} variant="secondary" className="text-[10px]">
                            {m.fullName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      {proj.deadline ? (
                        <div className="font-semibold">{proj.deadline.dueDate}</div>
                      ) : (
                        <span className="text-muted-foreground italic">None</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant={proj.active ? 'success' : 'secondary'} className="text-[10px]">
                        {proj.active ? 'Active' : 'Archived'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(proj)} className="h-7 text-xs px-2">
                        <Edit2 className="w-3 h-3 text-muted-foreground mr-1" /> Edit Members
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => updateProject(proj.id, { active: !proj.active })} 
                        className="h-7 text-xs px-2 text-muted-foreground"
                      >
                        {proj.active ? 'Archive' : 'Activate'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDeleteConfirmProj(proj)} 
                        className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Project Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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

          <form onSubmit={handleSubmit} className="space-y-5 py-3 text-xs">
            
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-900">Project Name</Label>
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="E.g., Voice Agent, Markeee, Buildicy CRM..."
                className="h-10 text-sm border-slate-300 rounded-xl font-medium px-3.5 focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" /> Select Teammates ({selectedMemberIds.length}/{users.length} assigned)
                </Label>
                <div className="flex items-center space-x-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedMemberIds(users.map(u => u.id))} 
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
                {users.map(u => {
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
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{u.email} • <span className="capitalize">{u.roleTier}</span></div>
                      </div>
                      <Badge 
                        variant={isSelected ? 'default' : 'outline'} 
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
            </div>

            <DialogFooter className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="h-10 px-5 text-xs font-semibold rounded-xl border-slate-300">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-10 px-6 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                {editingProjId ? 'Save Project Members' : 'Create Project'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmProj} onOpenChange={(open) => !open && setDeleteConfirmProj(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Project
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to delete project <strong className="text-slate-900">{deleteConfirmProj?.name}</strong> from the directory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setDeleteConfirmProj(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmDelete}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

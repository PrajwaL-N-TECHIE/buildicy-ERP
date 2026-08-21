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
import { FolderPlus, Edit2, Plus, Users, Calendar } from 'lucide-react';

export const ProjectManagement: React.FC = () => {
  const { currentUser, projects, users, addProject, updateProject } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

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
                        <Edit2 className="w-3 h-3 text-muted-foreground" /> Edit Members
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => updateProject(proj.id, { active: !proj.active })} 
                        className="h-7 text-xs px-2 text-muted-foreground"
                      >
                        {proj.active ? 'Archive' : 'Activate'}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingProjId ? 'Edit Project Members' : 'Create New Project'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define project title and select assigned team members.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 py-2 text-xs">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Project Name</Label>
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="E.g., Voice Agent, Markeee, Bizbrain..."
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assign Team Members</Label>
              <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1 bg-muted/20">
                {users.map(u => {
                  const isSelected = selectedMemberIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleMember(u.id)}
                      className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary font-semibold border border-primary/30' : 'hover:bg-muted'
                      }`}
                    >
                      <span>{u.fullName} ({u.title})</span>
                      <Badge variant={isSelected ? 'default' : 'outline'} className="text-[10px]">
                        {isSelected ? 'Assigned' : 'Add'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingProjId ? 'Save Project' : 'Create Project'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

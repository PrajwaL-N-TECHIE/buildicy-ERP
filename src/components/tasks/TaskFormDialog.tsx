import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TaskPriority, TaskChecklistItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Link, CheckSquare, Sparkles } from 'lucide-react';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskFormDialog: React.FC<TaskFormDialogProps> = ({ open, onOpenChange }) => {
  const { currentUser, users, projects, createTask } = useAuth();

  const [contributorId, setContributorId] = useState<string>(users.find(u => u.roleTier === 'contributor')?.id || '');
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [description, setDescription] = useState<string>('');
  const [hours, setHours] = useState<number>(1);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [deliverableUrl, setDeliverableUrl] = useState<string>('');
  const [checklists, setChecklists] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!currentUser) return null;

  const isAssigning = currentUser.roleTier !== 'contributor';
  const availableContributors = users.filter(u => u.active && u.roleTier === 'contributor');

  const handleAddChecklistItem = () => {
    if (newChecklistText.trim()) {
      setChecklists([...checklists, newChecklistText.trim()]);
      setNewChecklistText('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklists(checklists.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const checklistObj: TaskChecklistItem[] = checklists.map((text, i) => ({
        id: `chk-${Date.now()}-${i}`,
        text,
        completed: false
      }));

      await createTask({
        contributorId: isAssigning ? (contributorId || availableContributors[0]?.id || currentUser.id) : currentUser.id,
        projectId,
        description,
        hours,
        priority,
        dueDate: dueDate || undefined,
        deliverableUrl: deliverableUrl || undefined,
        checklist: checklistObj.length > 0 ? checklistObj : undefined
      });

      // Reset form
      setDescription('');
      setHours(1);
      setPriority('medium');
      setDueDate('');
      setDeliverableUrl('');
      setChecklists([]);
      onOpenChange(false);
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
        
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-slate-100 pr-6 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {isAssigning ? 'Assign Task to Team Member' : 'Log Daily Task Entry'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal">
                {isAssigning ? 'Top-down task assignment with 2-step quality review gate.' : 'Log work done today for reviewer pass.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 py-3 text-xs">
          
          {/* Contributor Selection (if Assigning) */}
          {isAssigning && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Assignee (Contributor / Intern)</Label>
              <Select value={contributorId} onValueChange={setContributorId}>
                <SelectTrigger className="h-9 text-xs border-slate-300 rounded-xl font-medium">
                  <SelectValue placeholder="Select Contributor" />
                </SelectTrigger>
                <SelectContent>
                  {availableContributors.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                      {c.fullName} ({c.title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Project & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-9 text-xs border-slate-300 rounded-xl font-medium">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-medium">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Priority Level</Label>
              <Select value={priority} onValueChange={(val: TaskPriority) => setPriority(val)}>
                <SelectTrigger className="h-9 text-xs border-slate-300 rounded-xl font-medium">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent" className="text-xs font-bold text-rose-700">Urgent</SelectItem>
                  <SelectItem value="high" className="text-xs font-bold text-amber-700">High</SelectItem>
                  <SelectItem value="medium" className="text-xs font-bold text-purple-700">Medium</SelectItem>
                  <SelectItem value="low" className="text-xs font-medium text-slate-600">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-900">Task Description</Label>
            <Textarea 
              placeholder="Describe work completed or task objectives clearly..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="text-xs min-h-[75px] border-slate-300 focus:ring-purple-600 rounded-xl font-normal"
              required
            />
          </div>

          {/* Hours & Target Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Logged Hours</Label>
              <Input 
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={hours}
                onChange={e => setHours(parseFloat(e.target.value) || 0)}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Target Due Date (Optional)</Label>
              <Input 
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>

          {/* Deliverable URL (Proof Submission) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-purple-600" /> Deliverable Proof Link (Figma / GitHub PR / Drive)
            </Label>
            <Input 
              type="url"
              placeholder="https://figma.com/file/... or https://github.com/org/repo/pull/12"
              value={deliverableUrl}
              onChange={e => setDeliverableUrl(e.target.value)}
              className="h-9 text-xs border-slate-300 rounded-xl font-normal"
            />
          </div>

          {/* Subtask Checklist Builder */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-purple-600" /> Subtask Checklist Items
              </span>
              <span className="text-[10px] text-slate-400 font-normal">({checklists.length} items)</span>
            </Label>

            <div className="flex items-center space-x-2">
              <Input 
                placeholder="Add subtask item..."
                value={newChecklistText}
                onChange={e => setNewChecklistText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                className="h-8 text-xs border-slate-300 rounded-lg font-normal"
              />
              <Button type="button" size="sm" onClick={handleAddChecklistItem} className="h-8 text-xs px-3 font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
                Add
              </Button>
            </div>

            {checklists.length > 0 && (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {checklists.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <span className="text-slate-800 font-medium truncate">{item}</span>
                    <button type="button" onClick={() => handleRemoveChecklistItem(idx)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <DialogFooter className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !description.trim()} className="h-9 px-5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
              {isSubmitting ? 'Saving...' : isAssigning ? 'Assign Task' : 'Log Task Entry'}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
};

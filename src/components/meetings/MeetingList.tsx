import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Meeting } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Plus, Video, CalendarDays, Trash2 } from 'lucide-react';

export const MeetingList: React.FC = () => {
  const { currentUser, meetings, projects, users, scheduleMeeting, deleteMeeting } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('none');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [location, setLocation] = useState<string>('https://meet.google.com/sbd-ccfe-hnz');
  const [notes, setNotes] = useState<string>('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!currentUser) return null;

  const canSchedule = currentUser.roleTier === 'admin' || currentUser.roleTier === 'reviewer';

  let visibleMeetings = meetings;
  if (currentUser.roleTier === 'contributor') {
    visibleMeetings = meetings.filter(m => m.participantIds.includes(currentUser.id));
  }

  const handleOpenSchedule = () => {
    setTitle('');
    setProjectId('none');
    setScheduledAt(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    setLocation('https://meet.google.com/sbd-ccfe-hnz');
    setNotes('');
    setSelectedParticipants([currentUser.id]);
    setIsDialogOpen(true);
  };

  const handleToggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt || selectedParticipants.length === 0) return;

    setIsSubmitting(true);
    try {
      await scheduleMeeting({
        title,
        projectId: projectId === 'none' ? null : projectId,
        participantIds: selectedParticipants,
        scheduledAt,
        location,
        notes
      });
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error scheduling meeting:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string, meetingTitle: string) => {
    if (window.confirm(`Are you sure you want to cancel and delete "${meetingTitle}"?`)) {
      await deleteMeeting(meetingId);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-100 dark:border-purple-950 shadow-2xs">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Video className="w-4 h-4 text-purple-600" /> Scheduled Meetings & Syncs
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            {canSchedule 
              ? 'Schedule team meetings and dispatch email invitations to selected attendees.'
              : 'Upcoming meetings you have been invited to participate in.'}
          </p>
        </div>

        {canSchedule && (
          <Button size="sm" onClick={handleOpenSchedule} className="text-xs h-9 px-4 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs">
            <Plus className="w-4 h-4 mr-1.5" /> Schedule Meeting
          </Button>
        )}
      </div>

      {/* Meeting Cards Grid */}
      {visibleMeetings.length === 0 ? (
        <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl">
          <CardContent className="p-10 text-center text-slate-400 text-xs font-normal">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            No scheduled meetings found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleMeetings.map(meet => {
            const project = meet.projectId ? projects.find(p => p.id === meet.projectId) : null;
            const organizer = users.find(u => u.id === meet.createdBy);
            const participants = users.filter(u => meet.participantIds.includes(u.id));
            const canDelete = currentUser.roleTier === 'admin' || currentUser.id === meet.createdBy;

            return (
              <Card key={meet.id} className="bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-all rounded-2xl space-y-0">
                <CardHeader className="p-5 pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-bold text-slate-900 leading-snug">{meet.title}</CardTitle>
                    <div className="flex items-center space-x-2 shrink-0">
                      {project && (
                        <Badge variant="purple" className="text-[10px] font-bold">
                          {project.name}
                        </Badge>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteMeeting(meet.id, meet.title)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Scheduled Meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs text-slate-500 pt-1 flex items-center gap-2 font-normal">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-bold text-purple-950 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/80">
                      {new Date(meet.scheduledAt).toLocaleString()}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-50/80 p-3 rounded-xl border border-purple-200/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-950 truncate">
                      <Video className="w-4 h-4 text-purple-600 shrink-0 animate-pulse" />
                      <span className="truncate">{meet.location || 'https://meet.google.com/sbd-ccfe-hnz'}</span>
                    </div>
                    <a
                      href={meet.location && meet.location.startsWith('http') ? meet.location : 'https://meet.google.com/sbd-ccfe-hnz'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all shrink-0"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Call →
                    </a>
                  </div>

                  {meet.notes && (
                    <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-slate-700 font-normal">
                      <strong className="text-purple-950 font-bold">Agenda Notes:</strong> {meet.notes}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-600" /> Participants ({participants.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {participants.map(p => (
                        <Badge key={p.id} variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-200/60">
                          {p.fullName} ({p.title})
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {organizer && (
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 font-normal">
                      Scheduled by: <strong className="text-slate-700">{organizer.fullName}</strong> ({organizer.title})
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Meeting Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100 pr-6">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Schedule Team Meeting
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal">
                  Dispatch automated email invites to all selected participants.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Meeting Title</Label>
              <Input 
                placeholder="e.g., Voice Agent Weekly Sprint Review"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Associated Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="h-9 text-xs border-slate-300 rounded-xl font-medium">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">General / None</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs font-medium">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Date & Time</Label>
                <Input 
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Location / Call Link</Label>
              <Input 
                placeholder="Google Meet link or Conference Room 2"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Agenda Notes</Label>
              <Textarea 
                placeholder="Key discussion points, review goals..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="text-xs min-h-[65px] border-slate-300 rounded-xl font-normal"
              />
            </div>

            {/* Participants Selector */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <Label className="text-xs font-bold text-slate-900">
                Select Invitees ({selectedParticipants.length} selected)
              </Label>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {users.map(u => (
                  <label key={u.id} className="flex items-center space-x-2 p-1.5 bg-slate-50 hover:bg-purple-50 rounded-lg cursor-pointer border border-slate-200 text-xs">
                    <input 
                      type="checkbox"
                      checked={selectedParticipants.includes(u.id)}
                      onChange={() => handleToggleParticipant(u.id)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-900">{u.fullName}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({u.title})</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !title.trim() || selectedParticipants.length === 0} className="h-9 px-5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                {isSubmitting ? 'Scheduling...' : 'Dispatch Meeting Invites'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

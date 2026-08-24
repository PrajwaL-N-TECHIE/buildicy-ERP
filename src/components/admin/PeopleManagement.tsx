import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, RoleTier } from '@/types';
import { todayIso } from '@/lib/date';
import { OrgTreeViewer } from './OrgTreeViewer';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, ShieldCheck, UserCheck, Mail, GitBranch, Table as TableIcon, Edit3, Calendar, DollarSign, Key, Cake } from 'lucide-react';

import { sendWelcomeMessageToUser, hasWelcomeBeenSentToUser } from '@/firebase/notifications';
import { useToast } from '@/context/ToastContext';

export const PeopleManagement: React.FC = () => {
  const toast = useToast();
  const { currentUser, users, projects, tasks, attendanceRecords, addUser, updateUser, toggleUserActive, addAuditLog } = useAuth();
  const [sendingUserWelcomeId, setSendingUserWelcomeId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'directory' | 'org-tree'>('directory');
  
  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [roleTier, setRoleTier] = useState<RoleTier>('contributor');
  const [dob, setDob] = useState<string>('');
  const [dateOfJoining, setDateOfJoining] = useState<string>('');
  const [sourceOfHiring, setSourceOfHiring] = useState<string>('Campus Placement');
  const [salary, setSalary] = useState<number>(30000);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit User State
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<User | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState<boolean>(false);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editRoleTier, setEditRoleTier] = useState<RoleTier>('contributor');
  const [editDob, setEditDob] = useState<string>('');
  const [editDateOfJoining, setEditDateOfJoining] = useState<string>('');
  const [editSourceOfHiring, setEditSourceOfHiring] = useState<string>('');
  const [editSalary, setEditSalary] = useState<number>(30000);
  const [editPhoneNumber, setEditPhoneNumber] = useState<string>('');
  const [editSelectedProjects, setEditSelectedProjects] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  if (!currentUser) return null;

  const isAdmin = currentUser.roleTier === 'admin';

  const handleOpenAddUser = () => {
    setFirstName('');
    setLastName('');
    setUsername('');
    setPassword(roleTier === 'admin' ? 'admin@123' : roleTier === 'reviewer' ? 'reviewer@123' : 'intern@123');
    setEmail('');
    setTitle('');
    setRoleTier('contributor');
    setDob('2003-01-01');
    setDateOfJoining('2026-01-10');
    setSourceOfHiring('Campus Placement');
    setSalary(30000);
    setPhoneNumber('');
    setSelectedProjects([]);
    setIsAddUserOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setSelectedUserToEdit(user);
    setEditFirstName(user.firstName || user.fullName.split(' ')[0] || '');
    setEditLastName(user.lastName || user.fullName.split(' ').slice(1).join(' ') || '');
    setEditUsername(user.username || user.email.split('@')[0] || '');
    setEditPassword(user.password || (user.roleTier === 'admin' ? 'admin@123' : user.roleTier === 'reviewer' ? 'reviewer@123' : 'intern@123'));
    setEditEmail(user.email);
    setEditTitle(user.title);
    setEditRoleTier(user.roleTier);
    setEditDob(user.dob || '2003-01-01');
    setEditDateOfJoining(user.dateOfJoining || '2026-01-10');
    setEditSourceOfHiring(user.sourceOfHiring || 'Campus Placement');
    setEditSalary(user.salary || 30000);
    setEditPhoneNumber(user.phoneNumber || '');
    setEditSelectedProjects(user.projectIds || []);
    setEditIsActive(user.active);
    setIsEditUserOpen(true);
  };

  const handleToggleProject = (projId: string) => {
    if (selectedProjects.includes(projId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projId));
    } else {
      setSelectedProjects([...selectedProjects, projId]);
    }
  };

  const handleToggleEditProject = (projId: string) => {
    if (editSelectedProjects.includes(projId)) {
      setEditSelectedProjects(editSelectedProjects.filter(id => id !== projId));
    } else {
      setEditSelectedProjects([...editSelectedProjects, projId]);
    }
  };

  const handleSendWelcomeToSingleUser = async (targetUser: User) => {
    if (!currentUser || sendingUserWelcomeId) return;

    if (hasWelcomeBeenSentToUser(targetUser)) {
      toast.warning(
        'Welcome Already Sent ✉️',
        `Welcome message was already sent to ${targetUser.fullName} (${targetUser.email}). Welcome messages are limited to once per member.`
      );
      return;
    }

    setSendingUserWelcomeId(targetUser.id);
    try {
      const res = await sendWelcomeMessageToUser(targetUser, currentUser);
      addAuditLog(
        'WELCOME_EMAIL_SENT',
        `User: ${targetUser.fullName}`,
        `Individual welcome email dispatched to ${targetUser.email} via Resend Mail Gateway by ${currentUser.fullName}.`
      );

      if (res && res.success === false) {
        toast.error('Resend Email Error', res.error || `Failed to send email to ${targetUser.email}`);
      } else {
        await updateUser(targetUser.id, { welcomeSent: true, welcomeSentAt: new Date().toISOString() });
        toast.success('Welcome Email Dispatched! 🚀', `Welcome email sent to ${targetUser.fullName} (${targetUser.email}) via Resend API.`);
      }
    } catch (err: any) {
      console.error('Error sending individual welcome email:', err);
      toast.error('Email Failed', err?.message || 'Unexpected exception sending welcome email.');
    } finally {
      setSendingUserWelcomeId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim() || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await addUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        username: username.trim() || email.split('@')[0],
        password: password.trim() || 'intern@123',
        email: email.trim(),
        title: title.trim(),
        roleTier,
        dob,
        dateOfJoining,
        sourceOfHiring,
        salary,
        phoneNumber,
        projectIds: selectedProjects,
        active: true
      });
      setIsAddUserOpen(false);
      toast.success('Member Onboarded! 🎉', `${firstName} ${lastName} added successfully.`);
    } catch (err: any) {
      console.error('Error adding user:', err);
      toast.error('Onboarding Error', err?.message || 'Could not onboard user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToEdit || !editFirstName.trim() || !editEmail.trim() || !editTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await updateUser(selectedUserToEdit.id, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        fullName: `${editFirstName.trim()} ${editLastName.trim()}`.trim(),
        username: editUsername.trim(),
        password: editPassword.trim(),
        email: editEmail.trim(),
        title: editTitle.trim(),
        roleTier: editRoleTier,
        dob: editDob,
        dateOfJoining: editDateOfJoining,
        sourceOfHiring: editSourceOfHiring,
        salary: editSalary,
        phoneNumber: editPhoneNumber,
        projectIds: editSelectedProjects,
        active: editIsActive
      });
      setIsEditUserOpen(false);
      toast.success('Profile Updated! ✏️', `Updated profile for ${editFirstName} ${editLastName}.`);
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error('Update Failed', err?.message || 'Could not update user profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-purple-100 shadow-2xs">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" /> Personnel Directory & Zoho People Management
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Manage employee details, DOB, hiring sources, salaries, and company hierarchy structure.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => setViewMode('directory')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'directory' ? 'bg-white text-purple-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Directory</span>
            </button>
            <button
              onClick={() => setViewMode('org-tree')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'org-tree' ? 'bg-white text-purple-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Org Tree</span>
            </button>
          </div>

          {isAdmin && (
            <Button size="sm" onClick={handleOpenAddUser} className="text-xs h-9 px-4 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs">
              <Plus className="w-4 h-4 mr-1.5" /> Onboard Member
            </Button>
          )}

        </div>
      </div>

      {/* Render View Mode: Directory Table vs Org Tree */}
      {viewMode === 'org-tree' ? (
        <OrgTreeViewer />
      ) : (
        <div className="bg-white border border-purple-100 rounded-2xl overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-purple-50/50 border-b border-purple-100">
              <TableRow className="border-b border-purple-100">
                <TableHead className="py-3 px-4 font-bold text-xs text-purple-950 uppercase tracking-wider">Member Name</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-purple-950 uppercase tracking-wider">Username</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-purple-950 uppercase tracking-wider">Role Tier</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-purple-950 uppercase tracking-wider">Job Title</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-purple-950 uppercase tracking-wider">DOB & Joining</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-purple-950 uppercase tracking-wider">Hours Worked Today</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-purple-950 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-purple-50">
              {users.map(u => (
                <TableRow key={u.id} className="hover:bg-purple-50/30 transition-colors">
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <Avatar className="h-8 w-8 border border-purple-200">
                        {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.fullName} /> : null}
                        <AvatarFallback className="bg-purple-600 text-white font-bold text-xs">
                          {getInitials(u.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block leading-tight">{u.fullName}</span>
                        <span className="text-[10px] text-slate-500 font-normal">{u.email}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 px-3 font-mono text-xs text-purple-950 font-semibold">
                    {u.email || u.username}
                  </TableCell>

                  <TableCell className="py-3.5 px-3">
                    <Badge variant={u.roleTier === 'admin' ? 'default' : u.roleTier === 'reviewer' ? 'purple' : 'info'} className="text-[10px] font-bold uppercase">
                      {u.roleTier === 'admin' ? 'Admin' : u.roleTier === 'reviewer' ? 'Leads' : 'Employee'}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3.5 px-3 font-medium text-xs text-slate-700">
                    {u.title}
                  </TableCell>

                  <TableCell className="py-3.5 px-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="block font-semibold text-purple-950 text-[11px]">🎂 {u.dob || '1998-05-14'}</span>
                      <span className="block text-[10px] text-slate-500">Joined: {u.dateOfJoining || '2025-01-01'}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 px-3 font-extrabold text-xs text-purple-950">
                    {tasks.filter(t => t.contributorId === u.id && t.taskDate === todayIso()).reduce((sum, t) => sum + (t.hours || 0), 0)} hrs
                  </TableCell>

                  <TableCell className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {attendanceRecords.some(r => r.userId === u.id && r.date === todayIso() && r.status === 'checked_in') && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                          ● Checked In
                        </span>
                      )}

                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>

                      {/* Send Welcome Email Button / Welcome Sent Badge */}
                      {hasWelcomeBeenSentToUser(u) ? (
                        <span 
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed shrink-0"
                          title={`Welcome email was already sent to ${u.fullName} (${u.email}) - Limited to once per member.`}
                        >
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>Welcome Sent</span>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendWelcomeToSingleUser(u)}
                          disabled={sendingUserWelcomeId === u.id}
                          className="h-7 px-2.5 text-[10px] font-bold border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg gap-1 shrink-0"
                          title={`Send welcome email to ${u.fullName} (${u.email}) via Resend (Single-send limit)`}
                        >
                          <Mail className="w-3 h-3 text-purple-600" />
                          <span>{sendingUserWelcomeId === u.id ? 'Sending...' : 'Send Welcome'}</span>
                        </Button>
                      )}

                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEditUser(u)}
                          className="h-7 w-7 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                          title="Edit Team Member Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add User Dialog with Complete Zoho People HR Fields */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100 pr-6 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Onboard New Employee (Zoho People)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal">
                  Create account credentials, DOB, joining details, and salary package.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 py-3 text-xs">
            
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">First Name</Label>
                <Input 
                  placeholder="e.g. Rajeshwari"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Last Name</Label>
                <Input 
                  placeholder="e.g. M"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Login Username</Label>
                <Input 
                  placeholder="rajeshwari.sde"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Key className="w-3 h-3 text-purple-600" /> Initial Password
                </Label>
                <Input 
                  type="password"
                  placeholder="intern@123"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Work Email Address</Label>
              <Input 
                type="email"
                placeholder="rajeshwari@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Job Title / Role</Label>
                <Input 
                  placeholder="e.g. SDE Intern"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Role Tier</Label>
                <Select value={roleTier} onValueChange={(val: RoleTier) => setRoleTier(val)}>
                  <SelectTrigger className="h-9 text-xs border-slate-300 rounded-xl font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contributor" className="text-xs font-medium">Contributor / Intern</SelectItem>
                    <SelectItem value="reviewer" className="text-xs font-bold text-purple-700">Reviewer / Lead</SelectItem>
                    <SelectItem value="admin" className="text-xs font-bold text-slate-900">Admin / Founder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* DOB & Date of Joining */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Cake className="w-3 h-3 text-purple-600" /> Date of Birth (DOB)
                </Label>
                <Input 
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-600" /> Date of Joining
                </Label>
                <Input 
                  type="date"
                  value={dateOfJoining}
                  onChange={e => setDateOfJoining(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
            </div>

            {/* Source of Hiring & Monthly Salary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Source of Hiring</Label>
                <Select value={sourceOfHiring} onValueChange={setSourceOfHiring}>
                  <SelectTrigger className="h-9 text-xs border-slate-300 rounded-xl font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Campus Placement" className="text-xs">Campus Placement</SelectItem>
                    <SelectItem value="LinkedIn Outreach" className="text-xs">LinkedIn Outreach</SelectItem>
                    <SelectItem value="Employee Referral" className="text-xs">Employee Referral</SelectItem>
                    <SelectItem value="Direct Application" className="text-xs">Direct Application</SelectItem>
                    <SelectItem value="Founder Direct" className="text-xs">Founder Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-600" /> Monthly Salary (₹)
                </Label>
                <Input 
                  type="number"
                  value={salary}
                  onChange={e => setSalary(parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-extrabold text-emerald-700"
                  required
                />
              </div>
            </div>

            {/* Project Assignments */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <Label className="text-xs font-bold text-slate-900">
                Assign to Projects ({selectedProjects.length} selected)
              </Label>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {projects.map(p => (
                  <label key={p.id} className="flex items-center space-x-2 p-1.5 bg-slate-50 hover:bg-purple-50 rounded-lg cursor-pointer border border-slate-200 text-xs">
                    <input 
                      type="checkbox"
                      checked={selectedProjects.includes(p.id)}
                      onChange={() => handleToggleProject(p.id)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-900">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100 shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddUserOpen(false)} className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !firstName.trim()} className="h-9 px-5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                {isSubmitting ? 'Onboarding...' : 'Onboard Employee'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog with Complete Zoho People HR Fields */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100 pr-6 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Edit Personnel Record (Zoho People)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal">
                  Update DOB, joining date, password, hiring source, and salary package for {selectedUserToEdit?.fullName}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 py-3 text-xs">
            
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">First Name</Label>
                <Input 
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Last Name</Label>
                <Input 
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Login Username</Label>
                <Input 
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Key className="w-3 h-3 text-purple-600" /> Account Password
                </Label>
                <Input 
                  type="text"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Work Email Address</Label>
              <Input 
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Job Title / Role</Label>
                <Input 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Role Tier</Label>
                <Select value={editRoleTier} onValueChange={(val: RoleTier) => setEditRoleTier(val)}>
                  <SelectTrigger className="h-9 text-xs border-slate-300 rounded-xl font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contributor" className="text-xs font-medium">Contributor / Intern</SelectItem>
                    <SelectItem value="reviewer" className="text-xs font-bold text-purple-700">Reviewer / Lead</SelectItem>
                    <SelectItem value="admin" className="text-xs font-bold text-slate-900">Admin / Founder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* DOB & Date of Joining */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Cake className="w-3 h-3 text-purple-600" /> Date of Birth (DOB)
                </Label>
                <Input 
                  type="date"
                  value={editDob}
                  onChange={e => setEditDob(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-600" /> Date of Joining
                </Label>
                <Input 
                  type="date"
                  value={editDateOfJoining}
                  onChange={e => setEditDateOfJoining(e.target.value)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
            </div>

            {/* Source of Hiring & Monthly Salary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Source of Hiring</Label>
                <Select value={editSourceOfHiring} onValueChange={setEditSourceOfHiring}>
                  <SelectTrigger className="h-9 text-xs border-slate-300 rounded-xl font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Campus Placement" className="text-xs">Campus Placement</SelectItem>
                    <SelectItem value="LinkedIn Outreach" className="text-xs">LinkedIn Outreach</SelectItem>
                    <SelectItem value="Employee Referral" className="text-xs">Employee Referral</SelectItem>
                    <SelectItem value="Direct Application" className="text-xs">Direct Application</SelectItem>
                    <SelectItem value="Founder Direct" className="text-xs">Founder Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-600" /> Monthly Salary (₹)
                </Label>
                <Input 
                  type="number"
                  value={editSalary}
                  onChange={e => setEditSalary(parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs border-slate-300 rounded-xl font-extrabold text-emerald-700"
                  required
                />
              </div>
            </div>

            {/* Account Status Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Account Active Status</span>
              <button
                type="button"
                onClick={() => setEditIsActive(!editIsActive)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  editIsActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {editIsActive ? 'Active' : 'Inactive'}
              </button>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100 shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditUserOpen(false)} className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !editFirstName.trim()} className="h-9 px-5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

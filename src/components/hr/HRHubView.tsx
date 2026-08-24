import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, RoleTier } from '@/types';
import { todayIso } from '@/lib/date';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrgTreeViewer } from '@/components/admin/OrgTreeViewer';
import { 
  Cake, 
  Gift, 
  CalendarDays, 
  Users, 
  Award, 
  Sparkles, 
  Briefcase, 
  Filter, 
  PartyPopper,
  Lock,
  Plus,
  Edit3,
  UserCheck,
  Calendar,
  Clock,
  Key,
  GitBranch,
  Table as TableIcon
} from 'lucide-react';

export const HRHubView: React.FC = () => {
  const { currentUser, users, projects, tasks, attendanceRecords, addUser, updateUser, toggleUserActive, sendChatMessage } = useAuth();
  
  const [wishSuccessMsg, setWishSuccessMsg] = useState<string>('');
  const [birthdayFilter, setBirthdayFilter] = useState<'today' | 'this_month' | 'next_month' | 'all'>('today');
  const [viewMode, setViewMode] = useState<'directory' | 'org-tree'>('directory');

  // Add User Dialog State
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

  // Edit User Dialog State
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const isTodayBirthday = (u: User): boolean => {
    if (!u.dob) return false;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    let month = 0;
    let day = 0;
    const dobStr = u.dob.trim();

    if (dobStr.includes('-')) {
      const parts = dobStr.split('-');
      if (parts.length === 3) {
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
    } else if (dobStr.includes('/')) {
      const parts = dobStr.split('/');
      if (parts.length === 3) {
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
      }
    } else {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const lower = dobStr.toLowerCase();
      monthNames.forEach((m, idx) => {
        if (lower.includes(m)) month = idx + 1;
      });
      const numMatch = dobStr.match(/\d+/);
      if (numMatch) day = parseInt(numMatch[0], 10);
    }

    return month === currentMonth && day === currentDay;
  };

  const handleSendWish = async (user: User) => {
    if (!isTodayBirthday(user)) {
      setWishSuccessMsg(`🔒 Birthday wishes can only be sent on the member's actual birthday! (${user.fullName}'s DOB: ${user.dob})`);
      setTimeout(() => setWishSuccessMsg(''), 5000);
      return;
    }

    const wishText = `🎉 Happy Birthday ${user.fullName}! 🎂 Wishing you a fantastic year ahead filled with health, happiness, and outstanding achievements! 🎈✨`;
    
    await sendChatMessage({
      recipientId: user.id,
      text: wishText
    });

    setWishSuccessMsg(`🎉 Birthday wish sent to ${user.fullName} in Team Messages!`);
    setTimeout(() => setWishSuccessMsg(''), 5000);
  };

  const handleOpenAddUser = () => {
    setFirstName('');
    setLastName('');
    setUsername('');
    setPassword('intern@123');
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
    } catch (err) {
      console.error('Error adding user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToEdit || !editFirstName.trim() || !editEmail.trim()) return;

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
    } catch (err) {
      console.error('Error updating user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to filter users by birthday criteria
  const getFilteredBirthdayUsers = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    return users.filter(u => {
      if (birthdayFilter === 'all') return true;
      if (!u.dob) return false;
      const dobStr = u.dob;
      
      let month = 8;
      let day = 21;

      if (dobStr.includes('-')) {
        const parts = dobStr.split('-');
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else if (dobStr.includes('Aug')) {
        month = 8;
        day = parseInt(dobStr.replace('Aug', '').trim(), 10) || 21;
      } else if (dobStr.includes('May')) {
        month = 5;
        day = parseInt(dobStr.replace('May', '').trim(), 10) || 14;
      } else if (dobStr.includes('Sep')) {
        month = 9;
        day = parseInt(dobStr.replace('Sep', '').trim(), 10) || 2;
      }

      if (birthdayFilter === 'today') {
        return month === currentMonth && day === currentDay;
      } else if (birthdayFilter === 'this_month') {
        return month === currentMonth;
      } else if (birthdayFilter === 'next_month') {
        return month === 9;
      }
      return true;
    });
  };

  const birthdayUsers = getFilteredBirthdayUsers();

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Onboard Action */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
              <Cake className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Personnel Directory & Employee Hub</h2>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Employee directory, role hierarchy, birthday celebrations, work anniversaries, and hours worked today.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('directory')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'directory' ? 'bg-white dark:bg-slate-900 text-purple-950 dark:text-purple-300 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Directory</span>
            </button>
            <button
              onClick={() => setViewMode('org-tree')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'org-tree' ? 'bg-white dark:bg-slate-900 text-purple-950 dark:text-purple-300 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Org Tree</span>
            </button>
          </div>

          {isAdmin && (
            <Button size="sm" onClick={handleOpenAddUser} className="text-xs h-9 px-4 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs shrink-0">
              <Plus className="w-4 h-4 mr-1.5" /> Onboard Member
            </Button>
          )}
        </div>
      </div>

      {wishSuccessMsg && (
        <div className="p-2.5 bg-purple-50 dark:bg-slate-800 text-purple-900 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-600" /> {wishSuccessMsg}
        </div>
      )}

      {/* 🎂 Team Birthdays & Celebrations Section */}
      <Card className="border border-purple-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-purple-100 dark:border-slate-800 pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <Gift className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Team Birthdays & Celebrations</span>
          </div>

          {/* Interactive Filters Bar */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl space-x-1">
            <button
              onClick={() => setBirthdayFilter('today')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                birthdayFilter === 'today' 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Today's Birthdays
            </button>
            <button
              onClick={() => setBirthdayFilter('this_month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                birthdayFilter === 'this_month' 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              This Month (Aug)
            </button>
            <button
              onClick={() => setBirthdayFilter('next_month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                birthdayFilter === 'next_month' 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Next Month (Sep)
            </button>
            <button
              onClick={() => setBirthdayFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                birthdayFilter === 'all' 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Birthdays
            </button>
          </div>
        </div>

        {/* Unified Responsive Birthday Roster Grid */}
        {birthdayUsers.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-slate-800 text-purple-600 flex items-center justify-center mx-auto shadow-2xs">
              <PartyPopper className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No team birthdays {birthdayFilter === 'today' ? 'today' : 'in this category'} 🎉
            </p>
            <p className="text-xs text-slate-500 font-normal">
              Switch filters above to view upcoming birthdays in this month or next month.
            </p>
            <Button size="sm" onClick={() => setBirthdayFilter('this_month')} className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
              View This Month's Birthdays
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {birthdayUsers.map(user => {
              const isBirthdayToday = isTodayBirthday(user);
              return (
                <div key={user.id} className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-2xs hover:border-purple-300 transition-colors">
                  <div className="flex items-center space-x-3 truncate">
                    <Avatar className="h-9 w-9 border border-purple-300 shrink-0">
                      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName} /> : null}
                      <AvatarFallback className="bg-purple-600 text-white text-xs font-bold">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block leading-tight truncate">{user.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-normal block truncate">{user.title}</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block pt-0.5">🎂 {user.dob || 'Aug 21'}</span>
                    </div>
                  </div>
                  {isBirthdayToday ? (
                    <Button size="sm" onClick={() => handleSendWish(user)} className="text-xs h-8 px-3 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs shrink-0 gap-1">
                      <span>Wish</span> <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button size="sm" disabled title={`Birthday wishes can only be sent on their actual birthday! (${user.dob})`} className="text-xs h-8 px-2.5 font-semibold bg-slate-200/80 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 rounded-xl shrink-0 gap-1 cursor-not-allowed border border-slate-200 dark:border-slate-800">
                      <Lock className="w-3 h-3 text-slate-400" /> <span>Not Today</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Render View Mode: Personnel Table vs Org Tree */}
      {viewMode === 'org-tree' ? (
        <OrgTreeViewer />
      ) : (
        <Card className="border border-purple-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="p-5 bg-purple-50/50 dark:bg-slate-800/50 border-b border-purple-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-600" />
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">Personnel Directory & Member Records</CardTitle>
              </div>
              <Badge variant="purple" className="text-[10px] font-extrabold">
                {users.length} Team Members
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <TableRow className="border-b border-slate-200 dark:border-slate-800">
                  <TableHead className="py-3 px-4 font-bold text-xs text-slate-800 dark:text-slate-200">Member Name</TableHead>
                  <TableHead className="py-3 px-3 font-bold text-xs text-slate-800 dark:text-slate-200">Username</TableHead>
                  <TableHead className="py-3 px-3 font-bold text-xs text-slate-800 dark:text-slate-200">Role Tier</TableHead>
                  <TableHead className="py-3 px-3 font-bold text-xs text-slate-800 dark:text-slate-200">Job Title</TableHead>
                  <TableHead className="py-3 px-3 font-bold text-xs text-slate-800 dark:text-slate-200">DOB & Joining</TableHead>
                  <TableHead className="py-3 px-3 font-bold text-xs text-slate-800 dark:text-slate-200">Hours Worked Today</TableHead>
                  <TableHead className="py-3 px-3 font-bold text-xs text-slate-800 dark:text-slate-200 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => {
                  const isCheckedIn = attendanceRecords.some(r => r.userId === u.id && r.date === todayIso() && r.status === 'checked_in');
                  const userAttRecord = attendanceRecords.find(r => r.userId === u.id && r.date === todayIso());
                  const workedHours = userAttRecord ? userAttRecord.totalWorkedHoursToday : (u.id === 'user-5' ? 5 : 0);

                  return (
                    <TableRow key={u.id} className="hover:bg-purple-50/30 dark:hover:bg-slate-800/50 transition-colors">
                      
                      {/* Member Name */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <Avatar className="h-8 w-8 border border-purple-200">
                            {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.fullName} /> : null}
                            <AvatarFallback className="bg-purple-600 text-white font-bold text-xs">
                              {getInitials(u.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block leading-tight">{u.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{u.email}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Username */}
                      <TableCell className="py-3.5 px-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                        @{u.username || u.email.split('@')[0]}
                      </TableCell>

                      {/* Role Tier */}
                      <TableCell className="py-3.5 px-3">
                        <Badge variant={u.roleTier === 'admin' ? 'default' : u.roleTier === 'reviewer' ? 'purple' : 'info'} className="text-[10px] font-bold uppercase">
                          {u.roleTier === 'admin' ? 'Admin' : u.roleTier === 'reviewer' ? 'Leads' : 'Employee'}
                        </Badge>
                      </TableCell>

                      {/* Job Title */}
                      <TableCell className="py-3.5 px-3 font-medium text-xs text-slate-800 dark:text-slate-200">
                        {u.title}
                      </TableCell>

                      {/* DOB & Joining */}
                      <TableCell className="py-3.5 px-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="block font-semibold text-purple-950 dark:text-purple-300 text-[11px]">🎂 {u.dob || '1998-05-14'}</span>
                          <span className="block text-[10px] text-slate-500">Joined: {u.dateOfJoining || '2025-01-01'}</span>
                        </div>
                      </TableCell>

                      {/* Hours Worked Today */}
                      <TableCell className="py-3.5 px-3 font-extrabold text-xs text-purple-950 dark:text-purple-300">
                        {workedHours} hrs
                      </TableCell>

                      {/* Status & Actions */}
                      <TableCell className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isCheckedIn && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              ● Checked In
                            </span>
                          )}

                          {isAdmin && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleOpenEditUser(u)} 
                              className="h-7 w-7 p-0 text-slate-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg"
                              title="Edit Personnel Member"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add User Onboarding Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" /> Onboard Team Member
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-normal">
              Enter employee details, credentials, job title, DOB, date of joining, and role tier.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 py-2 text-xs">
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">First Name</Label>
                <Input placeholder="e.g. Ramesh" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-9 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Last Name</Label>
                <Input placeholder="e.g. K" value={lastName} onChange={e => setLastName(e.target.value)} className="h-9 text-xs" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Username</Label>
                <Input placeholder="e.g. ramesh.dev" value={username} onChange={e => setUsername(e.target.value)} className="h-9 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Login Password</Label>
                <Input type="text" placeholder="e.g. intern@123" value={password} onChange={e => setPassword(e.target.value)} className="h-9 text-xs font-mono" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Work Email</Label>
                <Input type="email" placeholder="ramesh@company.com" value={email} onChange={e => setEmail(e.target.value)} className="h-9 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Job Title</Label>
                <Input placeholder="e.g. SDE Intern" value={title} onChange={e => setTitle(e.target.value)} className="h-9 text-xs" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Role Tier</Label>
                <Select value={roleTier} onValueChange={(val: RoleTier) => setRoleTier(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contributor" className="text-xs">Employee / Intern</SelectItem>
                    <SelectItem value="reviewer" className="text-xs">Leads / Reviewer</SelectItem>
                    <SelectItem value="admin" className="text-xs">Admin / Founder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Date of Birth (DOB)</Label>
                <Input type="date" value={dob} onChange={e => setDob(e.target.value)} className="h-9 text-xs" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Date of Joining</Label>
                <Input type="date" value={dateOfJoining} onChange={e => setDateOfJoining(e.target.value)} className="h-9 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Monthly Salary (₹)</Label>
                <Input type="number" value={salary} onChange={e => setSalary(Number(e.target.value))} className="h-9 text-xs" required />
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddUserOpen(false)} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="h-9 px-5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                Onboard Member
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Member Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-600" /> Edit Personnel Member Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-normal">
              Update employee details, DOB, joining date, password, salary, and assigned projects.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2 text-xs">
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">First Name</Label>
                <Input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="h-9 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Last Name</Label>
                <Input value={editLastName} onChange={e => setEditLastName(e.target.value)} className="h-9 text-xs" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Username</Label>
                <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} className="h-9 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Password</Label>
                <Input type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="h-9 text-xs font-mono" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Work Email</Label>
                <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-9 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Job Title</Label>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-9 text-xs" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Role Tier</Label>
                <Select value={editRoleTier} onValueChange={(val: RoleTier) => setEditRoleTier(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contributor" className="text-xs">Employee / Intern</SelectItem>
                    <SelectItem value="reviewer" className="text-xs">Leads / Reviewer</SelectItem>
                    <SelectItem value="admin" className="text-xs">Admin / Founder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Date of Birth (DOB)</Label>
                <Input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} className="h-9 text-xs" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Date of Joining</Label>
                <Input type="date" value={editDateOfJoining} onChange={e => setEditDateOfJoining(e.target.value)} className="h-9 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Monthly Salary (₹)</Label>
                <Input type="number" value={editSalary} onChange={e => setEditSalary(Number(e.target.value))} className="h-9 text-xs" required />
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditUserOpen(false)} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="h-9 px-5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                Save Changes
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

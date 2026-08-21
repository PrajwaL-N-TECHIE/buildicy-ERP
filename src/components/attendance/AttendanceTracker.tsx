import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AttendanceRecord } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Play, Square, CheckCircle2, UserCheck, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

export const AttendanceTracker: React.FC = () => {
  const { currentUser, users, tasks, attendanceRecords, checkIn, checkOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [elapsedTimeStr, setElapsedTimeStr] = useState<string>('0h 0m');

  if (!currentUser) return null;

  const todayStr = '2026-08-21';
  const isIntern = currentUser.roleTier === 'contributor';
  const isAdminOrReviewer = currentUser.roleTier === 'admin' || currentUser.roleTier === 'reviewer';

  // Find active check-in record for current user today
  const activeRecord = attendanceRecords.find(r => 
    r.userId === currentUser.id && 
    r.date === todayStr && 
    r.status === 'checked_in'
  );

  const activeSession = activeRecord?.sessions?.find(s => !s.checkOutTime);

  useEffect(() => {
    if (!activeRecord || activeRecord.status !== 'checked_in') {
      setElapsedTimeStr('0m 0s');
      return;
    }

    const updateTimer = () => {
      let startMs = Date.now();
      const currentActiveSess = activeRecord.sessions?.find(s => !s.checkOutTime);

      if (currentActiveSess?.sessionStartTimestamp) {
        startMs = new Date(currentActiveSess.sessionStartTimestamp).getTime();
      } else if (currentActiveSess?.checkInTime) {
        const [timePart, modifier] = currentActiveSess.checkInTime.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const d = new Date();
        d.setHours(hours || 0, minutes || 0, 0, 0);
        startMs = d.getTime();
      }

      // Sum duration of all completed sessions today
      const completedSessionsMs = (activeRecord.sessions || [])
        .filter(s => !!s.checkOutTime)
        .reduce((sum, s) => sum + (s.durationHours || 0) * 3600 * 1000, 0);

      const activeSessionDiffMs = Math.max(0, Date.now() - startMs);
      const totalCumulativeMs = completedSessionsMs + activeSessionDiffMs;
      const totalSecs = Math.floor(totalCumulativeMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');

      if (hours > 0) {
        setElapsedTimeStr(`${hours}h ${pad(mins)}m ${pad(secs)}s`);
      } else {
        setElapsedTimeStr(`${mins}m ${pad(secs)}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRecord]);

  const handleCheckIn = async () => {
    setIsProcessing(true);
    try {
      await checkIn();
    } catch (err) {
      console.error('Error checking in:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    setIsProcessing(true);
    try {
      await checkOut();
    } catch (err) {
      console.error('Error checking out:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const checkedInUsersCount = attendanceRecords.filter(r => r.date === todayStr && r.status === 'checked_in').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Check-In Widget for Interns */}
      <div className="p-5 bg-white border border-purple-100 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Intern Attendance & Shift Time Tracker</h2>
              <p className="text-xs text-slate-500 font-normal">Real-time intern check-in timestamps and daily working shift logs.</p>
            </div>
          </div>

          {/* Check In / Check Out Action Controls for Intern */}
          {isIntern && (
            <div className="flex items-center space-x-3">
              {activeRecord ? (
                <div className="flex items-center space-x-2 bg-emerald-50 p-1.5 px-3 rounded-xl border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    Checked In at {activeSession?.checkInTime || 'Active'}
                    <span className="bg-emerald-200/80 px-1.5 py-0.5 rounded text-[10px] text-emerald-950 font-mono">
                      ⏱️ {elapsedTimeStr} active
                    </span>
                  </span>
                  <Button 
                    size="sm" 
                    onClick={handleCheckOut}
                    disabled={isProcessing}
                    className="h-8 text-xs font-bold gap-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs ml-2"
                  >
                    <Square className="w-3 h-3 fill-current" /> Check Out
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleCheckIn}
                  disabled={isProcessing}
                  className="h-9 px-5 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Check In Now
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin / Reviewer Attendance Board Table */}
      <Card className="border border-purple-100 bg-white shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="p-5 bg-purple-50/50 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Team Shift Attendance Board ({todayStr})</CardTitle>
            </div>
            <Badge variant="purple" className="text-[10px] font-extrabold">
              {checkedInUsersCount} Currently Checked-In
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500 font-normal pt-0.5">
            Real-time shift activity monitored by founders and tech leads.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="border-b border-slate-200">
                <TableHead className="py-3 px-4 font-bold text-xs text-slate-800">Team Member</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-slate-800">Role Tier</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-slate-800">Check-In Time</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-slate-800">Check-Out Time</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-slate-800">Daily Hours Worked</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-slate-800 text-right">Shift Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {attendanceRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-slate-400 text-xs font-normal">
                    No attendance records logged for today yet.
                  </TableCell>
                </TableRow>
              ) : (
                attendanceRecords.map(rec => {
                  const member = users.find(u => u.id === rec.userId);
                  const isWorking = rec.status === 'checked_in';
                  const firstSession = rec.sessions?.[0];
                  const lastSession = rec.sessions?.[rec.sessions.length - 1];

                  return (
                    <TableRow key={rec.id} className="hover:bg-purple-50/30 transition-colors">
                      
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <Avatar className="h-7 w-7 border border-purple-200">
                            {member?.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.fullName} /> : null}
                            <AvatarFallback className="bg-purple-600 text-white font-bold text-[10px]">
                              {getInitials(member?.fullName || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">{member?.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{member?.title}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 px-3">
                        <Badge variant={member?.roleTier === 'admin' ? 'default' : member?.roleTier === 'reviewer' ? 'purple' : 'info'} className="text-[9px] font-bold uppercase">
                          {member?.roleTier}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3.5 px-3 font-bold text-xs text-slate-900">
                        {firstSession?.checkInTime || '—'}
                      </TableCell>

                      <TableCell className="py-3.5 px-3 font-medium text-xs text-slate-600">
                        {lastSession?.checkOutTime || (isWorking ? '● Working' : '—')}
                      </TableCell>

                      <TableCell className="py-3.5 px-3 font-extrabold text-xs text-purple-950">
                        {tasks.filter(t => t.contributorId === rec.userId && t.taskDate === '2026-08-21').reduce((sum, t) => sum + (t.hours || 0), 0)} hrs
                      </TableCell>

                      <TableCell className="py-3.5 px-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isWorking 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isWorking ? '● Working (Active)' : 'Completed Shift'}
                        </span>
                      </TableCell>

                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};

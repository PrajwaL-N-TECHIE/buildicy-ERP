import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AttendanceRecord } from '@/types';
import { todayIso } from '@/lib/date';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  Play, 
  Square, 
  UserCheck, 
  Download, 
  Trophy, 
  TrendingUp, 
  BarChart3, 
} from 'lucide-react';

export const AttendanceTracker: React.FC = () => {
  const { currentUser, users, attendanceRecords, checkIn, checkOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [elapsedTimeStr, setElapsedTimeStr] = useState<string>('0h 0m');

  if (!currentUser) return null;

  const todayStr = todayIso();
  const isContributor = currentUser.roleTier === 'contributor';
  const isAdminOrReviewer = currentUser.roleTier === 'admin' || currentUser.roleTier === 'reviewer';

  // Find active check-in record for current user today (ONLY applicable if contributor)
  const activeRecord = isContributor ? attendanceRecords.find(r => 
    r.userId === currentUser.id && 
    r.date === todayStr && 
    r.status === 'checked_in'
  ) : undefined;

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
    if (!isContributor) return;
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
    if (!isContributor) return;
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

  // Helper to calculate total shift hours for an attendance record
  const getRecordTotalHours = (rec: AttendanceRecord): number => {
    if (rec.totalWorkedHoursToday && rec.totalWorkedHoursToday > 0) {
      return rec.totalWorkedHoursToday;
    }
    let totalMs = 0;
    (rec.sessions || []).forEach(sess => {
      if (sess.durationHours) {
        totalMs += sess.durationHours * 3600 * 1000;
      } else if (sess.sessionStartTimestamp) {
        const start = new Date(sess.sessionStartTimestamp).getTime();
        const end = sess.sessionEndTimestamp ? new Date(sess.sessionEndTimestamp).getTime() : Date.now();
        if (!isNaN(start) && !isNaN(end)) {
          totalMs += Math.max(0, end - start);
        }
      }
    });
    return parseFloat((totalMs / (1000 * 3600)).toFixed(2));
  };

  // Filter attendance records to STRICTLY track Interns / Contributors only
  const internAttendanceRecords = attendanceRecords.filter(rec => {
    const member = users.find(u => u.id === rec.userId);
    return member ? member.roleTier === 'contributor' : true;
  });

  // Export CSV Report (Interns Only)
  const handleDownloadCSV = () => {
    const headers = ['User Name', 'Email', 'Role Tier', 'Title', 'Date', 'Check-In Time', 'Check-Out Time', 'Daily Hours Worked', 'Shift Status'];
    const rows = internAttendanceRecords.map(rec => {
      const member = users.find(u => u.id === rec.userId);
      const firstSess = rec.sessions?.[0];
      const lastSess = rec.sessions?.[rec.sessions.length - 1];
      const hoursWorked = getRecordTotalHours(rec);

      return [
        `"${member?.fullName || 'Unknown'}"`,
        `"${member?.email || ''}"`,
        `"${member?.roleTier || ''}"`,
        `"${member?.title || ''}"`,
        `"${rec.date}"`,
        `"${firstSess?.checkInTime || '—'}"`,
        `"${lastSess?.checkOutTime || (rec.status === 'checked_in' ? 'Working' : '—')}"`,
        `"${hoursWorked.toFixed(2)} hrs"`,
        `"${rec.status === 'checked_in' ? 'Working (Active)' : 'Completed Shift'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Buildicy_ERP_Intern_Shift_Attendance_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute Leaderboard & Analytics Metrics for Interns (Contributors) ONLY
  const checkedInUsersCount = internAttendanceRecords.filter(r => r.date === todayStr && r.status === 'checked_in').length;
  
  const userStats = users
    .filter(user => user.roleTier === 'contributor')
    .map(user => {
      const userRecords = attendanceRecords.filter(r => r.userId === user.id);
      const totalDaysWorked = new Set(userRecords.map(r => r.date)).size;
      const totalHoursLogged = userRecords.reduce((sum, r) => sum + getRecordTotalHours(r), 0);

      return {
        user,
        totalDaysWorked,
        totalHoursLogged: parseFloat(totalHoursLogged.toFixed(2)),
      };
    })
    .filter(s => s.totalHoursLogged > 0 || s.totalDaysWorked > 0)
    .sort((a, b) => b.totalHoursLogged - a.totalHoursLogged);

  const topWorkingDaysUser = [...userStats].sort((a, b) => b.totalDaysWorked - a.totalDaysWorked)[0];
  const maxHours = userStats.length > 0 ? Math.max(...userStats.map(s => s.totalHoursLogged), 1) : 1;

  return (
    <div className="space-y-6">
      
      {/* Top Shift Check-In Banner */}
      <div className="p-5 bg-white border border-purple-100 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAdminOrReviewer ? 'Intern Shift & Attendance Management Board' : 'Intern Shift Check-In Tracker'}
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {isAdminOrReviewer 
                  ? 'Real-time intern shift monitoring, daily working hours calculation, and audit reports.'
                  : 'Check in to start your shift timer and log working hours.'}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Check In / Check Out Controls STRICTLY for Interns (Contributors) */}
            {isContributor && (
              activeRecord ? (
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
              )
            )}

            {/* Export CSV Button for Admins/Reviewers */}
            {isAdminOrReviewer && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
                className="h-9 text-xs font-bold gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ADMIN & REVIEWER EXCLUSIVE DASHBOARD & BOARD */}
      {isAdminOrReviewer ? (
        <>
          {/* Attendance Analytics & Leaderboard Dashboard (Interns Only) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Top Leaderboard Card: Highest Working Days */}
            <Card className="border border-amber-200 bg-linear-to-br from-amber-50/60 to-orange-50/40 rounded-2xl shadow-2xs p-5 flex items-center space-x-4">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider block">
                  🏆 Highest Working Days Intern
                </span>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {topWorkingDaysUser ? topWorkingDaysUser.user.fullName : 'No intern data'}
                </h3>
                <p className="text-xs font-bold text-amber-900">
                  {topWorkingDaysUser ? `${topWorkingDaysUser.totalDaysWorked} Days Logged (${topWorkingDaysUser.totalHoursLogged} hrs total)` : '0 Days'}
                </p>
              </div>
            </Card>

            {/* Metric Card: Currently Active Intern Shifts */}
            <Card className="border border-emerald-200 bg-linear-to-br from-emerald-50/60 to-teal-50/40 rounded-2xl shadow-2xs p-5 flex items-center space-x-4">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider block">
                  🟢 Live Checked-In Interns
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {checkedInUsersCount} Interns Active
                </h3>
                <p className="text-xs font-medium text-emerald-800">
                  Shift activity actively logged for {todayStr}
                </p>
              </div>
            </Card>

            {/* Metric Card: Total Cumulative Hours Logged */}
            <Card className="border border-purple-200 bg-linear-to-br from-purple-50/60 to-indigo-50/40 rounded-2xl shadow-2xs p-5 flex items-center space-x-4">
              <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-md">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-purple-700 tracking-wider block">
                  📊 Total Intern Shift Hours Logged
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {userStats.reduce((sum, s) => sum + s.totalHoursLogged, 0).toFixed(1)} hrs
                </h3>
                <p className="text-xs font-medium text-purple-900">
                  Across all intern check-in sessions
                </p>
              </div>
            </Card>

          </div>

          {/* Intern Hours Logged Breakdown Leaderboard */}
          <Card className="border border-purple-100 bg-white shadow-2xs rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Total Shift Hours Logged Per Intern</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Ranked by Total Hours Worked
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userStats.length === 0 ? (
                <div className="col-span-2 py-6 text-center text-xs text-slate-400">
                  No intern attendance records or hours logged yet.
                </div>
              ) : (
                userStats.map((stat, idx) => (
                  <div key={stat.user.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                          idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-purple-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <Avatar className="h-7 w-7 border border-purple-200">
                          {stat.user.avatarUrl ? <AvatarImage src={stat.user.avatarUrl} alt={stat.user.fullName} /> : null}
                          <AvatarFallback className="bg-purple-600 text-white font-bold text-[10px]">
                            {getInitials(stat.user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-bold text-xs text-slate-900 block leading-tight">{stat.user.fullName}</span>
                          <span className="text-[10px] text-slate-500">{stat.user.title || stat.user.roleTier}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-xs text-purple-700 block">{stat.totalHoursLogged} hrs</span>
                        <span className="text-[10px] font-medium text-slate-500">{stat.totalDaysWorked} Days Logged</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (stat.totalHoursLogged / maxHours) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Admin / Reviewer Intern Attendance Board Table */}
          <Card className="border border-purple-100 bg-white shadow-2xs rounded-2xl overflow-hidden">
            <CardHeader className="p-5 bg-purple-50/50 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-sm font-bold text-slate-900">Intern Shift Attendance Board ({todayStr})</CardTitle>
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
                  {internAttendanceRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center text-slate-400 text-xs font-normal">
                        No intern attendance records logged for today yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    internAttendanceRecords.map(rec => {
                      const member = users.find(u => u.id === rec.userId);
                      const isWorking = rec.status === 'checked_in';
                      const firstSession = rec.sessions?.[0];
                      const lastSession = rec.sessions?.[rec.sessions.length - 1];
                      const totalWorkedHours = getRecordTotalHours(rec);

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
                            {totalWorkedHours.toFixed(2)} hrs
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
        </>
      ) : null}

    </div>
  );
};

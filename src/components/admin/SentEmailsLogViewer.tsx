import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { sendCustomNotificationEmail } from '@/firebase/notifications';
import { MailNotification } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  MailCheck, 
  Search, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Filter, 
  Sparkles,
  Send,
  ShieldAlert,
  Cake,
  Key,
  CheckCircle2,
  Mail,
  Trash2
} from 'lucide-react';
import { todayIso } from '@/lib/date';

export const SentEmailsLogViewer: React.FC = () => {
  const { notifications, users, clearAllNotifications } = useAuth();
  const toast = useToast();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [selectedMail, setSelectedMail] = useState<MailNotification | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [dispatchRecipient, setDispatchRecipient] = useState<string>(users[0]?.email || 'prajwal.n.ad.2023@snsce.ac.in');
  const [dispatchSubject, setDispatchSubject] = useState<string>('Buildicy ERP Official Operations Notification');
  const [dispatchBody, setDispatchBody] = useState<string>('This is an automated live notification dispatched via the Buildicy ERP Mail Gateway.');
  const [dispatchTrigger, setDispatchTrigger] = useState<MailNotification['triggerEvent']>('TASK_ASSIGNED');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isCustomRecipient, setIsCustomRecipient] = useState<boolean>(false);

  const handleDispatchCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchRecipient || !dispatchRecipient.includes('@')) {
      toast.error('Invalid Recipient', 'Please provide a valid recipient email address.');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await sendCustomNotificationEmail(
        dispatchRecipient,
        dispatchSubject,
        dispatchBody,
        dispatchTrigger
      );

      if (res.success) {
        toast.success(
          'Email Dispatched & Logged! 🚀',
          `Notification sent to ${dispatchRecipient} and logged in Sent Outbound Emails Log.`
        );
        setIsDispatchModalOpen(false);
      } else {
        toast.warning(
          'Logged to Outbound Log ✉️',
          res.error || `Notification logged for ${dispatchRecipient}.`
        );
        setIsDispatchModalOpen(false);
      }
    } catch (err: any) {
      console.error('Error dispatching email:', err);
      toast.error('Dispatch Error', err?.message || 'Failed to send email.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const getEventBadge = (triggerEvent?: string, subject?: string) => {
    let evt = triggerEvent;
    if (!evt || evt === 'TASK_ASSIGNED') {
      const subj = (subject || '').toLowerCase();
      if (subj.includes('welcome') || subj.includes('invite')) evt = 'WELCOME_INVITE';
      else if (subj.includes('password') || subj.includes('recovery')) evt = 'FORGOT_PASSWORD';
      else if (subj.includes('birthday') || subj.includes('🎂')) evt = 'BIRTHDAY_WISH';
      else if (subj.includes('meeting') || subj.includes('scheduled')) evt = 'MEETING_SCHEDULED';
      else if (subj.includes('cancelled') || subj.includes('deleted')) evt = 'TASK_DELETED';
      else if (subj.includes('overdue') || subj.includes('digest')) evt = 'DAILY_OVERDUE_DIGEST';
      else if (subj.includes('project') || subj.includes('deadline')) evt = 'PROJECT_UPDATE';
      else if (subj.includes('attendance') || subj.includes('shift')) evt = 'ATTENDANCE_ALERT';
      else if (subj.includes('announcement') || subj.includes('hr')) evt = 'HR_ANNOUNCEMENT';
      else if (subj.includes('official operations')) evt = 'GENERAL_BROADCAST';
    }
    switch (evt) {
      case 'WELCOME_INVITE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><User className="w-3 h-3 text-emerald-600" /> Welcome Invite</span>;
      case 'FORGOT_PASSWORD':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"><Key className="w-3 h-3 text-amber-600" /> Password Recovery</span>;
      case 'BIRTHDAY_WISH':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-300"><Cake className="w-3 h-3 text-pink-600" /> Birthday Wish</span>;
      case 'TASK_ASSIGNED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300"><Send className="w-3 h-3 text-purple-600" /> Task Assignment</span>;
      case 'TASK_DELETED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300"><ShieldAlert className="w-3 h-3 text-rose-600" /> Task Cancelled</span>;
      case 'MEETING_SCHEDULED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300"><Calendar className="w-3 h-3 text-sky-600" /> Meeting Invite</span>;
      case 'PROJECT_UPDATE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300"><Sparkles className="w-3 h-3 text-indigo-600" /> Project Update</span>;
      case 'ATTENDANCE_ALERT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><MailCheck className="w-3 h-3 text-emerald-600" /> Attendance Alert</span>;
      case 'HR_ANNOUNCEMENT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300"><User className="w-3 h-3 text-teal-600" /> HR Announcement</span>;
      case 'GENERAL_BROADCAST':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-300"><Mail className="w-3 h-3 text-violet-600" /> General Broadcast</span>;
      case 'SYSTEM_ALERT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300"><ShieldAlert className="w-3 h-3 text-red-600" /> System Alert</span>;
      case 'DAILY_OVERDUE_DIGEST':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-400"><ShieldAlert className="w-3 h-3 text-amber-700" /> Daily Overdue Digest</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300"><MailCheck className="w-3 h-3 text-slate-500" /> Outbound Email</span>;
    }
  };

  const filteredMails = notifications.filter(mail => {
    let mailEvt = mail.triggerEvent;
    if (!mailEvt || mailEvt === 'TASK_ASSIGNED') {
      const subj = mail.subject.toLowerCase();
      if (subj.includes('welcome') || subj.includes('invite')) mailEvt = 'WELCOME_INVITE';
      else if (subj.includes('password') || subj.includes('recovery')) mailEvt = 'FORGOT_PASSWORD';
      else if (subj.includes('birthday') || subj.includes('🎂')) mailEvt = 'BIRTHDAY_WISH';
      else if (subj.includes('meeting') || subj.includes('scheduled')) mailEvt = 'MEETING_SCHEDULED';
      else if (subj.includes('cancelled') || subj.includes('deleted')) mailEvt = 'TASK_DELETED';
      else if (subj.includes('overdue') || subj.includes('digest')) mailEvt = 'DAILY_OVERDUE_DIGEST';
      else if (subj.includes('project') || subj.includes('deadline')) mailEvt = 'PROJECT_UPDATE';
      else if (subj.includes('attendance') || subj.includes('shift')) mailEvt = 'ATTENDANCE_ALERT';
      else if (subj.includes('announcement') || subj.includes('hr')) mailEvt = 'HR_ANNOUNCEMENT';
      else if (subj.includes('official operations')) mailEvt = 'GENERAL_BROADCAST';
    }
    const eventMatch = eventFilter === 'all' || mailEvt === eventFilter;
    const searchMatch = !searchQuery.trim() ||
      mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.to.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mail.bodyText.toLowerCase().includes(searchQuery.toLowerCase());
    return eventMatch && searchMatch;
  });

  const handleExportCSV = () => {
    const headers = ['Notification ID', 'Timestamp', 'Recipient Emails', 'Subject', 'Trigger Event', 'Body Snippet'];
    const rows = filteredMails.map(m => [
      `"${m.id}"`,
      `"${m.createdAt}"`,
      `"${m.to.join('; ')}"`,
      `"${m.subject.replace(/"/g, '""')}"`,
      `"${m.triggerEvent || 'OUTBOUND_EMAIL'}"`,
      `"${m.bodyText.substring(0, 100).replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sent_emails_audit_log_${todayIso()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearLog = async () => {
    if (window.confirm("Are you sure you want to clear all sent email logs? This action will wipe all outbound email records.")) {
      await clearAllNotifications();
      toast.success("Outbound email logs cleared successfully.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-xs">
            <MailCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Sent Outbound Emails Log
              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200">
                ● Live Resend Sync
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Audit log of all automated emails dispatched for password recovery, birthday wishes, task updates, and meetings.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={() => setIsDispatchModalOpen(true)}
            size="sm"
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-1.5"
            title="Dispatch live notification email to any recipient via Resend API"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Custom Email</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            size="sm"
            variant="outline"
            className="h-9 px-4 text-xs font-bold border-purple-200 dark:border-slate-700 bg-purple-50 hover:bg-purple-100 dark:bg-slate-800 text-purple-900 dark:text-purple-300 rounded-xl shadow-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sent Emails CSV</span>
          </Button>

          <Button
            onClick={handleClearLog}
            size="sm"
            variant="outline"
            className="h-9 px-4 text-xs font-bold border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl shadow-xs gap-1.5"
            title="Clear all sent email logs permanently"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Clear Email Logs</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-purple-50/50 dark:bg-slate-800/50 border border-purple-100 dark:border-slate-800 rounded-2xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Sent Emails</span>
          <span className="text-2xl font-black text-purple-950 dark:text-purple-300">{notifications.length}</span>
        </Card>

        <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block">Password Recoveries</span>
          <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
            {notifications.filter(m => m.triggerEvent === 'FORGOT_PASSWORD').length}
          </span>
        </Card>

        <Card className="p-4 bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40 rounded-2xl">
          <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider block">Birthday Wishes</span>
          <span className="text-2xl font-black text-pink-700 dark:text-pink-300">
            {notifications.filter(m => m.triggerEvent === 'BIRTHDAY_WISH').length}
          </span>
        </Card>

        <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">Task & Meeting Invites</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {notifications.filter(m => m.triggerEvent === 'TASK_ASSIGNED' || m.triggerEvent === 'MEETING_SCHEDULED').length}
          </span>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">Filter Event:</span>
          <select
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
            className="h-8 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
          >
            <option value="all">All Dispatched Events ({notifications.length})</option>
            <option value="TASK_ASSIGNED">Task Assigned</option>
            <option value="MEETING_SCHEDULED">Meeting Invite</option>
            <option value="PROJECT_UPDATE">Project Update</option>
            <option value="ATTENDANCE_ALERT">Attendance Alert</option>
            <option value="HR_ANNOUNCEMENT">HR Announcement</option>
            <option value="BIRTHDAY_WISH">Birthday Wish</option>
            <option value="FORGOT_PASSWORD">Password Recovery</option>
            <option value="GENERAL_BROADCAST">General Broadcast</option>
            <option value="SYSTEM_ALERT">System Alert</option>
            <option value="TASK_DELETED">Task Cancelled</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search email address, subject..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs border-slate-300 dark:border-slate-700 rounded-xl"
          />
        </div>
      </div>

      {/* Sent Emails Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5">Dispatched Date/Time</th>
              <th className="p-3.5">Event Type</th>
              <th className="p-3.5">Recipient Email(s)</th>
              <th className="p-3.5">Email Subject</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMails.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                  No sent emails found matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredMails.map(mail => (
                <tr key={mail.id} className="hover:bg-purple-50/40 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(mail.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    {getEventBadge(mail.triggerEvent, mail.subject)}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {mail.to.map((addr, idx) => (
                        <span key={idx} className="bg-purple-50 dark:bg-slate-800 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-slate-700 px-2 py-0.5 rounded-lg text-[11px] font-mono">
                          {addr}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 max-w-sm">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                      {mail.subject}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {mail.bodyText.substring(0, 70)}...
                    </span>
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedMail(mail)}
                      className="h-7 text-[11px] font-bold text-purple-700 dark:text-purple-300 border-purple-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-800 gap-1 rounded-xl"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Mail Body
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Render Selected Email Preview Dialog */}
      <Dialog open={selectedMail !== null} onOpenChange={() => setSelectedMail(null)}>
        <DialogContent className="sm:max-w-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
          {selectedMail && (
            <>
              <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  {getEventBadge(selectedMail.triggerEvent, selectedMail.subject)}
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(selectedMail.createdAt).toLocaleString()}
                  </span>
                </div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 pt-2">
                  {selectedMail.subject}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal">
                  To: <strong className="text-purple-700 dark:text-purple-300">{selectedMail.to.join(', ')}</strong>
                </DialogDescription>
              </DialogHeader>

              {/* Rendered HTML or Plain Text Email Content */}
              <div className="py-4 space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl max-h-96 overflow-y-auto">
                  {selectedMail.htmlText ? (
                    <iframe
                      srcDoc={selectedMail.htmlText}
                      title="Dispatched Email HTML Body"
                      className="w-full h-80 border-0 rounded-lg bg-white"
                    />
                  ) : (
                    <p className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedMail.bodyText}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Dispatched via Resend API
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMail(null)}
                  className="h-8 px-4 text-xs font-semibold rounded-xl border-slate-300"
                >
                  Close Preview
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispatch Custom Email Dialog Modal */}
      <Dialog open={isDispatchModalOpen} onOpenChange={setIsDispatchModalOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              Dispatch Live Email Notification
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-normal">
              Send an automated email notification via Resend Gateway (<strong className="text-emerald-600">notifications@erp.buildicy.com</strong>).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDispatchCustomEmail} className="space-y-4 py-3">
            
            {/* Single Recipient Email Field (Dropdown with Custom option) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Recipient Email Address
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomRecipient(!isCustomRecipient);
                    if (!isCustomRecipient) {
                      setDispatchRecipient('');
                    } else {
                      setDispatchRecipient(users[0]?.email || '');
                    }
                  }}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                >
                  {isCustomRecipient ? 'Select Team Member' : '+ Custom Email'}
                </button>
              </div>

              {!isCustomRecipient ? (
                <select
                  value={dispatchRecipient}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM_OTHER') {
                      setIsCustomRecipient(true);
                      setDispatchRecipient('');
                    } else {
                      setDispatchRecipient(e.target.value);
                    }
                  }}
                  className="w-full h-10 px-3 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.fullName} ({u.email}) — {u.title}
                    </option>
                  ))}
                  <option value="CUSTOM_OTHER">+ Enter Custom External Email...</option>
                </select>
              ) : (
                <Input
                  type="email"
                  required
                  value={dispatchRecipient}
                  onChange={(e) => setDispatchRecipient(e.target.value)}
                  placeholder="e.g. name@domain.com"
                  className="h-10 text-xs font-semibold rounded-xl border-slate-200 focus:ring-emerald-500"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Subject Line</label>
              <Input
                type="text"
                required
                value={dispatchSubject}
                onChange={(e) => setDispatchSubject(e.target.value)}
                placeholder="Enter email subject line"
                className="h-10 text-xs font-semibold rounded-xl border-slate-200 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Trigger Event Category</label>
              <select
                value={dispatchTrigger}
                onChange={(e) => setDispatchTrigger(e.target.value as any)}
                className="w-full h-10 px-3 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="TASK_ASSIGNED">Task Assignment</option>
                <option value="MEETING_SCHEDULED">Scheduled Meeting Invitation</option>
                <option value="PROJECT_UPDATE">Project & Milestone Update</option>
                <option value="ATTENDANCE_ALERT">Shift Check-In / Attendance Alert</option>
                <option value="HR_ANNOUNCEMENT">HR & Personnel Announcement</option>
                <option value="BIRTHDAY_WISH">Birthday & Personnel Greeting</option>
                <option value="FORGOT_PASSWORD">Password Recovery</option>
                <option value="GENERAL_BROADCAST">General Operations Broadcast</option>
                <option value="SYSTEM_ALERT">System Compliance Alert</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message Content / Body</label>
              <textarea
                required
                rows={4}
                value={dispatchBody}
                onChange={(e) => setDispatchBody(e.target.value)}
                placeholder="Type notification message..."
                className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDispatchModalOpen(false)}
                className="h-9 px-4 text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSendingTest}
                size="sm"
                className="h-9 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'Sending Email...' : 'Dispatch Email Now'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

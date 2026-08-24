import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  CheckCircle2
} from 'lucide-react';
import { todayIso } from '@/lib/date';

export const SentEmailsLogViewer: React.FC = () => {
  const { notifications } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [selectedMail, setSelectedMail] = useState<MailNotification | null>(null);

  const getEventBadge = (triggerEvent?: string) => {
    switch (triggerEvent) {
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
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300"><MailCheck className="w-3 h-3 text-slate-500" /> Outbound Email</span>;
    }
  };

  const filteredMails = notifications.filter(mail => {
    const eventMatch = eventFilter === 'all' || mail.triggerEvent === eventFilter;
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

        <Button
          onClick={handleExportCSV}
          size="sm"
          className="h-9 px-4 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Sent Emails CSV</span>
        </Button>
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
            <option value="FORGOT_PASSWORD">Password Recovery</option>
            <option value="BIRTHDAY_WISH">Birthday Wish</option>
            <option value="TASK_ASSIGNED">Task Assigned</option>
            <option value="TASK_DELETED">Task Cancelled</option>
            <option value="MEETING_SCHEDULED">Meeting Invite</option>
            <option value="PROJECT_DEADLINE_UPDATED">Project Deadline Updated</option>
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
                    {getEventBadge(mail.triggerEvent)}
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
                  {getEventBadge(selectedMail.triggerEvent)}
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

    </div>
  );
};

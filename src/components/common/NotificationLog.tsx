import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOperationalNotifications, OperationalAlert } from '@/hooks/useOperationalNotifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  ShieldAlert, 
  Calendar, 
  ShieldCheck, 
  Mail, 
  Trash2,
  Sparkles,
  Filter
} from 'lucide-react';

interface NotificationLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationLog: React.FC<NotificationLogProps> = ({ open, onOpenChange }) => {
  const { currentUser, clearAllNotifications } = useAuth();
  const { alerts, unreadCount } = useOperationalNotifications();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!currentUser) return null;

  const filteredAlerts = alerts.filter(alert => {
    if (activeCategory === 'all') return true;
    return alert.category === activeCategory;
  });

  const getCategoryBadge = (alert: OperationalAlert) => {
    switch (alert.category) {
      case 'check_in':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            {alert.badgeLabel}
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            {alert.badgeLabel}
          </span>
        );
      case 'meeting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <Calendar className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            {alert.badgeLabel}
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            {alert.badgeLabel}
          </span>
        );
      case 'system':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Mail className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            {alert.badgeLabel}
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[540px] max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 pr-6 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Notification Center
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal">
                  Live check-ins, overdue tasks, meeting invites & review sign-offs.
                </DialogDescription>
              </div>
            </div>

            <Badge variant="purple" className="text-xs font-bold px-2.5 py-0.5 shrink-0">
              {unreadCount} Active
            </Badge>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
            {[
              { key: 'all', label: 'All Alerts' },
              ...((currentUser.roleTier === 'admin' || currentUser.roleTier === 'reviewer')
                ? [{ key: 'check_in', label: 'Check-Ins' }]
                : []),
              { key: 'overdue', label: 'Overdue' },
              { key: 'meeting', label: 'Meetings' },
              { key: 'review', label: 'Approvals' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all shrink-0 ${
                  activeCategory === tab.key
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Operational Alerts Feed List */}
        <div className="mt-3 flex-1 overflow-y-auto min-h-0 space-y-2.5 pr-1.5 focus-visible:outline-none">
          {filteredAlerts.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No alerts found</p>
              <p className="text-[11px] text-slate-400">Everything is caught up for this category.</p>
            </div>
          ) : (
            filteredAlerts.map((item) => (
              <div 
                key={item.id} 
                className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1.5 transition-colors hover:border-purple-300 dark:hover:border-purple-800 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </span>
                  {getCategoryBadge(item)}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                    Buildicy ERP Alert
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clear All Footer */}
        {alerts.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await clearAllNotifications();
              }}
              className="h-7 text-[11px] font-bold text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 rounded-lg gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear Operational Alerts
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};

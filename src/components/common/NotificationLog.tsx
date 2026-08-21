import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Mail, Clock, Send, ShieldCheck, CheckCircle2, Bell, Check, Trash2, ArrowRight } from 'lucide-react';

interface NotificationLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationLog: React.FC<NotificationLogProps> = ({ open, onOpenChange }) => {
  const { notifications, tasks, currentUser } = useAuth();
  const [activeFilterTab, setActiveFilterTab] = useState<string>('all');

  if (!currentUser) return null;

  const pendingReviewTasks = tasks.filter(t => 
    (currentUser.roleTier === 'reviewer' && t.status === 'Submitted') ||
    (currentUser.roleTier === 'admin' && t.status === 'Pending Admin')
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-[560px] max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 pr-6 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Notification Center & Email Log
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal">
                  Outbound email dispatches and pending action notifications.
                </DialogDescription>
              </div>
            </div>

            <Badge variant="purple" className="text-xs font-bold px-2.5 py-0.5 shrink-0">
              {notifications.length} Alerts
            </Badge>
          </div>
        </DialogHeader>

        {/* Tabs Container */}
        <Tabs value={activeFilterTab} onValueChange={setActiveFilterTab} className="w-full flex-1 flex flex-col min-h-0 pt-2">
          
          <TabsList className="grid grid-cols-2 w-full h-9 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <TabsTrigger value="all" className="text-xs font-bold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-2xs">
              Outbound Emails ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs font-bold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-2xs">
              Action Required ({pendingReviewTasks.length})
            </TabsTrigger>
          </TabsList>

          {/* Email Dispatches Tab */}
          <TabsContent value="all" className="mt-3 flex-1 overflow-y-auto min-h-0 space-y-3 pr-1.5 focus-visible:outline-none">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-normal">
                No outbound email notifications logged yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 hover:border-purple-300 transition-colors shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="p-1 bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 rounded-md shrink-0">
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {Array.isArray(n.to) ? n.to.join(', ') : n.to}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-0.5 pl-6">
                    <h5 className="text-xs font-bold text-purple-950 dark:text-purple-300 leading-tight">{n.subject}</h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">{n.bodyText}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 pl-6">
                    <span>Trigger: <strong className="text-purple-600 dark:text-purple-400 font-bold capitalize">{n.triggerEvent ? n.triggerEvent.replace(/_/g, ' ') : 'System Dispatch'}</strong></span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Firestore `mail`
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Action Required Tab */}
          <TabsContent value="alerts" className="mt-3 flex-1 overflow-y-auto min-h-0 space-y-3 pr-1.5 focus-visible:outline-none">
            {pendingReviewTasks.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-normal">
                No pending tasks requiring your review or sign-off.
              </div>
            ) : (
              pendingReviewTasks.map((t) => (
                <div key={t.id} className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" /> Task Review Pending
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold border-amber-300 text-amber-800">
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium pl-5 leading-snug">
                    {t.description}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

        </Tabs>

      </DialogContent>
    </Dialog>
  );
};

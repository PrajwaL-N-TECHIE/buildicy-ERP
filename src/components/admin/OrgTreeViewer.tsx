import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users2, ShieldCheck, UserCheck, Layers, GitBranch, ArrowDown } from 'lucide-react';

export const OrgTreeViewer: React.FC = () => {
  const { users, projects, tasks } = useAuth();

  const admins = users.filter(u => u.roleTier === 'admin');
  const reviewers = users.filter(u => u.roleTier === 'reviewer');
  const contributors = users.filter(u => u.roleTier === 'contributor');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 bg-white border border-purple-100 rounded-2xl shadow-2xs space-y-1">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Company Organization Hierarchy Tree</h2>
            <p className="text-xs text-slate-500 font-normal">Top-down enterprise reporting structure and role hierarchy.</p>
          </div>
        </div>
      </div>

      {/* Organization Tree Container */}
      <div className="bg-white border border-purple-100 rounded-2xl p-8 shadow-2xs space-y-8 min-h-[550px] flex flex-col items-center">
        
        {/* LEVEL 1: FOUNDER & ADMIN TIER */}
        <div className="flex flex-col items-center space-y-3">
          <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            Level 1: Founders & Executive Sign-Off Tier
          </span>

          <div className="flex flex-wrap justify-center gap-4">
            {admins.map(admin => {
              const activeCount = tasks.filter(t => t.status !== 'Completed').length;
              return (
                <Card key={admin.id} className="w-64 bg-purple-50/60 border-2 border-purple-300 shadow-xs rounded-2xl p-4 text-center space-y-2">
                  <Avatar className="h-12 w-12 mx-auto border-2 border-purple-400">
                    {admin.avatarUrl ? <AvatarImage src={admin.avatarUrl} alt={admin.fullName} /> : null}
                    <AvatarFallback className="bg-purple-600 text-white font-bold text-sm">
                      {getInitials(admin.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-extrabold text-sm text-purple-950 block">{admin.fullName}</span>
                    <span className="text-xs text-slate-600 font-medium block">{admin.title}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <Badge variant="default" className="text-[9px] font-bold uppercase">Admin Tier</Badge>
                    <Badge variant="purple" className="text-[9px] font-bold">All Projects</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Connecting Line Level 1 -> Level 2 */}
        <div className="flex flex-col items-center">
          <div className="h-8 w-0.5 bg-purple-300" />
          <ArrowDown className="w-4 h-4 text-purple-500 -mt-1" />
        </div>

        {/* LEVEL 2: REVIEWERS & TECH LEADS TIER */}
        <div className="flex flex-col items-center space-y-3 w-full">
          <span className="text-[10px] font-extrabold uppercase text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Level 2: Tech Leads & Reviewers Tier
          </span>

          <div className="flex flex-wrap justify-center gap-6 w-full">
            {reviewers.map(rev => {
              const assignedTasks = tasks.filter(t => t.status === 'Submitted');
              return (
                <Card key={rev.id} className="w-72 bg-amber-50/40 border-2 border-amber-200 shadow-xs rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border border-amber-300 shrink-0">
                      {rev.avatarUrl ? <AvatarImage src={rev.avatarUrl} alt={rev.fullName} /> : null}
                      <AvatarFallback className="bg-amber-600 text-white font-bold text-xs">
                        {getInitials(rev.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <span className="font-bold text-xs text-slate-900 block truncate">{rev.fullName}</span>
                      <span className="text-[11px] text-slate-500 font-normal block truncate">{rev.title}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-amber-200/60">
                    <Badge variant="purple" className="text-[9px] font-bold">
                      {assignedTasks.length} Pending Reviews
                    </Badge>
                    <span className="text-slate-500 font-medium">Assigned Lead</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Connecting Line Level 2 -> Level 3 */}
        <div className="flex flex-col items-center">
          <div className="h-8 w-0.5 bg-purple-300" />
          <ArrowDown className="w-4 h-4 text-purple-500 -mt-1" />
        </div>

        {/* LEVEL 3: CONTRIBUTORS & INTERNS TIER */}
        <div className="flex flex-col items-center space-y-3 w-full">
          <span className="text-[10px] font-extrabold uppercase text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            Level 3: Contributors & Interns Tier
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl">
            {contributors.map(contrib => {
              const userTasks = tasks.filter(t => t.contributorId === contrib.id);
              const completed = userTasks.filter(t => t.status === 'Completed').length;

              return (
                <Card key={contrib.id} className="bg-white border border-slate-200 shadow-2xs hover:border-purple-200 transition-colors rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <Avatar className="h-8 w-8 border border-purple-200 shrink-0">
                      {contrib.avatarUrl ? <AvatarImage src={contrib.avatarUrl} alt={contrib.fullName} /> : null}
                      <AvatarFallback className="bg-purple-600 text-white font-bold text-[10px]">
                        {getInitials(contrib.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <span className="font-bold text-xs text-slate-900 block truncate">{contrib.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-normal block truncate">{contrib.title}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span>{userTasks.length} Tasks Logged</span>
                    <span className="text-emerald-700 font-bold">{completed} Approved</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

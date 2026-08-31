import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, LogOut, ShieldAlert, CheckCircle2, UserCheck, Layers, ChevronDown } from 'lucide-react';

import { BuildicyLogo } from '@/components/common/BuildicyLogo';

import { useOperationalNotifications } from '@/hooks/useOperationalNotifications';

interface NavbarProps {
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications }) => {
  const { currentUser, users, loginAsUser, logout } = useAuth();
  const { unreadCount } = useOperationalNotifications();

  if (!currentUser) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wide flex items-center gap-1 shadow-sm"><ShieldAlert className="w-3 h-3" /> Admin</Badge>;
      case 'reviewer':
        return <Badge variant="purple" className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wide flex items-center gap-1 shadow-sm"><UserCheck className="w-3 h-3" /> Reviewer</Badge>;
      default:
        return <Badge variant="info" className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wide flex items-center gap-1 shadow-sm"><CheckCircle2 className="w-3 h-3" /> Contributor</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm font-bold transition-transform hover:scale-105">
            <BuildicyLogo size={28} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-foreground">Buildicy <span className="text-indigo-600">ERP</span></span>
              <span className="text-[10px] font-semibold tracking-wider text-indigo-700 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300 uppercase px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                v3.0
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">Enterprise Management Platform</p>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">

          {/* Mail Log Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenNotifications}
            className="relative flex items-center gap-2 text-xs h-9 px-3.5 rounded-lg border-border/80 shadow-2xs hover:bg-accent transition-all"
          >
            <Mail className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline font-semibold">Mail Log</span>
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* User Profile Badge */}
          <div className="flex items-center space-x-3 border-l border-border/60 pl-3 sm:pl-4">
            <Avatar className="h-9 w-9 border border-border/80 shadow-2xs">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {getInitials(currentUser.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold leading-tight text-foreground">{currentUser.fullName}</span>
              <span className="text-[11px] text-muted-foreground leading-tight font-medium">{currentUser.title}</span>
            </div>
            <div className="hidden sm:block">
              {getRoleBadge(currentUser.roleTier)}
            </div>
          </div>

          {/* Sign Out */}
          <Button variant="ghost" size="icon" onClick={logout} title="Sign Out" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>

        </div>

      </div>
    </header>
  );
};

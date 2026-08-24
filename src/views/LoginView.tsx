import React, { useState } from 'react';
import { useAuth, USE_FIREBASE_AUTH } from '@/auth/AuthContext';
import { useLegacyAuth } from '@/auth/useLegacyAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, getStoredUsers } from '@/firebase/config';
import { User } from '@/types';
import { sendForgotPasswordEmail } from '@/firebase/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Key,
  Send,
  ShieldCheck,
  Sparkles,
  Activity,
  Layers,
  Globe
} from 'lucide-react';

import { BuildicyLogo } from '@/components/common/BuildicyLogo';

export const LoginView: React.FC = () => {
  const newAuth = USE_FIREBASE_AUTH ? useAuth() : null;
  const legacyAuth = USE_FIREBASE_AUTH ? null : useLegacyAuth();

  const login = newAuth ? newAuth.login : null;
  const loginWithCredentials = legacyAuth ? legacyAuth.loginWithCredentials : null;
  const userList: User[] = getStoredUsers();

  const [email, setEmail] = useState<string>('admin@buildicy.com');
  const [password, setPassword] = useState<string>('admin@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Forgot Password Dialog state
  const [isForgotOpen, setIsForgotOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string>('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState<string>('');
  const [isSendingForgot, setIsSendingForgot] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (USE_FIREBASE_AUTH && login) {
        await login(email.trim(), password);
      } else if (loginWithCredentials) {
        const success = await loginWithCredentials(email.trim(), password.trim());
        if (!success) {
          setErrorMsg('Invalid email or password. Please verify credentials.');
        }
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const msg =
        code === 'auth/invalid-credential'
          ? 'Invalid email or password. Please verify credentials.'
          : code === 'auth/too-many-requests'
          ? 'Too many failed login attempts. Please try again later.'
          : 'Authentication failed. Please check your email and password.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenForgot = () => {
    setForgotEmail(email || '');
    setForgotSuccessMsg('');
    setForgotErrorMsg('');
    setIsForgotOpen(true);
  };

  const handleSendForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsSendingForgot(true);
    setForgotSuccessMsg('');
    setForgotErrorMsg('');

    try {
      const targetEmail = forgotEmail.trim().toLowerCase();

      // 1. Search in local storage / stored users
      const storedUsers = getStoredUsers();
      let matchedUser = storedUsers.find((u: User) => u.email.toLowerCase() === targetEmail);

      // 2. Search in default system user database
      if (!matchedUser) {
        const defaultAccounts: User[] = [
          {
            id: 'user-admin-default',
            firstName: 'Admin',
            lastName: 'Founder',
            fullName: 'Founder/Admin',
            username: 'admin@buildicy.com',
            email: 'admin@buildicy.com',
            title: 'Managing Director & Founder',
            roleTier: 'admin',
            password: 'admin@123',
            projectIds: [],
            active: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'user-reviewer-default',
            firstName: 'Reviewer',
            lastName: 'Lead',
            fullName: 'Technical Reviewer',
            username: 'reviewer@buildicy.com',
            email: 'reviewer@buildicy.com',
            title: 'Senior QA Reviewer',
            roleTier: 'reviewer',
            password: 'reviewer@123',
            projectIds: [],
            active: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'user-intern-default',
            firstName: 'Intern',
            lastName: 'Contributor',
            fullName: 'Buildicy Intern',
            username: 'intern@buildicy.com',
            email: 'intern@buildicy.com',
            title: 'Software Engineer Intern',
            roleTier: 'contributor',
            password: 'intern@123',
            projectIds: [],
            active: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'user-rajeshwari',
            firstName: 'Rajeshwari',
            lastName: 'SDE',
            fullName: 'Rajeshwari SDE',
            username: 'rajeshwari@buildicy.com',
            email: 'rajeshwari@buildicy.com',
            title: 'Full Stack Engineer',
            roleTier: 'contributor',
            password: 'rajeshwari@123',
            projectIds: [],
            active: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'user-prajwal',
            firstName: 'Prajwal',
            lastName: 'N',
            fullName: 'Prajwal N (System Admin)',
            username: 'prajwalgenious@gmail.com',
            email: 'prajwalgenious@gmail.com',
            title: 'Lead Architect & Systems Admin',
            roleTier: 'admin',
            password: 'prajwal@123',
            projectIds: [],
            active: true,
            createdAt: new Date().toISOString()
          }
        ];
        matchedUser = defaultAccounts.find(u => u.email.toLowerCase() === targetEmail);
      }

      // 3. Search Firestore DB if connected
      if (!matchedUser) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', targetEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docData = snap.docs[0].data() as User;
            matchedUser = { ...docData, id: snap.docs[0].id };
          }
        } catch (err) {
          console.warn('[Forgot Password] Firestore search warning:', err);
        }
      }

      // STRICT DB CHECK: IF USER DOES NOT EXIST IN DB -> DO NOT SEND EMAIL
      if (!matchedUser) {
        setForgotErrorMsg(`❌ No account found matching "${forgotEmail}". Please check your registered email or contact system administration.`);
        setIsSendingForgot(false);
        return;
      }

      // IF USER EXISTS IN DB -> DISPATCH PASSWORD RECOVERY EMAIL
      const passStr = matchedUser.password || (matchedUser.roleTier === 'admin' ? 'admin@123' : matchedUser.roleTier === 'reviewer' ? 'reviewer@123' : 'prajwal@123');

      await sendForgotPasswordEmail(matchedUser, passStr);
      setForgotSuccessMsg(`✅ Password recovery email successfully dispatched to ${matchedUser.email}! Check your inbox or Outbound Email Logs.`);
    } catch (err: any) {
      console.error('Error sending forgot password email:', err);
      setForgotErrorMsg('Failed to dispatch password recovery email. Please check your network connection.');
    } finally {
      setIsSendingForgot(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-white text-slate-900 font-sans antialiased overflow-hidden">
      
      {/* Main Split Layout Container */}
      <div className="flex-1 flex flex-col lg:flex-row w-full h-screen">
        
        {/* Left Form Panel */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
          <div className="w-full max-w-md space-y-7 my-auto">
            
            {/* Top Logo Emblem */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center shadow-xs hover:scale-105 transition-transform">
                <BuildicyLogo size={36} />
              </div>
              
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back!
                </h1>
              </div>
            </div>

            {/* Error Notice */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-2xl flex items-start gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-600 hidden">
                  Email address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-sm border-slate-300 rounded-2xl focus-visible:ring-purple-600 px-4 placeholder:text-slate-400 font-medium shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Password Input with Eye Icon */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-600 hidden">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-sm border-slate-300 rounded-2xl focus-visible:ring-purple-600 pl-4 pr-12 placeholder:text-slate-400 font-medium shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleOpenForgot}
                  className="text-purple-600 font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Pill Button: Log In */}
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim() || !password.trim()}
                className="w-full h-12 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Log in...
                  </>
                ) : (
                  <span>Log in</span>
                )}
              </Button>
            </form>

          </div>
        </div>

        {/* Right Decorative Pattern Panel (Buildicy Theme Purple Sail Grid) */}
        <div className="hidden lg:flex w-1/2 bg-[#090d19] relative overflow-hidden flex-col justify-between p-12 text-white">
          
          {/* Repeating Geometric Quarter-Circle Sail Pattern Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-80">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sailPurple" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.85" />
                </linearGradient>
                <pattern id="sailGrid" width="140" height="140" patternUnits="userSpaceOnUse">
                  {/* Dark Grid Background Cell */}
                  <rect width="140" height="140" fill="#090d19" stroke="#12182b" strokeWidth="1" />
                  {/* Quarter-Circle Swoosh Sail Curve matching the reference layout */}
                  <path d="M 0 140 Q 0 0 140 0 L 140 140 Z" fill="url(#sailPurple)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sailGrid)" />
            </svg>
          </div>

          {/* Top Brand Pill Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-purple-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Buildicy ERP v3.0 • Enterprise Cloud</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-purple-200/80 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-Bit SSL Secured</span>
            </div>
          </div>

          {/* Center Glassmorphic Enterprise Core Showcase Card */}
          <div className="relative z-10 my-auto max-w-xl mx-auto space-y-6">
            
            {/* Header Title */}
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unified Workspace Suite</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
                Operational Excellence & Enterprise Automation
              </h2>
              <p className="text-xs text-purple-200/80 font-normal leading-relaxed">
                Streamline enterprise operations with role-based submittals, real-time team chat compliance, automated notification logs, and HR analytics.
              </p>
            </div>

            {/* Enterprise Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl hover:bg-white/15 transition-all space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/30 text-purple-200 flex items-center justify-center border border-purple-400/30">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Role-Based Workflows</h3>
                <p className="text-[11px] text-purple-200/70 leading-relaxed">
                  Tiered governance for Admins, Reviewers, and Team Contributors with submittal approvals.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl hover:bg-white/15 transition-all space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 text-indigo-200 flex items-center justify-center border border-indigo-400/30">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Outbound Email Engine</h3>
                <p className="text-[11px] text-purple-200/70 leading-relaxed">
                  Automated birthday wishes, credential recovery, meeting links, and audit logs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl hover:bg-white/15 transition-all space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 text-emerald-200 flex items-center justify-center border border-emerald-400/30">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">HR & Time Tracking</h3>
                <p className="text-[11px] text-purple-200/70 leading-relaxed">
                  Real-time attendance, personnel directory, org hierarchy trees, and worked hours.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl hover:bg-white/15 transition-all space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/30 text-pink-200 flex items-center justify-center border border-pink-400/30">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Chat Compliance & Audits</h3>
                <p className="text-[11px] text-purple-200/70 leading-relaxed">
                  Encrypted team messaging, user-wise chat deletion logs, and meeting scheduling.
                </p>
              </div>

            </div>

          </div>

          {/* Bottom Live System Metrics Bar */}
          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-[11px] text-purple-200/60 font-medium">
            <div className="flex items-center space-x-2">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Multi-Region Firestore Sync</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>All Systems Operational</span>
            </div>
          </div>

        </div>

      </div>

      {/* Forgot Password Modal Dialog */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2">
              <Key className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recover Workspace Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-normal">
              Enter your registered email address. We'll send your workspace password to your inbox via Resend.
            </DialogDescription>
          </DialogHeader>

          {forgotSuccessMsg ? (
            <div className="py-4 space-y-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{forgotSuccessMsg}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendForgotPassword} className="py-3 space-y-4">
              {forgotErrorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{forgotErrorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="forgotEmail" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Registered Email Address
                </Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  placeholder="e.g. prajwalgenious@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (forgotErrorMsg) setForgotErrorMsg('');
                  }}
                  className="h-10 text-xs border-slate-300 rounded-xl"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsForgotOpen(false)}
                  className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingForgot || !forgotEmail.trim()}
                  size="sm"
                  className="h-9 px-4 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs gap-1.5"
                >
                  {isSendingForgot ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Send Recovery Email
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {forgotSuccessMsg && (
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="w-full h-9 text-xs font-bold bg-purple-600 text-white rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

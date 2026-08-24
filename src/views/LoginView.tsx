import React, { useState } from 'react';
import { useAuth, USE_FIREBASE_AUTH } from '@/auth/AuthContext';
import { useLegacyAuth } from '@/auth/useLegacyAuth';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  BarChart3,
  Loader2,
  CheckCircle2,
  Building2,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const newAuth = USE_FIREBASE_AUTH ? useAuth() : null;
  const legacyAuth = USE_FIREBASE_AUTH ? null : useLegacyAuth();

  const login = newAuth ? newAuth.login : null;
  const loginWithCredentials = legacyAuth ? legacyAuth.loginWithCredentials : null;

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  return (
    <div className="min-h-screen w-screen flex bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 text-slate-900 font-sans antialiased relative overflow-hidden">
      {/* Light Theme Soft Ambient Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10 gap-8 lg:gap-12">
        
        {/* Left Side: Enterprise Feature Overview */}
        <div className="w-full lg:w-1/2 space-y-6 text-left hidden lg:block pr-4">
          <div className="inline-flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold gap-1.5 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Buildicy ERP v3.0 • Firebase Auth
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md">
                <AvatarFallback className="bg-transparent text-white font-bold">
                  <Building2 className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Buildicy <span className="text-indigo-600">ERP</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">Enterprise Management Platform</p>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Streamlined Enterprise Task Tracking & Role-Based Workflows
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Log in to manage tasks, review submittals, track team attendance, and coordinate real-time operations across departments.
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Role-Based Approvals</h4>
                <p className="text-[11px] text-slate-500">Multi-tier reviewer workflows</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Firebase Security</h4>
                <p className="text-[11px] text-slate-500">Custom RBAC claims & Firestore</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Live Attendance</h4>
                <p className="text-[11px] text-slate-500">Real-time check-ins & analytics</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Personnel Hub</h4>
                <p className="text-[11px] text-slate-500">HR management & payroll</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Shadcn UI Card Form */}
        <div className="w-full lg:w-1/2 max-w-md">
          <Card className="shadow-xl shadow-indigo-100/50 border-slate-200/80 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="p-6 sm:p-8 pb-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Sign In to ERP
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500 pt-0.5">
                    Enter your workspace email and password.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-5">
              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              {/* Form Inputs */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                    Work Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 text-xs border-slate-200 rounded-xl focus-visible:ring-indigo-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 text-xs border-slate-200 rounded-xl focus-visible:ring-indigo-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button using Shadcn Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !email.trim() || !password.trim()}
                  className="w-full h-11 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md gap-2 transition-all mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Workspace <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enterprise SSL Active
              </span>
              <span className="font-semibold text-slate-400">Buildicy ERP v3.0</span>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
  );
};

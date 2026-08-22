import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth, USE_FIREBASE_AUTH } from '@/auth/AuthContext';
import { useLegacyAuth } from '@/auth/useLegacyAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';
import { auth } from '@/firebase/config';

const DEMO_LOGINS = [
  { label: 'Prajwal (Admin)', email: 'prajwal@company.com', password: 'Admin@1234' },
  { label: 'Mizbha (Lead)', email: 'mizbha@company.com', password: 'Review@1234' },
  { label: 'Shiva (Intern)', email: 'shiva@company.com', password: 'Intern@1234' },
];

export const LoginView: React.FC = () => {
  // Two auth surfaces: when the flag is on we use real Firebase Auth via
  // the new context. When off (legacy mode), we fall through to the old
  // context that still owns loginWithCredentials + loginAsUser.
  const newAuth = USE_FIREBASE_AUTH ? useAuth() : null;
  const legacyAuth = USE_FIREBASE_AUTH ? null : useLegacyAuth();

  const login = newAuth ? newAuth.login : null;
  const loginWithCredentials = legacyAuth ? legacyAuth.loginWithCredentials : null;
  const loginAsUser = legacyAuth ? legacyAuth.loginAsUser : null;

  const [email, setEmail] = useState<string>('prajwal@company.com');
  const [password, setPassword] = useState<string>('Admin@1234');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (USE_FIREBASE_AUTH && login) {
        await login(email, password);
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
          ? 'Too many attempts. Try again later.'
          : 'An error occurred during authentication.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (creds: { email: string; password: string }) => {
    if (USE_FIREBASE_AUTH) {
      setEmail(creds.email);
      setPassword(creds.password);
      setIsSubmitting(true);
      signInWithEmailAndPassword(auth, creds.email, creds.password)
        .catch((err) => {
          const code = (err as { code?: string })?.code;
          setErrorMsg(
            code === 'auth/invalid-credential'
              ? 'Invalid demo credentials. Have you seeded Auth users? See functions/scripts/seedAuthUsers.js.'
              : 'Authentication failed.'
          );
        })
        .finally(() => setIsSubmitting(false));
    } else if (loginAsUser) {
      const idMap: Record<string, string> = {
        'prajwal@company.com': 'user-1',
        'mizbha@company.com': 'user-3',
        'shiva@company.com': 'user-5',
      };
      loginAsUser(idMap[creds.email] || 'user-1');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 p-4 font-sans antialiased relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl" />

      <Card className="w-full max-w-md bg-white border-0 shadow-2xl rounded-3xl overflow-hidden z-10 space-y-0">
        <CardHeader className="p-8 pb-4 text-center space-y-2 bg-slate-50/60 border-b border-slate-100">
          <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-extrabold text-slate-900 tracking-tight">Task Tracker ERP</CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium pt-0.5">
              {USE_FIREBASE_AUTH
                ? 'Enter credentials to sign in to your enterprise workspace.'
                : 'Enter credentials to sign in (legacy localStorage mode).'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-600" /> Work Email Address
              </Label>
              <Input
                type="email"
                placeholder="prajwal@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs border-slate-300 rounded-xl font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-600" /> Password
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-xs border-slate-300 rounded-xl font-medium"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="w-full h-10 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md gap-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to ERP'} <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {USE_FIREBASE_AUTH && (
            <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2 text-xs">
              <span className="font-extrabold text-purple-950 block text-[11px] uppercase tracking-wider">
                Default Credentials (First Login)
              </span>
              <div className="space-y-1 text-[11px] text-slate-600 font-normal">
                <div>👑 <strong className="text-purple-950">Admin:</strong> <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-bold">Admin@1234</code></div>
                <div>🛡️ <strong className="text-purple-950">Reviewer:</strong> <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-bold">Review@1234</code></div>
                <div>💻 <strong className="text-purple-950">Contributor:</strong> <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-bold">Intern@1234</code></div>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block text-center">
              1-Click Demo Sign-In
            </span>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_LOGINS.map((demo) => (
                <Button
                  key={demo.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDemoLogin(demo)}
                  className="text-[10px] h-8 px-1 font-bold border-purple-200 text-purple-950 hover:bg-purple-50 rounded-xl"
                >
                  {demo.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 bg-slate-50 border-t border-slate-100 justify-center">
          <span className="text-[10px] text-slate-400 font-medium">
            Task Tracker Enterprise ERP v3.0 {USE_FIREBASE_AUTH ? '• Firebase Auth' : '• Legacy mode'}
          </span>
        </CardFooter>
      </Card>
    </div>
  );
};

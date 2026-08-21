import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShieldCheck, Lock, Mail, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, loginAsUser } = useAuth();
  
  const [email, setEmail] = useState<string>('prajwal@company.com');
  const [password, setPassword] = useState<string>('admin@123');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const success = await loginWithCredentials(email.trim(), password.trim());
      if (!success) {
        setErrorMsg('Invalid email or password. Please verify credentials.');
      }
    } catch (err) {
      setErrorMsg('An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (userId: string) => {
    loginAsUser(userId);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 p-4 font-sans antialiased relative overflow-hidden">
      
      {/* Dynamic Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl" />

      <Card className="w-full max-w-md bg-white border-0 shadow-2xl rounded-3xl overflow-hidden z-10 space-y-0">
        
        {/* Header */}
        <CardHeader className="p-8 pb-4 text-center space-y-2 bg-slate-50/60 border-b border-slate-100">
          <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-extrabold text-slate-900 tracking-tight">Task Tracker ERP</CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium pt-0.5">
              Enter credentials to sign in to your enterprise workspace.
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
                onChange={e => setEmail(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
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

          {/* Preset Passwords Helper Box */}
          <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2 text-xs">
            <span className="font-extrabold text-purple-950 block text-[11px] uppercase tracking-wider">
              Default Credentials Guide
            </span>
            <div className="space-y-1 text-[11px] text-slate-600 font-normal">
              <div>👑 <strong className="text-purple-950">Admin/Founder:</strong> password <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-bold">admin@123</code></div>
              <div>🛡️ <strong className="text-purple-950">Reviewer/Lead:</strong> password <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-bold">reviewer@123</code></div>
              <div>💻 <strong className="text-purple-950">Intern/Contributor:</strong> password <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-bold">intern@123</code></div>
            </div>
          </div>

          {/* Quick Demo Sign-In Buttons */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block text-center">
              Or Instant 1-Click Persona Sign-In
            </span>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickDemoLogin('user-1')}
                className="text-[10px] h-8 px-1 font-bold border-purple-200 text-purple-950 hover:bg-purple-50 rounded-xl"
              >
                Prajwal (Admin)
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickDemoLogin('user-3')}
                className="text-[10px] h-8 px-1 font-bold border-amber-200 text-amber-950 hover:bg-amber-50 rounded-xl"
              >
                Mizbha (Lead)
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickDemoLogin('user-5')}
                className="text-[10px] h-8 px-1 font-bold border-sky-200 text-sky-950 hover:bg-sky-50 rounded-xl"
              >
                Shiva (Intern)
              </Button>
            </div>
          </div>

        </CardContent>

        <CardFooter className="p-4 bg-slate-50 border-t border-slate-100 justify-center">
          <span className="text-[10px] text-slate-400 font-medium">Task Tracker Enterprise ERP v3.0 &bull; Firebase Powered</span>
        </CardFooter>

      </Card>

    </div>
  );
};

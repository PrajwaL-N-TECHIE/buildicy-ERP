import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, Camera, Check, Lock, KeyRound } from 'lucide-react';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ open, onOpenChange }) => {
  const { currentUser, updateUser, changePassword } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState<string>(currentUser?.fullName || '');
  const [title, setTitle] = useState<string>(currentUser?.title || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser?.avatarUrl || '');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!currentUser) return null;

  const isAdmin = currentUser.roleTier === 'admin';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const wasPasswordChanged = Boolean(newPassword);

      if (newPassword) {
        if (newPassword.length < 6) {
          const errMsg = 'Password must be at least 6 characters long.';
          setErrorMsg(errMsg);
          toast.error('Invalid Password', errMsg);
          setIsSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          const errMsg = 'New password and confirm password do not match.';
          setErrorMsg(errMsg);
          toast.error('Password Mismatch', errMsg);
          setIsSaving(false);
          return;
        }
        await changePassword(newPassword);
      }

      const updateData: Partial<typeof currentUser> = {
        avatarUrl: avatarUrl.trim() || null
      };

      if (isAdmin) {
        updateData.fullName = fullName.trim();
        updateData.title = title.trim();
      }

      await updateUser(currentUser.id, updateData);

      if (wasPasswordChanged) {
        const msg = 'Password updated successfully! A security notice was sent to your email.';
        setSuccessMsg(msg);
        toast.success(
          '🔐 Password Changed Successfully!',
          `Security confirmation email dispatched to ${currentUser.email}`
        );
      } else {
        const msg = 'Profile settings updated successfully!';
        setSuccessMsg(msg);
        toast.success('✨ Profile Updated', 'Your profile preferences have been updated.');
      }

      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const errMsg = err?.message || 'Failed to update profile. Please try again.';
      setErrorMsg(errMsg);
      toast.error('Update Failed', errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100 pr-6">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                User Profile & Password Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal">
                Update avatar photo, password, and personal preferences.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
          
          {/* Avatar Photo Section */}
          <div className="space-y-2 text-center">
            <Label className="text-xs font-bold text-slate-900 block text-left">Profile Picture</Label>
            
            <div className="flex items-center justify-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-purple-300 shadow-sm">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={currentUser.fullName} /> : null}
                <AvatarFallback className="bg-purple-600 text-white font-bold text-base">
                  {getInitials(currentUser.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2 text-left">
                <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-200 transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
                <span className="text-[10px] text-slate-400 block">PNG or JPG up to 5MB</span>
              </div>
            </div>

            {/* Avatar Presets */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-semibold block text-left mb-1.5">Or Choose Avatar Preset</span>
              <div className="flex items-center justify-center space-x-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`rounded-full border-2 transition-all overflow-hidden ${
                      avatarUrl === url ? 'border-purple-600 ring-2 ring-purple-200 scale-110' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-8 h-8 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full Name & Job Title */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Full Name</span>
                {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
              </Label>
              <Input 
                value={isAdmin ? fullName : currentUser.fullName}
                onChange={e => setFullName(e.target.value)}
                disabled={!isAdmin}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Job Title</span>
                {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
              </Label>
              <Input 
                value={isAdmin ? title : currentUser.title}
                onChange={e => setTitle(e.target.value)}
                disabled={!isAdmin}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>

          {!isAdmin && (
            <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium">
              ℹ️ Full Name & Job Role can only be modified by an Administrator.
            </p>
          )}

          {/* Change Password Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-600" /> Change Account Password
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input 
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium"
              />
              <Input 
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving} className="h-9 px-5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
};

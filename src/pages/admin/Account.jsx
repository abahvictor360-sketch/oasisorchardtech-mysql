import { useState } from 'react';
import { KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { auth as authApi } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

function strengthOf(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak',   color: 'bg-red-400',    width: '33%' };
  if (score <= 2) return { label: 'Medium', color: 'bg-yellow-400', width: '66%' };
  return { label: 'Strong', color: 'bg-green-500', width: '100%' };
}

function PwInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"
        />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function Account() {
  const { user } = useAuth();
  const { addToast } = useApp();
  const [form, setForm]     = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const strength = strengthOf(form.newPw);

  const handleChangePassword = async () => {
    if (!form.current)              { addToast('Enter your current password.', 'error'); return; }
    if (form.newPw.length < 6)      { addToast('New password must be at least 6 characters.', 'error'); return; }
    if (form.newPw !== form.confirm){ addToast('Passwords do not match.', 'error'); return; }
    setSaving(true);
    const { error } = await authApi.changePassword(form.current, form.newPw);
    if (error) {
      addToast(error.message || 'Password change failed.', 'error');
    } else {
      addToast('Password changed! Other logged-in sessions have been signed out.', 'success');
      setForm({ current: '', newPw: '', confirm: '' });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1bb0ce]/10 flex items-center justify-center">
          <KeyRound size={20} className="text-[#1bb0ce]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0a1628]">Account Security</h2>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
      </div>

      {/* Change password */}
      <Card className="p-6 space-y-4">
        <PwInput
          label="Current Password"
          value={form.current}
          onChange={e => setForm(p => ({ ...p, current: e.target.value }))}
          placeholder="Your current password"
        />
        <PwInput
          label="New Password"
          value={form.newPw}
          onChange={e => setForm(p => ({ ...p, newPw: e.target.value }))}
          placeholder="Min. 6 characters"
        />
        {strength && (
          <div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className={`${strength.color} h-1.5 rounded-full transition-all`} style={{ width: strength.width }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Strength: {strength.label}</p>
          </div>
        )}
        <PwInput
          label="Confirm New Password"
          value={form.confirm}
          onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
          placeholder="Repeat the new password"
        />
        <Button variant="primary" onClick={handleChangePassword} disabled={saving} className="w-full sm:w-auto px-6">
          {saving ? <Spinner size="sm" color="white" /> : <KeyRound size={15} />}
          Change Password
        </Button>
      </Card>

      {/* Info */}
      <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
        <ShieldCheck size={15} className="shrink-0 mt-0.5" />
        <p>
          Changing your password signs out every other device that is logged in to this account.
          Your current session stays active.
        </p>
      </div>
    </div>
  );
}

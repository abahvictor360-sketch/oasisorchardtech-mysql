import { useState } from 'react';
import { Lock, Upload, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDate, getInitials } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const planNames = { basic: 'Basic Connect', smart: 'Smart Connect', business: 'Business Connect' };

function passwordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: 'bg-red-400', width: '33%' };
  if (score <= 2) return { label: 'Medium', color: 'bg-yellow-400', width: '66%' };
  return { label: 'Strong', color: 'bg-green-500', width: '100%' };
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useApp();

  // Profile form
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address?.street || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  const strength = passwordStrength(pwForm.newPw);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    await new Promise(r => setTimeout(r, 1000));
    updateUser({
      name: form.name,
      phone: form.phone,
      address: { ...(user?.address || {}), street: form.address },
    });
    addToast('Profile updated!', 'success');
    setSavingProfile(false);
  };

  const handleUpdatePassword = async () => {
    if (!pwForm.current) { addToast('Enter your current password.', 'error'); return; }
    if (pwForm.newPw.length < 6) { addToast('New password must be at least 6 characters.', 'error'); return; }
    if (pwForm.newPw !== pwForm.confirm) { addToast('Passwords do not match.', 'error'); return; }
    setSavingPw(true);
    await new Promise(r => setTimeout(r, 1000));
    addToast('Password updated successfully!', 'success');
    setPwForm({ current: '', newPw: '', confirm: '' });
    setSavingPw(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Avatar */}
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#0a1628] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {getInitials(user?.name || 'U')}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0a1628]">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <Button size="sm" variant="outline" className="mt-3 gap-2">
              <Upload size={14} /> Upload Photo
            </Button>
          </div>
        </div>
      </Card>

      {/* Profile form */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0a1628] mb-4 flex items-center gap-2">
          <User size={16} /> Profile Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <Lock size={12} className="inline ml-1 text-gray-400" />
            </label>
            <input
              value={user?.email || ''}
              readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <input
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          <div className="pt-1">
            <Button loading={savingProfile} onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0a1628] mb-4 flex items-center gap-2">
          <Lock size={16} /> Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={pwForm.newPw}
              onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
            {strength && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Strength: <span className="font-medium">{strength.label}</span></p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          <div className="pt-1">
            <Button loading={savingPw} onClick={handleUpdatePassword}>
              Update Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0a1628] mb-4 flex items-center gap-2">
          <Shield size={16} /> Account Information
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Member since</span>
            <span className="font-medium text-[#0a1628]">{user?.joinedDate ? formatDate(user.joinedDate) : '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Current plan</span>
            <span className="font-medium text-[#0a1628]">{planNames[user?.plan] || user?.plan || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Account status</span>
            <Badge variant={user?.status === 'active' ? 'success' : 'danger'} size="sm">
              {user?.status === 'active' ? 'Active' : 'Suspended'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

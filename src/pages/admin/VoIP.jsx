import { useState, useEffect, useCallback } from 'react';
import {
  Phone, PhoneOutgoing, PhoneIncoming, PhoneMissed,
  Settings, Users, List, Zap, Save, RotateCcw, Eye, EyeOff,
  CheckCircle, AlertTriangle, RefreshCw, Plus, Minus,
  Clock, DollarSign, TrendingUp,
} from 'lucide-react';
import { voip as voipApi } from '../../lib/api';
import { users as usersApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/helpers';

// ── Helpers ───────────────────────────────────────────────────
function fmtDuration(secs) {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PROVIDERS = [
  {
    id:    'demo',
    label: 'Demo Mode (no real calls)',
    desc:  'Simulated calls only. No credentials required. Great for testing.',
    fields: [],
  },
  {
    id:    'voipms',
    label: 'VoIP.ms (Recommended)',
    desc:  'Canadian VoIP provider. Get API credentials at voip.ms → API → Enable API.',
    fields: [], // credentials saved separately to voip_settings for security
    voipmsCredentials: true,
  },
  {
    id:    'twilio',
    label: 'Twilio',
    desc:  'Industry-standard VoIP. Get credentials at console.twilio.com',
    fields: [
      { key: 'accountSid',   label: 'Account SID',      placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', secret: false },
      { key: 'authToken',    label: 'Auth Token',        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  secret: true  },
      { key: 'twimlAppSid',  label: 'TwiML App SID',    placeholder: 'APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', secret: false },
      { key: 'callerNumber', label: 'Caller ID Number',  placeholder: '+1XXXXXXXXXX',                      secret: false },
    ],
  },
  {
    id:    'telnyx',
    label: 'Telnyx',
    desc:  'Cheaper per-minute rates. Credentials at portal.telnyx.com',
    fields: [
      { key: 'apiKey',        label: 'API Key',           placeholder: 'KEY...',    secret: true  },
      { key: 'connectionId',  label: 'Connection ID',     placeholder: '...',       secret: false },
      { key: 'callerNumber',  label: 'Caller ID Number',  placeholder: '+1XXXXXXXXXX', secret: false },
    ],
  },
  {
    id:    'vonage',
    label: 'Vonage (Nexmo)',
    desc:  'Good WebRTC SDK. Credentials at dashboard.nexmo.com',
    fields: [
      { key: 'apiKey',    label: 'API Key',    placeholder: 'xxxxxxxx', secret: false },
      { key: 'apiSecret', label: 'API Secret', placeholder: 'xxxxxxxx', secret: true  },
      { key: 'appId',     label: 'App ID',     placeholder: 'xxxxxxxx-...', secret: false },
    ],
  },
  {
    id:    'sip',
    label: 'Custom SIP / PBX',
    desc:  'Connect your own Asterisk, FreePBX, or other SIP server.',
    fields: [
      { key: 'sipServer',   label: 'SIP Server',     placeholder: 'sip.yourdomain.com', secret: false },
      { key: 'sipDomain',   label: 'SIP Domain',     placeholder: 'yourdomain.com',     secret: false },
      { key: 'sipUsername', label: 'SIP Username',   placeholder: 'admin',              secret: false },
      { key: 'sipPassword', label: 'SIP Password',   placeholder: '...',                secret: true  },
    ],
  },
];

const DEFAULT_CONFIG = {
  provider:      'demo',
  ratePerMinute: 0.014,
  enabled:       true,
};

const STATUS_BADGE = {
  ended:     { variant: 'success', label: 'Ended'     },
  answered:  { variant: 'success', label: 'Answered'  },
  missed:    { variant: 'danger',  label: 'Missed'    },
  cancelled: { variant: 'default', label: 'Cancelled' },
  initiated: { variant: 'info',    label: 'Initiated' },
  failed:    { variant: 'danger',  label: 'Failed'    },
};

// ── Save setting (stored in voip_settings — same table the dashboard reads) ─
async function saveSetting(key, value) {
  const { error } = await voipApi.saveSettings({ [key]: value });
  if (error) throw new Error(error.message);
}

// ── Provider Setup ────────────────────────────────────────────
function ProviderSetup() {
  const { addToast } = useApp();
  const [config,    setConfig]    = useState(DEFAULT_CONFIG);
  const [creds,     setCreds]     = useState({});
  const [vmsConfig, setVmsConfig] = useState({ api_user: '', api_pass: '', server: 'webrtc.voip.ms', did: '' });
  const [saving,    setSaving]    = useState(false);
  const [dirty,     setDirty]     = useState(false);
  const [showSecret, setShowSecret] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const { data } = await voipApi.getSettings();
        if (data) {
          if (data.provider_config) {
            const { provider, ratePerMinute, enabled, ...rest } = data.provider_config;
            setConfig({ provider: provider ?? 'demo', ratePerMinute: ratePerMinute ?? 0.014, enabled: enabled ?? true });
            setCreds(rest);
          }
          setVmsConfig(prev => ({
            api_user: data.voipms_api_user ?? prev.api_user,
            api_pass: data.voipms_api_pass ?? prev.api_pass,
            server:   data.voipms_server   ?? prev.server,
            did:      data.voipms_did      ?? prev.did,
          }));
        }
      } catch {}
    }
    load();
  }, []);

  const providerDef = PROVIDERS.find(p => p.id === config.provider) ?? PROVIDERS[0];

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSetting('provider_config', { ...config, ...creds });
      await saveSetting('voip_enabled',    { value: config.enabled });
      // Save VoIP.ms credentials to voip_settings (secure, server-side only)
      if (config.provider === 'voipms') {
        await voipApi.saveSettings({
          voipms_api_user: vmsConfig.api_user,
          voipms_api_pass: vmsConfig.api_pass,
          voipms_server:   vmsConfig.server,
          voipms_did:      vmsConfig.did,
        });
      }
      addToast('Phone call settings saved!', 'success');
      setDirty(false);
    } catch { addToast('Save failed.', 'error'); }
    finally { setSaving(false); }
  };

  const setC   = (k, v) => { setConfig(p => ({ ...p, [k]: v })); setDirty(true); };
  const setCr  = (k, v) => { setCreds(p => ({ ...p, [k]: v })); setDirty(true); };
  const setVms = (k, v) => { setVmsConfig(p => ({ ...p, [k]: v })); setDirty(true); };

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#0a1628]">Phone Call Service</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Enable or disable phone calling for all users.
            </p>
          </div>
          <button
            onClick={() => setC('enabled', !config.enabled)}
            className={[
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
              config.enabled ? 'bg-[#1bb0ce]' : 'bg-gray-200',
            ].join(' ')}
          >
            <span className={[
              'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
              config.enabled ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')} />
          </button>
        </div>
      </Card>

      {/* Provider selection */}
      <Card className="p-5">
        <h3 className="font-semibold text-[#0a1628] mb-4">Call Provider</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {PROVIDERS.map(p => (
            <label key={p.id} className={[
              'flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all',
              config.provider === p.id
                ? 'border-[#1bb0ce] bg-[#1bb0ce]/5'
                : 'border-gray-200 hover:border-gray-300',
            ].join(' ')}>
              <div className="flex items-center gap-2">
                <input type="radio" name="provider" value={p.id}
                  checked={config.provider === p.id}
                  onChange={() => { setC('provider', p.id); setCreds({}); }}
                  className="accent-[#1bb0ce]" />
                <span className="font-semibold text-sm text-[#0a1628]">{p.label}</span>
              </div>
              <p className="text-xs text-gray-500 ml-5">{p.desc}</p>
            </label>
          ))}
        </div>

        {/* Credential fields */}
        {config.provider === 'voipms' ? (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700">VoIP.ms API Credentials</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
              <p className="font-semibold">Setup Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Log in to voip.ms → Main Menu → API → Enable API</li>
                <li>Set an <strong>API Password</strong> (different from your login password)</li>
                <li>Whitelist your server IP under "Allowed IPs"</li>
                <li>Enter your VoIP.ms email and API password below</li>
                <li>Save, then use "Sub-Accounts" tab to provision users</li>
              </ol>
            </div>
            {[
              { k: 'api_user', label: 'API Username (your VoIP.ms email)', placeholder: 'you@example.com', secret: false },
              { k: 'api_pass', label: 'API Password',                       placeholder: 'voipms API password (not login password)', secret: true },
              { k: 'server',   label: 'WebRTC Server',                      placeholder: 'webrtc.voip.ms', secret: false },
              { k: 'did',      label: 'Caller DID Number',                  placeholder: '+19025551234', secret: false },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <div className="relative">
                  <input
                    type={f.secret && !showSecret[f.k] ? 'password' : 'text'}
                    value={vmsConfig[f.k] ?? ''}
                    onChange={e => setVms(f.k, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 font-mono"
                  />
                  {f.secret && (
                    <button type="button"
                      onClick={() => setShowSecret(p => ({ ...p, [f.k]: !p[f.k] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >{showSecret[f.k] ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : providerDef.fields.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 border-t border-gray-100 pt-4">
              {providerDef.label} Credentials
            </h4>
            {providerDef.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.secret && !showSecret[field.key] ? 'password' : 'text'}
                    value={creds[field.key] ?? ''}
                    onChange={e => setCr(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 font-mono"
                  />
                  {field.secret && (
                    <button type="button"
                      onClick={() => setShowSecret(p => ({ ...p, [field.key]: !p[field.key] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret[field.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            <p className="font-semibold flex items-center gap-2"><CheckCircle size={15} /> Demo mode active</p>
            <p className="mt-1 text-xs">Calls are simulated in the browser. No real phone network connection. Perfect for testing the UI and billing flows.</p>
          </div>
        )}
      </Card>

      {/* Rate config */}
      <Card className="p-5">
        <h3 className="font-semibold text-[#0a1628] mb-4">Overage Rate</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Price per minute (for calls beyond plan allocation)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">$</span>
              <input
                type="number" min="0" step="0.001"
                value={config.ratePerMinute}
                onChange={e => setC('ratePerMinute', parseFloat(e.target.value) || 0)}
                className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"
              />
              <span className="text-gray-500 text-sm">/ minute</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center text-sm">
            <p className="text-gray-500 text-xs mb-0.5">e.g. 10 min overage</p>
            <p className="font-bold text-[#0a1628]">{formatCurrency(config.ratePerMinute * 10)}</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} loading={saving} disabled={!dirty}>
          <Save size={15} className="mr-1.5" /> Save Settings
        </Button>
        <Button variant="ghost" onClick={() => { setConfig(DEFAULT_CONFIG); setCreds({}); setDirty(true); }}>
          <RotateCcw size={15} className="mr-1.5" /> Reset
        </Button>
        {dirty && <Badge variant="warning" size="sm">Unsaved changes</Badge>}
      </div>
    </div>
  );
}

// ── Call Logs ─────────────────────────────────────────────────
function CallLogs() {
  const [calls,   setCalls]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await voipApi.getAdminCalls();
      setCalls(data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? calls : calls.filter(c => {
    if (filter === 'missed')    return c.status === 'missed';
    if (filter === 'outbound')  return c.direction === 'outbound';
    if (filter === 'inbound')   return c.direction === 'inbound';
    return true;
  });

  const totalMins  = Math.ceil(calls.reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / 60);
  const totalCost  = calls.reduce((s, c) => s + (c.cost ?? 0), 0);
  const totalCalls = calls.filter(c => c.status === 'ended').length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Calls',   value: totalCalls,               icon: Phone,       unit: '' },
          { label: 'Total Minutes', value: totalMins,                icon: Clock,       unit: ' min' },
          { label: 'Total Revenue', value: formatCurrency(totalCost), icon: DollarSign, unit: '' },
        ].map(({ label, value, icon: Icon, unit }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1bb0ce]/10 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-[#1bb0ce]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-[#0a1628]">{value}{unit}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter + reload */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex gap-1.5 flex-wrap">
            {['all','outbound','inbound','missed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  filter === f ? 'bg-[#1bb0ce] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ].join(' ')}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Phone} title="No calls found" description="Call logs will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">User</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Direction</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Number</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium hidden md:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Duration</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Cost</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(call => {
                  const badge = STATUS_BADGE[call.status] ?? STATUS_BADGE.initiated;
                  return (
                    <tr key={call.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#0a1628] text-xs">{call.profiles?.name ?? '—'}</p>
                        <p className="text-gray-400 text-[11px]">{call.profiles?.email ?? '—'}</p>
                      </td>
                      <td className="px-5 py-3">
                        {call.direction === 'outbound'
                          ? <span className="flex items-center gap-1 text-[#1bb0ce] text-xs"><PhoneOutgoing size={12}/> Out</span>
                          : call.status === 'missed'
                          ? <span className="flex items-center gap-1 text-red-400 text-xs"><PhoneMissed size={12}/> Missed</span>
                          : <span className="flex items-center gap-1 text-green-500 text-xs"><PhoneIncoming size={12}/> In</span>
                        }
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">
                        {call.direction === 'outbound' ? call.to_number : call.from_number}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap hidden md:table-cell">
                        {formatDate(call.started_at)}
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-600">{fmtDuration(call.duration_seconds)}</td>
                      <td className="px-5 py-3">
                        {call.cost > 0
                          ? <span className="text-red-500 font-semibold text-xs">{formatCurrency(call.cost)}</span>
                          : <span className="text-green-600 text-xs">Plan</span>
                        }
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── User VoIP Accounts ────────────────────────────────────────
function UserAccounts() {
  const { addToast } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await voipApi.getAdminAccounts();
      setAccounts(data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await voipApi.updateAdminAccount(editModal.id, {
        phone_number:   editModal.phone_number ?? null,
        voip_credits:   parseFloat(editModal.voip_credits) || 0,
        voip_enabled:   editModal.voip_enabled,
      });
      addToast('Account updated!', 'success');
      setEditModal(null);
      load();
    } catch { addToast('Save failed.', 'error'); }
    finally { setSaving(false); }
  };

  const adjustCredits = (delta) =>
    setEditModal(p => p ? { ...p, voip_credits: Math.max(0, +(parseFloat(p.voip_credits || 0) + delta).toFixed(2)) } : p);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : accounts.length === 0 ? (
        <EmptyState icon={Users} title="No phone accounts" description="Accounts are auto-created when users first visit the Phone Calls page." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">User</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Plan</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">DID Number</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Credits</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#0a1628]">{acc.profiles?.name ?? '—'}</p>
                      <p className="text-gray-400 text-xs">{acc.profiles?.email ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="info" size="sm">{acc.profiles?.plan ?? 'basic'}</Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">
                      {acc.phone_number ?? <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#0a1628]">
                      {formatCurrency(acc.voip_credits ?? 0)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={acc.voip_enabled !== false ? 'success' : 'danger'} size="sm">
                        {acc.voip_enabled !== false ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setEditModal({ ...acc })}
                        className="text-xs text-[#1bb0ce] hover:underline font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={`Manage: ${editModal?.profiles?.name ?? 'User'}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        {editModal && (
          <div className="space-y-4">
            {/* DID number */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned DID Phone Number</label>
              <input
                value={editModal.phone_number ?? ''}
                onChange={e => setEditModal(p => ({ ...p, phone_number: e.target.value }))}
                placeholder="+1XXXXXXXXXX"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank if no inbound number assigned.</p>
            </div>

            {/* Credits */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Call Credits</label>
              <div className="flex items-center gap-3">
                <button onClick={() => adjustCredits(-5)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <Minus size={14} className="text-gray-600" />
                </button>
                <input
                  type="number" min="0" step="0.01"
                  value={editModal.voip_credits ?? 0}
                  onChange={e => setEditModal(p => ({ ...p, voip_credits: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"
                />
                <button onClick={() => adjustCredits(5)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <Plus size={14} className="text-gray-600" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Use +/- buttons to adjust by $5, or type directly.</p>
            </div>

            {/* Enable / disable */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-[#0a1628]">Phone Access</p>
                <p className="text-xs text-gray-500">Allow this user to make/receive calls.</p>
              </div>
              <button
                onClick={() => setEditModal(p => ({ ...p, voip_enabled: !p.voip_enabled }))}
                className={[
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  editModal.voip_enabled !== false ? 'bg-[#1bb0ce]' : 'bg-gray-200',
                ].join(' ')}
              >
                <span className={[
                  'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                  editModal.voip_enabled !== false ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: calls } = await voipApi.getAdminCalls();

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const all     = calls ?? [];
        const month   = all.filter(c => new Date(c.started_at) >= monthStart);
        const today   = all.filter(c => new Date(c.started_at) >= todayStart);
        const ended   = all.filter(c => c.status === 'ended');

        setStats({
          totalCalls:    ended.length,
          todayCalls:    today.filter(c => c.status === 'ended').length,
          monthCalls:    month.filter(c => c.status === 'ended').length,
          totalMins:     Math.ceil(ended.reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / 60),
          totalRevenue:  ended.reduce((s, c) => s + (c.cost ?? 0), 0),
          missedCalls:   all.filter(c => c.status === 'missed').length,
        });
      } catch { setStats({ totalCalls: 0, todayCalls: 0, monthCalls: 0, totalMins: 0, totalRevenue: 0, missedCalls: 0 }); }
    }
    load();
  }, []);

  if (!stats) return <div className="flex justify-center py-12"><Spinner /></div>;

  const cards = [
    { label: 'Total Calls',    value: stats.totalCalls,              icon: Phone,        color: 'text-[#1bb0ce]',  bg: 'bg-[#1bb0ce]/10' },
    { label: "Today's Calls",  value: stats.todayCalls,              icon: TrendingUp,   color: 'text-green-500',  bg: 'bg-green-50' },
    { label: 'This Month',     value: stats.monthCalls,              icon: Clock,        color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Total Minutes',  value: `${stats.totalMins}`,          icon: Clock,        color: 'text-blue-500',   bg: 'bg-blue-50' },
    { label: 'Overage Revenue',value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Missed Calls',   value: stats.missedCalls,             icon: PhoneMissed,  color: 'text-red-500',    bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-[#0a1628]">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* VoIP setup guide */}
      <Card className="p-5">
        <h3 className="font-semibold text-[#0a1628] mb-3 flex items-center gap-2">
          <Zap size={16} className="text-[#1bb0ce]" />
          Quick Integration Guide
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1bb0ce] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-medium text-[#0a1628]">Choose a Call Provider</p>
                <p className="text-xs text-gray-500 mt-0.5">Go to the <strong>Provider Setup</strong> tab. We recommend Twilio for beginners or Telnyx for lower costs.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1bb0ce] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-medium text-[#0a1628]">Add API Credentials</p>
                <p className="text-xs text-gray-500 mt-0.5">Enter your Account SID, Auth Token, and other credentials in the setup form.</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1bb0ce] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-medium text-[#0a1628]">Deploy the Token Function</p>
                <p className="text-xs text-gray-500 mt-0.5">Create a Supabase Edge Function called <code className="bg-gray-100 px-1 rounded">voip-token</code> that generates access tokens for the provider's SDK.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1bb0ce] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <div>
                <p className="font-medium text-[#0a1628]">Assign Phone Numbers</p>
                <p className="text-xs text-gray-500 mt-0.5">Go to <strong>User Accounts</strong> tab to assign DID numbers to users for inbound calling.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Main admin VoIP page ──────────────────────────────────────
// ── Sub-Accounts Manager (VoIP.ms provisioning) ───────────────
function SubAccountsManager() {
  const { addToast } = useApp();
  const [users,      setUsers]      = useState([]);
  const [accounts,   setAccounts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [provisioning, setProvisioning] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ur, ar] = await Promise.all([usersApi.list(), voipApi.getAdminAccounts()]);
      setUsers(ur.data ?? []);
      setAccounts(ar.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const accountMap = Object.fromEntries((accounts).map(a => [a.user_id, a]));

  const handleProvision = async (userId) => {
    setProvisioning(p => ({ ...p, [userId]: true }));
    try {
      await voipApi.provision(userId);
      addToast('Sub-account provisioned on VoIP.ms!', 'success');
      load();
    } catch (e) {
      addToast(e?.message || 'Provisioning failed. Check VoIP.ms credentials.', 'error');
    } finally {
      setProvisioning(p => ({ ...p, [userId]: false }));
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">VoIP.ms Sub-Account Provisioning</p>
        <p className="text-xs">Each user needs a VoIP.ms sub-account to make real phone calls. Click <strong>Provision</strong> to automatically create a sub-account on VoIP.ms and store the SIP credentials. Make sure VoIP.ms API credentials are saved in Provider Setup first.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SIP Username</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Server</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.filter(u => u.role !== 'admin').map(u => {
                const acc = accountMap[u.id];
                const hasAccount = !!(acc?.sip_username);
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0a1628]">{u.name || u.email}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {acc?.sip_username || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {acc?.sip_server || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {hasAccount
                        ? <Badge variant="success" size="sm"><CheckCircle size={11} className="mr-1" />Provisioned</Badge>
                        : <Badge variant="default" size="sm">Not set up</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={hasAccount ? 'outline' : 'primary'}
                        loading={provisioning[u.id]}
                        onClick={() => handleProvision(u.id)}
                      >
                        <Zap size={13} className="mr-1" />
                        {hasAccount ? 'Re-provision' : 'Provision'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {users.filter(u => u.role !== 'admin').length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function AdminVoIP() {
  const [tab, setTab] = useState('overview');

  const TABS = [
    { key: 'overview',  label: 'Overview',        icon: TrendingUp },
    { key: 'setup',     label: 'Provider Setup',   icon: Settings   },
    { key: 'logs',      label: 'Call Logs',         icon: List       },
    { key: 'users',     label: 'User Accounts',     icon: Users      },
    { key: 'provision', label: 'Sub-Accounts',      icon: Zap        },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0a1628]">VoIP Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure your VoIP provider, monitor calls, and manage user phone accounts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={[
              'px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
              tab === key ? 'border-[#1bb0ce] text-[#1bb0ce]' : 'border-transparent text-gray-500 hover:text-[#0a1628]',
            ].join(' ')}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <Overview />}
      {tab === 'setup'     && <ProviderSetup />}
      {tab === 'logs'      && <CallLogs />}
      {tab === 'users'     && <UserAccounts />}
      {tab === 'provision' && <SubAccountsManager />}
    </div>
  );
}

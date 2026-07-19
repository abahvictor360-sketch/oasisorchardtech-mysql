import { useState, useEffect } from 'react';
import { Bell, Mail, MessageCircle, Server, Save, Send, Eye, EyeOff, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { smtp as smtpApi } from '../../lib/api';

const BASE = '/api';

async function apiReq(path, options = {}) {
  const token = localStorage.getItem('oasis_token');
  const res = await fetch(BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  return { data: text ? JSON.parse(text) : null, ok: res.ok };
}

const TABS = ['SMTP', 'Email', 'WhatsApp'];

// ── Shared UI ─────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={['w-11 h-6 rounded-full transition-colors duration-200', checked ? 'bg-[#1bb0ce]' : 'bg-gray-200'].join(' ')} />
        <div className={['absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200', checked ? 'translate-x-5' : ''].join(' ')} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#0a1628]">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-[#0a1628]">{label}</label>}
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function MaskedInput({ label, name, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:border-[#1bb0ce] font-mono"
        />
        <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1bb0ce] focus:ring-1 focus:ring-[#1bb0ce]';

// ── SMTP Tab ──────────────────────────────────────────────────────
function SmtpTab({ addToast }) {
  const [cfg,     setCfg]     = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    smtpApi.getSettings().then(({ data }) => {
      if (data) setCfg(data);
      setLoading(false);
    });
  }, []);

  const set = (key, val) => setCfg(p => ({ ...p, [key]: val }));
  const handleChange = e => set(e.target.name, e.target.value);
  const enabled = cfg.smtp_enabled === 'true' || cfg.smtp_enabled === true;

  const save = async () => {
    setSaving(true);
    const { ok, data } = await smtpApi.saveSettings({ ...cfg, smtp_enabled: enabled ? 'true' : 'false' });
    if (ok) { setCfg(data); addToast('SMTP settings saved', 'success'); }
    else     addToast('Save failed', 'error');
    setSaving(false);
  };

  const sendTest = async () => {
    if (!testEmail) { addToast('Enter a test email address first', 'error'); return; }
    setTesting(true);
    const { ok, data } = await smtpApi.test(testEmail);
    if (ok && data?.sent) {
      addToast(`Test email sent to ${testEmail}! Check your inbox (and spam folder).`, 'success');
    } else {
      const reason = data?.error || 'Unknown error — check PHP error logs.';
      addToast(`Failed: ${reason}`, 'error');
    }
    setTesting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const port = cfg.smtp_port || '587';
  const secure = cfg.smtp_secure || 'tls';

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-bold text-[#0a1628] mb-1">SMTP Email Server</h3>
        <p className="text-sm text-gray-400">Configure your outgoing mail server. This powers all emails: order confirmations, email verification, and password resets.</p>
      </div>

      <Toggle
        checked={enabled}
        onChange={v => set('smtp_enabled', v ? 'true' : 'false')}
        label="Enable SMTP Email"
        description="When off, no emails are sent from the website"
      />

      {enabled && (
        <>
          {/* Hostinger preset banner */}
          <div className="bg-[#f0fbff] border border-[#b3e8f5] rounded-xl p-4 flex gap-3">
            <Info size={16} className="text-[#1bb0ce] shrink-0 mt-0.5" />
            <div className="text-sm text-[#0a1628]">
              <strong>Using Hostinger?</strong> Use <code className="bg-[#dff4fa] px-1 rounded">smtp.hostinger.com</code> port <code className="bg-[#dff4fa] px-1 rounded">587</code> with your Hostinger email address and password.
            </div>
          </div>

          {/* Host + Port row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="SMTP Host" hint="e.g. smtp.hostinger.com or smtp.gmail.com">
              <input name="smtp_host" value={cfg.smtp_host || ''} onChange={handleChange} placeholder="smtp.hostinger.com" className={inputCls} />
            </Field>
            <Field label="Port">
              <select name="smtp_port" value={port} onChange={handleChange} className={inputCls}>
                <option value="587">587 — STARTTLS (recommended)</option>
                <option value="465">465 — SSL</option>
                <option value="25">25 — Plain (no encryption)</option>
              </select>
            </Field>
            <Field label="Encryption">
              <select name="smtp_secure" value={secure} onChange={handleChange} className={inputCls}>
                <option value="tls">TLS / STARTTLS</option>
                <option value="ssl">SSL</option>
              </select>
            </Field>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SMTP Username (Email)" hint="Usually your full email address">
              <input name="smtp_user" value={cfg.smtp_user || ''} onChange={handleChange} placeholder="info@oasisorchardtech.com" className={inputCls} />
            </Field>
            <MaskedInput
              label="SMTP Password"
              name="smtp_pass"
              value={cfg.smtp_pass || ''}
              onChange={handleChange}
              placeholder="Your email account password"
              hint="Stored securely on the server, never exposed to the browser"
            />
          </div>

          {/* From */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="From Email" hint="Must match your SMTP username on most providers">
              <input name="smtp_from" value={cfg.smtp_from || ''} onChange={handleChange} placeholder="info@oasisorchardtech.com" className={inputCls} />
            </Field>
            <Field label="From Name">
              <input name="smtp_from_name" value={cfg.smtp_from_name || ''} onChange={handleChange} placeholder="Oasis Orchard Technologies" className={inputCls} />
            </Field>
          </div>

          {/* Test */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-[#0a1628] mb-3">Send a test email</p>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                className={`${inputCls} max-w-xs`}
              />
              <Button variant="outline" onClick={sendTest} disabled={testing} className="gap-2 shrink-0">
                {testing ? <Spinner size="sm" /> : <Send size={14} />}
                Send Test
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Save settings first, then send a test to verify the connection works.</p>
          </div>
        </>
      )}

      <Button variant="primary" onClick={save} disabled={saving} className="gap-2">
        {saving ? <><Spinner size="sm" color="white" />Saving…</> : <><Save size={16} />Save SMTP Settings</>}
      </Button>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function Notifications() {
  const { addToast } = useApp();
  const [tab,     setTab]     = useState('SMTP');
  const [cfg,     setCfg]     = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [testing, setTesting] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState(null);

  useEffect(() => {
    Promise.all([
      apiReq('/notifications/settings'),
      smtpApi.getSettings(),
    ]).then(([notif, smtpRes]) => {
      if (notif.data)    setCfg(notif.data);
      if (smtpRes.data)  setSmtpStatus(smtpRes.data.smtp_enabled);
      setLoading(false);
    });
  }, []);

  const set = (key, val) => setCfg(prev => ({ ...prev, [key]: val }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  const save = async () => {
    setSaving(true);
    const { ok } = await apiReq('/notifications/settings', { method: 'PUT', body: cfg });
    if (ok) addToast('Notification settings saved', 'success');
    else    addToast('Save failed', 'error');
    setSaving(false);
  };

  const sendTest = async (type) => {
    setTesting(true);
    const { ok, data } = await apiReq('/notifications/test', {
      method: 'POST',
      body: { type, email: cfg.admin_email },
    });
    if (ok && data?.sent) addToast(`Test ${type} sent! Check your ${type === 'email' ? 'inbox' : 'WhatsApp'}.`, 'success');
    else addToast('Test failed — check your SMTP settings and try again.', 'error');
    setTesting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  const emailEnabled    = cfg.email_enabled    === 'true';
  const whatsappEnabled = cfg.whatsapp_enabled === 'true';
  const provider        = cfg.whatsapp_provider || 'callmebot';
  const smtpOn          = smtpStatus === 'true' || smtpStatus === true;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1bb0ce]/10 flex items-center justify-center">
          <Bell size={20} className="text-[#1bb0ce]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0a1628]">Notifications & Email</h2>
          <p className="text-sm text-gray-400">Configure SMTP and get notified when orders are placed</p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Server size={18} className="text-purple-500" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#0a1628] text-sm">SMTP</p>
            <p className="text-xs text-gray-400 truncate">{smtpOn ? 'Configured' : 'Not enabled'}</p>
          </div>
          {smtpOn
            ? <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shrink-0"><CheckCircle size={11} />On</span>
            : <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">Off</span>}
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Mail size={18} className="text-blue-500" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#0a1628] text-sm">Email Alerts</p>
            <p className="text-xs text-gray-400 truncate">{cfg.admin_email || 'Not configured'}</p>
          </div>
          {emailEnabled
            ? <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shrink-0"><CheckCircle size={11} />On</span>
            : <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">Off</span>}
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><MessageCircle size={18} className="text-green-500" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#0a1628] text-sm">WhatsApp</p>
            <p className="text-xs text-gray-400 truncate">{cfg.whatsapp_phone || 'Not configured'}</p>
          </div>
          {whatsappEnabled
            ? <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shrink-0"><CheckCircle size={11} />On</span>
            : <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">Off</span>}
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={['px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === t ? 'bg-white text-[#0a1628] shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
            {t === 'SMTP' && <Server size={13} className="inline mr-1.5 mb-0.5" />}
            {t === 'Email' && <Mail size={13} className="inline mr-1.5 mb-0.5" />}
            {t === 'WhatsApp' && <MessageCircle size={13} className="inline mr-1.5 mb-0.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* ── SMTP tab ── */}
      {tab === 'SMTP' && <SmtpTab addToast={addToast} />}

      {/* ── Email notifications tab ── */}
      {tab === 'Email' && (
        <Card className="p-6 space-y-5">
          <div>
            <h3 className="font-bold text-[#0a1628] mb-1">Order Email Alerts</h3>
            <p className="text-sm text-gray-400">Receive an email every time a customer places an order. Requires SMTP to be configured.</p>
          </div>

          {!smtpOn && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 text-sm text-yellow-800">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div>SMTP is not enabled. Go to the <button className="font-semibold underline" onClick={() => setTab('SMTP')}>SMTP tab</button> to configure it first.</div>
            </div>
          )}

          <Toggle
            checked={emailEnabled}
            onChange={v => set('email_enabled', v ? 'true' : 'false')}
            label="Enable Admin Order Emails"
            description="Send an HTML order summary to the admin email below"
          />

          {emailEnabled && (
            <>
              <div>
                <label className="text-sm font-medium text-[#0a1628] block mb-1">Admin Email Address</label>
                <input
                  type="email"
                  name="admin_email"
                  value={cfg.admin_email || ''}
                  onChange={handleChange}
                  placeholder="admin@yourdomain.com"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">New order notifications will be sent to this address.</p>
              </div>

              <Button variant="outline" onClick={() => sendTest('email')} disabled={testing || !cfg.admin_email || !smtpOn} className="gap-2">
                {testing ? <Spinner size="sm" /> : <Send size={14} />}
                Send Test Order Email
              </Button>
            </>
          )}

          <Button variant="primary" onClick={save} disabled={saving} className="gap-2">
            {saving ? <><Spinner size="sm" color="white" />Saving…</> : <><Save size={16} />Save</>}
          </Button>
        </Card>
      )}

      {/* ── WhatsApp tab ── */}
      {tab === 'WhatsApp' && (
        <Card className="p-6 space-y-5">
          <div>
            <h3 className="font-bold text-[#0a1628] mb-1">WhatsApp Alerts</h3>
            <p className="text-sm text-gray-400">Receive a WhatsApp message every time a customer places an order.</p>
          </div>

          <Toggle
            checked={whatsappEnabled}
            onChange={v => set('whatsapp_enabled', v ? 'true' : 'false')}
            label="Enable WhatsApp Notifications"
            description="Receive a WhatsApp message every time an order is placed"
          />

          {whatsappEnabled && (
            <>
              <div>
                <label className="text-sm font-medium text-[#0a1628] block mb-1">Your WhatsApp Number</label>
                <input name="whatsapp_phone" value={cfg.whatsapp_phone || ''} onChange={handleChange} placeholder="+1234567890" className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +1 for Canada/USA.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-[#0a1628] block mb-2">Provider</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'callmebot', name: 'CallMeBot', badge: 'Free',  color: 'text-green-700 bg-green-50 border-green-200' },
                    { id: 'ultramsg',  name: 'UltraMsg',  badge: 'Paid',  color: 'text-blue-700 bg-blue-50 border-blue-200' },
                    { id: 'twilio',    name: 'Twilio',    badge: 'Paid',  color: 'text-purple-700 bg-purple-50 border-purple-200' },
                  ].map(p => (
                    <label key={p.id} className={['flex flex-col gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all', provider === p.id ? 'border-[#1bb0ce] bg-[#e0f7fb]' : 'border-gray-200 hover:border-gray-300'].join(' ')}>
                      <input type="radio" name="whatsapp_provider" value={p.id} checked={provider === p.id} onChange={handleChange} className="sr-only" />
                      <span className="font-semibold text-sm text-[#0a1628]">{p.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border w-fit ${p.color}`}>{p.badge}</span>
                    </label>
                  ))}
                </div>
              </div>

              {provider === 'callmebot' && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 space-y-2">
                    <p className="font-semibold">CallMeBot Setup (Free — 3 steps)</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Save <strong>+34 644 59 77 91</strong> as a contact in your phone</li>
                      <li>Send this WhatsApp message to that number: <code className="bg-green-100 px-1 rounded">I allow callmebot to send me messages</code></li>
                      <li>You will receive your API key via WhatsApp — paste it below</li>
                    </ol>
                  </div>
                  <MaskedInput label="API Key" name="whatsapp_apikey" value={cfg.whatsapp_apikey || ''} onChange={handleChange} placeholder="123456" hint="Received from CallMeBot via WhatsApp after registration." />
                </div>
              )}

              {provider === 'ultramsg' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                    Sign up at <strong>ultramsg.com</strong>, create an instance, and copy your Instance ID and Token below.
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0a1628] block mb-1">Instance ID</label>
                    <input name="whatsapp_instance" value={cfg.whatsapp_instance || ''} onChange={handleChange} placeholder="instance12345" className={inputCls} />
                  </div>
                  <MaskedInput label="Token" name="whatsapp_apikey" value={cfg.whatsapp_apikey || ''} onChange={handleChange} placeholder="your_ultramsg_token" />
                </div>
              )}

              {provider === 'twilio' && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-800">
                    Use your Twilio account. The WhatsApp Sandbox sender is <code>whatsapp:+14155238886</code> for testing.
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0a1628] block mb-1">Account SID</label>
                    <input name="whatsapp_sid" value={cfg.whatsapp_sid || ''} onChange={handleChange} placeholder="ACxxxxxxxxxxxxxxx" className={`${inputCls} font-mono`} />
                  </div>
                  <MaskedInput label="Auth Token" name="whatsapp_secret" value={cfg.whatsapp_secret || ''} onChange={handleChange} placeholder="your_auth_token" />
                  <div>
                    <label className="text-sm font-medium text-[#0a1628] block mb-1">From Number</label>
                    <input name="whatsapp_from" value={cfg.whatsapp_from || 'whatsapp:+14155238886'} onChange={handleChange} placeholder="whatsapp:+14155238886" className={`${inputCls} font-mono`} />
                    <p className="text-xs text-gray-400 mt-1">Format: <code>whatsapp:+1XXXXXXXXXX</code></p>
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={() => sendTest('whatsapp')} disabled={testing || !cfg.whatsapp_phone} className="gap-2">
                {testing ? <Spinner size="sm" /> : <Send size={14} />}
                Send Test WhatsApp
              </Button>
            </>
          )}

          <Button variant="primary" onClick={save} disabled={saving} className="gap-2">
            {saving ? <><Spinner size="sm" color="white" />Saving…</> : <><Save size={16} />Save</>}
          </Button>
        </Card>
      )}
    </div>
  );
}

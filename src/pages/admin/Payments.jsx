import { useState, useEffect } from 'react';
import { CreditCard, Eye, EyeOff, Save, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { payments as paymentsApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const TABS = ['Stripe', 'General'];

function MaskedInput({ label, name, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-[#0a1628]">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:border-[#1bb0ce] focus:ring-1 focus:ring-[#1bb0ce] font-mono"
        />
        <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
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

function StatusBadge({ enabled }) {
  return enabled
    ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"><CheckCircle size={12} />Active</span>
    : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full"><XCircle size={12} />Inactive</span>;
}

export default function Payments() {
  const { addToast } = useApp();
  const [tab,     setTab]     = useState('Stripe');
  const [cfg,     setCfg]     = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    paymentsApi.settings().then(({ data }) => {
      if (data) setCfg(data);
      setLoading(false);
    });
  }, []);

  const set = (key, val) => setCfg(prev => ({ ...prev, [key]: val }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    set(name, value);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await paymentsApi.saveSettings(cfg);
    if (error) addToast('Save failed: ' + error.message, 'error');
    else addToast('Payment settings saved', 'success');
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  const stripeEnabled = cfg.stripe_enabled === 'true';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1bb0ce]/10 flex items-center justify-center">
          <CreditCard size={20} className="text-[#1bb0ce]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0a1628]">Payment Gateway</h2>
          <p className="text-sm text-gray-400">Configure Stripe for checkout</p>
        </div>
      </div>

      {/* Gateway status overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#635bff]/10 flex items-center justify-center text-[#635bff] font-extrabold text-lg">S</div>
          <div className="flex-1">
            <p className="font-semibold text-[#0a1628]">Stripe</p>
            <p className="text-xs text-gray-400">Credit &amp; debit cards</p>
          </div>
          <StatusBadge enabled={stripeEnabled} />
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={['px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === t ? 'bg-white text-[#0a1628] shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Stripe ── */}
      {tab === 'Stripe' && (
        <Card className="p-6 space-y-6">
          <Toggle
            checked={stripeEnabled}
            onChange={v => set('stripe_enabled', v ? 'true' : 'false')}
            label="Enable Stripe"
            description="Accept credit and debit cards via Stripe"
          />

          {stripeEnabled && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  Get your keys from{' '}
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="underline font-medium">
                    dashboard.stripe.com/apikeys
                  </a>. Use <strong>test keys</strong> (pk_test_…) while testing.
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-[#0a1628] block mb-1">Publishable Key</label>
                  <input
                    name="stripe_publishable_key"
                    value={cfg.stripe_publishable_key || ''}
                    onChange={handleChange}
                    placeholder="pk_live_… or pk_test_…"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1bb0ce] font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">Safe to expose — used in the browser to load Stripe Elements.</p>
                </div>
                <MaskedInput label="Secret Key"         name="stripe_secret_key"      value={cfg.stripe_secret_key || ''}      onChange={handleChange} placeholder="sk_live_… or sk_test_…"  hint="Never shared publicly. Used server-side only." />
                <MaskedInput label="Webhook Signing Secret" name="stripe_webhook_secret" value={cfg.stripe_webhook_secret || ''} onChange={handleChange} placeholder="whsec_…"               hint="From Stripe Dashboard → Webhooks. Used to verify webhook events." />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-[#0a1628] mb-2">Stripe Webhook Setup</p>
                <p>1. Go to Stripe Dashboard → Developers → Webhooks → Add endpoint</p>
                <p>2. Endpoint URL: <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">https://yourdomain.com/api/payments/stripe/webhook</code></p>
                <p>3. Select event: <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">payment_intent.succeeded</code></p>
                <p>4. Copy the signing secret and paste above.</p>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ── General ── */}
      {tab === 'General' && (
        <Card className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-[#0a1628] block mb-2">Currency</label>
            <select
              name="currency"
              value={cfg.currency || 'CAD'}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1bb0ce]"
            >
              {[['CAD','Canadian Dollar (CAD)'],['USD','US Dollar (USD)'],['GBP','British Pound (GBP)'],['EUR','Euro (EUR)']].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Must match your Stripe account currency settings.</p>
          </div>
        </Card>
      )}

      {/* Save */}
      <Button variant="primary" onClick={save} disabled={saving} className="w-full sm:w-auto px-8">
        {saving ? <><Spinner size="sm" color="white" />Saving…</> : <><Save size={16} />Save Settings</>}
      </Button>
    </div>
  );
}

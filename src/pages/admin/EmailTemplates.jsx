import { useState, useEffect, useCallback } from 'react';
import { emailTemplates } from '../../lib/api';
import {
  Plus, Save, Trash2, RotateCcw, Send, Eye, EyeOff,
  ChevronRight, Mail, AlertCircle, CheckCircle, X, Loader2,
} from 'lucide-react';

const CATEGORY_COLORS = {
  welcome:             'bg-emerald-100 text-emerald-800',
  email_verification:  'bg-blue-100 text-blue-800',
  password_reset:      'bg-orange-100 text-orange-800',
  order_confirmation:  'bg-violet-100 text-violet-800',
  order_status_update: 'bg-indigo-100 text-indigo-800',
  new_user_admin:      'bg-pink-100 text-pink-800',
  voip_provisioned:    'bg-cyan-100 text-cyan-800',
  support_new_admin:   'bg-amber-100 text-amber-800',
  support_reply:       'bg-teal-100 text-teal-800',
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-xl shadow-lg px-4 py-3 max-w-sm text-sm font-medium
      ${type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
      {type === 'success'
        ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-emerald-600" />
        : <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1"><X size={14} /></button>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0a1628] hover:bg-[#1bb0ce]'}`}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewTemplateModal({ onSave, onClose }) {
  const [form, setForm] = useState({ id: '', name: '', subject: '', body_html: '', variables: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.id || !form.name || !form.subject || !form.body_html) {
      setError('All fields except Variables are required.');
      return;
    }
    setSaving(true);
    setError('');
    const vars = form.variables ? form.variables.split(',').map(v => v.trim()).filter(Boolean) : [];
    const { data, error: err } = await emailTemplates.create({ ...form, variables: vars });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">New Email Template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Template ID <span className="text-red-500">*</span></label>
            <input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_') }))}
              placeholder="e.g. my_custom_email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]" />
            <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, underscores only.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Display Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="My Custom Email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Subject Line <span className="text-red-500">*</span></label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Your email subject" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Variables (comma-separated)</label>
            <input value={form.variables} onChange={e => setForm(f => ({ ...f, variables: e.target.value }))}
              placeholder="name, email, order_id" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Body HTML <span className="text-red-500">*</span></label>
            <textarea value={form.body_html} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
              rows={6} placeholder='<h2>Hello {{name}}</h2><p>Your message here...</p>'
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] resize-y" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-[#0a1628] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#1bb0ce] disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [varInput, setVarInput] = useState('');

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await emailTemplates.list();
    setLoading(false);
    if (error) { showToast(error.message, 'error'); return; }
    setTemplates(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectTemplate = async (tpl) => {
    const { data, error } = await emailTemplates.get(tpl.id);
    if (error) { showToast(error.message, 'error'); return; }
    setSelected(data);
    setDraft({ subject: data.subject, body_html: data.body_html, is_active: data.is_active });
    setVarInput(Array.isArray(data.variables) ? data.variables.join(', ') : '');
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const vars = varInput ? varInput.split(',').map(v => v.trim()).filter(Boolean) : [];
    const { data, error } = await emailTemplates.update(selected.id, { ...draft, variables: vars });
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    setSelected(data);
    setTemplates(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
    showToast('Template saved successfully!');
  };

  const handleDelete = () => {
    setConfirm({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${selected?.name}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        const { error } = await emailTemplates.remove(selected.id);
        if (error) { showToast(error.message, 'error'); return; }
        setTemplates(prev => prev.filter(t => t.id !== selected.id));
        setSelected(null);
        setDraft(null);
        showToast('Template deleted.');
      },
    });
  };

  const handleReset = () => {
    setConfirm({
      title: 'Reset to Default',
      message: `This will replace the current content of "${selected?.name}" with the original default. Your edits will be lost.`,
      danger: false,
      onConfirm: async () => {
        setConfirm(null);
        const { data, error } = await emailTemplates.reset(selected.id);
        if (error) { showToast(error.message, 'error'); return; }
        setSelected(data);
        setDraft({ subject: data.subject, body_html: data.body_html, is_active: data.is_active });
        setVarInput(Array.isArray(data.variables) ? data.variables.join(', ') : '');
        setTemplates(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
        showToast('Template reset to default.');
      },
    });
  };

  const handleTest = async () => {
    if (!testEmail.trim()) { showToast('Enter an email address to test.', 'error'); return; }
    setTestSending(true);
    const { error } = await emailTemplates.test(selected.id, testEmail.trim());
    setTestSending(false);
    if (error) { showToast('Test failed: ' + error.message, 'error'); return; }
    showToast(`Test email sent to ${testEmail}!`);
  };

  const handleNewSave = (tpl) => {
    setShowNew(false);
    setTemplates(prev => [...prev, tpl]);
    selectTemplate(tpl);
    showToast(`Template "${tpl.name}" created!`);
  };

  const isDirty = draft && selected && (
    draft.subject !== selected.subject ||
    draft.body_html !== selected.body_html ||
    draft.is_active !== selected.is_active ||
    varInput !== (Array.isArray(selected.variables) ? selected.variables.join(', ') : '')
  );

  const previewHtml = draft ? `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>body{margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;}</style></head>
    <body>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#0a1628,#1bb0ce);padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Oasis Orchard Technologies</h1>
        <p style="margin:4px 0 0;color:#b3e8f5;font-size:13px;">Professional Wireless Solutions &mdash; Canada</p>
      </td></tr>
      <tr><td style="background:#fff;padding:32px;border:1px solid #e8ecf0;border-top:none;">
        ${draft.body_html.replace(/\{\{[^}]+\}\}/g, '<em style="color:#1bb0ce;background:#f0fbff;padding:1px 4px;border-radius:3px;">[variable]</em>')}
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 32px;border:1px solid #e8ecf0;border-top:none;border-radius:0 0 12px 12px;text-align:center;">
        <p style="margin:0;color:#aaa;font-size:12px;">&copy; ${new Date().getFullYear()} Oasis Orchard Technologies</p>
      </td></tr>
    </table></td></tr></table></body></html>` : '';

  return (
    <div className="flex h-full min-h-0 gap-0">
      {/* Left panel — template list */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Email Templates</h2>
            <p className="text-xs text-gray-400 mt-0.5">{templates.length} templates</p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-[#0a1628] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#1bb0ce] transition-colors">
            <Plus size={13} />New
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#1bb0ce]" />
          </div>
        ) : (
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {templates.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No templates yet. Click New to create one.</p>
            )}
            {templates.map(tpl => (
              <button key={tpl.id} onClick={() => selectTemplate(tpl)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                  ${selected?.id === tpl.id ? 'bg-[#f0fbff] border border-[#b3e8f5]' : 'hover:bg-gray-50'}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tpl.is_active ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${selected?.id === tpl.id ? 'text-[#0a1628]' : 'text-gray-700'}`}>{tpl.name}</p>
                  <p className="text-xs text-gray-400 truncate font-mono">{tpl.id}</p>
                </div>
                <ChevronRight size={14} className={`flex-shrink-0 ${selected?.id === tpl.id ? 'text-[#1bb0ce]' : 'text-gray-300 group-hover:text-gray-400'}`} />
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Right panel — editor */}
      {!selected ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-16 h-16 bg-[#f0fbff] rounded-2xl flex items-center justify-center">
            <Mail size={32} className="text-[#1bb0ce]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Select a Template</h3>
            <p className="text-gray-500 text-sm mt-1">Choose a template from the list to edit it, or create a new one.</p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-[#0a1628] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1bb0ce] transition-colors">
            <Plus size={16} />New Template
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[selected.id] || 'bg-gray-100 text-gray-600'}`}>
                {selected.id}
              </span>
              {selected.is_system && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">system</span>
              )}
              {isDirty && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">unsaved changes</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPreview(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                {showPreview ? <><EyeOff size={13} />Editor</> : <><Eye size={13} />Preview</>}
              </button>
              {selected.is_system && (
                <button onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                  <RotateCcw size={13} />Reset
                </button>
              )}
              {!selected.is_system && (
                <button onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 size={13} />Delete
                </button>
              )}
              <button onClick={handleSave} disabled={saving || !isDirty}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#0a1628] text-white hover:bg-[#1bb0ce] disabled:opacity-40 transition-colors">
                {saving ? <><Loader2 size={13} className="animate-spin" />Saving…</> : <><Save size={13} />Save</>}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Template Name</label>
                <p className="text-sm text-gray-800 font-medium">{selected.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Active</label>
                <button onClick={() => setDraft(d => ({ ...d, is_active: !d.is_active }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${draft.is_active ? 'bg-[#1bb0ce]' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${draft.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Subject Line</label>
              <input value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Variables
                <span className="ml-2 font-normal text-gray-400 normal-case tracking-normal">comma-separated list of placeholder names</span>
              </label>
              <input value={varInput} onChange={e => setVarInput(e.target.value)}
                placeholder="name, email, order_id"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]" />
              {varInput && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {varInput.split(',').map(v => v.trim()).filter(Boolean).map(v => (
                    <span key={v} className="inline-block bg-[#f0fbff] border border-[#b3e8f5] text-[#0a1628] text-xs font-mono px-2 py-0.5 rounded">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {showPreview ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Preview</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <iframe
                    srcDoc={previewHtml}
                    title="Email preview"
                    className="w-full h-[500px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Body HTML</label>
                  <span className="text-xs text-gray-400">Use <code className="bg-gray-100 px-1 rounded">{'{{variable_name}}'}</code> for placeholders. Append <code className="bg-gray-100 px-1 rounded">_html</code> for raw HTML vars.</span>
                </div>
                <textarea
                  value={draft.body_html}
                  onChange={e => setDraft(d => ({ ...d, body_html: e.target.value }))}
                  rows={16}
                  spellCheck={false}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] resize-y leading-relaxed"
                />
              </div>
            )}

            {/* Test send */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Send Test Email</label>
              <p className="text-xs text-gray-500 mb-3">Sends this template with placeholder values so you can preview it in your inbox.</p>
              <div className="flex gap-2">
                <input
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  type="email"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]"
                />
                <button onClick={handleTest} disabled={testSending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0a1628] text-white rounded-lg text-sm font-medium hover:bg-[#1bb0ce] disabled:opacity-50 transition-colors flex-shrink-0">
                  {testSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {testSending ? 'Sending…' : 'Send Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {showNew && <NewTemplateModal onSave={handleNewSave} onClose={() => setShowNew(false)} />}
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  Tag, Plus, Trash2, Save, Eye, EyeOff, GripVertical, AlertCircle,
} from 'lucide-react';
import { content as contentApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const ICON_OPTIONS = [
  { value: 'PhoneCall',  label: 'Phone' },
  { value: 'Smartphone', label: 'Smartphone' },
  { value: 'Monitor',    label: 'Monitor' },
];

const DEFAULT_TABS = [
  { key: 'all',        label: 'All Phones', icon: 'PhoneCall',  visible: true,  builtin: true },
  { key: 'mobile',     label: 'Mobile',     icon: 'Smartphone', visible: true,  builtin: true },
  { key: 'home-phone', label: 'Home Phone', icon: 'PhoneCall',  visible: true,  builtin: true },
];

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40';

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function Categories() {
  const { addToast } = useApp();
  const [tabs,    setTabs]    = useState(DEFAULT_TABS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [newTab,  setNewTab]  = useState({ label: '', key: '', icon: 'PhoneCall' });
  const [keyAuto, setKeyAuto] = useState(true);

  useEffect(() => {
    contentApi.get('shop_tabs').then(({ data }) => {
      if (Array.isArray(data) && data.length > 0) {
        // Merge builtins with saved data so builtin flag is preserved
        const builtinKeys = DEFAULT_TABS.map(t => t.key);
        const merged = data.map(t => ({
          ...t,
          builtin: builtinKeys.includes(t.key),
          visible: t.visible !== false,
        }));
        setTabs(merged);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await contentApi.save('shop_tabs', tabs);
    if (error) addToast('Save failed', 'error');
    else       addToast('Categories saved — shop tabs updated.', 'success');
    setSaving(false);
  };

  const toggle = (key) =>
    setTabs(prev => prev.map(t => t.key === key && !t.builtin
      ? { ...t, visible: !t.visible }
      : t.key === key && t.builtin && t.key !== 'all'
      ? { ...t, visible: !t.visible }
      : t
    ));

  const updateLabel = (key, label) =>
    setTabs(prev => prev.map(t => t.key === key ? { ...t, label } : t));

  const updateIcon = (key, icon) =>
    setTabs(prev => prev.map(t => t.key === key ? { ...t, icon } : t));

  const remove = (key) =>
    setTabs(prev => prev.filter(t => t.key !== key));

  const addTab = () => {
    const label = newTab.label.trim();
    const key   = newTab.key.trim() || slugify(label);
    if (!label) { addToast('Category name is required.', 'error'); return; }
    if (!key)   { addToast('Category key is required.', 'error');  return; }
    if (tabs.some(t => t.key === key)) { addToast('A category with this key already exists.', 'error'); return; }
    setTabs(prev => [...prev, { key, label, icon: newTab.icon, visible: true, builtin: false }]);
    setNewTab({ label: '', key: '', icon: 'PhoneCall' });
    setKeyAuto(true);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1bb0ce]/10 flex items-center justify-center">
            <Tag size={20} className="text-[#1bb0ce]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0a1628]">Shop Categories</h2>
            <p className="text-sm text-gray-400">Manage which tabs appear on the shop page</p>
          </div>
        </div>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? <Spinner size="sm" color="white" /> : <Save size={15} />}
          Save Changes
        </Button>
      </div>

      {/* Category list */}
      <Card className="divide-y divide-gray-100">
        {tabs.map((tab) => (
          <div key={tab.key} className="flex items-center gap-3 px-4 py-3">
            {/* Drag handle (visual only) */}
            <GripVertical size={16} className="text-gray-300 flex-shrink-0 cursor-grab" />

            {/* Visibility toggle */}
            <button
              onClick={() => toggle(tab.key)}
              disabled={tab.key === 'all'}
              title={tab.visible ? 'Hide from shop' : 'Show on shop'}
              className={[
                'flex-shrink-0 p-1.5 rounded-lg transition-colors',
                tab.key === 'all' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer',
                tab.visible ? 'text-[#1bb0ce]' : 'text-gray-300',
              ].join(' ')}
            >
              {tab.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            {/* Label */}
            <input
              value={tab.label}
              onChange={e => updateLabel(tab.key, e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 min-w-0"
            />

            {/* Key badge */}
            <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded flex-shrink-0 hidden sm:inline">
              {tab.key}
            </span>

            {/* Icon */}
            <select
              value={tab.icon}
              onChange={e => updateIcon(tab.key, e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 flex-shrink-0"
            >
              {ICON_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Delete */}
            <button
              onClick={() => remove(tab.key)}
              disabled={tab.builtin}
              title={tab.builtin ? 'Built-in categories cannot be deleted' : 'Delete category'}
              className={[
                'flex-shrink-0 p-1.5 rounded-lg transition-colors',
                tab.builtin ? 'opacity-20 cursor-not-allowed' : 'hover:bg-red-50 text-red-500 cursor-pointer',
              ].join(' ')}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {tabs.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">No categories yet.</div>
        )}
      </Card>

      {/* Info banner */}
      <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
        <p>
          The <strong>category key</strong> must match the <code className="bg-amber-100 px-1 rounded">category</code> field on your products.
          Built-in categories (<code className="bg-amber-100 px-1 rounded">all</code>, <code className="bg-amber-100 px-1 rounded">mobile</code>, <code className="bg-amber-100 px-1 rounded">home-phone</code>) cannot be deleted but can be hidden.
        </p>
      </div>

      {/* Add new category */}
      <Card className="p-5">
        <h3 className="font-semibold text-[#0a1628] text-sm mb-4 flex items-center gap-2">
          <Plus size={16} className="text-[#1bb0ce]" /> Add New Category
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Name <span className="text-red-500">*</span></label>
            <input
              value={newTab.label}
              onChange={e => {
                const label = e.target.value;
                setNewTab(prev => ({
                  ...prev,
                  label,
                  key: keyAuto ? slugify(label) : prev.key,
                }));
              }}
              placeholder="e.g. Desktop Phones"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Key <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">— must match the product category field</span>
            </label>
            <input
              value={newTab.key}
              onChange={e => { setKeyAuto(false); setNewTab(prev => ({ ...prev, key: slugify(e.target.value) })); }}
              placeholder="e.g. desktop"
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Icon</label>
            <select
              value={newTab.icon}
              onChange={e => setNewTab(prev => ({ ...prev, icon: e.target.value }))}
              className={inputCls}
            >
              {ICON_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={addTab} className="w-full gap-2">
            <Plus size={15} /> Add Category
          </Button>
        </div>
      </Card>
    </div>
  );
}

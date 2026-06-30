import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { servicePlans as mockPlans } from '../../data/products';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const planColorMap = {
  basic: 'border-blue-200',
  smart: 'border-[#1bb0ce]',
  business: 'border-purple-200',
};

const emptyForm = { name: '', price: '', features: '', active: true };

export default function Plans() {
  const { addToast } = useApp();
  const [plans, setPlans] = useState(mockPlans.map(p => ({ ...p, active: true })));
  const [planModal, setPlanModal] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openEdit = (plan) => {
    setForm({
      name: plan.name,
      price: String(plan.price),
      features: plan.features.join('\n'),
      active: plan.active,
    });
    setPlanModal({ mode: 'edit', id: plan.id });
  };

  const openAdd = () => {
    setForm(emptyForm);
    setPlanModal({ mode: 'add' });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price) {
      addToast('Name and price are required.', 'error'); return;
    }
    const features = form.features.split('\n').map(f => f.trim()).filter(Boolean);
    if (planModal.mode === 'add') {
      const newPlan = {
        id: `plan-${Date.now()}`,
        name: form.name,
        price: parseFloat(form.price) || 0,
        features,
        active: true,
        color: 'gray',
        popular: false,
      };
      setPlans(prev => [...prev, newPlan]);
      addToast('Plan added!', 'success');
    } else {
      setPlans(prev => prev.map(p => p.id === planModal.id ? {
        ...p,
        name: form.name,
        price: parseFloat(form.price) || p.price,
        features,
        active: form.active,
      } : p));
      addToast('Plan updated!', 'success');
    }
    setPlanModal(null);
  };

  const handleToggle = (id) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0a1628]">Service Plans</h2>
        <Button onClick={openAdd}><Plus size={16} /> Add New Plan</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {plans.map(plan => (
          <Card key={plan.id} className={`border-2 ${planColorMap[plan.id] || 'border-gray-200'} relative`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-lg font-bold text-[#0a1628]">{plan.name}</h3>
                <Badge variant={plan.active ? 'success' : 'default'} size="sm">
                  {plan.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-2xl font-extrabold text-[#1bb0ce] mb-4">
                ${plan.price}<span className="text-sm font-medium text-gray-400">/mo</span>
              </p>
              <ul className="space-y-1.5 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={13} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(plan)} className="flex-1">
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant={plan.active ? 'ghost' : 'outline'}
                  onClick={() => handleToggle(plan.id)}
                  className="flex-1"
                >
                  {plan.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={!!planModal}
        onClose={() => setPlanModal(null)}
        title={planModal?.mode === 'add' ? 'Add New Plan' : 'Edit Plan'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPlanModal(null)}>Cancel</Button>
            <Button onClick={handleSave}>{planModal?.mode === 'add' ? 'Add Plan' : 'Save Changes'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan Name</label>
            <input
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Business Connect"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($/mo)</label>
            <input
              type="number" min="0" step="0.01"
              value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Features <span className="text-gray-400 text-xs">(one per line)</span>
            </label>
            <textarea
              rows={5}
              value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
              placeholder="Unlimited local calls&#10;Voicemail&#10;Caller ID"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce] resize-none font-mono"
            />
          </div>
          {planModal?.mode === 'edit' && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                className="w-4 h-4 rounded accent-[#1bb0ce]"
              />
              Active
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
}

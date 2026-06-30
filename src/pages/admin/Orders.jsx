import { useState } from 'react';
import { Printer, MapPin, CreditCard, Package } from 'lucide-react';
import { orders as mockOrders, users } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const STATUS_TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];
const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered'];

const statusVariant = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
};

const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

export default function Orders() {
  const { addToast } = useApp();
  const [orders, setOrders] = useState([...mockOrders].sort((a, b) => new Date(b.date) - new Date(a.date)));
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'All' || o.status === statusFilter.toLowerCase();
    const matchFrom = !dateFrom || o.date >= dateFrom;
    const matchTo = !dateTo || o.date <= dateTo;
    return matchStatus && matchFrom && matchTo;
  });

  const openDetail = (order) => {
    setDetailModal(order);
    setNewStatus(order.status);
  };

  const handleStatusUpdate = () => {
    setOrders(prev => prev.map(o => o.id === detailModal.id ? { ...o, status: newStatus } : o));
    setDetailModal(prev => ({ ...prev, status: newStatus }));
    addToast(`Order status updated to "${newStatus}".`, 'success');
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-[#0a1628]">Order Management</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                statusFilter === tab ? 'bg-[#1bb0ce] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-gray-500">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50" />
          <label className="text-xs text-gray-500">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50" />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Order #</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium hidden md:table-cell">Customer</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium hidden lg:table-cell">Items</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Total</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium hidden sm:table-cell">Date</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No orders match your filters.</td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0a1628]">{order.id}</td>
                  <td className="px-5 py-3 text-gray-700 hidden md:table-cell">{userMap[order.userId] || order.userId}</td>
                  <td className="px-5 py-3 text-gray-600 hidden lg:table-cell">{order.items.reduce((s, i) => s + i.qty, 0)} item(s)</td>
                  <td className="px-5 py-3 font-semibold">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant[order.status] || 'default'} size="sm">
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{formatDate(order.date)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => openDetail(order)}>View</Button>
                      <button title="Print Invoice" className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors" onClick={() => addToast('Invoice printed (mock).', 'info')}>
                        <Printer size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={`Order ${detailModal?.id}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => addToast('Invoice printed (mock).', 'info')}>
              <Printer size={14} /> Print Invoice
            </Button>
            <Button onClick={handleStatusUpdate}>Save Status</Button>
          </>
        }
      >
        {detailModal && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="font-semibold text-[#0a1628]">{userMap[detailModal.userId] || detailModal.userId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date</p>
                <p className="font-semibold text-[#0a1628]">{formatDate(detailModal.date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Update Status</p>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                <Package size={14} /> Items
              </h4>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                {detailModal.items.map((item, i) => (
                  <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-700">{item.name} <span className="text-gray-400">x{item.qty}</span></span>
                    <span className="font-semibold">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 text-sm font-bold border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-[#1bb0ce]">{formatCurrency(detailModal.total)}</span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                  <MapPin size={14} /> Shipping
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-0.5">
                  <p>{detailModal.shippingAddress.street}</p>
                  <p>{detailModal.shippingAddress.city}, {detailModal.shippingAddress.state} {detailModal.shippingAddress.zip}</p>
                </div>
              </div>
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                  <CreditCard size={14} /> Payment
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  {detailModal.paymentMethod}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

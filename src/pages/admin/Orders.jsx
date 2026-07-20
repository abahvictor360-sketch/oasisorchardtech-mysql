import { useState, useEffect } from 'react';
import { Eye, RefreshCw, Package, Undo2 } from 'lucide-react';
import { orders as ordersApi, payments as paymentsApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const STATUS_TABS    = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusVariant = {
  pending:    'warning',
  processing: 'info',
  shipped:    'info',
  delivered:  'success',
  paid:       'success',
  failed:     'error',
  cancelled:  'danger',
  refunded:   'default',
};

const paymentBadge = { pending: 'warning', paid: 'success', failed: 'error', refunded: 'default' };

export default function Orders() {
  const { addToast } = useApp();
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [detailModal,  setDetailModal]  = useState(null);
  const [detailItems,  setDetailItems]  = useState([]);
  const [newStatus,    setNewStatus]    = useState('');
  const [updating,     setUpdating]     = useState(false);
  const [refundArmed,  setRefundArmed]  = useState(false);
  const [refunding,    setRefunding]    = useState(false);

  const load = () => {
    setLoading(true);
    ordersApi.list().then(({ data }) => {
      setOrders(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'All' || o.status === statusFilter.toLowerCase();
    const matchFrom   = !dateFrom || o.created_at?.slice(0,10) >= dateFrom;
    const matchTo     = !dateTo   || o.created_at?.slice(0,10) <= dateTo;
    return matchStatus && matchFrom && matchTo;
  });

  const openDetail = async (order) => {
    setDetailModal(order);
    setNewStatus(order.status);
    setRefundArmed(false);
    const { data } = await ordersApi.get(order.id);
    setDetailItems(data?.items || []);
  };

  const handleRefund = async () => {
    if (!detailModal) return;
    if (!refundArmed) { setRefundArmed(true); return; } // first click arms, second confirms
    setRefunding(true);
    const { error } = await paymentsApi.refund(detailModal.id);
    if (error) {
      addToast('Refund failed: ' + error.message, 'error');
    } else {
      addToast('Payment refunded — the customer has been emailed.', 'success');
      const patch = { payment_status: 'refunded', status: 'refunded' };
      setOrders(prev => prev.map(o => o.id === detailModal.id ? { ...o, ...patch } : o));
      setDetailModal(prev => ({ ...prev, ...patch }));
      setNewStatus('refunded');
    }
    setRefundArmed(false);
    setRefunding(false);
  };

  const handleStatusUpdate = async () => {
    if (!detailModal || newStatus === detailModal.status) return;
    setUpdating(true);
    const { error } = await ordersApi.update(detailModal.id, { status: newStatus });
    if (error) { addToast('Failed to update status', 'error'); }
    else {
      addToast('Order status updated', 'success');
      setOrders(prev => prev.map(o => o.id === detailModal.id ? { ...o, status: newStatus } : o));
      setDetailModal(prev => ({ ...prev, status: newStatus }));
    }
    setUpdating(false);
  };

  // Stats
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const paidCount    = orders.filter(o => o.payment_status === 'paid').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Orders',   value: orders.length,           color: 'text-[#0a1628]' },
          { label: 'Pending',        value: pendingCount,            color: 'text-yellow-600' },
          { label: 'Revenue (Paid)', value: formatCurrency(totalRevenue), color: 'text-green-600' },
        ].map(s => (
          <Card key={s.label} className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map(t => (
              <button
                key={t}
                onClick={() => setStatusFilter(t)}
                className={['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === t ? 'bg-[#1bb0ce] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            <button onClick={load} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#1bb0ce]' : 'text-gray-500'} />
            </button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Order ID','Customer','Items','Total','Payment','Status','Date',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#0a1628] font-semibold">{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0a1628]">{order.shipping_name}</p>
                      <p className="text-xs text-gray-400">{order.shipping_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{order.item_names || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-[#0a1628]">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={paymentBadge[order.payment_status] || 'default'}>
                        {order.payment_method} · {order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[order.status] || 'default'}>{order.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <Button size="xs" variant="outline" onClick={() => openDetail(order)}>
                        <Eye size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {detailModal && (
        <Modal isOpen onClose={() => { setDetailModal(null); setDetailItems([]); }} title={`Order ${detailModal.id}`} size="lg">
          <div className="space-y-5">
            {/* Status + payment badges */}
            <div className="flex gap-3 flex-wrap">
              <Badge variant={statusVariant[detailModal.status] || 'default'}>Status: {detailModal.status}</Badge>
              <Badge variant={paymentBadge[detailModal.payment_status] || 'default'}>Payment: {detailModal.payment_status}</Badge>
              <Badge variant="default">Method: {detailModal.payment_method}</Badge>
            </div>

            {/* Shipping */}
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Shipping</h4>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-[#0a1628] space-y-0.5">
                <p className="font-semibold">{detailModal.shipping_name}</p>
                <p>{detailModal.shipping_email} · {detailModal.shipping_phone}</p>
                <p>{detailModal.shipping_street}</p>
                <p>{detailModal.shipping_city}, {detailModal.shipping_state} {detailModal.shipping_zip}, {detailModal.shipping_country}</p>
              </div>
            </div>

            {/* Items */}
            {detailItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</h4>
                <div className="space-y-2">
                  {detailItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-10 h-10 object-contain rounded" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0a1628] truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="font-semibold text-[#0a1628]">{formatCurrency(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
              <span className="font-semibold text-[#0a1628]">Total</span>
              <span className="text-xl font-bold text-[#1bb0ce]">{formatCurrency(detailModal.total)}</span>
            </div>

            {/* Update status */}
            {detailModal.status !== 'refunded' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</h4>
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1bb0ce]"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                  <Button variant="primary" onClick={handleStatusUpdate} disabled={updating || newStatus === detailModal.status}>
                    {updating ? <Spinner size="sm" color="white" /> : 'Update'}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">The customer receives an email whenever the status changes.</p>
              </div>
            )}

            {/* Refund */}
            {detailModal.payment_status === 'paid' && detailModal.payment_method === 'stripe' && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Refund</h4>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={handleRefund}
                    disabled={refunding}
                    className={refundArmed ? '!border-red-400 !text-red-600 hover:!bg-red-50' : ''}
                  >
                    {refunding
                      ? <Spinner size="sm" />
                      : <><Undo2 size={14} className="mr-1.5" />{refundArmed ? `Confirm refund of ${formatCurrency(detailModal.total)}?` : 'Refund payment'}</>}
                  </Button>
                  {refundArmed && !refunding && (
                    <button onClick={() => setRefundArmed(false)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                      Cancel
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Refunds the full amount to the customer's card via Stripe and emails them. This cannot be undone.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

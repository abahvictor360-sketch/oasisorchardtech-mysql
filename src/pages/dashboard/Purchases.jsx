import { useState, useEffect } from 'react';
import { ShoppingBag, Package, MapPin, CreditCard, Truck, Printer, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getUserOrders } from '../../lib/db';
import { orders as mockOrders } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const STATUS_TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];

const statusVariant = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
};

// ── Invoice Modal ─────────────────────────────────────────────────────────────
function InvoiceModal({ isOpen, onClose, order, user }) {
  if (!order) return null;

  const items = order.order_items || order.items || [];
  const shipping = order.shipping_address || order.shippingAddress || {};
  const paymentMethod = order.payment_method || order.paymentMethod || 'N/A';
  const orderDate = order.created_at || order.date;

  const handlePrint = () => window.print();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${order.id}`} size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer size={15} /> Print Invoice
          </Button>
        </>
      }
    >
      <div className="space-y-5 text-sm" id="invoice-print-area">
        {/* Invoice header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Invoice</p>
            <p className="font-mono font-semibold text-[#0a1628]">#{order.id}</p>
            <p className="text-gray-500 mt-1">Date: {formatDate(orderDate)}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-[#0a1628]">Oasis Orchard Technologies</p>
            <p className="text-gray-500">61 Rue Bastarache</p>
            <p className="text-gray-500">Dieppe NB E1A 6Y6, Canada</p>
            <p className="text-gray-500">support@oasisorchard.com</p>
          </div>
        </div>

        {/* Bill To */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bill To</p>
          <p className="font-semibold text-[#0a1628]">{user?.name || 'Customer'}</p>
          <p className="text-gray-600">{user?.email || ''}</p>
          {shipping.street && (
            <p className="text-gray-600">
              {shipping.street}{shipping.city ? `, ${shipping.city}` : ''}
            </p>
          )}
        </div>

        {/* Items table */}
        <div>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Product Name</th>
                <th className="text-center px-4 py-2 text-gray-600 font-medium">Qty</th>
                <th className="text-right px-4 py-2 text-gray-600 font-medium">Unit Price</th>
                <th className="text-right px-4 py-2 text-gray-600 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, i) => {
                const name = item.product_name || item.name || 'Item';
                const qty = item.qty || item.quantity || 1;
                const price = item.price || 0;
                return (
                  <tr key={i}>
                    <td className="px-4 py-2 text-gray-700">{name}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{qty}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{formatCurrency(price)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(price * qty)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-bold text-[#0a1628]">Total</td>
                <td className="px-4 py-2 text-right font-bold text-[#1bb0ce]">{formatCurrency(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment & Status */}
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
            <p className="font-medium text-[#0a1628]">{paymentMethod}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
            <Badge variant={statusVariant[order.status] || 'default'}>
              {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
            </Badge>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Purchases() {
  const { user } = useAuth();
  const { addToast } = useApp();
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.id) return;
      try {
        const data = await getUserOrders(user.id);
        if (data && data.length > 0) {
          setUserOrders(data);
        } else {
          // Fallback to mock data
          const mock = mockOrders
            .filter(o => o.userId === user.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          setUserOrders(mock);
        }
      } catch {
        const mock = mockOrders
          .filter(o => o.userId === user.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setUserOrders(mock);
      }
    }
    fetchOrders();
  }, [user?.id]);

  const filtered = statusFilter === 'All'
    ? userOrders
    : userOrders.filter(o => o.status === statusFilter.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0a1628]">My Purchases</h2>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
              statusFilter === tab
                ? 'bg-[#1bb0ce] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No purchases found"
            description="You haven't placed any orders yet, or none match the current filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Order #</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium hidden md:table-cell">Items</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const items = order.order_items || order.items || [];
                  const itemCount = items.reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
                  const orderDate = order.created_at || order.date;
                  return (
                    <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0a1628]">{order.id}</td>
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(orderDate)}</td>
                      <td className="px-5 py-3 text-gray-600 hidden md:table-cell">{itemCount} item(s)</td>
                      <td className="px-5 py-3 font-semibold text-[#0a1628]">{formatCurrency(order.total)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant[order.status] || 'default'} size="sm">
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                            View Details
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-1" onClick={() => setInvoiceOrder(order)}>
                            <FileText size={13} /> Invoice
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.id}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Close</Button>
            <Button onClick={() => { setInvoiceOrder(selectedOrder); setSelectedOrder(null); }} className="gap-2">
              <FileText size={15} /> Download Invoice
            </Button>
          </>
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Status + Date */}
            <div className="flex items-center gap-3">
              <Badge variant={statusVariant[selectedOrder.status] || 'default'}>
                {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-500">{formatDate(selectedOrder.created_at || selectedOrder.date)}</span>
            </div>

            {/* Items */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                <Package size={15} /> Items
              </h4>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                {(selectedOrder.order_items || selectedOrder.items || []).map((item, i) => {
                  const name = item.product_name || item.name || 'Item';
                  const qty = item.qty || item.quantity || 1;
                  const price = item.price || 0;
                  return (
                    <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm">
                      <span className="text-gray-700">{name} <span className="text-gray-400">x{qty}</span></span>
                      <span className="font-semibold">{formatCurrency(price * qty)}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center px-4 py-2.5 text-sm font-bold border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-[#1bb0ce]">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping + Payment */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                  <MapPin size={15} /> Shipping Address
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-0.5">
                  {(() => {
                    const addr = selectedOrder.shipping_address || selectedOrder.shippingAddress || {};
                    return (
                      <>
                        <p>{addr.street}</p>
                        <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                  <CreditCard size={15} /> Payment Method
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  {selectedOrder.payment_method || selectedOrder.paymentMethod}
                </div>
              </div>
            </div>

            {/* Tracking */}
            {(selectedOrder.tracking_number || selectedOrder.trackingNumber) && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                  <Truck size={15} /> Tracking Number
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono text-[#1bb0ce]">
                  {selectedOrder.tracking_number || selectedOrder.trackingNumber}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
        user={user}
      />
    </div>
  );
}

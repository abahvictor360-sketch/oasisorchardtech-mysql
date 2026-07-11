import { useState, useEffect } from 'react';
import { FileText, Printer, Package, MapPin, CreditCard, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserOrders } from '../../lib/db';
import { orders as mockOrders } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

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
      <div className="space-y-5 text-sm">
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
export default function Invoices() {
  const { user } = useAuth();
  const [userOrders, setUserOrders] = useState([]);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.id) return;
      try {
        const data = await getUserOrders(user.id);
        if (data && data.length > 0) {
          setUserOrders(data);
        } else {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0a1628]">Invoices</h2>
      </div>

      <Card>
        {userOrders.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Invoices Yet"
            description="Your invoices will appear here after placing an order."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Invoice #</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Order Date</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {userOrders.map(order => {
                  const orderDate = order.created_at || order.date;
                  return (
                    <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0a1628]">#{order.id}</td>
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(orderDate)}</td>
                      <td className="px-5 py-3 font-semibold text-[#0a1628]">{formatCurrency(order.total)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant[order.status] || 'default'} size="sm">
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setInvoiceOrder(order)}>
                          <FileText size={13} /> View Invoice
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <InvoiceModal
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
        user={user}
      />
    </div>
  );
}

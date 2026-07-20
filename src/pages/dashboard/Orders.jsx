import { useState } from 'react';
import { ShoppingBag, Package, MapPin, CreditCard, Truck, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { orders } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const STATUS_TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

const statusVariant = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'default',
};

export default function Orders() {
  const { user } = useAuth();
  const { addToast } = useApp();
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const userOrders = orders
    .filter(o => o.userId === user?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = statusFilter === 'All'
    ? userOrders
    : userOrders.filter(o => o.status === statusFilter.toLowerCase());

  const handleReorder = (order) => {
    addToast(`${order.items.length} item(s) added to cart!`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0a1628]">My Orders</h2>
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
            title="No orders found"
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
                {filtered.map(order => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0a1628]">{order.id}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(order.date)}</td>
                    <td className="px-5 py-3 text-gray-600 hidden md:table-cell">
                      {order.items.reduce((s, i) => s + i.qty, 0)} item(s)
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#0a1628]">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[order.status] || 'default'} size="sm">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
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
            <Button onClick={() => { handleReorder(selectedOrder); setSelectedOrder(null); }}>
              <RotateCcw size={15} /> Reorder
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
              <span className="text-sm text-gray-500">{formatDate(selectedOrder.date)}</span>
            </div>

            {/* Items */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                <Package size={15} /> Items
              </h4>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm">
                    <span className="text-gray-700">{item.name} <span className="text-gray-400">x{item.qty}</span></span>
                    <span className="font-semibold">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
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
                  <p>{selectedOrder.shippingAddress.street}</p>
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</p>
                </div>
              </div>
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                  <CreditCard size={15} /> Payment Method
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  {selectedOrder.paymentMethod}
                </div>
              </div>
            </div>

            {/* Tracking */}
            {selectedOrder.trackingNumber && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] mb-2">
                  <Truck size={15} /> Tracking Number
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono text-[#1bb0ce]">
                  {selectedOrder.trackingNumber}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

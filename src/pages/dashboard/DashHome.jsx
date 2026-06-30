import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard, Wallet, ShoppingBag, MessageSquare,
  ShoppingCart, TrendingUp, ArrowRight, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { getUserOrders, getUserTickets } from '../../lib/db';
import { orders as mockOrders, tickets as mockTickets } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const statusVariant = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
};

const txTypeVariant = {
  credit: 'success',
  debit: 'danger',
};

export default function DashHome() {
  const { user } = useAuth();
  const { balance, transactions } = useWallet();
  const navigate = useNavigate();

  const [userOrders, setUserOrders] = useState([]);
  const [openTickets, setOpenTickets] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;

      // Fetch orders
      try {
        const orders = await getUserOrders(user.id);
        if (orders && orders.length > 0) {
          setUserOrders(orders);
        } else {
          setUserOrders(mockOrders.filter(o => o.userId === user.id));
        }
      } catch {
        setUserOrders(mockOrders.filter(o => o.userId === user.id));
      }

      // Fetch tickets
      try {
        const tickets = await getUserTickets(user.id);
        if (tickets) {
          setOpenTickets(tickets.filter(t => t.status === 'open'));
        } else {
          setOpenTickets(mockTickets.filter(t => t.userId === user.id && t.status === 'open'));
        }
      } catch {
        setOpenTickets(mockTickets.filter(t => t.userId === user.id && t.status === 'open'));
      }
    }
    fetchData();
  }, [user?.id]);

  const recentOrders = [...userOrders]
    .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
    .slice(0, 3);
  const recentTxns = transactions.slice(0, 3);

  const planNames = { basic: 'Basic Connect', smart: 'Smart Connect', business: 'Business Connect' };

  const stats = [
    {
      label: 'Current Plan',
      value: planNames[user?.plan] || user?.plan || '—',
      icon: CreditCard,
      color: 'bg-cyan-50 text-[#1bb0ce]',
    },
    {
      label: 'Wallet Balance',
      value: formatCurrency(balance),
      icon: Wallet,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Orders',
      value: userOrders.length,
      icon: ShoppingBag,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Open Tickets',
      value: openTickets.length,
      icon: MessageSquare,
      color: 'bg-yellow-50 text-yellow-600',
    },
  ];

  const quickActions = [
    { label: 'Top Up Wallet', icon: Wallet, path: '/dashboard/wallet', color: 'bg-[#1bb0ce]' },
    { label: 'Browse Shop', icon: ShoppingCart, path: '/shop', color: 'bg-[#22c55e]' },
    { label: 'Upgrade Plan', icon: TrendingUp, path: '/dashboard/plan', color: 'bg-purple-500' },
    { label: 'My Invoices', icon: FileText, path: '/dashboard/invoices', color: 'bg-indigo-500' },
    { label: 'Contact Support', icon: MessageSquare, path: '/dashboard/support', color: 'bg-[#0a1628]' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#0a1628] to-[#1bb0ce] p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-white/70 text-sm">Here's a summary of your account activity.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{label}</p>
                <p className="text-base font-bold text-[#0a1628] truncate">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Purchases */}
      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-semibold text-[#0a1628]">Recent Purchases</h3>
          <Link to="/dashboard/purchases" className="text-sm text-[#1bb0ce] hover:underline flex items-center gap-1">
            View All Purchases <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100">
                <th className="text-left px-5 py-2 text-gray-500 font-medium">Order #</th>
                <th className="text-left px-5 py-2 text-gray-500 font-medium">Date</th>
                <th className="text-left px-5 py-2 text-gray-500 font-medium hidden sm:table-cell">Items</th>
                <th className="text-left px-5 py-2 text-gray-500 font-medium">Total</th>
                <th className="text-left px-5 py-2 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No orders yet.</td>
                </tr>
              ) : recentOrders.map(order => {
                const items = order.order_items || order.items || [];
                const itemCount = items.reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
                const orderDate = order.created_at || order.date;
                return (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-[#0a1628]">{order.id}</td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(orderDate)}</td>
                    <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">{itemCount} item(s)</td>
                    <td className="px-5 py-3 font-semibold text-[#0a1628]">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[order.status] || 'default'} size="sm">
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-semibold text-[#0a1628]">Recent Transactions</h3>
          <Link to="/dashboard/wallet" className="text-sm text-[#1bb0ce] hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100">
                <th className="text-left px-5 py-2 text-gray-500 font-medium">Date</th>
                <th className="text-left px-5 py-2 text-gray-500 font-medium">Description</th>
                <th className="text-left px-5 py-2 text-gray-500 font-medium">Amount</th>
                <th className="text-left px-5 py-2 text-gray-500 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">No transactions yet.</td>
                </tr>
              ) : recentTxns.map(txn => (
                <tr key={txn.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-600">{formatDate(txn.date)}</td>
                  <td className="px-5 py-3 text-gray-600">{txn.description}</td>
                  <td className={`px-5 py-3 font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {txn.type === 'credit' ? '+' : ''}{formatCurrency(txn.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={txTypeVariant[txn.type] || 'default'} size="sm">
                      {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-[#0a1628] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {quickActions.map(({ label, icon: Icon, path, color }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color}`}>
                <Icon size={22} />
              </div>
              <span className="text-sm font-medium text-[#0a1628] text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Users, DollarSign, ShoppingBag, MessageSquare } from 'lucide-react';
import { stats as statsApi } from '../../lib/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import RevenueBarChart from '../../components/charts/RevenueBarChart';
import PlanPieChart from '../../components/charts/PlanPieChart';
import CategoryDoughnut from '../../components/charts/CategoryDoughnut';

const statusVariant = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  refunded: 'default',
};

export default function AdminHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.get().then(({ data }) => {
      setData(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const {
    totalUsers = 0, totalRevenue = 0, ordersToday = 0, openTickets = 0,
    monthlyRevenue = [], planDistribution = [], categorySales = [], recentOrders = [],
  } = data ?? {};

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Orders Today', value: ordersToday, icon: ShoppingBag, color: 'bg-cyan-50 text-[#1bb0ce]' },
    { label: 'Open Tickets', value: openTickets, icon: MessageSquare, color: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-[#0a1628]">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[#0a1628] mb-4">Monthly Revenue</h3>
          {monthlyRevenue.length ? (
            <RevenueBarChart data={monthlyRevenue} />
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">No paid orders yet.</p>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[#0a1628] mb-4">Plan Distribution</h3>
          {planDistribution.length ? (
            <PlanPieChart data={planDistribution} />
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">No subscribed users yet.</p>
          )}
        </Card>
      </div>

      {/* Category doughnut */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[#0a1628] mb-4">Sales by Category</h3>
          {categorySales.length ? (
            <CategoryDoughnut data={categorySales} />
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">No paid orders yet.</p>
          )}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[#0a1628] mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Order #</th>
                    <th className="text-left py-2 text-gray-500 font-medium hidden sm:table-cell">Customer</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Total</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-2 text-gray-500 font-medium hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 font-mono text-xs font-semibold text-[#0a1628]">{order.id}</td>
                      <td className="py-2.5 text-gray-700 hidden sm:table-cell">{order.customer_name || '—'}</td>
                      <td className="py-2.5 font-semibold">{formatCurrency(order.total)}</td>
                      <td className="py-2.5">
                        <Badge variant={statusVariant[order.status] || 'default'} size="sm">
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-gray-500 hidden md:table-cell">{formatDate(order.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

import { Users, DollarSign, ShoppingBag, MessageSquare } from 'lucide-react';
import { users, orders, tickets, transactions, monthlyRevenue, planDistribution, categorySales } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import RevenueBarChart from '../../components/charts/RevenueBarChart';
import PlanPieChart from '../../components/charts/PlanPieChart';
import CategoryDoughnut from '../../components/charts/CategoryDoughnut';

const statusVariant = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
};

export default function AdminHome() {
  const totalRevenue = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const today = new Date().toISOString().split('T')[0];
  const ordersToday = orders.filter(o => o.date === today).length || 8;
  const openTickets = tickets.filter(t => t.status === 'open').length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
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
          <RevenueBarChart data={monthlyRevenue} />
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[#0a1628] mb-4">Plan Distribution</h3>
          <PlanPieChart data={planDistribution} />
        </Card>
      </div>

      {/* Category doughnut */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[#0a1628] mb-4">Sales by Category</h3>
          <CategoryDoughnut data={categorySales} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[#0a1628] mb-4">Recent Orders</h3>
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
                    <td className="py-2.5 text-gray-700 hidden sm:table-cell">{userMap[order.userId] || order.userId}</td>
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
        </Card>
      </div>
    </div>
  );
}

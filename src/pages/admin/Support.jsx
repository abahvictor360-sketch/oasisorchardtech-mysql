import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { tickets as mockTickets, users } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime, getInitials } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

const STATUS_OPTIONS = ['all', 'open', 'in-progress', 'resolved'];
const CATEGORY_OPTIONS = ['all', 'billing', 'technical', 'general', 'shipping'];

const statusVariant = {
  open: 'danger',
  'in-progress': 'warning',
  resolved: 'success',
};
const statusLabel = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
};

export default function AdminSupport() {
  const { addToast } = useApp();
  const [tickets, setTickets] = useState(
    [...mockTickets].sort((a, b) => new Date(b.date) - new Date(a.date))
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [threadTicket, setThreadTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');

  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchStatus && matchCategory;
  });

  const openThread = (ticket) => {
    setThreadTicket(ticket);
    setTicketStatus(ticket.status);
    setReply('');
  };

  const handleSendReply = () => {
    if (!reply.trim() || !threadTicket) return;
    const newMsg = {
      sender: 'support',
      message: reply.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = { ...threadTicket, messages: [...threadTicket.messages, newMsg] };
    setTickets(prev => prev.map(t => t.id === threadTicket.id ? updated : t));
    setThreadTicket(updated);
    setReply('');
  };

  const handleStatusChange = () => {
    setTickets(prev => prev.map(t => t.id === threadTicket.id ? { ...t, status: ticketStatus } : t));
    setThreadTicket(prev => ({ ...prev, status: ticketStatus }));
    addToast(`Ticket status updated to "${statusLabel[ticketStatus]}".`, 'success');
  };

  const handleClose = () => {
    setTickets(prev => prev.map(t => t.id === threadTicket.id ? { ...t, status: 'resolved' } : t));
    addToast('Ticket closed.', 'success');
    setThreadTicket(null);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-[#0a1628]">Support Management</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Status:</label>
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All' : statusLabel[s] || s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Category:</label>
          <select
            value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50"
          >
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No tickets found" description="No tickets match your current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium hidden md:table-cell">User</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium hidden lg:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium hidden sm:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ticket => (
                  <tr key={ticket.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0a1628]">{ticket.id}</td>
                    <td className="px-5 py-3 text-gray-700 hidden md:table-cell">{userMap[ticket.userId] || ticket.userId}</td>
                    <td className="px-5 py-3 text-gray-700 max-w-[180px] truncate">{ticket.subject}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize hidden lg:table-cell">{ticket.category}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[ticket.status] || 'default'} size="sm">
                        {statusLabel[ticket.status] || ticket.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{formatDate(ticket.date)}</td>
                    <td className="px-5 py-3">
                      <Button size="sm" variant="outline" onClick={() => openThread(ticket)}>
                        View Thread
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Thread Modal */}
      <Modal
        isOpen={!!threadTicket}
        onClose={() => { setThreadTicket(null); setReply(''); }}
        title={threadTicket?.subject || 'Ticket Thread'}
        size="lg"
        footer={
          <>
            <Button variant="danger" onClick={handleClose}>
              <X size={14} /> Close Ticket
            </Button>
            <Button onClick={handleStatusChange}>Save Status</Button>
          </>
        }
      >
        {threadTicket && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={statusVariant[threadTicket.status] || 'default'} size="sm">
                {statusLabel[threadTicket.status] || threadTicket.status}
              </Badge>
              <span className="text-xs text-gray-400 capitalize">{threadTicket.category}</span>
              <span className="text-xs text-gray-400">{userMap[threadTicket.userId] || threadTicket.userId}</span>

              <div className="ml-auto flex items-center gap-2">
                <label className="text-xs text-gray-500">Status:</label>
                <select
                  value={ticketStatus}
                  onChange={e => setTicketStatus(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {threadTicket.messages.map((msg, i) => {
                const isUser = msg.sender === 'user';
                const senderName = isUser ? (userMap[threadTicket.userId] || 'User') : 'Support';
                return (
                  <div key={i} className={`flex gap-3 ${isUser ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isUser ? 'bg-gray-400' : 'bg-[#0a1628]'}`}>
                      {isUser ? getInitials(senderName) : 'SP'}
                    </div>
                    <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? 'items-start' : 'items-end'}`}>
                      <div className={`px-4 py-2.5 rounded-xl text-sm ${isUser ? 'bg-gray-100 text-gray-800 rounded-tl-sm' : 'bg-[#0a1628] text-white rounded-tr-sm'}`}>
                        {msg.message}
                      </div>
                      <span className="text-xs text-gray-400">{formatDateTime(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply */}
            <div className="flex gap-2 border-t border-gray-100 pt-4">
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type admin reply..."
                onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
              />
              <Button onClick={handleSendReply} disabled={!reply.trim()}>
                <Send size={15} />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

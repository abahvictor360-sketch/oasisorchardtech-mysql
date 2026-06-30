import { useState } from 'react';
import { MessageSquare, Plus, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { tickets as mockTickets } from '../../data/mockData';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { getInitials } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const CATEGORIES = ['Billing', 'Technical', 'General', 'Shipping'];

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

export default function Support() {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [tickets, setTickets] = useState(
    mockTickets.filter(t => t.userId === user?.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  );

  // New ticket modal
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Thread modal
  const [threadTicket, setThreadTicket] = useState(null);
  const [reply, setReply] = useState('');

  const handleSubmitTicket = async () => {
    if (!subject.trim()) { addToast('Please enter a subject.', 'error'); return; }
    if (message.trim().length < 20) { addToast('Message must be at least 20 characters.', 'error'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    const newTicket = {
      id: `TKT-${Date.now()}`,
      userId: user?.id,
      subject: subject.trim(),
      category: category.toLowerCase(),
      status: 'open',
      date: new Date().toISOString().split('T')[0],
      messages: [
        {
          sender: 'user',
          message: message.trim(),
          timestamp: new Date().toISOString(),
        }
      ]
    };
    setTickets(prev => [newTicket, ...prev]);
    addToast('Ticket submitted!', 'success');
    setShowNew(false);
    setSubject(''); setCategory('General'); setMessage('');
    setSubmitting(false);
  };

  const handleSendReply = () => {
    if (!reply.trim() || !threadTicket) return;
    const newMsg = {
      sender: 'user',
      message: reply.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = { ...threadTicket, messages: [...threadTicket.messages, newMsg] };
    setTickets(prev => prev.map(t => t.id === threadTicket.id ? updated : t));
    setThreadTicket(updated);
    setReply('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0a1628]">Support Tickets</h2>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> Create New Ticket
        </Button>
      </div>

      <Card>
        {tickets.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No tickets yet"
            description="Submit a support ticket and we'll help you out."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium hidden md:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium hidden sm:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0a1628]">{ticket.id}</td>
                    <td className="px-5 py-3 text-gray-700 max-w-[200px] truncate">{ticket.subject}</td>
                    <td className="px-5 py-3 text-gray-600 hidden md:table-cell capitalize">{ticket.category}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[ticket.status] || 'default'} size="sm">
                        {statusLabel[ticket.status] || ticket.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{formatDate(ticket.date)}</td>
                    <td className="px-5 py-3">
                      <Button size="sm" variant="outline" onClick={() => setThreadTicket(ticket)}>
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

      {/* New Ticket Modal */}
      <Modal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        title="Create New Ticket"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleSubmitTicket}>Submit Ticket</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Briefly describe your issue"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message <span className="text-gray-400 text-xs">(min 20 characters)</span>
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce] resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{message.length} / 20+ characters</p>
          </div>
        </div>
      </Modal>

      {/* Thread Modal */}
      <Modal
        isOpen={!!threadTicket}
        onClose={() => { setThreadTicket(null); setReply(''); }}
        title={threadTicket?.subject || 'Ticket Thread'}
        size="lg"
      >
        {threadTicket && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[threadTicket.status] || 'default'} size="sm">
                {statusLabel[threadTicket.status] || threadTicket.status}
              </Badge>
              <span className="text-xs text-gray-400 capitalize">{threadTicket.category}</span>
            </div>

            {/* Messages */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {threadTicket.messages.map((msg, i) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={i} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isUser ? 'bg-[#1bb0ce]' : 'bg-[#0a1628]'}`}>
                      {isUser ? getInitials(user?.name || 'U') : 'SP'}
                    </div>
                    <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-4 py-2.5 rounded-xl text-sm ${isUser ? 'bg-[#1bb0ce] text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                        {msg.message}
                      </div>
                      <span className="text-xs text-gray-400">{formatDateTime(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply */}
            {threadTicket.status !== 'resolved' && (
              <div className="flex gap-2 border-t border-gray-100 pt-4">
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
                />
                <Button onClick={handleSendReply} disabled={!reply.trim()}>
                  <Send size={15} />
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

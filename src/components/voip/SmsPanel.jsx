import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { voip as voipApi } from '../../lib/api';
import { useVoip } from '../../context/VoipContext';
import { useApp } from '../../context/AppContext';
import Card from '../ui/Card';
import Button from '../ui/Button';

const SEGMENT_LEN = 160;

export default function SmsPanel() {
  const { phoneNumber } = useVoip();
  const { addToast } = useApp();

  const [dst, setDst]         = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState([]); // { dst, message, at } — this session only

  const segments = Math.max(1, Math.ceil(message.length / SEGMENT_LEN));

  const handleSend = async () => {
    const destination = dst.replace(/[^\d+]/g, '');
    if (!destination) { addToast('Enter a destination number.', 'error'); return; }
    if (!message.trim()) { addToast('Enter a message.', 'error'); return; }
    if (!phoneNumber) { addToast('No phone number assigned to your account yet.', 'error'); return; }

    setSending(true);
    try {
      const { data, error } = await voipApi.proxy('sendSMS', {
        did:     phoneNumber.replace(/[^\d]/g, ''),
        dst:     destination,
        message,
      });
      if (error) throw new Error(error.message);
      if (data?.status && data.status !== 'success') throw new Error(data.status);

      setSent(prev => [{ dst: destination, message, at: new Date() }, ...prev].slice(0, 20));
      setMessage('');
      addToast('Text message sent!', 'success');
    } catch (e) {
      addToast('Could not send SMS: ' + e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-[#1bb0ce]" />
        <h3 className="font-semibold text-[#0a1628]">Send a Text Message</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="tel"
            value={dst}
            onChange={e => setDst(e.target.value)}
            placeholder="+1 902 555 0100"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-500">Message</label>
            <span className="text-xs text-gray-400">
              {message.length} chars · {segments} segment{segments > 1 ? 's' : ''}
            </span>
          </div>
          <textarea
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 resize-none"
          />
        </div>
        <Button onClick={handleSend} loading={sending} disabled={sending} className="w-full sm:w-auto">
          <Send size={15} /> Send Text
        </Button>
      </div>

      {sent.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">Sent this session</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sent.map((s, i) => (
              <div key={i} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-xs text-gray-500">{s.dst}</span>
                  <span className="text-xs text-gray-400">
                    {s.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-700">{s.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

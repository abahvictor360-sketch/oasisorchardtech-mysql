import { useState, useEffect, useCallback } from 'react';
import { Voicemail, RefreshCw, Play, Pause } from 'lucide-react';
import { voip as voipApi } from '../../lib/api';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

function fmtDate(val) {
  if (!val) return '';
  // VoIP.ms returns 'YYYY-MM-DD HH:MM:SS' style timestamps
  const d = new Date(val.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function VoicemailPanel() {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [playing,  setPlaying]  = useState(null); // index of playing message

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await voipApi.proxy('getVoicemailMessages', {});
      if (err) throw new Error(err.message);
      if (data?.status && data.status !== 'success') throw new Error(data.status);
      const list = data?.messages ?? data?.voicemail_messages ?? [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || 'Could not load voicemail.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const togglePlay = (idx) => {
    setPlaying(p => (p === idx ? null : idx));
  };

  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Voicemail size={18} className="text-[#1bb0ce]" />
          <h3 className="font-semibold text-[#0a1628]">Voicemail</h3>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1bb0ce] transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">{error}</div>
      ) : messages.length === 0 ? (
        <EmptyState
          icon={Voicemail}
          title="No voicemail messages"
          description="New voicemail left on your line will show up here."
        />
      ) : (
        <div className="divide-y divide-gray-50">
          {messages.map((m, i) => {
            const from     = m.callerid ?? m.caller_id ?? m.from ?? 'Unknown';
            const date     = m.date ?? m.origtime ?? m.received ?? '';
            const duration = m.duration ?? m.length ?? '';
            const listenUrl = m.listen ?? m.url ?? m.link ?? null;
            const isPlaying = playing === i;
            return (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <button
                  onClick={() => togglePlay(i)}
                  disabled={!listenUrl}
                  className="w-9 h-9 rounded-full bg-[#1bb0ce]/10 text-[#1bb0ce] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#1bb0ce]/20 transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0a1628] truncate">{from}</p>
                  <p className="text-xs text-gray-400">{fmtDate(date)}{duration ? ` · ${duration}s` : ''}</p>
                  {isPlaying && listenUrl && (
                    <audio
                      src={listenUrl}
                      autoPlay
                      controls
                      onEnded={() => setPlaying(null)}
                      className="mt-2 w-full h-8"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

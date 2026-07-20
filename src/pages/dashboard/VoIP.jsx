import { Link } from 'react-router-dom';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Wallet, Clock, AlertTriangle, CheckCircle,
  TrendingUp, Info,
} from 'lucide-react';
import { useVoip, CALL_STATUS } from '../../context/VoipContext';
import { useWallet } from '../../context/WalletContext';
import Softphone from '../../components/voip/Softphone';
import SmsPanel from '../../components/voip/SmsPanel';
import VoicemailPanel from '../../components/voip/VoicemailPanel';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/helpers';

// ── Helpers ───────────────────────────────────────────────────
function fmtDuration(secs) {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function CallIcon({ direction, status }) {
  if (status === 'missed') return <PhoneMissed size={15} className="text-red-400" />;
  if (direction === 'inbound')  return <PhoneIncoming size={15} className="text-green-500" />;
  return <PhoneOutgoing size={15} className="text-[#1bb0ce]" />;
}

const STATUS_BADGE = {
  ended:     { variant: 'success', label: 'Ended' },
  answered:  { variant: 'success', label: 'Answered' },
  missed:    { variant: 'danger',  label: 'Missed' },
  cancelled: { variant: 'default', label: 'Cancelled' },
  initiated: { variant: 'info',    label: 'Initiated' },
  failed:    { variant: 'danger',  label: 'Failed' },
};

export default function VoIP() {
  const {
    voipEnabled, phoneNumber,
    usedMinutes, planMinutes, remainingPlanMinutes,
    callHistory, providerReady, callStatus, isVoipMs,
  } = useVoip();
  const { balance } = useWallet();

  const isInCall = callStatus !== CALL_STATUS.IDLE && callStatus !== CALL_STATUS.ENDED;

  const minutePct = Math.min(100, Math.round((usedMinutes / planMinutes) * 100));
  const minuteColor = minutePct > 85 ? 'bg-red-500' : minutePct > 60 ? 'bg-yellow-500' : 'bg-[#1bb0ce]';

  return (
    <div className="space-y-6">

      {/* Provider banner */}
      {!providerReady && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <Info size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Running in Demo Mode</p>
            <p>Calls are simulated. To enable real phone calls, your admin needs to connect a call provider in Admin settings.</p>
          </div>
        </div>
      )}

      {!voipEnabled && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
          <p>Phone service is temporarily disabled by your administrator.</p>
        </div>
      )}

      {/* Main grid: softphone + stats */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Softphone (2 cols) */}
        <div className="lg:col-span-2 flex justify-center">
          <Softphone />
        </div>

        {/* Stats (3 cols) */}
        <div className="lg:col-span-3 space-y-4">

          {/* Plan minutes card */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#1bb0ce]" />
                <h3 className="font-semibold text-[#0a1628]">Plan Minutes</h3>
              </div>
              <Badge variant={remainingPlanMinutes < 30 ? 'danger' : 'info'} size="sm">
                {remainingPlanMinutes} min left
              </Badge>
            </div>
            <div className="flex items-end justify-between text-sm mb-2">
              <span className="text-gray-500">{usedMinutes} used</span>
              <span className="font-semibold text-[#0a1628]">{planMinutes} included</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`${minuteColor} h-2.5 rounded-full transition-all`}
                style={{ width: `${minutePct}%` }}
              />
            </div>
            {remainingPlanMinutes < 30 && (
              <p className="text-xs text-amber-600 mt-2">
                Low on plan minutes — calls beyond this are billed from your wallet.
              </p>
            )}
          </Card>

          {/* Wallet balance card — funds all call charges */}
          <div className="bg-gradient-to-r from-[#0a1628] to-[#1bb0ce] rounded-xl p-5 text-white flex items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm mb-1 flex items-center gap-1.5">
                <Wallet size={14} /> Wallet Balance
              </p>
              <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
              <p className="text-white/60 text-xs mt-1">Calls are billed at VoIP.ms rates straight from your wallet</p>
            </div>
            <Link to="/dashboard/wallet">
              <Button className="bg-white/20 hover:bg-white/30 text-white border-0 flex-shrink-0" size="sm">
                <Wallet size={14} className="mr-1" /> Top Up
              </Button>
            </Link>
          </div>

          {/* Phone number */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Phone size={16} className="text-[#1bb0ce]" />
              <h3 className="font-semibold text-[#0a1628] text-sm">Your Phone Number</h3>
            </div>
            {phoneNumber ? (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-bold text-[#0a1628] tracking-wider">{phoneNumber}</span>
                <Badge variant="success" size="sm"><CheckCircle size={11} className="mr-1" />Active</Badge>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mt-1">
                No number assigned yet. Contact support or wait for admin to assign a DID number to your account.
              </p>
            )}
          </Card>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Total Calls',
                value: callHistory.filter(c => c.status !== 'credit').length,
                icon: Phone,
              },
              {
                label: 'This Month',
                value: callHistory.filter(c => {
                  const ms = new Date(); ms.setDate(1); ms.setHours(0,0,0,0);
                  return new Date(c.started_at) >= ms && c.status === 'ended';
                }).length,
                icon: TrendingUp,
              },
              {
                label: 'Missed',
                value: callHistory.filter(c => c.status === 'missed').length,
                icon: PhoneMissed,
              },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="p-4 text-center">
                <Icon size={18} className="text-[#1bb0ce] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#0a1628]">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Call history */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-[#0a1628]">Call History</h3>
        </div>
        {callHistory.filter(c => c.direction !== 'internal').length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No calls yet"
            description="Your call history will appear here after you make or receive calls."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Number</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium hidden sm:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Duration</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Cost</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {callHistory.filter(c => c.direction !== 'internal').map(call => {
                  const badge = STATUS_BADGE[call.status] ?? STATUS_BADGE.initiated;
                  return (
                    <tr key={call.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <CallIcon direction={call.direction} status={call.status} />
                      </td>
                      <td className="px-5 py-3 text-gray-700 font-mono text-xs">
                        {call.direction === 'outbound' ? call.to_number : call.from_number}
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">
                        {formatDate(call.started_at)}
                      </td>
                      <td className="px-5 py-3 text-gray-600 font-mono">
                        {fmtDuration(call.duration_seconds)}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {call.cost > 0 ? formatCurrency(call.cost) : <span className="text-green-600 text-xs font-medium">Plan</span>}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SMS + Voicemail — only meaningful once a real VoIP.ms line is connected */}
      {isVoipMs && providerReady && (
        <div className="grid lg:grid-cols-2 gap-6">
          <SmsPanel />
          <VoicemailPanel />
        </div>
      )}
    </div>
  );
}

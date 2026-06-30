import { useState, useCallback } from 'react';
import {
  Phone, PhoneOff, PhoneMissed, Mic, MicOff,
  PauseCircle, PlayCircle, Delete, Volume2, Wifi,
} from 'lucide-react';
import { useVoip, CALL_STATUS } from '../../context/VoipContext';

// ── Helpers ───────────────────────────────────────────────────
function fmtDuration(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const DIAL_KEYS = [
  ['1', ''],    ['2', 'ABC'],  ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'],  ['6', 'MNO'],
  ['7', 'PQRS'],['8', 'TUV'],  ['9', 'WXYZ'],
  ['*', ''],    ['0', '+'],    ['#', ''],
];

// ── Status display config ─────────────────────────────────────
const STATUS_DISPLAY = {
  [CALL_STATUS.IDLE]:      { label: 'Ready',        color: 'text-green-400',  pulse: false },
  [CALL_STATUS.DIALING]:   { label: 'Dialing…',     color: 'text-[#1bb0ce]',  pulse: true  },
  [CALL_STATUS.RINGING]:   { label: 'Ringing…',     color: 'text-yellow-400', pulse: true  },
  [CALL_STATUS.CONNECTED]: { label: 'Connected',    color: 'text-green-400',  pulse: false },
  [CALL_STATUS.ENDED]:     { label: 'Call Ended',   color: 'text-gray-400',   pulse: false },
  [CALL_STATUS.FAILED]:    { label: 'Call Failed',  color: 'text-red-400',    pulse: false },
  [CALL_STATUS.INCOMING]:  { label: 'Incoming…',    color: 'text-[#1bb0ce]',  pulse: true  },
};

export default function Softphone() {
  const {
    callStatus, activeCall, callDuration,
    makeCall, hangUp, toggleMute, toggleHold,
    voipEnabled, hasCallCapacity,
  } = useVoip();

  const [dialInput, setDialInput] = useState('');

  const isActive    = callStatus !== CALL_STATUS.IDLE && callStatus !== CALL_STATUS.ENDED;
  const isConnected = callStatus === CALL_STATUS.CONNECTED;
  const isIdle      = callStatus === CALL_STATUS.IDLE;

  const pressKey = useCallback((key) => {
    if (isActive) return; // don't change number mid-call
    setDialInput(p => p.length < 20 ? p + key : p);
  }, [isActive]);

  const handleCall = () => {
    if (!dialInput.trim()) return;
    makeCall(dialInput.trim());
  };

  const statusInfo = STATUS_DISPLAY[callStatus] ?? STATUS_DISPLAY[CALL_STATUS.IDLE];

  return (
    <div className="bg-[#0a1628] rounded-2xl overflow-hidden shadow-2xl w-full max-w-xs mx-auto select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Wifi size={16} className="text-[#1bb0ce]" />
          <span className="text-white text-sm font-semibold">Oasis Phones</span>
        </div>
        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          {statusInfo.pulse && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1bb0ce] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1bb0ce]" />
            </span>
          )}
          <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
      </div>

      {/* Display screen */}
      <div className="mx-4 bg-[#0d1f38] rounded-xl px-4 py-3 mb-4 min-h-[72px] flex flex-col justify-center">
        {isActive && activeCall ? (
          <>
            <p className="text-[#1bb0ce] text-xs font-medium mb-1 uppercase tracking-wider">
              {activeCall.direction === 'inbound' ? '← Incoming' : '→ Outbound'}
            </p>
            <p className="text-white text-xl font-bold tracking-wider truncate">
              {activeCall.number}
            </p>
            {isConnected && (
              <p className="text-green-400 text-sm font-mono mt-1">
                {fmtDuration(callDuration)}
                {activeCall.muted  && <span className="ml-2 text-red-400 text-xs">MUTED</span>}
                {activeCall.onHold && <span className="ml-2 text-yellow-400 text-xs">HOLD</span>}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-white text-2xl font-bold tracking-widest min-h-[32px]">
              {dialInput || <span className="text-gray-600">Enter number</span>}
            </p>
          </>
        )}
      </div>

      {/* Dial pad */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-3">
        {DIAL_KEYS.map(([digit, sub]) => (
          <button
            key={digit}
            onClick={() => pressKey(digit)}
            disabled={isActive}
            className="flex flex-col items-center justify-center h-12 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-white text-lg font-bold leading-none">{digit}</span>
            {sub && <span className="text-gray-500 text-[9px] mt-0.5 font-medium tracking-widest">{sub}</span>}
          </button>
        ))}
      </div>

      {/* Input controls row */}
      <div className="px-4 flex items-center justify-between mb-4">
        {/* Backspace */}
        <button
          onClick={() => !isActive && setDialInput(p => p.slice(0, -1))}
          disabled={isActive || !dialInput}
          className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Backspace"
        >
          <Delete size={18} />
        </button>

        {/* Main call / hangup button */}
        {!isActive ? (
          <button
            onClick={handleCall}
            disabled={!dialInput.trim() || !voipEnabled || !hasCallCapacity}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 active:bg-green-600 flex items-center justify-center shadow-lg shadow-green-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            title="Call"
          >
            <Phone size={26} className="text-white" />
          </button>
        ) : (
          <button
            onClick={hangUp}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 active:bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40 transition-all transform hover:scale-105 animate-pulse"
            title="End call"
          >
            <PhoneOff size={26} className="text-white" />
          </button>
        )}

        {/* Volume / add digit icon placeholder */}
        <button
          disabled={!isActive}
          className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Volume"
        >
          <Volume2 size={18} />
        </button>
      </div>

      {/* In-call controls (mute + hold) */}
      {isConnected && (
        <div className="mx-4 mb-4 flex gap-2">
          <button
            onClick={toggleMute}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
              activeCall?.muted
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10',
            ].join(' ')}
          >
            {activeCall?.muted ? <MicOff size={15} /> : <Mic size={15} />}
            {activeCall?.muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            onClick={toggleHold}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
              activeCall?.onHold
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10',
            ].join(' ')}
          >
            {activeCall?.onHold ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
            {activeCall?.onHold ? 'Resume' : 'Hold'}
          </button>
        </div>
      )}

      {/* Disabled overlay message */}
      {(!voipEnabled || !hasCallCapacity) && isIdle && (
        <div className="mx-4 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-center">
          <p className="text-amber-400 text-xs font-medium">
            {!voipEnabled ? 'Phone service is currently disabled.' : 'No calling credits remaining. Top up to continue.'}
          </p>
        </div>
      )}
    </div>
  );
}

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { voip as voipApi } from '../lib/api';
import { useAuth } from './AuthContext';

// ── Plan minutes allocation per tier ──────────────────────────
export const PLAN_MINUTES = {
  basic:    100,
  smart:    500,
  business: 2000,
};

// ── Call status enum ─────────────────────────────────────────
export const CALL_STATUS = {
  IDLE:     'idle',
  DIALING:  'dialing',
  RINGING:  'ringing',
  CONNECTED:'connected',
  ENDED:    'ended',
  FAILED:   'failed',
  INCOMING: 'incoming',
};

// ── Default provider config (demo) ───────────────────────────
const DEFAULT_PROVIDER = {
  provider:      'demo',  // 'demo' | 'twilio' | 'telnyx' | 'vonage' | 'sip'
  ratePerMinute: 0.014,   // $/min for overage
  enabled:       true,
};

const VoipContext = createContext(null);

export function VoipProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  // ── Account state ────────────────────────────────────────────
  const [voipCredits,  setVoipCredits]  = useState(0);
  const [phoneNumber,  setPhoneNumber]  = useState(null);
  const [usedMinutes,  setUsedMinutes]  = useState(0);
  const [callHistory,  setCallHistory]  = useState([]);
  const [voipEnabled,  setVoipEnabled]  = useState(true);
  const [providerConfig, setProviderConfig] = useState(DEFAULT_PROVIDER);

  // ── Call state ───────────────────────────────────────────────
  const [callStatus,   setCallStatus]   = useState(CALL_STATUS.IDLE);
  const [activeCall,   setActiveCall]   = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const callTimerRef   = useRef(null);
  const simTimerRef    = useRef([]);
  const callStartRef   = useRef(null);
  const activeCallIdRef = useRef(null);

  // ── Load data on auth ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    loadAccount();
    loadSettings();
    loadHistory();
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Duration timer ───────────────────────────────────────────
  useEffect(() => {
    if (callStatus === CALL_STATUS.CONNECTED) {
      if (!callStartRef.current) callStartRef.current = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callStatus]);

  // ── DB helpers ───────────────────────────────────────────────
  async function loadAccount() {
    try {
      const { data } = await voipApi.getAccount();
      if (data) {
        setVoipCredits(parseFloat(data.voip_credits) ?? 0);
        setPhoneNumber(data.phone_number ?? null);
      }
    } catch { /* table may not exist yet */ }
  }

  async function loadSettings() {
    try {
      const { data } = await voipApi.getSettings();
      if (data) {
        if (data.provider_config) setProviderConfig({ ...DEFAULT_PROVIDER, ...data.provider_config });
        if (data.voip_enabled != null) setVoipEnabled(data.voip_enabled?.value !== false);
      }
    } catch { /* use defaults */ }
  }

  async function loadHistory() {
    try {
      const { data } = await voipApi.getCalls();
      setCallHistory(data ?? []);

      // Minutes used this billing month
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const monthCalls = (data ?? []).filter(
        c => c.status === 'ended' && new Date(c.started_at) >= monthStart
      );
      setUsedMinutes(
        Math.ceil(monthCalls.reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / 60)
      );
    } catch {}
  }

  // ── Derived values ───────────────────────────────────────────
  const planMinutes          = PLAN_MINUTES[user?.plan] ?? PLAN_MINUTES.basic;
  const remainingPlanMinutes = Math.max(0, planMinutes - usedMinutes);
  const providerReady        = providerConfig.provider !== 'demo' &&
                               !!(providerConfig.accountSid || providerConfig.apiKey);
  const hasCallCapacity      = remainingPlanMinutes > 0 || voipCredits > 0;

  // ── Make call ────────────────────────────────────────────────
  const makeCall = useCallback(async (rawNumber) => {
    if (callStatus !== CALL_STATUS.IDLE) return;
    if (!hasCallCapacity) return;

    const number = rawNumber.replace(/\s+/g, '').trim();
    setCallStatus(CALL_STATUS.DIALING);
    setActiveCall({ direction: 'outbound', number, muted: false, onHold: false });
    setCallDuration(0);
    callStartRef.current = null;
    activeCallIdRef.current = null;

    // Log to DB
    try {
      const { data } = await voipApi.logCall({
        direction:   'outbound',
        from_number: phoneNumber ?? 'Unknown',
        to_number:   number,
      });
      activeCallIdRef.current = data?.id ?? null;
    } catch {}

    if (providerReady) {
      // ─── LIVE PROVIDER HOOK ───────────────────────────────────
      // Replace this block with your provider's SDK call.
      //
      // Example — Twilio Voice Web SDK:
      //   1. Call Supabase Edge Function to get an access token:
      //      const { data } = await supabase.functions.invoke('voip-token',
      //        { body: { userId: user.id } });
      //   2. Boot the Device:
      //      const device = new Twilio.Device(data.token);
      //      await device.register();
      //   3. Connect:
      //      const conn = await device.connect({ params: { To: number } });
      //      conn.on('accept', () => setCallStatus(CALL_STATUS.CONNECTED));
      //      conn.on('disconnect', () => hangUp());
      //
      // Example — Telnyx WebRTC:
      //   const client = new TelnyxRTC({ login_token: data.token });
      //   client.on('telnyx.ready', () => client.newCall({ destinationNumber: number }));
      // ─────────────────────────────────────────────────────────
      console.warn('[VoIP] Live provider selected but SDK not wired yet. Falling back to demo.');
    }

    // Demo simulation (works without provider credentials)
    const t1 = setTimeout(() => {
      setCallStatus(CALL_STATUS.RINGING);
    }, 1500);

    const t2 = setTimeout(() => {
      setCallStatus(CALL_STATUS.CONNECTED);
      callStartRef.current = Date.now();
      if (activeCallIdRef.current) {
        voipApi.updateCall(activeCallIdRef.current, { status: 'answered' }).then(() => {});
      }
    }, 4000);

    simTimerRef.current = [t1, t2];
  }, [callStatus, hasCallCapacity, phoneNumber, providerReady, user?.id]);

  // ── Hang up ──────────────────────────────────────────────────
  const hangUp = useCallback(async () => {
    simTimerRef.current.forEach(clearTimeout);
    simTimerRef.current = [];

    const duration    = callDuration;
    const callId      = activeCallIdRef.current;
    const wasAnswered = callStatus === CALL_STATUS.CONNECTED;

    setCallStatus(CALL_STATUS.ENDED);

    // Billing: plan minutes first, then credits for overage
    let costDollars = 0;
    if (wasAnswered && duration > 0) {
      const callMins  = Math.ceil(duration / 60);
      const rate      = providerConfig.ratePerMinute ?? 0.014;
      if (remainingPlanMinutes >= callMins) {
        setUsedMinutes(u => u + callMins);
      } else {
        const freeMins    = remainingPlanMinutes;
        const overageMins = callMins - freeMins;
        costDollars = +(overageMins * rate).toFixed(4);
        setUsedMinutes(u => u + freeMins);
        setVoipCredits(c => +(Math.max(0, c - costDollars)).toFixed(4));
        if (user?.id) {
          await voipApi.patchAccount({ voip_credits: Math.max(0, voipCredits - costDollars) });
        }
      }
    }

    if (callId) {
      await voipApi.updateCall(callId, {
        status:           wasAnswered ? 'ended' : (callStatus === CALL_STATUS.RINGING ? 'missed' : 'cancelled'),
        duration_seconds: duration,
        cost:             costDollars,
        ended_at:         new Date().toISOString(),
      });
    }

    setTimeout(() => {
      setCallStatus(CALL_STATUS.IDLE);
      setActiveCall(null);
      setCallDuration(0);
      callStartRef.current  = null;
      activeCallIdRef.current = null;
      loadHistory();
    }, 2500);
  }, [callStatus, callDuration, remainingPlanMinutes, voipCredits, providerConfig, user?.id]);

  // ── Call controls ────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setActiveCall(p => p ? { ...p, muted: !p.muted } : p);
  }, []);

  const toggleHold = useCallback(() => {
    setActiveCall(p => p ? { ...p, onHold: !p.onHold } : p);
  }, []);

  // ── Top up VoIP credits ──────────────────────────────────────
  const topUpVoipCredits = useCallback(async (amount) => {
    const newBal = +(voipCredits + amount).toFixed(2);
    setVoipCredits(newBal);
    try {
      await voipApi.patchAccount({ voip_credits: newBal });
    } catch {}
  }, [voipCredits, user?.id]);

  return (
    <VoipContext.Provider value={{
      // Account
      voipEnabled, voipCredits, phoneNumber,
      usedMinutes, planMinutes, remainingPlanMinutes,
      hasCallCapacity, callHistory, providerReady, providerConfig,
      // Call
      callStatus, activeCall, callDuration,
      // Actions
      makeCall, hangUp, toggleMute, toggleHold,
      topUpVoipCredits,
      reloadHistory: loadHistory,
      reloadSettings: loadSettings,
    }}>
      {children}
    </VoipContext.Provider>
  );
}

export function useVoip() {
  const ctx = useContext(VoipContext);
  if (!ctx) throw new Error('useVoip must be inside VoipProvider');
  return ctx;
}

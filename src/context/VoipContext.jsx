import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { voip as voipApi } from '../lib/api';
import { useAuth } from './AuthContext';

export const PLAN_MINUTES = {
  basic:    100,
  smart:    500,
  business: 2000,
};

export const CALL_STATUS = {
  IDLE:      'idle',
  DIALING:   'dialing',
  RINGING:   'ringing',
  CONNECTED: 'connected',
  ENDED:     'ended',
  FAILED:    'failed',
  INCOMING:  'incoming',
};

const DEFAULT_PROVIDER = {
  provider:      'demo',
  ratePerMinute: 0.014,
  enabled:       true,
};

const VoipContext = createContext(null);

export function VoipProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  // ── Account state ─────────────────────────────────────────────
  const [voipCredits,    setVoipCredits]    = useState(0);
  const [phoneNumber,    setPhoneNumber]    = useState(null);
  const [usedMinutes,    setUsedMinutes]    = useState(0);
  const [callHistory,    setCallHistory]    = useState([]);
  const [voipEnabled,    setVoipEnabled]    = useState(true);
  const [providerConfig, setProviderConfig] = useState(DEFAULT_PROVIDER);
  const [sipCreds,       setSipCreds]       = useState(null); // { sip_username, sip_password, sip_server }
  const [jsSipRegistered, setJsSipRegistered] = useState(false);

  // ── Call state ────────────────────────────────────────────────
  const [callStatus,   setCallStatus]   = useState(CALL_STATUS.IDLE);
  const [activeCall,   setActiveCall]   = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const callTimerRef    = useRef(null);
  const simTimerRef     = useRef([]);
  const callStartRef    = useRef(null);
  const activeCallIdRef = useRef(null);
  const uaRef           = useRef(null);   // JsSIP UserAgent
  const sessionRef      = useRef(null);   // active JsSIP RTCSession

  // ── Duration timer ────────────────────────────────────────────
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

  // ── Load data on auth ─────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    loadAccount();
    loadSettings();
    loadHistory();
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initialize JsSIP when provider is voipms ─────────────────
  useEffect(() => {
    if (providerConfig.provider !== 'voipms' || !sipCreds?.sip_username || !sipCreds?.sip_password) {
      if (uaRef.current) { try { uaRef.current.stop(); } catch {} uaRef.current = null; }
      return;
    }

    let ua;
    import('jssip').then(JsSIP => {
      // Suppress JsSIP debug logs
      JsSIP.default.debug.disable('JsSIP:*');

      const server = sipCreds.sip_server || 'webrtc.voip.ms';
      const socket = new JsSIP.default.WebSocketInterface(`wss://${server}:443`);

      ua = new JsSIP.default.UA({
        sockets:        [socket],
        uri:            `sip:${sipCreds.sip_username}@voip.ms`,
        password:       sipCreds.sip_password,
        display_name:   user?.name || sipCreds.sip_username,
        session_timers: false,
        register:       true,
      });

      ua.on('registered',           () => setJsSipRegistered(true));
      ua.on('unregistered',         () => setJsSipRegistered(false));
      ua.on('registrationFailed',   () => setJsSipRegistered(false));

      // Handle incoming calls
      ua.on('newRTCSession', ({ session, originator }) => {
        if (originator === 'remote') {
          sessionRef.current = session;
          setCallStatus(CALL_STATUS.INCOMING);
          setActiveCall({ direction: 'inbound', number: session.remote_identity?.uri?.user || 'Unknown', muted: false, onHold: false });

          session.on('ended',  () => triggerHangUp());
          session.on('failed', () => { setCallStatus(CALL_STATUS.FAILED); setTimeout(() => setCallStatus(CALL_STATUS.IDLE), 2500); });
        }
      });

      ua.start();
      uaRef.current = ua;
    }).catch(() => {});

    return () => {
      if (ua) { try { ua.stop(); } catch {} }
      uaRef.current = null;
      setJsSipRegistered(false);
    };
  }, [providerConfig.provider, sipCreds?.sip_username, sipCreds?.sip_password]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── DB helpers ────────────────────────────────────────────────
  async function loadAccount() {
    try {
      const { data } = await voipApi.getAccount();
      if (data) {
        setVoipCredits(parseFloat(data.voip_credits) ?? 0);
        setPhoneNumber(data.phone_number ?? null);
        if (data.sip_username && data.sip_password) {
          setSipCreds({
            sip_username: data.sip_username,
            sip_password: data.sip_password,
            sip_server:   data.sip_server || 'webrtc.voip.ms',
          });
        }
      }
    } catch {}
  }

  async function loadSettings() {
    try {
      const { data } = await voipApi.getSettings();
      if (data) {
        if (data.provider_config) setProviderConfig({ ...DEFAULT_PROVIDER, ...data.provider_config });
        if (data.voip_enabled != null) setVoipEnabled(data.voip_enabled?.value !== false);
      }
    } catch {}
  }

  async function loadHistory() {
    try {
      const { data } = await voipApi.getCalls();
      setCallHistory(data ?? []);
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

  // ── Derived values ────────────────────────────────────────────
  const planMinutes          = PLAN_MINUTES[user?.plan] ?? PLAN_MINUTES.basic;
  const remainingPlanMinutes = Math.max(0, planMinutes - usedMinutes);
  const isVoipMs             = providerConfig.provider === 'voipms';
  const providerReady        = isVoipMs
    ? jsSipRegistered
    : (providerConfig.provider !== 'demo' && !!(providerConfig.accountSid || providerConfig.apiKey));
  const hasCallCapacity = remainingPlanMinutes > 0 || voipCredits > 0;

  // ── Shared hangup logic (used by both demo & JsSIP) ──────────
  const triggerHangUp = useCallback(() => {
    // This is called internally; the exposed hangUp does billing too
    setCallStatus(CALL_STATUS.ENDED);
    sessionRef.current = null;
  }, []);

  // ── Make call ─────────────────────────────────────────────────
  const makeCall = useCallback(async (rawNumber) => {
    if (callStatus !== CALL_STATUS.IDLE) return;
    if (!hasCallCapacity) return;

    const number = rawNumber.replace(/\s+/g, '').trim();
    setCallStatus(CALL_STATUS.DIALING);
    setActiveCall({ direction: 'outbound', number, muted: false, onHold: false });
    setCallDuration(0);
    callStartRef.current  = null;
    activeCallIdRef.current = null;

    // Log to local DB
    try {
      const { data } = await voipApi.logCall({
        direction:   'outbound',
        from_number: phoneNumber ?? 'Unknown',
        to_number:   number,
      });
      activeCallIdRef.current = data?.id ?? null;
    } catch {}

    // ── VoIP.ms via JsSIP ─────────────────────────────────────
    if (isVoipMs && uaRef.current && jsSipRegistered) {
      try {
        const session = uaRef.current.call(`sip:${number}@voip.ms`, {
          mediaConstraints:    { audio: true, video: false },
          rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
          sessionTimersExpires: 120,
        });

        sessionRef.current = session;
        setCallStatus(CALL_STATUS.RINGING);

        session.on('progress', () => setCallStatus(CALL_STATUS.RINGING));
        session.on('confirmed', () => {
          setCallStatus(CALL_STATUS.CONNECTED);
          callStartRef.current = Date.now();
          if (activeCallIdRef.current) {
            voipApi.updateCall(activeCallIdRef.current, { status: 'answered' }).then(() => {});
          }
        });
        session.on('ended',  () => hangUp());
        session.on('failed', (e) => {
          console.warn('[JsSIP] Call failed:', e.cause);
          setCallStatus(CALL_STATUS.FAILED);
          sessionRef.current = null;
          setTimeout(() => setCallStatus(CALL_STATUS.IDLE), 2500);
        });
      } catch (err) {
        console.error('[JsSIP] makeCall error:', err);
        setCallStatus(CALL_STATUS.FAILED);
        setTimeout(() => setCallStatus(CALL_STATUS.IDLE), 2500);
      }
      return;
    }

    // ── Demo simulation ───────────────────────────────────────
    const t1 = setTimeout(() => setCallStatus(CALL_STATUS.RINGING), 1500);
    const t2 = setTimeout(() => {
      setCallStatus(CALL_STATUS.CONNECTED);
      callStartRef.current = Date.now();
      if (activeCallIdRef.current) {
        voipApi.updateCall(activeCallIdRef.current, { status: 'answered' }).then(() => {});
      }
    }, 4000);
    simTimerRef.current = [t1, t2];
  }, [callStatus, hasCallCapacity, phoneNumber, isVoipMs, jsSipRegistered]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hang up ───────────────────────────────────────────────────
  const hangUp = useCallback(async () => {
    simTimerRef.current.forEach(clearTimeout);
    simTimerRef.current = [];

    // Terminate JsSIP session if active
    if (sessionRef.current) {
      try {
        if (['established','early'].includes(sessionRef.current.status_str ?? '')) {
          sessionRef.current.terminate();
        }
      } catch {}
      sessionRef.current = null;
    }

    const duration    = callDuration;
    const callId      = activeCallIdRef.current;
    const wasAnswered = callStatus === CALL_STATUS.CONNECTED;

    setCallStatus(CALL_STATUS.ENDED);

    // Billing
    let costDollars = 0;
    if (wasAnswered && duration > 0) {
      const callMins = Math.ceil(duration / 60);
      const rate     = providerConfig.ratePerMinute ?? 0.014;
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
      callStartRef.current    = null;
      activeCallIdRef.current = null;
      loadHistory();
    }, 2500);
  }, [callStatus, callDuration, remainingPlanMinutes, voipCredits, providerConfig, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Answer incoming call ──────────────────────────────────────
  const answerCall = useCallback(() => {
    if (callStatus !== CALL_STATUS.INCOMING || !sessionRef.current) return;
    sessionRef.current.answer({ mediaConstraints: { audio: true, video: false } });
    setCallStatus(CALL_STATUS.CONNECTED);
    callStartRef.current = Date.now();
  }, [callStatus]);

  // ── In-call controls ──────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setActiveCall(p => {
      if (!p) return p;
      const next = !p.muted;
      if (sessionRef.current) {
        try { next ? sessionRef.current.mute() : sessionRef.current.unmute(); } catch {}
      }
      return { ...p, muted: next };
    });
  }, []);

  const toggleHold = useCallback(() => {
    setActiveCall(p => {
      if (!p) return p;
      const next = !p.onHold;
      if (sessionRef.current) {
        try { next ? sessionRef.current.hold() : sessionRef.current.unhold(); } catch {}
      }
      return { ...p, onHold: next };
    });
  }, []);

  // ── Top up ────────────────────────────────────────────────────
  const topUpVoipCredits = useCallback(async (amount) => {
    const newBal = +(voipCredits + amount).toFixed(2);
    setVoipCredits(newBal);
    try { await voipApi.patchAccount({ voip_credits: newBal }); } catch {}
  }, [voipCredits]);

  return (
    <VoipContext.Provider value={{
      voipEnabled, voipCredits, phoneNumber,
      usedMinutes, planMinutes, remainingPlanMinutes,
      hasCallCapacity, callHistory, providerReady, providerConfig,
      jsSipRegistered, isVoipMs,
      callStatus, activeCall, callDuration,
      makeCall, hangUp, answerCall, toggleMute, toggleHold,
      topUpVoipCredits,
      reloadHistory:  loadHistory,
      reloadSettings: loadSettings,
      reloadAccount:  loadAccount,
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

/**
 * voip-token — Supabase Edge Function
 * Generates a short-lived access token for the chosen VoIP provider.
 *
 * Supported providers:  twilio | telnyx | vonage | demo
 *
 * ── HOW TO DEPLOY ────────────────────────────────────────────────────────
 *  1. Install the Supabase CLI:  npm i -g supabase
 *  2. Link your project:         supabase link --project-ref <your-ref>
 *  3. Set secrets (once):
 *       supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxx
 *       supabase secrets set TWILIO_API_KEY=SKxxxxxxxx
 *       supabase secrets set TWILIO_API_SECRET=xxxxxxxx
 *       supabase secrets set TWILIO_TWIML_APP_SID=APxxxxxxxx
 *       # — OR for Telnyx —
 *       supabase secrets set TELNYX_API_KEY=KEYxxxxxxxx
 *       supabase secrets set TELNYX_CONNECTION_ID=xxxxxxxx
 *       # — OR for Vonage —
 *       supabase secrets set VONAGE_API_KEY=xxxxxxxx
 *       supabase secrets set VONAGE_API_SECRET=xxxxxxxx
 *       supabase secrets set VONAGE_APP_ID=xxxxxxxx
 *       supabase secrets set VONAGE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
 *  4. Deploy:
 *       supabase functions deploy voip-token --no-verify-jwt
 *
 * ── WIRING IT TO THE FRONTEND ─────────────────────────────────────────────
 *  In src/context/VoipContext.jsx, replace the TODO block inside makeCall()
 *  with:
 *
 *    const { data, error } = await supabase.functions.invoke('voip-token', {
 *      body: { userId: user.id, provider: providerConfig.provider },
 *    });
 *    if (error) throw error;
 *
 *    if (providerConfig.provider === 'twilio') {
 *      // Install:  npm install @twilio/voice-sdk
 *      const { Device } = await import('@twilio/voice-sdk');
 *      const device = new Device(data.token, { logLevel: 'warn' });
 *      await device.register();
 *      const call = await device.connect({ params: { To: number } });
 *      call.on('accept',     () => setCallStatus(CALL_STATUS.CONNECTED));
 *      call.on('disconnect', () => hangUp());
 *      call.on('error',      () => setCallStatus(CALL_STATUS.FAILED));
 *    }
 *
 *    if (providerConfig.provider === 'telnyx') {
 *      // Install:  npm install @telnyx/webrtc
 *      const { TelnyxRTC } = await import('@telnyx/webrtc');
 *      const client = new TelnyxRTC({ login_token: data.token });
 *      client.on('telnyx.ready', () => {
 *        client.newCall({ destinationNumber: number, callerNumber: providerConfig.callerNumber });
 *      });
 *      client.on('telnyx.error', () => setCallStatus(CALL_STATUS.FAILED));
 *      client.connect();
 *    }
 * ─────────────────────────────────────────────────────────────────────────
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── CORS headers (needed for browser requests) ───────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helper: JSON response ────────────────────────────────────
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

// ── Main handler ─────────────────────────────────────────────
serve(async (req: Request) => {
  // Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Authenticate the calling user ─────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    // ── 2. Read request body ──────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const userId: string   = user.id;
    const provider: string = body.provider ?? 'demo';

    // ── 3. Check user's voip_accounts row ────────────────────
    const { data: account } = await supabase
      .from('voip_accounts')
      .select('voip_enabled, voip_credits')
      .eq('user_id', userId)
      .maybeSingle();

    if (account?.voip_enabled === false) {
      return json({ error: 'VoIP access disabled for this account' }, 403);
    }

    // ── 4. Generate token per provider ───────────────────────

    // ── DEMO MODE ────────────────────────────────────────────
    if (provider === 'demo') {
      // Return a fake token — the frontend will simulate the call
      return json({ token: `demo_${userId}_${Date.now()}`, provider: 'demo' });
    }

    // ── TWILIO ───────────────────────────────────────────────
    if (provider === 'twilio') {
      const accountSid   = Deno.env.get('TWILIO_ACCOUNT_SID');
      const apiKey       = Deno.env.get('TWILIO_API_KEY');
      const apiSecret    = Deno.env.get('TWILIO_API_SECRET');
      const twimlAppSid  = Deno.env.get('TWILIO_TWIML_APP_SID');

      if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
        return json({ error: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_TWIML_APP_SID as Supabase secrets.' }, 500);
      }

      // Build Twilio Access Token with VoiceGrant
      // Using Twilio's REST API to create token (avoids importing Twilio SDK in Deno)
      const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const now     = Math.floor(Date.now() / 1000);
      const payload = btoa(JSON.stringify({
        jti:   `${apiKey}-${now}`,
        iss:   apiKey,
        sub:   accountSid,
        nbf:   now,
        exp:   now + 3600,            // 1 hour
        grants: {
          identity: userId,
          voice: {
            incoming: { allow: true },
            outgoing: { application_sid: twimlAppSid },
          },
        },
      }));

      const signingInput = `${header}.${payload}`;
      const enc          = new TextEncoder();
      const key          = await crypto.subtle.importKey(
        'raw', enc.encode(apiSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false, ['sign'],
      );
      const sig    = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
      const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      return json({ token: `${signingInput}.${sigB64}`, provider: 'twilio', identity: userId });
    }

    // ── TELNYX ───────────────────────────────────────────────
    if (provider === 'telnyx') {
      const telnyxApiKey      = Deno.env.get('TELNYX_API_KEY');
      const connectionId      = Deno.env.get('TELNYX_CONNECTION_ID');

      if (!telnyxApiKey || !connectionId) {
        return json({ error: 'Telnyx credentials not configured. Set TELNYX_API_KEY and TELNYX_CONNECTION_ID as Supabase secrets.' }, 500);
      }

      // Create a Telnyx credential for WebRTC
      const resp = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${telnyxApiKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          connection_id: connectionId,
          name:          `user_${userId}`,
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        return json({ error: `Telnyx API error: ${err}` }, 502);
      }

      const { data: cred } = await resp.json();

      // Get a short-lived token for the credential
      const tokenResp = await fetch(`https://api.telnyx.com/v2/telephony_credentials/${cred.id}/token`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${telnyxApiKey}` },
      });

      const tokenText = await tokenResp.text();
      return json({ token: tokenText.trim(), provider: 'telnyx', credentialId: cred.id });
    }

    // ── VONAGE (NEXMO) ───────────────────────────────────────
    if (provider === 'vonage') {
      const vonageApiKey    = Deno.env.get('VONAGE_API_KEY');
      const vonageApiSecret = Deno.env.get('VONAGE_API_SECRET');
      const vonageAppId     = Deno.env.get('VONAGE_APP_ID');
      const vonagePrivKey   = Deno.env.get('VONAGE_PRIVATE_KEY');

      if (!vonageApiKey || !vonageApiSecret || !vonageAppId || !vonagePrivKey) {
        return json({ error: 'Vonage credentials not configured. Set VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_APP_ID, VONAGE_PRIVATE_KEY as Supabase secrets.' }, 500);
      }

      // Build a Vonage JWT
      const now     = Math.floor(Date.now() / 1000);
      const header  = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        application_id: vonageAppId,
        iat:            now,
        exp:            now + 3600,
        jti:            `${vonageAppId}-${now}`,
        sub:            userId,
        acl:            { paths: { '/*/users/**': {}, '/*/conversations/**': {}, '/*/sessions/**': {}, '/*/devices/**': {}, '/*/image/**': {}, '/*/media/**': {}, '/*/applications/**': {}, '/*/push/**': {}, '/*/knocking/**': {}, '/*/legs/**': {} } },
      }));

      // NOTE: Vonage requires RS256 (RSA) signing — your private key must be stored in VONAGE_PRIVATE_KEY
      // The Web Crypto API can import RSA PKCS#8 keys in Deno.
      const pemBody = vonagePrivKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
      const keyBin  = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
      const key     = await crypto.subtle.importKey(
        'pkcs8', keyBin.buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false, ['sign'],
      );

      const signingInput = `${header}.${payload}`;
      const enc          = new TextEncoder();
      const sig          = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput));
      const sigB64       = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      return json({ token: `${signingInput}.${sigB64}`, provider: 'vonage' });
    }

    // ── Unknown provider ─────────────────────────────────────
    return json({ error: `Unknown provider: ${provider}` }, 400);

  } catch (err) {
    console.error('[voip-token] Error:', err);
    return json({ error: 'Internal server error', detail: String(err) }, 500);
  }
});

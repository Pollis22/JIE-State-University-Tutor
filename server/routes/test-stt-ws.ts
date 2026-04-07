/**
 * STT Provider Comparison Test Route
 * Fans mic audio to AssemblyAI, Deepgram Nova-3, and Deepgram Flux simultaneously.
 * Returns tagged transcription results with latency measurements.
 * 
 * FOR EVALUATION ONLY — not production code.
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import type { Socket } from "net";

// ─── Provider configs ───────────────────────────────────────────────

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';

interface ProviderConnection {
  ws: WebSocket | null;
  name: string;
  connected: boolean;
  connectTime: number;
}

interface TestMessage {
  type: string;
  provider?: string;
  transcript?: string;
  is_final?: boolean;
  confidence?: number;
  latency_ms?: number;
  event_type?: string;
  raw?: any;
  error?: string;
  timestamp?: number;
}

// ─── AssemblyAI v3 Streaming ────────────────────────────────────────

function connectAssemblyAI(
  clientWs: WebSocket,
  onReady: () => void
): ProviderConnection {
  const conn: ProviderConnection = {
    ws: null,
    name: 'assemblyai',
    connected: false,
    connectTime: Date.now(),
  };

  const wsUrl = 'wss://streaming.edge.assemblyai.com/v3/ws';
  
  const ws = new WebSocket(wsUrl, {
    headers: { 'Authorization': ASSEMBLYAI_API_KEY },
  });

  conn.ws = ws;

  ws.on('open', () => {
    console.log('[TestSTT] AssemblyAI WS opened, sending Begin...');
    // Send Begin message with config
    ws.send(JSON.stringify({
      type: 'Begin',
      transcription: {
        encoding: 'pcm_s16le',
        sample_rate: 16000,
        endpointing_model: 'balanced',
        end_of_turn_confidence_threshold: 0.45,
        min_end_of_turn_silence_when_confident: 500,
        max_turn_silence: 2000,
      }
    }));
  });

  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      const now = Date.now();
      
      if (msg.type === 'Begin') {
        conn.connected = true;
        conn.connectTime = now;
        console.log('[TestSTT] AssemblyAI ready');
        onReady();
        return;
      }

      // Forward transcript events
      if (msg.type === 'Turn' || msg.type === 'EndOfTurn') {
        const transcript = msg.transcript?.text || '';
        if (transcript.trim()) {
          const result: TestMessage = {
            type: 'transcript',
            provider: 'assemblyai',
            transcript: transcript.trim(),
            is_final: msg.type === 'EndOfTurn',
            confidence: msg.transcript?.confidence || 0,
            event_type: msg.type,
            latency_ms: now - conn.connectTime,
            timestamp: now,
          };
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(result));
          }
        }
      }

      // Forward turn detection events
      if (msg.type === 'EndOfTurn' || msg.type === 'ForceEndpoint') {
        const result: TestMessage = {
          type: 'turn_event',
          provider: 'assemblyai',
          event_type: msg.type,
          transcript: msg.transcript?.text || '',
          confidence: msg.transcript?.confidence || 0,
          timestamp: now,
        };
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(result));
        }
      }
    } catch (err) {
      console.error('[TestSTT] AssemblyAI parse error:', err);
    }
  });

  ws.on('error', (err) => {
    console.error('[TestSTT] AssemblyAI error:', err);
    sendError(clientWs, 'assemblyai', String(err));
  });

  ws.on('close', (code, reason) => {
    console.log(`[TestSTT] AssemblyAI closed: ${code} ${reason}`);
    conn.connected = false;
  });

  return conn;
}

// ─── Deepgram Nova-3 (v1/listen) ───────────────────────────────────

function connectDeepgramNova3(
  clientWs: WebSocket,
  onReady: () => void
): ProviderConnection {
  const conn: ProviderConnection = {
    ws: null,
    name: 'deepgram-nova3',
    connected: false,
    connectTime: Date.now(),
  };

  const params = new URLSearchParams({
    model: 'nova-3',
    language: 'en-US',
    encoding: 'linear16',
    sample_rate: '16000',
    channels: '1',
    smart_format: 'true',
    interim_results: 'true',
    vad_events: 'true',
    endpointing: '300',
    utterance_end_ms: '1000',
  });

  const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  
  const ws = new WebSocket(wsUrl, {
    headers: { 'Authorization': `Token ${DEEPGRAM_API_KEY}` },
  });

  conn.ws = ws;
  let firstAudioSent = false;
  let keepAliveInterval: NodeJS.Timeout | null = null;

  ws.on('open', () => {
    console.log('[TestSTT] Deepgram Nova-3 connected');
    conn.connected = true;
    conn.connectTime = Date.now();
    onReady();
  });

  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      const now = Date.now();

      // Transcript results
      if (msg.type === 'Results') {
        const alt = msg.channel?.alternatives?.[0];
        const transcript = alt?.transcript || '';
        if (transcript.trim()) {
          const result: TestMessage = {
            type: 'transcript',
            provider: 'deepgram-nova3',
            transcript: transcript.trim(),
            is_final: msg.is_final === true,
            confidence: alt?.confidence || 0,
            event_type: msg.speech_final ? 'speech_final' : (msg.is_final ? 'is_final' : 'interim'),
            latency_ms: now - conn.connectTime,
            timestamp: now,
          };
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(result));
          }
        }

        // speech_final is the real commit signal for Nova-3
        if (msg.speech_final && transcript.trim()) {
          const turnEvent: TestMessage = {
            type: 'turn_event',
            provider: 'deepgram-nova3',
            event_type: 'speech_final',
            transcript: transcript.trim(),
            confidence: alt?.confidence || 0,
            timestamp: now,
          };
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(turnEvent));
          }
        }
      }

      // UtteranceEnd event (logging, not primary commit)
      if (msg.type === 'UtteranceEnd') {
        const result: TestMessage = {
          type: 'turn_event',
          provider: 'deepgram-nova3',
          event_type: 'UtteranceEnd',
          timestamp: now,
        };
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(result));
        }
      }

      // SpeechStarted event
      if (msg.type === 'SpeechStarted') {
        const result: TestMessage = {
          type: 'turn_event',
          provider: 'deepgram-nova3',
          event_type: 'SpeechStarted',
          timestamp: now,
        };
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(result));
        }
      }
    } catch (err) {
      console.error('[TestSTT] Deepgram Nova-3 parse error:', err);
    }
  });

  ws.on('error', (err) => {
    console.error('[TestSTT] Deepgram Nova-3 error:', err);
    sendError(clientWs, 'deepgram-nova3', String(err));
  });

  ws.on('close', (code, reason) => {
    console.log(`[TestSTT] Deepgram Nova-3 closed: ${code} ${reason}`);
    conn.connected = false;
    if (keepAliveInterval) clearInterval(keepAliveInterval);
  });

  // Start KeepAlive after first audio is sent
  const originalSend = ws.send.bind(ws);
  const wrappedConn = conn;
  // We'll handle keepAlive in the send wrapper below

  return conn;
}

// ─── Deepgram Flux (v2/listen) ──────────────────────────────────────

function connectDeepgramFlux(
  clientWs: WebSocket,
  onReady: () => void
): ProviderConnection {
  const conn: ProviderConnection = {
    ws: null,
    name: 'deepgram-flux',
    connected: false,
    connectTime: Date.now(),
  };

  const params = new URLSearchParams({
    model: 'flux-general-en',
    encoding: 'linear16',
    sample_rate: '16000',
    channels: '1',
    eot_threshold: '0.7',
    eot_timeout_ms: '1500',
  });

  const wsUrl = `wss://api.deepgram.com/v2/listen?${params.toString()}`;
  
  const ws = new WebSocket(wsUrl, {
    headers: { 'Authorization': `Token ${DEEPGRAM_API_KEY}` },
  });

  conn.ws = ws;

  ws.on('open', () => {
    console.log('[TestSTT] Deepgram Flux connected');
    conn.connected = true;
    conn.connectTime = Date.now();
    onReady();
  });

  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      const now = Date.now();

      // Flux transcript results
      if (msg.type === 'Results') {
        const alt = msg.channel?.alternatives?.[0];
        const transcript = alt?.transcript || '';
        if (transcript.trim()) {
          const result: TestMessage = {
            type: 'transcript',
            provider: 'deepgram-flux',
            transcript: transcript.trim(),
            is_final: msg.is_final === true,
            confidence: alt?.confidence || 0,
            event_type: msg.is_final ? 'final' : 'interim',
            latency_ms: now - conn.connectTime,
            timestamp: now,
          };
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(result));
          }
        }
      }

      // Flux-native turn events
      if (msg.type === 'StartOfTurn') {
        const result: TestMessage = {
          type: 'turn_event',
          provider: 'deepgram-flux',
          event_type: 'StartOfTurn',
          timestamp: now,
        };
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(result));
        }
      }

      if (msg.type === 'EagerEndOfTurn') {
        const result: TestMessage = {
          type: 'turn_event',
          provider: 'deepgram-flux',
          event_type: 'EagerEndOfTurn',
          transcript: msg.channel?.alternatives?.[0]?.transcript || '',
          timestamp: now,
        };
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(result));
        }
      }

      if (msg.type === 'TurnResumed') {
        const result: TestMessage = {
          type: 'turn_event',
          provider: 'deepgram-flux',
          event_type: 'TurnResumed',
          timestamp: now,
        };
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(result));
        }
      }

      if (msg.type === 'EndOfTurn') {
        const result: TestMessage = {
          type: 'turn_event',
          provider: 'deepgram-flux',
          event_type: 'EndOfTurn',
          transcript: msg.channel?.alternatives?.[0]?.transcript || '',
          confidence: msg.channel?.alternatives?.[0]?.confidence || 0,
          timestamp: now,
        };
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(result));
        }
      }
    } catch (err) {
      console.error('[TestSTT] Deepgram Flux parse error:', err);
    }
  });

  ws.on('error', (err) => {
    console.error('[TestSTT] Deepgram Flux error:', err);
    sendError(clientWs, 'deepgram-flux', String(err));
  });

  ws.on('close', (code, reason) => {
    console.log(`[TestSTT] Deepgram Flux closed: ${code} ${reason}`);
    conn.connected = false;
  });

  return conn;
}

// ─── Helpers ────────────────────────────────────────────────────────

function sendError(clientWs: WebSocket, provider: string, error: string) {
  if (clientWs.readyState === WebSocket.OPEN) {
    clientWs.send(JSON.stringify({
      type: 'error',
      provider,
      error,
      timestamp: Date.now(),
    }));
  }
}

function sendStatus(clientWs: WebSocket, provider: string, status: string) {
  if (clientWs.readyState === WebSocket.OPEN) {
    clientWs.send(JSON.stringify({
      type: 'status',
      provider,
      event_type: status,
      timestamp: Date.now(),
    }));
  }
}

// ─── Main WebSocket Setup ───────────────────────────────────────────

export function setupTestSTTWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  console.log('[TestSTT] WebSocket server initialized on /api/test-stt-ws');

  // Register upgrade handler
  server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const url = request.url || '';
    if (!url.startsWith('/api/test-stt-ws')) return; // Let other handlers deal with it

    console.log('[TestSTT] Upgrade request received');

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (clientWs: WebSocket) => {
    console.log('[TestSTT] Client connected');

    let providers: ProviderConnection[] = [];
    let audioStartTime = 0;
    let nova3KeepAlive: NodeJS.Timeout | null = null;
    let nova3FirstAudioSent = false;

    // Track when first audio arrives (for latency measurement)
    let firstAudioAt = 0;

    clientWs.on('message', (data: Buffer | string) => {
      // Check for control messages (JSON strings)
      if (typeof data === 'string' || (Buffer.isBuffer(data) && data[0] === 0x7b)) {
        try {
          const msg = JSON.parse(data.toString());

          if (msg.type === 'start') {
            console.log('[TestSTT] Starting STT providers...');
            audioStartTime = Date.now();
            firstAudioAt = 0;

            // Connect all 3 providers
            let readyCount = 0;
            const totalProviders = 3;
            const checkAllReady = () => {
              readyCount++;
              if (readyCount >= totalProviders) {
                sendStatus(clientWs, 'all', 'all_ready');
              }
            };

            const assemblyAI = connectAssemblyAI(clientWs, () => {
              sendStatus(clientWs, 'assemblyai', 'connected');
              checkAllReady();
            });

            const nova3 = connectDeepgramNova3(clientWs, () => {
              sendStatus(clientWs, 'deepgram-nova3', 'connected');
              checkAllReady();
            });

            const flux = connectDeepgramFlux(clientWs, () => {
              sendStatus(clientWs, 'deepgram-flux', 'connected');
              checkAllReady();
            });

            providers = [assemblyAI, nova3, flux];
            return;
          }

          if (msg.type === 'stop') {
            console.log('[TestSTT] Stopping all providers...');
            cleanup();
            return;
          }

          // Mark when user starts speaking (client sends this)
          if (msg.type === 'speech_start') {
            audioStartTime = Date.now();
            // Broadcast to client for latency tracking
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'speech_start_ack',
                timestamp: audioStartTime,
              }));
            }
            return;
          }
        } catch {
          // Not JSON — treat as binary audio
        }
      }

      // Binary audio data — fan out to all providers
      const audioBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data as any);

      if (firstAudioAt === 0) {
        firstAudioAt = Date.now();
        console.log(`[TestSTT] First audio frame received (${audioBuffer.length} bytes)`);
      }

      for (const provider of providers) {
        if (provider.ws && provider.ws.readyState === WebSocket.OPEN) {
          try {
            provider.ws.send(audioBuffer);
          } catch (err) {
            console.error(`[TestSTT] Error sending to ${provider.name}:`, err);
          }
        }
      }

      // Start Nova-3 KeepAlive after first audio
      if (!nova3FirstAudioSent) {
        nova3FirstAudioSent = true;
        const nova3Provider = providers.find(p => p.name === 'deepgram-nova3');
        if (nova3Provider?.ws) {
          nova3KeepAlive = setInterval(() => {
            if (nova3Provider.ws && nova3Provider.ws.readyState === WebSocket.OPEN) {
              try {
                nova3Provider.ws.send(JSON.stringify({ type: 'KeepAlive' }));
              } catch {}
            }
          }, 4000);
        }
      }
    });

    function cleanup() {
      if (nova3KeepAlive) {
        clearInterval(nova3KeepAlive);
        nova3KeepAlive = null;
      }
      for (const provider of providers) {
        if (provider.ws) {
          try {
            if (provider.name === 'assemblyai') {
              // AssemblyAI needs a Terminate message
              provider.ws.send(JSON.stringify({ type: 'Terminate' }));
            } else {
              // Deepgram — send CloseStream
              provider.ws.send(JSON.stringify({ type: 'CloseStream' }));
            }
            provider.ws.close();
          } catch {}
        }
      }
      providers = [];
      nova3FirstAudioSent = false;
    }

    clientWs.on('close', () => {
      console.log('[TestSTT] Client disconnected');
      cleanup();
    });

    clientWs.on('error', (err) => {
      console.error('[TestSTT] Client WS error:', err);
      cleanup();
    });

    // Send ready signal
    sendStatus(clientWs, 'server', 'connected');
  });
}

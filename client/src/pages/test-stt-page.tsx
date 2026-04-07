/**
 * STT Provider Comparison Test Page
 * Side-by-side comparison: AssemblyAI vs Deepgram Nova-3 vs Deepgram Flux
 * 
 * Tests single-word recognition after varying idle gaps.
 */

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────

interface TranscriptEntry {
  provider: string;
  transcript: string;
  is_final: boolean;
  confidence: number;
  event_type: string;
  timestamp: number;
  latency_ms?: number;
}

interface TurnEvent {
  provider: string;
  event_type: string;
  transcript?: string;
  confidence?: number;
  timestamp: number;
}

interface ProviderStatus {
  connected: boolean;
  transcripts: TranscriptEntry[];
  turnEvents: TurnEvent[];
  finalTranscript: string;
  firstFinalAt: number | null;
}

const TEST_WORDS = ["yes", "no", "math", "eight", "blood", "shapes", "gravity", "Jupiter", "hello", "three"];
const IDLE_GAPS = [0, 5, 10, 15];

const PROVIDER_COLORS: Record<string, string> = {
  assemblyai: '#3B82F6',
  'deepgram-nova3': '#10B981',
  'deepgram-flux': '#F59E0B',
};

const PROVIDER_LABELS: Record<string, string> = {
  assemblyai: 'AssemblyAI v3',
  'deepgram-nova3': 'Deepgram Nova-3',
  'deepgram-flux': 'Deepgram Flux',
};

// ─── Component ──────────────────────────────────────────────────────

export default function TestSTTPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [allReady, setAllReady] = useState(false);
  const [selectedWord, setSelectedWord] = useState(TEST_WORDS[0]);
  const [selectedGap, setSelectedGap] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [speakNow, setSpeakNow] = useState(false);
  const [speechStartTime, setSpeechStartTime] = useState<number | null>(null);

  const [providers, setProviders] = useState<Record<string, ProviderStatus>>({
    assemblyai: { connected: false, transcripts: [], turnEvents: [], finalTranscript: '', firstFinalAt: null },
    'deepgram-nova3': { connected: false, transcripts: [], turnEvents: [], finalTranscript: '', firstFinalAt: null },
    'deepgram-flux': { connected: false, transcripts: [], turnEvents: [], finalTranscript: '', firstFinalAt: null },
  });

  // Test results log
  const [testLog, setTestLog] = useState<Array<{
    word: string;
    gap: number;
    results: Record<string, { detected: boolean; transcript: string; latency_ms: number; confidence: number }>;
    timestamp: number;
  }>>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // ─── WebSocket ──────────────────────────────────────────────────

  const connectWS = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/test-stt-ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[TestSTT] Connected to server');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'status') {
        if (msg.event_type === 'connected' && msg.provider !== 'server') {
          setProviders(prev => ({
            ...prev,
            [msg.provider]: { ...prev[msg.provider], connected: true },
          }));
        }
        if (msg.event_type === 'all_ready') {
          setAllReady(true);
          console.log('[TestSTT] All providers ready');
        }
      }

      if (msg.type === 'transcript') {
        setProviders(prev => {
          const p = prev[msg.provider];
          if (!p) return prev;
          const newTranscripts = [...p.transcripts, msg as TranscriptEntry];
          let newFinal = p.finalTranscript;
          let newFirstFinalAt = p.firstFinalAt;
          if (msg.is_final && msg.transcript) {
            newFinal = msg.transcript;
            if (!newFirstFinalAt) newFirstFinalAt = msg.timestamp;
          }
          return {
            ...prev,
            [msg.provider]: {
              ...p,
              transcripts: newTranscripts,
              finalTranscript: newFinal,
              firstFinalAt: newFirstFinalAt,
            },
          };
        });
      }

      if (msg.type === 'turn_event') {
        setProviders(prev => {
          const p = prev[msg.provider];
          if (!p) return prev;
          return {
            ...prev,
            [msg.provider]: {
              ...p,
              turnEvents: [...p.turnEvents, msg as TurnEvent],
            },
          };
        });
      }

      if (msg.type === 'error') {
        console.error(`[TestSTT] ${msg.provider} error:`, msg.error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setAllReady(false);
      setIsRecording(false);
    };

    ws.onerror = (err) => {
      console.error('[TestSTT] WS error:', err);
    };
  }, []);

  const disconnectWS = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // ─── Audio Capture ────────────────────────────────────────────────

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      // Use 2048 buffer to match JIE pipeline
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        // Convert float32 to int16 PCM
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        // Send as binary
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(pcm.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      return true;
    } catch (err) {
      console.error('[TestSTT] Mic error:', err);
      return false;
    }
  }, []);

  const stopMic = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // ─── Test Flow ────────────────────────────────────────────────────

  const startTest = useCallback(async () => {
    // Reset provider state
    setProviders({
      assemblyai: { connected: false, transcripts: [], turnEvents: [], finalTranscript: '', firstFinalAt: null },
      'deepgram-nova3': { connected: false, transcripts: [], turnEvents: [], finalTranscript: '', firstFinalAt: null },
      'deepgram-flux': { connected: false, transcripts: [], turnEvents: [], finalTranscript: '', firstFinalAt: null },
    });
    setAllReady(false);
    setSpeakNow(false);
    setSpeechStartTime(null);

    // Connect WS if not connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWS();
      // Wait for connection
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
    }

    // Start mic
    const micOk = await startMic();
    if (!micOk) return;
    setIsRecording(true);

    // Tell server to connect all STT providers
    wsRef.current!.send(JSON.stringify({ type: 'start' }));

    // Wait for all_ready, then start idle gap countdown
    const waitForReady = () => {
      return new Promise<void>((resolve) => {
        const origHandler = wsRef.current!.onmessage;
        const check = (event: MessageEvent) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'status' && msg.event_type === 'all_ready') {
            resolve();
          }
          // Still process the message normally
          if (origHandler) (origHandler as any)(event);
        };
        // Temporary override — but we already have the handler set up
        // Just resolve after allReady is set
        const interval = setInterval(() => {
          // Check via a flag we'll set
          resolve(); // For now, just proceed after a delay
          clearInterval(interval);
        }, 2000);
      });
    };

    // Give providers 3 seconds to connect, then start countdown
    setTimeout(() => {
      if (selectedGap > 0) {
        setCountdown(selectedGap);
        let remaining = selectedGap;
        countdownRef.current = setInterval(() => {
          remaining--;
          setCountdown(remaining);
          if (remaining <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setCountdown(null);
            setSpeakNow(true);
            setSpeechStartTime(Date.now());
            // Tell server speech is starting
            wsRef.current?.send(JSON.stringify({ type: 'speech_start' }));
          }
        }, 1000);
      } else {
        setSpeakNow(true);
        setSpeechStartTime(Date.now());
        wsRef.current?.send(JSON.stringify({ type: 'speech_start' }));
      }
    }, 3000);
  }, [connectWS, startMic, selectedGap]);

  const stopTest = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    setSpeakNow(false);
    setIsRecording(false);

    // Log results
    if (speechStartTime) {
      const results: Record<string, { detected: boolean; transcript: string; latency_ms: number; confidence: number }> = {};
      for (const [name, p] of Object.entries(providers)) {
        const finalT = p.transcripts.find(t => t.is_final);
        results[name] = {
          detected: !!p.finalTranscript,
          transcript: p.finalTranscript || '(none)',
          latency_ms: p.firstFinalAt ? p.firstFinalAt - speechStartTime : -1,
          confidence: finalT?.confidence || 0,
        };
      }
      setTestLog(prev => [...prev, {
        word: selectedWord,
        gap: selectedGap,
        results,
        timestamp: Date.now(),
      }]);
    }

    // Stop everything
    wsRef.current?.send(JSON.stringify({ type: 'stop' }));
    stopMic();
  }, [providers, speechStartTime, selectedWord, selectedGap, stopMic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWS();
      stopMic();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [disconnectWS, stopMic]);

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        STT Provider Comparison Test
      </h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        Side-by-side: AssemblyAI v3 vs Deepgram Nova-3 vs Deepgram Flux
      </p>

      {/* ─── Controls ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* Target Word */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#555' }}>
            TARGET WORD
          </label>
          <select
            value={selectedWord}
            onChange={e => setSelectedWord(e.target.value)}
            disabled={isRecording}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
          >
            {TEST_WORDS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {/* Idle Gap */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#555' }}>
            IDLE GAP (seconds before speaking)
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {IDLE_GAPS.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGap(g)}
                disabled={isRecording}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: selectedGap === g ? '2px solid #3B82F6' : '1px solid #ddd',
                  background: selectedGap === g ? '#EFF6FF' : '#fff',
                  fontWeight: selectedGap === g ? 700 : 400,
                  cursor: isRecording ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                }}
              >
                {g}s
              </button>
            ))}
          </div>
        </div>

        {/* Start/Stop */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          {!isRecording ? (
            <button
              onClick={startTest}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#10B981',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ▶ Start Test
            </button>
          ) : (
            <button
              onClick={stopTest}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#EF4444',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ■ Stop & Log Result
            </button>
          )}
        </div>
      </div>

      {/* ─── Status Banner ────────────────────────────────── */}
      {isRecording && (
        <div style={{
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 700,
          background: speakNow ? '#DCFCE7' : countdown !== null ? '#FEF3C7' : '#F3F4F6',
          color: speakNow ? '#166534' : countdown !== null ? '#92400E' : '#374151',
        }}>
          {countdown !== null && (
            <>Idle gap: speak in <span style={{ fontSize: 32 }}>{countdown}</span> seconds...</>
          )}
          {speakNow && (
            <>🎤 SPEAK NOW: say "<strong>{selectedWord}</strong>"</>
          )}
          {!countdown && !speakNow && (
            <>Connecting providers...</>
          )}
        </div>
      )}

      {/* ─── Provider Panels ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {Object.entries(PROVIDER_LABELS).map(([key, label]) => {
          const p = providers[key];
          return (
            <div
              key={key}
              style={{
                border: `2px solid ${p.connected ? PROVIDER_COLORS[key] : '#E5E7EB'}`,
                borderRadius: 8,
                padding: 16,
                minHeight: 200,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: PROVIDER_COLORS[key], margin: 0 }}>
                  {label}
                </h3>
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: p.connected ? '#DCFCE7' : '#FEE2E2',
                  color: p.connected ? '#166534' : '#991B1B',
                }}>
                  {p.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Final transcript */}
              <div style={{
                background: '#F9FAFB',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8,
                minHeight: 48,
                fontSize: 18,
                fontWeight: 600,
                color: p.finalTranscript ? '#111' : '#9CA3AF',
              }}>
                {p.finalTranscript || 'Waiting...'}
              </div>

              {/* Latency */}
              {p.firstFinalAt && speechStartTime && (
                <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
                  ⏱ Finalized in <strong>{p.firstFinalAt - speechStartTime}ms</strong> after speech
                </div>
              )}

              {/* Turn events */}
              <div style={{ fontSize: 11, color: '#888', maxHeight: 120, overflow: 'auto' }}>
                {p.turnEvents.map((te, i) => (
                  <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{ color: PROVIDER_COLORS[key], fontWeight: 600 }}>{te.event_type}</span>
                    {te.transcript && <> — "{te.transcript}"</>}
                    {te.confidence ? ` (${(te.confidence * 100).toFixed(0)}%)` : ''}
                  </div>
                ))}
              </div>

              {/* Interim stream */}
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 11, color: '#aaa', cursor: 'pointer' }}>
                  Raw transcripts ({p.transcripts.length})
                </summary>
                <div style={{ fontSize: 10, maxHeight: 150, overflow: 'auto', fontFamily: 'monospace' }}>
                  {p.transcripts.map((t, i) => (
                    <div key={i} style={{ color: t.is_final ? '#111' : '#aaa', padding: '1px 0' }}>
                      [{t.is_final ? 'F' : 'I'}] {t.transcript} ({(t.confidence * 100).toFixed(0)}%) [{t.event_type}]
                    </div>
                  ))}
                </div>
              </details>
            </div>
          );
        })}
      </div>

      {/* ─── Test Results Log ─────────────────────────────── */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Test Results Log</h2>
      {testLog.length === 0 ? (
        <p style={{ color: '#999', fontSize: 14 }}>No tests run yet. Select a word, idle gap, and press Start Test.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F3F4F6' }}>
                <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>#</th>
                <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Word</th>
                <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Gap</th>
                {Object.values(PROVIDER_LABELS).map(label => (
                  <th key={label} style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {testLog.map((entry, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8, color: '#999' }}>{i + 1}</td>
                  <td style={{ padding: 8, fontWeight: 600 }}>{entry.word}</td>
                  <td style={{ padding: 8 }}>{entry.gap}s</td>
                  {Object.keys(PROVIDER_LABELS).map(key => {
                    const r = entry.results[key];
                    return (
                      <td key={key} style={{ padding: 8 }}>
                        <span style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: r?.detected ? '#10B981' : '#EF4444',
                          marginRight: 6,
                        }} />
                        {r?.detected ? (
                          <>
                            "{r.transcript}" — {r.latency_ms}ms ({(r.confidence * 100).toFixed(0)}%)
                          </>
                        ) : (
                          <span style={{ color: '#EF4444' }}>MISSED</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary stats */}
          <div style={{ marginTop: 16, padding: 16, background: '#F9FAFB', borderRadius: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Detection Rate Summary</h3>
            <div style={{ display: 'flex', gap: 24 }}>
              {Object.entries(PROVIDER_LABELS).map(([key, label]) => {
                const total = testLog.length;
                const detected = testLog.filter(e => e.results[key]?.detected).length;
                const avgLatency = testLog
                  .filter(e => e.results[key]?.latency_ms > 0)
                  .reduce((sum, e) => sum + e.results[key].latency_ms, 0) / (detected || 1);
                return (
                  <div key={key}>
                    <div style={{ fontWeight: 600, color: PROVIDER_COLORS[key] }}>{label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{total > 0 ? Math.round(detected / total * 100) : 0}%</div>
                    <div style={{ fontSize: 11, color: '#888' }}>
                      {detected}/{total} detected • avg {Math.round(avgLatency)}ms
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useEffect } from 'react';
import { X, Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';

/**
 * State University — Live Voice Support Widget (v2)
 *
 * v2 change: listens for a window-level `open-live-chat` custom event so any
 * page-level button can open the voice call without prop-drilling. The
 * floating phone button still works the same way; this is additive.
 *
 * Voice-only UI. No text transcript. Agent ID via env var:
 *   VITE_ELEVENLABS_SUPPORT_AGENT_ID=agent_xxxxxxxxxxxxxxxxx
 *
 * To trigger from anywhere:
 *   window.dispatchEvent(new CustomEvent('open-live-chat'));
 */
export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentId = import.meta.env.VITE_ELEVENLABS_SUPPORT_AGENT_ID as string | undefined;

  const conversation = useConversation({
    onConnect: () => {
      console.log('[LiveChat] Connected to State University Support');
      setError(null);
    },
    onDisconnect: () => {
      console.log('[LiveChat] Disconnected');
    },
    onError: (err) => {
      console.error('[LiveChat] Error:', err);
      setError('Connection error. Please try again.');
    },
  });

  const handleStart = useCallback(async () => {
    if (!agentId) {
      console.error('[LiveChat] VITE_ELEVENLABS_SUPPORT_AGENT_ID is not set');
      setError('Voice support is not configured.');
      setIsOpen(true);
      return;
    }
    setIsOpen(true);
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId,
        connectionType: 'webrtc',
      });
    } catch (err) {
      console.error('[LiveChat] Failed to start:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else {
        setError('Failed to connect. Please try again.');
      }
    }
  }, [agentId, conversation]);

  const handleEnd = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('[LiveChat] Failed to end:', err);
    }
    setIsOpen(false);
    setIsMuted(false);
    setError(null);
  }, [conversation]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // v2: allow any page-level button to open the widget via custom event.
  useEffect(() => {
    const openHandler = () => {
      if (!isOpen) {
        void handleStart();
      }
    };
    window.addEventListener('open-live-chat', openHandler);
    return () => window.removeEventListener('open-live-chat', openHandler);
  }, [handleStart, isOpen]);

  if (!agentId && !isOpen) {
    return null;
  }

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  let statusLabel = 'Connecting...';
  if (isConnected && isSpeaking) statusLabel = '● Speaking';
  else if (isConnected) statusLabel = '● Listening';

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleStart}
          className="fixed bottom-6 right-6 z-50 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
          style={{ background: '#C5050C' }}
          aria-label="Start live voice support"
          data-testid="button-start-live-chat"
        >
          <Phone className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          <div
            className="text-white p-4 flex justify-between items-center"
            style={{ background: 'linear-gradient(135deg, #C5050C 0%, #A00409 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className="font-semibold"
                  style={{ fontFamily: "'Red Hat Display', sans-serif" }}
                >
                  Live Voice Support
                </h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {statusLabel}
                </p>
              </div>
            </div>
            <button
              onClick={handleEnd}
              className="hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Close voice support"
              data-testid="button-close-chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-6 py-10 min-h-[220px]">
            {error && (
              <div
                className="w-full border px-4 py-3 rounded-lg text-sm mb-4 text-center"
                style={{ background: '#FEE2E2', borderColor: '#FCA5A5', color: '#991B1B' }}
              >
                {error}
              </div>
            )}

            {!error && !isConnected && (
              <div className="flex flex-col items-center text-gray-500">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pulse"
                  style={{ background: '#FEE2E2' }}
                >
                  <Phone className="h-8 w-8" style={{ color: '#C5050C' }} />
                </div>
                <p className="text-sm">Connecting...</p>
              </div>
            )}

            {!error && isConnected && !isSpeaking && (
              <div className="flex flex-col items-center text-gray-700">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-4 relative"
                  style={{ background: 'rgba(197,5,12,0.1)' }}
                >
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: 'rgba(197,5,12,0.25)' }}
                  />
                  <Mic className="h-10 w-10 relative" style={{ color: '#C5050C' }} />
                </div>
                <p className="text-sm font-medium">I'm listening...</p>
                <p className="text-xs text-gray-500 mt-1">Just start talking</p>
              </div>
            )}

            {!error && isConnected && isSpeaking && (
              <div className="flex flex-col items-center text-gray-700">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(197,5,12,0.1)' }}
                >
                  <Volume2 className="h-10 w-10" style={{ color: '#C5050C' }} />
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#C5050C', animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#C5050C', animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#C5050C', animationDelay: '300ms' }}
                  />
                </div>
                <p className="text-sm font-medium">Agent is speaking...</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded-full transition-colors ${
                    isMuted ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={isMuted ? { background: '#C5050C' } : {}}
                  aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  data-testid="button-toggle-mute"
                  disabled={!isConnected}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <span className="text-sm text-gray-500">
                  {isMuted ? 'Muted' : 'Tap to mute'}
                </span>
              </div>

              <button
                onClick={handleEnd}
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
                style={{ background: '#FEE2E2', color: '#C5050C' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FCA5A5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FEE2E2')}
                data-testid="button-end-call"
              >
                <PhoneOff className="h-4 w-4" />
                <span className="text-sm font-medium">End</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LiveChatWidget;

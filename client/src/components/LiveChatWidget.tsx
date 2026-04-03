import { useConversation } from '@elevenlabs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Phone, PhoneOff, Mic, MicOff } from 'lucide-react';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State University AI Tutor Support Agent ID
  const agentId = 'agent_7601k9nzfad9e3c88n3hhdc2p80d';

  const conversation = useConversation({
    onConnect: () => {
      console.log('[LiveChat] Connected to State University AI Tutor Support');
      setError(null);
      // First message comes from ElevenLabs agent configuration - don't add duplicate
    },
    onDisconnect: () => {
      console.log('[LiveChat] Disconnected');
    },
    onMessage: (message) => {
      console.log('[LiveChat] Message:', message);
      if (message.message) {
        setMessages(prev => [...prev, {
          role: message.source === 'user' ? 'user' : 'agent',
          content: message.message,
          timestamp: new Date()
        }]);
      }
    },
    onError: (error) => {
      console.error('[LiveChat] Error:', error);
      setError('Connection error. Please try again.');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = useCallback(async () => {
    if (!agentId) {
      console.error('[LiveChat] Missing agent ID');
      setError('Chat not configured');
      return;
    }
    setIsOpen(true);
    setMessages([]);
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ 
        agentId,
        connectionType: "webrtc"
      });
    } catch (err) {
      console.error('[LiveChat] Failed to start:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access.');
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
    setMessages([]);
    setError(null);
  }, [conversation]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  if (!agentId) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleStart}
          className="fixed bottom-6 right-6 z-50 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
          style={{ background: '#C5050C' }}
          aria-label="Start live chat"
          data-testid="button-start-live-chat"
        >
          <Phone className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          <div className="text-white p-4 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #C5050C 0%, #A00409 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ fontFamily: "'Red Hat Display', sans-serif" }}>State University AI Tutor Support</h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {conversation.status === 'connected' ? '● Live' : 'Connecting...'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleEnd}
              className="hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Close chat"
              data-testid="button-close-chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {error && (
              <div className="border px-4 py-2 rounded-lg text-sm" style={{ background: '#FEE2E2', borderColor: '#FCA5A5', color: '#991B1B' }}>
                {error}
              </div>
            )}

            {messages.length === 0 && !error && (
              <div className="text-center text-gray-400 py-8">
                <Mic className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p>Start speaking to chat with our AI support</p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-md'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                  }`}
                  style={msg.role === 'user' ? { background: '#C5050C' } : {}}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'opacity-80' : 'text-gray-400'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {conversation.isSpeaking && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#C5050C', animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#C5050C', animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#C5050C', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded-full transition-colors ${
                    isMuted 
                      ? 'text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={isMuted ? { background: '#C5050C' } : {}}
                  data-testid="button-toggle-mute"
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <span className="text-sm text-gray-500">
                  {conversation.isSpeaking ? 'Listening...' : 'Tap to mute'}
                </span>
              </div>
              
              <button
                onClick={handleEnd}
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
                style={{ background: '#FEE2E2', color: '#C5050C' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FCA5A5'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#FEE2E2'}
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

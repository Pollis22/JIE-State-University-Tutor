import { useState, useEffect } from "react";
import suLogo from "@/assets/state-university-logo.png";
import buckyClassroom from "@/assets/campus/bucky-classroom.png";
import buckyLecture from "@/assets/campus/bucky-lecture.png";
import studentLibrary from "@/assets/campus/student-library.png";
import bascomHall from "@/assets/campus/bascom-hall.png";

const TIPS = [
  { icon: "🎯", text: "Speak clearly and take your time — your tutor is listening carefully." },
  { icon: "📚", text: "Ask 'Can you explain that differently?' anytime you need a new approach." },
  { icon: "💡", text: "The best learners ask questions. There are no wrong ones here." },
  { icon: "🔁", text: "Say 'Can we review that?' to revisit anything you want to master." },
  { icon: "🧠", text: "Your tutor remembers past sessions and builds on what you know." },
  { icon: "✏️", text: "Take notes while you listen — writing helps lock in learning." },
  { icon: "🌍", text: "Need help in another language? Just ask your tutor to switch." },
  { icon: "⏸️", text: "Need a moment? Just pause — your tutor will wait for you." },
  { icon: "🏆", text: "Go State! Your success starts with every question you ask." },
];

const GALLERY = [
  { src: buckyClassroom, caption: "Learning at State University" },
  { src: buckyLecture, caption: "Expert instruction, your schedule" },
  { src: studentLibrary, caption: "Study smarter, not harder" },
  { src: bascomHall, caption: "Campus pride, academic excellence" },
];

// crimson
const UW_RED = "#C5050C";

interface Props {
  isSpeaking?: boolean;
  isConnected?: boolean;
  hasMessages?: boolean;
}

export function TutorSessionAmbient({ isSpeaking = false, isConnected = false, hasMessages = false }: Props) {
  const [tipIndex, setTipIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [pulseRing, setPulseRing] = useState(false);
  const [visible, setVisible] = useState(true);
  // Logo flash state — shows logo prominently on first connect
  const [showLogoFlash, setShowLogoFlash] = useState(false);
  const [logoFlashDone, setLogoFlashDone] = useState(false);

  if (hasMessages) return null;

  // Tip rotation
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTipIndex(i => (i + 1) % TIPS.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Gallery rotation
  useEffect(() => {
    const t = setInterval(() => {
      setGalleryIndex(i => (i + 1) % GALLERY.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Speaking pulse
  useEffect(() => {
    if (isSpeaking) {
      setPulseRing(true);
      const t = setTimeout(() => setPulseRing(false), 1200);
      return () => clearTimeout(t);
    }
  }, [isSpeaking]);

  // Logo flash — triggers once when isConnected first becomes true
  useEffect(() => {
    if (isConnected && !logoFlashDone) {
      setShowLogoFlash(true);
      setLogoFlashDone(true);
      // Hold for 1.4s then fade out
      const t = setTimeout(() => setShowLogoFlash(false), 1400);
      return () => clearTimeout(t);
    }
  }, [isConnected, logoFlashDone]);

  const tip = TIPS[tipIndex];

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-4 py-6 px-4"
      style={{
        background: "linear-gradient(160deg, #fff8f8 0%, #fff0f0 40%, #fdf8f8 100%)",
        minHeight: "280px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Logo Flash — centered overlay on first connect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          background: "rgba(255,255,255,0.92)",
          opacity: showLogoFlash ? 1 : 0,
          transition: "opacity 0.45s ease",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <img
            src={suLogo}
            alt="State University"
            style={{
              width: 140,
              height: "auto",
              filter: "drop-shadow(0 4px 16px rgba(197,5,12,0.25))",
              transform: showLogoFlash ? "scale(1.04)" : "scale(0.95)",
              transition: "transform 0.45s ease",
            }}
          />
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontWeight: "bold",
              fontSize: 16,
              color: UW_RED,
              letterSpacing: "0.04em",
              opacity: 0.9,
            }}
          >
            Go State!
          </span>
        </div>
      </div>

      {/* Status Orb / status indicator */}
      <div
        className="relative flex flex-col items-center gap-2"
        style={{ opacity: showLogoFlash ? 0.2 : 1, transition: "opacity 0.4s ease" }}
      >
        {/* Pulse ring behind logo */}
        <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
          {pulseRing && (
            <div
              className="absolute rounded-full"
              style={{
                width: 72,
                height: 72,
                border: `2px solid ${UW_RED}`,
                opacity: 0,
                animation: "uwPulse 1.2s ease-out forwards",
              }}
            />
          )}
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              background: `radial-gradient(circle at 35% 35%, white 0%, rgba(197,5,12,0.15) 60%, rgba(197,5,12,0.35) 100%)`,
              boxShadow: `0 0 0 3px rgba(197,5,12,0.12), 0 4px 20px rgba(197,5,12,0.2)`,
              border: `2px solid rgba(197,5,12,0.2)`,
            }}
          >
            <img src={suLogo} alt="State University" style={{ width: 44, height: "auto", objectFit: "contain" }} />
          </div>
        </div>

        {/* Speaking sound bars */}
        {isSpeaking && (
          <div className="flex items-end gap-0.5 mt-1">
            {[3, 7, 11, 7, 3].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  borderRadius: 2,
                  background: UW_RED,
                  animation: `soundBar 0.45s ease-in-out infinite`,
                  animationDelay: `${i * 0.09}s`,
                  height: h,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status pill */}
      <div
        className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
        style={{
          background: isConnected ? "rgba(197,5,12,0.1)" : "rgba(100,100,120,0.08)",
          color: isConnected ? UW_RED : "#888",
          border: `1px solid ${isConnected ? "rgba(197,5,12,0.2)" : "rgba(100,100,120,0.15)"}`,
          opacity: showLogoFlash ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
      >
        {isSpeaking ? "🔊 Tutor is speaking..." : isConnected ? "✓ Connected — start speaking" : "Connecting..."}
      </div>

      {/* Campus photo gallery — only after connected */}
      {isConnected && (
        <div
          className="w-full rounded-xl overflow-hidden relative"
          style={{ height: 110, maxWidth: 340, opacity: 1, transition: "opacity 0.5s ease" }}
        >
          {GALLERY.map((g, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-all duration-700"
              style={{ opacity: galleryIndex === i ? 1 : 0 }}
            >
              <img src={g.src} alt="" className="w-full h-full object-cover object-center" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(50,10,10,0.75) 0%, transparent 55%)" }}
              />
              <span
                className="absolute bottom-2 left-3 text-white text-xs font-semibold"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)", fontFamily: "Georgia, serif" }}
              >
                {g.caption}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Rotating study tip */}
      <div
        className="w-full rounded-xl p-3 flex items-start gap-3"
        style={{
          maxWidth: 340,
          background: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(197,5,12,0.12)",
          boxShadow: "0 2px 12px rgba(197,5,12,0.06)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{tip.icon}</span>
        <p className="text-xs leading-relaxed" style={{ color: "#444", margin: 0 }}>
          {tip.text}
        </p>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes uwPulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes soundBar {
          0%, 100% { height: var(--base-h, 4px); }
          50%       { height: calc(var(--base-h, 4px) * 2.2); }
        }
      `}</style>
    </div>
  );
}

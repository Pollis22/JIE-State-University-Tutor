import { useState, useEffect } from "react";
import suLogo from "@/assets/state-university-logo.png";
import buckyClassroom from "@/assets/campus/bucky-classroom.png";
import buckyLecture from "@/assets/campus/bucky-lecture.png";
import buckyGraduation from "@/assets/campus/bucky-graduation.png";
import bascomHall from "@/assets/campus/bascom-hall.png";

// Brand colors
const UW_RED   = "#C5050C";
const UW_DARK  = "#9B0000";
const UW_NAVY  = "#1e2a47";

const STATS = [
  { value: "State University", label: "AI Tutor" },
  { value: "Voice-First", label: "Learning" },
  { value: "25+ Subjects", label: "Covered" },
  { value: "24/7", label: "Available" },
];

const COURSES = [
  "Calculus", "Biology", "Chemistry", "History", "English",
  "Economics", "Physics", "Statistics", "Political Science", "Psychology",
  "Sociology", "Accounting", "Kinesiology", "Genetics", "Philosophy",
];

interface Props {
  /** Hide when a tutoring session is active */
  mounted?: boolean;
}

export function HeroBanner({ mounted = false }: Props) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [tick, setTick]               = useState(0);

  const slides = [
    {
      image:    buckyGraduation,
      headline: "Your State University AI Tutor",
      sub:      "Powered by advanced voice conversation technology",
      accent:   UW_NAVY,
    },
    {
      image:    buckyClassroom,
      headline: "Learn at Your Own Pace",
      sub:      "Adaptive instruction across every course and subject",
      accent:   UW_DARK,
    },
    {
      image:    buckyLecture,
      headline: "AI That Understands You",
      sub:      "Real-time voice conversation with session memory",
      accent:   "#0a2240",
    },
    {
      image:    bascomHall,
      headline: "Academic Excellence",
      sub:      "Academic support built for State University students",
      accent:   UW_DARK,
    },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveSlide(p => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 80);
    return () => clearInterval(t);
  }, []);

  if (mounted) return null;

  const courseIndex = Math.floor(tick / 30) % COURSES.length;

  return (
    <div className="w-full rounded-2xl overflow-hidden mb-2" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Hero Slideshow ─────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: 180, borderRadius: "16px 16px 0 0" }}>
        {slides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-all duration-1000"
            style={{
              opacity:   activeSlide === i ? 1 : 0,
              transform: activeSlide === i ? "scale(1)" : "scale(1.03)",
            }}
          >
            <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(105deg, ${slide.accent}ee 0%, ${slide.accent}99 38%, transparent 68%)` }}
            />
            <div className="absolute inset-0 flex flex-col justify-center pl-6 pr-40">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 mb-2 px-2 py-0.5 rounded-full w-fit"
                style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}
              >
                <img src={suLogo} alt="" className="h-5 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
                <span className="text-white text-xs font-bold tracking-widest uppercase">State University</span>
              </div>
              <h2
                className="text-white font-black leading-tight mb-1"
                style={{ fontSize: "1.35rem", textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
              >
                {slide.headline}
              </h2>
              <p className="text-white/85 text-sm font-medium" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>
                {slide.sub}
              </p>
            </div>
          </div>
        ))}

        {/* Slide dots */}
        <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              style={{
                width:        activeSlide === i ? 20 : 6,
                height:       6,
                borderRadius: 3,
                background:   activeSlide === i ? "white" : "rgba(255,255,255,0.45)",
                border:       "none",
                cursor:       "pointer",
                padding:      0,
                transition:   "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Stats Strip ────────────────────────────────────── */}
      <div
        className="grid grid-cols-4 w-full"
        style={{ background: `linear-gradient(90deg, ${UW_RED} 0%, ${UW_DARK} 100%)` }}
      >
        {STATS.map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center py-2.5"
            style={{ borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.2)" : "none" }}
          >
            <span className="text-white font-black leading-none" style={{ fontSize: "0.95rem" }}>
              {stat.value}
            </span>
            <span className="text-white/75 text-xs mt-0.5 font-medium tracking-wide">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Course Ticker ──────────────────────────────────── */}
      <div
        className="flex items-center gap-0 w-full overflow-hidden"
        style={{ background: UW_NAVY, borderRadius: "0 0 16px 16px", padding: "7px 16px" }}
      >
        <span className="text-xs font-bold uppercase tracking-widest mr-3 shrink-0" style={{ color: UW_RED }}>
          Courses
        </span>
        <div className="flex gap-2 overflow-hidden flex-1">
          {COURSES.map((course, i) => {
            const isActive = i === courseIndex;
            const isNear   = Math.abs(i - courseIndex) <= 2;
            return (
              <span
                key={course}
                className="text-xs font-semibold whitespace-nowrap transition-all duration-500 px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: isActive ? UW_RED : isNear ? "rgba(197,5,12,0.18)" : "transparent",
                  color:      isActive ? "white" : isNear ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.32)",
                  transform:  isActive ? "scale(1.1)" : "scale(1)",
                }}
              >
                {course}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import {
  Calendar, CheckSquare, BookOpen, Upload, Brain, TrendingUp, Bell,
  Users, BarChart3, Mail, ArrowRight, Sparkles, Clock, Shield,
  GraduationCap, Target, AlertTriangle, FileText, Mic, ChevronRight
} from "lucide-react";
import suLogo from "@/assets/state-university-logo.png";

function SRMStep({ number, title, desc, icon }: { number: number; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="relative flex gap-5 md:gap-6">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ background: "#C5050C", boxShadow: "0 4px 14px rgba(197,5,12,0.3)" }}>
          {number}
        </div>
        {number < 5 && <div className="w-px flex-1 mt-2" style={{ background: "linear-gradient(to bottom, #C5050C, transparent)" }} />}
      </div>
      <div className="pb-10">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(197,5,12,0.06)" }}>
          {icon}
        </div>
        <h3 style={{ fontFamily: "'Red Hat Display', sans-serif", fontWeight: 700, fontSize: 20, color: "#282728", marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: "#646569", maxWidth: 480 }}>{desc}</p>
      </div>
    </div>
  );
}

export default function SRMPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFF", fontFamily: "'Red Hat Text', 'Source Sans 3', sans-serif" }}>
      <NavigationHeader />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ paddingTop: 100, paddingBottom: 60 }}>
        {/* Subtle gradient backdrop */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #FFF 0%, #FEF7F7 40%, #FFF5F5 70%, #FFF 100%)" }} />
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full opacity-[0.04]" style={{ background: "#C5050C", filter: "blur(120px)" }} />

        <div className="relative max-w-6xl mx-auto px-4 md:px-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: "rgba(197,5,12,0.06)", border: "1px solid rgba(197,5,12,0.12)" }}>
              <Calendar className="w-4 h-4" style={{ color: "#C5050C" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#C5050C" }}>Student Relationship Management</span>
            </div>

            <h1 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.08, color: "#282728", marginBottom: 20, letterSpacing: -1.5 }}>
              Your Academic<br />
              <span style={{ color: "#C5050C" }}>Command Center</span>
            </h1>

            <p style={{ fontSize: 19, lineHeight: 1.65, color: "#646569", marginBottom: 32, maxWidth: 540 }}>
              Upload your syllabi. Get an intelligent calendar, auto-generated study tasks, and a tutor that knows exactly what's due — so you never fall behind.
            </p>

            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button onClick={() => setLocation("/academic-dashboard")}
                  className="text-white font-semibold px-8 py-3 rounded-lg text-base flex items-center gap-2"
                  style={{ background: "#C5050C", boxShadow: "0 4px 20px rgba(197,5,12,0.3)" }}>
                  Open My SRM <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={() => setLocation("/auth?action=register")}
                  className="text-white font-semibold px-8 py-3 rounded-lg text-base flex items-center gap-2"
                  style={{ background: "#C5050C", boxShadow: "0 4px 20px rgba(197,5,12,0.3)" }}>
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="font-semibold px-6 py-3 rounded-lg text-base"
                style={{ borderColor: "#C5050C", color: "#C5050C" }}>
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-16 md:py-20 px-4 md:px-12" style={{ background: "#FAFAFA" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#282728", lineHeight: 1.15, marginBottom: 8 }}>
              Most Students Don't Fail Exams Because They're Not Smart
            </h2>
            <p style={{ fontSize: 17, color: "#646569", maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
              They fail because they started studying too late, missed a deadline, or didn't realize they were behind until it was too late to catch up.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Without SRM */}
            <div className="rounded-2xl p-7" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#FEE2E2" }}>
                  <AlertTriangle className="w-5 h-5" style={{ color: "#DC2626" }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, color: "#282728" }}>Without a system</p>
              </div>
              <div className="space-y-3">
                {[
                  "Deadlines scattered across 5 different syllabi",
                  "\"Wait, that exam is THIS Thursday?\"",
                  "Studying starts the night before — too late for deep learning",
                  "No idea which course needs the most attention right now",
                  "Advisors only see a problem after the grade drops",
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "#DC2626" }} />
                    <span style={{ fontSize: 14, color: "#646569", lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* With SRM */}
            <div className="rounded-2xl p-7" style={{ background: "#FFFFFF", border: "2px solid #C5050C", boxShadow: "0 4px 20px rgba(197,5,12,0.08)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(40,167,69,0.1)" }}>
                  <Target className="w-5 h-5" style={{ color: "#28A745" }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, color: "#282728" }}>With your SRM</p>
              </div>
              <div className="space-y-3">
                {[
                  "Every deadline from every syllabus in one calendar",
                  "Study tasks auto-generated 7, 5, 3, and 1 day before each exam",
                  "Your tutor opens the session: \"You have an Orgo exam Friday — let's review mechanisms\"",
                  "Engagement score tells you exactly which course needs more attention",
                  "Advisors get early alerts — intervention happens before the problem, not after",
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckSquare className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#28A745" }} />
                    <span style={{ fontSize: 14, color: "#282728", fontWeight: 500, lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Step by Step */}
      <section id="how-it-works" className="py-16 md:py-20 px-4 md:px-12 scroll-mt-20" style={{ background: "#FFFFFF" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(197,5,12,0.08)", border: "1px solid rgba(197,5,12,0.15)" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#C5050C", textTransform: "uppercase", letterSpacing: 1 }}>How It Works</span>
            </div>
            <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#282728", lineHeight: 1.15 }}>
              From Syllabus to Study Plan in <span style={{ color: "#C5050C" }}>60 Seconds</span>
            </h2>
          </div>

          <div className="ml-2 md:ml-8">
            <SRMStep number={1} icon={<Upload className="w-5 h-5" style={{ color: "#C5050C" }} />}
              title="Upload Your Syllabi" desc="Paste or upload your syllabus for each course. Our AI reads every date, assignment, exam, and project — and extracts them instantly." />
            <SRMStep number={2} icon={<Calendar className="w-5 h-5" style={{ color: "#C5050C" }} />}
              title="Your Calendar Builds Itself" desc="Every exam, assignment, quiz, and project deadline appears on your personal academic calendar — color-coded by course. No manual entry." />
            <SRMStep number={3} icon={<CheckSquare className="w-5 h-5" style={{ color: "#C5050C" }} />}
              title="Study Tasks Auto-Generate" desc="For every exam, the system creates study tasks at 7 days, 5 days, 3 days, and 1 day before — with escalating priority. Assignments get 5, 3, and 1 day reminders. You'll never be surprised again." />
            <SRMStep number={4} icon={<Mic className="w-5 h-5" style={{ color: "#C5050C" }} />}
              title="Your Tutor Knows What's Coming" desc={'Start a tutoring session and your AI tutor already knows: "You have a Chemistry midterm in 3 days covering reaction mechanisms. Want to review that?" No more explaining context — it\'s already loaded.'} />
            <SRMStep number={5} icon={<BarChart3 className="w-5 h-5" style={{ color: "#C5050C" }} />}
              title="Track Your Engagement" desc="A 0–100 engagement score tracks your sessions, task completion, study time, and consistency. See your trend over weeks. Identify which courses need more focus before it's too late." />
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-16 md:py-20 px-4 md:px-12" style={{ background: "#FAFAFA" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#282728", lineHeight: 1.15, marginBottom: 8 }}>
              Everything You Need to <span style={{ color: "#C5050C" }}>Stay Ahead</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Brain className="w-6 h-6" />, title: "AI Syllabus Parsing", desc: "Paste your syllabus text and Claude AI extracts every date, exam, assignment, and project automatically. Course info, instructor name, and event types are all identified." },
              { icon: <Calendar className="w-6 h-6" />, title: "Interactive Academic Calendar", desc: "Month view with color-coded events by course. Click any day to see what's due. Add manual events for study groups, office hours, or personal deadlines." },
              { icon: <CheckSquare className="w-6 h-6" />, title: "Smart Study Tasks", desc: "Auto-generated study reminders that escalate in priority as deadlines approach. Exam prep starts at 7 days out. Assignments at 5 days. Quizzes at 3 days. Every task has estimated study time." },
              { icon: <TrendingUp className="w-6 h-6" />, title: "Engagement Scoring", desc: "A composite 0–100 score based on sessions completed (40%), tasks done (30%), study minutes (20%), and consistency across days (10%). Tracks your trend: improving, stable, or declining." },
              { icon: <Bell className="w-6 h-6" />, title: "Reminders & Alerts", desc: "In-app and email reminders before every major deadline. Exam reminders at 7, 3, and 1 day. Assignment reminders at 3 and 1 day. Never miss a deadline again." },
              { icon: <Mail className="w-6 h-6" />, title: "Parent/Advisor Sharing", desc: "Optionally share a weekly digest email with a parent or advisor — showing your engagement score, courses, upcoming deadlines, and study activity. You control who sees what." },
              { icon: <Sparkles className="w-6 h-6" />, title: "Voice Tutor Integration", desc: "Your AI tutor sees your calendar. It knows what exams are coming, what assignments are overdue, and what study tasks you need to complete. Every session starts with context." },
              { icon: <Shield className="w-6 h-6" />, title: "Early Intervention Alerts", desc: "Advisors and coaches see automated alerts when students show signs of disengagement — no activity for 7+ days, declining scores, missed tasks, or an exam approaching with no prep." },
              { icon: <FileText className="w-6 h-6" />, title: "Institutional Reporting", desc: "Admin dashboard with aggregate engagement metrics, risk distribution, course-level analytics, and CSV export. Built for the data that proves ROI to department heads." },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(197,5,12,0.06)", color: "#C5050C" }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 6, color: "#282728" }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#646569" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Voice Tutor Difference — Showpiece section */}
      <section className="py-16 md:py-20 px-4 md:px-12" style={{ background: "#FFFFFF" }}>
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E8E8E8", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
            <div className="p-2" style={{ background: "#C5050C" }}>
              <p className="text-center text-white font-bold" style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: 14, letterSpacing: 1, textTransform: "uppercase" }}>
                What Makes This Different
              </p>
            </div>
            <div className="p-7 md:p-10" style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFF 100%)" }}>
              <h3 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, color: "#282728", marginBottom: 12 }}>
                Your Tutor Doesn't Just Know Your Subject.<br />
                <span style={{ color: "#C5050C" }}>It Knows Your Semester.</span>
              </h3>
              <p style={{ fontSize: 16, color: "#646569", lineHeight: 1.65, marginBottom: 28, maxWidth: 600 }}>
                Other AI tools answer questions. Your State University AI Tutor opens the conversation with what matters most — because it sees your entire academic picture.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#D4D4D4" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#646569" }}>Other AI</span>
                  </div>
                  <div className="rounded-lg p-4" style={{ background: "#F5F5F5" }}>
                    <p style={{ fontSize: 14, color: "#646569", fontStyle: "italic" }}>"How can I help you today?"</p>
                  </div>
                  <p className="mt-3" style={{ fontSize: 12, color: "#999" }}>No context. No awareness. No plan.</p>
                </div>

                <div className="rounded-xl p-5" style={{ background: "rgba(197,5,12,0.03)", border: "2px solid rgba(197,5,12,0.15)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#28A745" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#C5050C" }}>State University AI Tutor + SRM</span>
                  </div>
                  <div className="rounded-lg p-4" style={{ background: "rgba(197,5,12,0.04)" }}>
                    <p style={{ fontSize: 14, color: "#282728", fontWeight: 500, fontStyle: "italic" }}>"Welcome back! I see you have an Organic Chemistry midterm in 3 days covering reaction mechanisms and stereochemistry. You've completed 2 of 4 study tasks for it. Want to start with the mechanism review?"</p>
                  </div>
                  <p className="mt-3" style={{ fontSize: 12, color: "#C5050C", fontWeight: 600 }}>Full academic awareness. Proactive guidance. Personal advisor.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Student-Athletes */}
      <section className="py-16 md:py-20 px-4 md:px-12" style={{ background: "#FAFAFA" }}>
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl p-7 md:p-10" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(197,5,12,0.08)" }}>
                  <Shield className="w-3.5 h-3.5" style={{ color: "#C5050C" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#C5050C", textTransform: "uppercase", letterSpacing: 1 }}>For Student-Athletes</span>
                </div>
                <h3 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, color: "#282728", marginBottom: 12 }}>
                  Protect Your Eligibility.<br />Automatically.
                </h3>
                <p style={{ fontSize: 15, color: "#646569", lineHeight: 1.65, marginBottom: 20 }}>
                  Travel schedules and game days make it easy to fall behind. The SRM keeps your academic advisor informed with automated engagement alerts — so intervention happens weeks before midterms, not after.
                </p>
                <div className="space-y-3">
                  {[
                    "Advisor sees declining engagement scores before you even notice",
                    "Missed deadline alerts trigger proactive outreach",
                    "Exam-unprepared flags when an exam is 3 days out with no study sessions",
                    "Weekly parent/advisor digest keeps everyone aligned",
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckSquare className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#28A745" }} />
                      <span style={{ fontSize: 14, color: "#282728", fontWeight: 500, lineHeight: 1.5 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-72 flex-shrink-0 rounded-xl p-5" style={{ background: "#FEF7F7", border: "1px solid rgba(197,5,12,0.1)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#C5050C", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Alert Types</p>
                <div className="space-y-3">
                  {[
                    { label: "No Activity", desc: "7+ days without a session", color: "#EA580C" },
                    { label: "Declining Score", desc: "Engagement below 40/100", color: "#DC2626" },
                    { label: "Missed Deadlines", desc: "3+ overdue tasks", color: "#DC2626" },
                    { label: "Exam Unprepared", desc: "Exam in ≤3 days, no prep", color: "#B91C1C" },
                  ].map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: a.color }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#282728" }}>{a.label}</p>
                        <p style={{ fontSize: 12, color: "#646569" }}>{a.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Score Breakdown */}
      <section className="py-16 md:py-20 px-4 md:px-12" style={{ background: "#FFFFFF" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#282728", marginBottom: 8 }}>
            Your Engagement Score, <span style={{ color: "#C5050C" }}>Explained</span>
          </h2>
          <p style={{ fontSize: 16, color: "#646569", maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.6 }}>
            A weekly 0–100 score that tells you exactly where you stand — so you never have to wonder.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Sessions", weight: "40%", desc: "Tutoring sessions completed vs target (3/week per course)", color: "#C5050C" },
              { label: "Tasks", weight: "30%", desc: "Study tasks completed on time vs total due", color: "#EA580C" },
              { label: "Study Time", weight: "20%", desc: "Minutes studied vs recommended based on upcoming exams", color: "#CA8A04" },
              { label: "Consistency", weight: "10%", desc: "Activity on 4+ different days earns the full bonus", color: "#16A34A" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-5" style={{ background: "#FAFAFA", border: "1px solid #E8E8E8" }}>
                <div className="text-3xl font-bold mb-1" style={{ color: s.color, fontFamily: "'Red Hat Display', sans-serif" }}>{s.weight}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#282728", marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 12, color: "#646569", lineHeight: 1.4 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { range: "70–100", label: "On Track", color: "#16A34A", bg: "rgba(22,163,74,0.08)" },
              { range: "50–69", label: "Needs Attention", color: "#CA8A04", bg: "rgba(202,138,4,0.08)" },
              { range: "30–49", label: "At Risk", color: "#EA580C", bg: "rgba(234,88,12,0.08)" },
              { range: "0–29", label: "Critical", color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: r.bg }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.range}</span>
                <span style={{ fontSize: 13, color: "#282728" }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 md:px-12" style={{ background: "#282728" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#FFFFFF", marginBottom: 12 }}>
            Stop Reacting. Start <span style={{ color: "#FF6B6B" }}>Leading</span> Your Semester.
          </h2>
          <p style={{ fontSize: 16, color: "#A0A0A0", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Upload your syllabi, let the SRM build your plan, and let your AI tutor guide every session toward what matters most.
          </p>
          {user ? (
            <Button onClick={() => setLocation("/academic-dashboard")}
              className="text-white font-semibold px-8 py-3 rounded-lg text-base flex items-center gap-2 mx-auto"
              style={{ background: "#C5050C" }}>
              Open My SRM <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => setLocation("/auth?action=register")}
              className="text-white font-semibold px-8 py-3 rounded-lg text-base flex items-center gap-2 mx-auto"
              style={{ background: "#C5050C" }}>
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-10 px-4 md:px-12 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderTop: "1px solid #E8E8E8", background: "#FFFFFF" }}>
        <div className="flex items-center gap-3">
          <img src={suLogo} alt="State University" className="h-8 object-contain" />
          <span style={{ fontSize: 12, color: "#646569" }}>State University · AI Tutor Program</span>
        </div>
        <span style={{ fontSize: 11, color: "#DAD7CB" }}>Powered by JIE Mastery.ai</span>
      </footer>
    </div>
  );
}

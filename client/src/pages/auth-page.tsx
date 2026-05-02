import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Mic, Brain, ArrowRight, GraduationCap, FlaskConical, CheckCircle, X, Shield, Sparkles, TrendingUp, Clock, BookOpen, Menu, Calendar, Target, Bell, BarChart3 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import suLogo from "@/assets/state-university-logo.png";

// Campus photos
import buckyGraduation from "@/assets/campus/bucky-graduation.png";
import bascomHall from "@/assets/campus/bascom-hall.png";
import buckyTeaching from "@/assets/campus/bucky-teaching.png";
import buckyBasketball from "@/assets/campus/bucky-basketball.png";
import buckyLecture from "@/assets/campus/bucky-lecture.png";
import buckyFootball from "@/assets/campus/bucky-football.png";
import buckyClassroom from "@/assets/campus/bucky-classroom.png";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  accountName: z.string().min(1, "Your name is required"),
  studentName: z.string().min(1, "Student name is required"),
  studentAge: z.coerce.number().min(16, "Must be at least 16").max(99, "Please enter a valid age"),
  gradeLevel: z.literal("college-adult"),
  primarySubject: z.literal("general"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  plan: z.literal("elite"),
  marketingOptIn: z.boolean().default(false),
  accessCode: z.string().min(1, "Access code is required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

/* ─── Photo Collage ─── */
function PhotoCollage() {
  return (
    <section className="py-12 md:py-16 px-4 md:px-12 max-w-7xl mx-auto" style={{ background: "#FFFFFF" }}>
      <div className="text-center mb-8 md:mb-12">
        <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#282728", lineHeight: 1.15, marginBottom: 8 }}>
          Where students study hard & play harder
        </h2>
        <p style={{ fontSize: 16, color: "#646569", maxWidth: 520, margin: "0 auto", lineHeight: 1.6, padding: "0 8px" }}>
          From lecture halls to campus events — students bring that energy everywhere. Your Student Relationship Manager keeps up, wherever learning happens.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="col-span-2 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-[1.01]"
          style={{ border: "3px solid white", boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
          <img src={bascomHall} alt="State University campus" className="w-full h-64 md:h-[28rem] object-cover" style={{ objectPosition: "center 35%" }} />
          <div style={{ height: 4, background: "#C5050C" }} />
        </div>

        <div className="rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-[1.03]"
          style={{ border: "3px solid white", boxShadow: "0 8px 25px rgba(0,0,0,0.1)", transform: "rotate(-1deg)" }}>
          <img src={buckyClassroom} alt="Students in classroom" className="w-full h-48 md:h-64 object-cover" />
        </div>

        <div className="rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-[1.03]"
          style={{ border: "3px solid white", boxShadow: "0 8px 25px rgba(0,0,0,0.1)", transform: "rotate(-1deg)" }}>
          <img src={buckyBasketball} alt="Students at sports event" className="w-full h-36 md:h-48 object-cover" />
        </div>

        <div className="rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-[1.03]"
          style={{ border: "3px solid white", boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}>
          <img src={buckyFootball} alt="Students at sports event" className="w-full h-36 md:h-48 object-cover" />
        </div>

        <div className="rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-[1.03]"
          style={{ border: "3px solid white", boxShadow: "0 8px 25px rgba(0,0,0,0.1)", transform: "rotate(1deg)" }}>
          <img src={buckyLecture} alt="Students in lecture hall" className="w-full h-36 md:h-48 object-cover" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-6 md:mt-8">
        <div className="mx-auto px-5 py-3.5 rounded-xl shadow-md inline-block"
          style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(197,5,12,0.12)", borderLeft: "3px solid #C5050C" }}>
          <p style={{ fontFamily: "'Red Hat Text', sans-serif", fontSize: 14, fontStyle: "italic", color: "#282728", lineHeight: 1.5, fontWeight: 500 }}>
            "It's not just a tutor — it knows my whole semester. Every deadline, every exam, every gap. Game changer."
          </p>
          <p style={{ fontSize: 12, color: "#646569", marginTop: 4, fontWeight: 600 }}>— Junior, Biology</p>
        </div>
      </div>
    </section>
  );
}

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  // Registration is disabled institution-wide. Accounts are provisioned by the admin.
  // To re-enable self-service signup (with access codes), flip this to true.
  const REGISTRATION_ENABLED = false;
  const [resendCooldown, setResendCooldown] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchParams = new URLSearchParams(searchString);
  const verificationStatus = searchParams.get("verified");
  const actionParam = searchParams.get("action");

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (actionParam === "register" && REGISTRATION_ENABLED) setActiveTab("register");
  }, [actionParam]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return res.json();
    },
    onSuccess: () => {
      setResendCooldown(60);
      toast({ title: "Verification email sent", description: "Check your inbox." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not resend.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (user) {
      // Post-login routing:
      //   - Admins → /admin
      //   - Students → /tutor ALWAYS, except when they intentionally deep-linked
      //     to a whitelisted destination before logging in.
      const WHITELIST = ["/tutor", "/academic-dashboard", "/settings"];
      const savedRedirect = sessionStorage.getItem("jie_redirect_after_login");
      sessionStorage.removeItem("jie_redirect_after_login");

      if ((user as any).isAdmin) {
        setLocation("/admin");
      } else if (savedRedirect && WHITELIST.includes(savedRedirect)) {
        setLocation(savedRedirect);
      } else {
        setLocation("/tutor");
      }
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountName: "", studentName: "", studentAge: 20,
      gradeLevel: "college-adult", primarySubject: "general",
      email: "", password: "", plan: "elite", marketingOptIn: false,
      accessCode: "",
    },
  });

  const handleLogin = async (data: LoginForm) => {
    try {
      setUnverifiedEmail(null);
      await loginMutation.mutateAsync(data);
    } catch (error: any) {
      if (error.requiresVerification && error.email) {
        setUnverifiedEmail(error.email);
      } else if (error.message?.includes("verify")) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailPattern.test(data.email)) setUnverifiedEmail(data.email);
      }
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    try {
      await registerMutation.mutateAsync(data);
    } catch (error: any) {
      // handled by mutation
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFF", fontFamily: "'Red Hat Text', 'Source Sans 3', sans-serif" }}>
      <div className="fixed top-0 left-0 right-0 z-[60]" style={{ height: 4, background: "#C5050C" }} />

      <nav className="fixed top-1 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
          padding: "8px 16px",
        }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <img src={suLogo} alt="State University" className="h-12 md:h-20 object-contain flex-shrink-0" />
            <div className="hidden sm:block" style={{ borderLeft: "1px solid #DAD7CB", paddingLeft: 12 }}>
              <div style={{ fontFamily: "'Red Hat Display', sans-serif", fontWeight: 700, fontSize: 16, color: "#282728", lineHeight: 1.1 }}>Academic SRM + AI Tutor</div>
              <div style={{ fontSize: 10, color: "#646569", fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>Powered by JIE Mastery</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {[
              { label: "Features", path: "/features" },
              { label: "Academic SRM", path: "/srm" },
              { label: "What is LSIS?", path: "/about-lsis" },
              { label: "College Test Prep", path: "/features#test-prep" },
              { label: "Best Practices", path: "/best-practices" },
              { label: "Support", path: "/support" },
              { label: "Contact", path: "/contact" },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => {
                  const [basePath, hash] = item.path.split("#");
                  setLocation(basePath);
                  if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 500);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#646569",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Red Hat Text', sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#C5050C";
                  e.currentTarget.style.background = "rgba(197,5,12,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#646569";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Button
              onClick={() => { setActiveTab("login"); document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" }); }}
              className="text-white font-semibold px-4 md:px-5 py-2 rounded-lg text-xs md:text-sm"
              style={{ background: "#C5050C" }}>
              Sign In
            </Button>
            <button className="lg:hidden p-2 rounded-md" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              <Menu className="w-5 h-5" style={{ color: "#282728" }} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pb-3 border-t pt-3" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {[
              { label: "Features", path: "/features" },
              { label: "Academic SRM", path: "/srm" },
              { label: "What is LSIS?", path: "/about-lsis" },
              { label: "College Test Prep", path: "/features#test-prep" },
              { label: "Best Practices", path: "/best-practices" },
              { label: "Support", path: "/support" },
              { label: "Contact", path: "/contact" },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => {
                  const [basePath, hash] = item.path.split("#");
                  setLocation(basePath);
                  if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 500);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-sm font-medium"
                style={{ color: "#282728", borderBottom: "1px solid rgba(0,0,0,0.04)" }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {verificationStatus === "success" && (
        <div className="fixed top-16 left-0 right-0 z-40 px-4">
          <div className="max-w-xl mx-auto p-3 rounded-lg shadow-lg" style={{ background: "#E8F5E9", border: "1px solid #28A745" }}>
            <p className="text-sm font-semibold" style={{ color: "#1B5E20" }}>Email verified! You can now sign in.</p>
          </div>
        </div>
      )}

      {/* HERO — SRM-FIRST */}
      <section className="relative" style={{ paddingTop: 100, paddingBottom: 40, background: "linear-gradient(180deg, #FFFFFF 0%, #FFF5F5 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(197,5,12,0.08)", border: "1px solid rgba(197,5,12,0.2)" }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#C5050C" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#C5050C", textTransform: "uppercase", letterSpacing: 1 }}>
                The Next Generation of Academic Support
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div style={{ animation: "fadeInUp 0.8s ease" }}>
              <h1 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(34px, 5.5vw, 60px)", fontWeight: 800, lineHeight: 1.05, color: "#282728", marginBottom: 20, letterSpacing: -1.5 }}>
                Your Academic<br />
                <span style={{ color: "#C5050C" }}>Command Center.</span>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.55, color: "#282728", marginBottom: 16, maxWidth: 520, fontWeight: 600 }}>
                The first Student Relationship Manager built for college — with the most advanced AI tutor on the planet baked in.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "#646569", marginBottom: 28, maxWidth: 520 }}>
                Upload your syllabi and the system builds your entire semester calendar, generates escalating study tasks, scores your engagement in every course, and alerts you before you fall behind — all while your voice tutor walks into every session already knowing what's due.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button onClick={() => { setActiveTab(REGISTRATION_ENABLED ? "register" : "login"); document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="text-white font-semibold px-7 py-3 rounded-lg text-base flex items-center justify-center gap-2"
                  style={{ background: "#C5050C", boxShadow: "0 4px 20px rgba(197,5,12,0.3)" }}>
                  {REGISTRATION_ENABLED ? "Claim Your Command Center" : "Sign In"} <ArrowRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => setLocation("/srm")}
                  variant="outline"
                  className="font-semibold px-7 py-3 rounded-lg text-base"
                  style={{ borderColor: "#C5050C", color: "#C5050C", background: "transparent" }}>
                  See How the SRM Works
                </Button>
              </div>

              <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: 12, color: "#646569" }}>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" style={{ color: "#28A745" }} /> Syllabus → calendar in seconds</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" style={{ color: "#28A745" }} /> Voice tutor 24/7</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" style={{ color: "#28A745" }} /> Every subject, every level</span>
              </div>
            </div>

            <div className="flex justify-center items-center">
              <div className="relative w-full max-w-md">
                <div className="rounded-2xl overflow-hidden shadow-2xl"
                  style={{ border: "4px solid white", boxShadow: "0 20px 50px rgba(0,0,0,0.14)" }}>
                  <img src={buckyGraduation} alt="Students celebrating graduation" className="w-full h-auto" />
                </div>
                <div className="absolute rounded-lg overflow-hidden shadow-xl hidden md:block"
                  style={{ width: 120, bottom: -16, left: -20, transform: "rotate(-4deg)", border: "3px solid white", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
                  <img src={buckyTeaching} alt="Students in lab" className="w-full h-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SRM PILLARS */}
      <section className="py-12 md:py-20 px-4 md:px-12" style={{ background: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(197,5,12,0.08)", border: "1px solid rgba(197,5,12,0.15)" }}>
              <Target className="w-3.5 h-3.5" style={{ color: "#C5050C" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#C5050C", textTransform: "uppercase", letterSpacing: 1 }}>The Five Pillars</span>
            </div>
            <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#282728", lineHeight: 1.15, marginBottom: 8 }}>
              Everything you need to <span style={{ color: "#C5050C" }}>stay ahead</span> of every course.
            </h2>
            <p style={{ fontSize: 16, color: "#646569", maxWidth: 640, margin: "0 auto", lineHeight: 1.6, padding: "0 8px" }}>
              Five systems working together. Miss nothing. Fall behind on nothing. Walk into every exam prepared.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {[
              { icon: <Calendar className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "Syllabus Parsing", desc: "Paste a syllabus. AI extracts every exam, quiz, assignment, and project date into your calendar — automatically." },
              { icon: <CheckCircle className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "Smart Study Tasks", desc: "Tasks auto-generate 7, 3, and 1 day before every deadline — escalating in priority so the work gets done." },
              { icon: <BarChart3 className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "Engagement Scoring", desc: "A 0–100 weekly score per course tracks sessions, tasks completed, study minutes, and consistency." },
              { icon: <Mic className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "Voice AI Tutor", desc: "A Socratic-method tutor that knows your syllabus, remembers every session, and explains it your way." },
              { icon: <Bell className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "Reminders & Alerts", desc: "In-app and email alerts before every deadline. Advisor alerts when engagement drops. You never miss a thing." },
            ].map((f, i) => (
              <div key={i} className="rounded-xl md:rounded-2xl p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4" style={{ background: "rgba(197,5,12,0.06)" }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(14px, 2vw, 17px)", fontWeight: 700, marginBottom: 6, color: "#282728" }}>{f.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "#646569" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COVERAGE — every subject, every level */}
      <section className="py-12 md:py-20 px-4 md:px-12" style={{ background: "#FAFAFA" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(197,5,12,0.08)", border: "1px solid rgba(197,5,12,0.15)" }}>
              <BookOpen className="w-3.5 h-3.5" style={{ color: "#C5050C" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#C5050C", textTransform: "uppercase", letterSpacing: 1 }}>Covers every subject · every level</span>
            </div>
            <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#282728", lineHeight: 1.15, marginBottom: 8 }}>
              From freshman seminars to <span style={{ color: "#C5050C" }}>postgrad exam prep.</span>
            </h2>
            <p style={{ fontSize: 16, color: "#646569", maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
              Whether it's the first week of Econ 101 or three months out from the MCAT, the tutor adapts to where you are in your academic journey.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
            {[
              { label: "Core Coursework", items: "Chem · Bio · Calc · Physics · CS · Writing · History · Econ" },
              { label: "Postgrad Test Prep", items: "GRE · GMAT · LSAT · MCAT · DAT · PCAT · OAT" },
              { label: "Pro & Licensing", items: "CFA · CPA · Series 7 · NCLEX · Praxis · ASWB" },
              { label: "Languages", items: "Spanish · French · German · Mandarin · and more" },
            ].map((cat, i) => (
              <div key={i} className="p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#C5050C", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{cat.label}</p>
                <p style={{ fontSize: 13, color: "#282728", fontWeight: 500, lineHeight: 1.55 }}>{cat.items}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PhotoCollage />

      {/* SRM SHOWCASE */}
      <section className="py-12 md:py-20 px-4 md:px-12" style={{ background: "#FAFAFA" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(197,5,12,0.08)", border: "1px solid rgba(197,5,12,0.15)" }}>
              <Calendar className="w-3.5 h-3.5" style={{ color: "#C5050C" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#C5050C", textTransform: "uppercase", letterSpacing: 1 }}>The Academic Command Center</span>
            </div>
            <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#282728", lineHeight: 1.15, marginBottom: 8 }}>
              A Personal <span style={{ color: "#C5050C" }}>Academic Advisor</span> That Never Sleeps.
            </h2>
            <p style={{ fontSize: 16, color: "#646569", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
              Upload your syllabi and your SRM becomes a proactive academic coach — knowing every deadline, every exam, and exactly where you need to focus.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { icon: <Calendar className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "Syllabus → Calendar in Seconds", desc: "Paste your syllabus and AI extracts every exam, assignment, quiz, and project date. Your entire semester appears on one calendar — instantly." },
              { icon: <CheckCircle className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "Study Tasks That Write Themselves", desc: "7 days before an exam: \"Begin reviewing.\" 3 days: \"Intensive review.\" 1 day: \"Final review.\" Tasks auto-generate with escalating priority — no willpower needed." },
              { icon: <Mic className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "A Tutor That Knows Your Semester", desc: "Start a session and hear: \"You have an Organic Chemistry exam Friday. You've completed 2 of 4 prep tasks. Want to review mechanisms?\" Context-aware from day one." },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(197,5,12,0.06)" }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#282728" }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "#646569" }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(197,5,12,0.06)" }}>
                  <TrendingUp className="w-5 h-5" style={{ color: "#C5050C" }} />
                </div>
                <div>
                  <h4 style={{ fontFamily: "'Red Hat Display', sans-serif", fontWeight: 700, fontSize: 16, color: "#282728", marginBottom: 4 }}>Engagement Scoring (0–100)</h4>
                  <p style={{ fontSize: 14, color: "#646569", lineHeight: 1.5 }}>A weekly score tracks your tutoring sessions, task completion, study time, and consistency. See at a glance which courses need more attention — before it's too late.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(197,5,12,0.06)" }}>
                  <Shield className="w-5 h-5" style={{ color: "#C5050C" }} />
                </div>
                <div>
                  <h4 style={{ fontFamily: "'Red Hat Display', sans-serif", fontWeight: 700, fontSize: 16, color: "#282728", marginBottom: 4 }}>Early Intervention for Advisors</h4>
                  <p style={{ fontSize: 14, color: "#646569", lineHeight: 1.5 }}>Academic advisors and coaches see automated alerts when a student drops off — declining engagement, missed deadlines, or an exam approaching with zero prep. Intervention happens early.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setLocation("/srm")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-base transition-all hover:shadow-lg"
              style={{ background: "#C5050C", color: "#FFFFFF", boxShadow: "0 4px 20px rgba(197,5,12,0.2)" }}>
              Learn More About the SRM <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* THREE-WAY COMPARISON */}
      <section className="py-12 md:py-20 px-4 md:px-12 max-w-7xl mx-auto" style={{ background: "#FFFFFF" }}>
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(197,5,12,0.08)", border: "1px solid rgba(197,5,12,0.15)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#C5050C", textTransform: "uppercase", letterSpacing: 1 }}>Built Different</span>
          </div>
          <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#282728", lineHeight: 1.15, marginBottom: 8 }}>
            Not ChatGPT. Not a Traditional Tutor.
          </h2>
          <p style={{ fontSize: 16, color: "#646569", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
            State University's Academic SRM combines the best of both — and adds a layer of intelligence neither can offer.
          </p>
        </div>

        <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden" style={{ border: "1px solid #E8E8E8", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div className="grid grid-cols-4 text-center font-semibold" style={{ borderBottom: "1px solid #E8E8E8" }}>
            <div className="p-3 md:p-4" style={{ background: "#F8F8F8" }}></div>
            <div className="p-3 md:p-4" style={{ background: "#F8F8F8", fontSize: 13, color: "#646569" }}>Traditional Tutoring</div>
            <div className="p-3 md:p-4" style={{ background: "#F8F8F8", fontSize: 13, color: "#646569" }}>ChatGPT</div>
            <div className="p-3 md:p-4" style={{ background: "rgba(197,5,12,0.06)", fontSize: 13, color: "#C5050C", fontWeight: 700 }}>State AI Tutor + SRM</div>
          </div>

          {[
            { feature: "Academic calendar & planning", trad: false, gpt: false, jie: "Syllabus → auto-built calendar with study tasks" },
            { feature: "Knows your upcoming exams", trad: "If you remember to mention it", gpt: false, jie: "Proactively opens sessions with what's due" },
            { feature: "Engagement & risk scoring", trad: false, gpt: false, jie: "0–100 weekly score with advisor alerts" },
            { feature: "Remembers your sessions", trad: "Depends on the tutor", gpt: false, jie: "Builds a knowledge profile across every session" },
            { feature: "Adapts teaching strategy", trad: "If you're lucky", gpt: false, jie: "Learns what works and adjusts automatically" },
            { feature: "Tracks mastery over time", trad: false, gpt: false, jie: "0–100% mastery scoring per concept" },
            { feature: "Every subject, one tutor", trad: false, gpt: "Any topic, no structure", jie: "Full course load — no scheduling specialists" },
            { feature: "Available 24/7", trad: false, gpt: true, jie: "Any time, any device, voice or text" },
            { feature: "Guides reasoning (Socratic)", trad: "Varies", gpt: false, jie: "Never gives answers — builds understanding" },
            { feature: "Voice conversations", trad: true, gpt: false, jie: "Natural voice in 25 languages" },
            { feature: "Faculty dashboards", trad: "Manual notes if any", gpt: false, jie: "Mastery reports mapped to course objectives" },
            { feature: "Detects learning challenges", trad: "Depends on attentiveness", gpt: false, jie: "Automated flags after consistent patterns" },
            { feature: "Consistent quality", trad: "Varies by day", gpt: "Varies by prompting", jie: "Same excellence every session" },
            { feature: "Travel & schedule friendly", trad: false, gpt: true, jie: "Study on the bus, hotel, between events" },
            { feature: "Academic integrity", trad: true, gpt: false, jie: "Socratic method — guides, never gives answers" },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-4 text-center" style={{ borderBottom: "1px solid #F0F0F0", background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}>
              <div className="p-2.5 md:p-3 text-left font-medium" style={{ fontSize: 13, color: "#282728", background: i % 2 === 0 ? "#FAFAFA" : "#F5F5F5" }}>{row.feature}</div>
              <div className="p-2.5 md:p-3 flex items-center justify-center">
                {row.trad === true ? <CheckCircle className="w-4 h-4" style={{ color: "#646569" }} /> :
                 row.trad === false ? <X className="w-4 h-4" style={{ color: "#D4D4D4" }} /> :
                 <span style={{ fontSize: 11, color: "#646569" }}>{row.trad}</span>}
              </div>
              <div className="p-2.5 md:p-3 flex items-center justify-center">
                {row.gpt === true ? <CheckCircle className="w-4 h-4" style={{ color: "#646569" }} /> :
                 row.gpt === false ? <X className="w-4 h-4" style={{ color: "#D4D4D4" }} /> :
                 <span style={{ fontSize: 11, color: "#646569" }}>{row.gpt}</span>}
              </div>
              <div className="p-2.5 md:p-3" style={{ background: "rgba(197,5,12,0.03)" }}>
                <div className="flex items-start gap-1.5 pl-2">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#28A745" }} />
                  <span style={{ fontSize: 11, color: "#282728", fontWeight: 500, textAlign: "left" }}>{row.jie}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* IT GETS SMARTER EVERY SESSION */}
      <section className="py-12 md:py-20 px-4 md:px-12" style={{ background: "#FAFAFA" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(40,167,69,0.08)", border: "1px solid rgba(40,167,69,0.15)" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#28A745", textTransform: "uppercase", letterSpacing: 1 }}>What No Other AI Can Do</span>
            </div>
            <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#282728", lineHeight: 1.15, marginBottom: 8 }}>
              It Gets <span style={{ color: "#C5050C" }}>Smarter</span> Every Session
            </h2>
            <p style={{ fontSize: 16, color: "#646569", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
              ChatGPT forgets everything when you close the window. Your State University AI Tutor builds a permanent learning profile that compounds over time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
            {[
              { icon: <Brain className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "It Remembers Everything", desc: "After 20 sessions, your tutor knows you struggle with organic chemistry nomenclature, learn best with real-world analogies, and need extra time on thermodynamics. Every session makes the next one better." },
              { icon: <Sparkles className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "It Adapts Its Teaching", desc: "If step-by-step derivations work better for you than big-picture explanations, the tutor adjusts. It tracks which strategies are effective for you specifically and applies them automatically." },
              { icon: <TrendingUp className="w-6 h-6" style={{ color: "#C5050C" }} />, title: "You See Real Progress", desc: "Mastery scores by concept, session summaries after every conversation, and growth tracking over weeks. See exactly where you're strong and where you need to focus before the exam." },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl p-6 md:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(197,5,12,0.06)" }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#282728" }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "#646569" }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E8E8E8", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div className="grid md:grid-cols-2">
              <div className="p-6 md:p-8" style={{ borderBottom: "1px solid #E8E8E8", background: "#FFFFFF" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "#F0F0F0", color: "#646569" }}>1</div>
                  <div>
                    <p style={{ fontWeight: 700, color: "#282728", fontSize: 15 }}>Session 1</p>
                    <p style={{ fontSize: 12, color: "#646569" }}>Any AI tool can do this</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {["Generic introduction, no context about your coursework", "Doesn't know your major or what you're studying", "Uses default explanations for everyone", "No idea what you already understand"].map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#D4D4D4" }} />
                      <span style={{ fontSize: 13, color: "#646569" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 md:p-8" style={{ background: "rgba(197,5,12,0.03)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "#C5050C" }}>20</div>
                  <div>
                    <p style={{ fontWeight: 700, color: "#282728", fontSize: 15 }}>Session 20</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#C5050C" }}>Only State University AI Tutor can do this</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    '"Welcome back! Last time we nailed Le Chatelier\'s — ready to tackle equilibrium constants?"',
                    "Knows you learn best with real-world examples, not abstract formulas",
                    "Skips concepts already mastered, focuses on your actual gaps",
                    "Detects recurring misconceptions and addresses them proactively",
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#28A745" }} />
                      <span style={{ fontSize: 13, color: "#282728", fontWeight: 500 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center mt-6" style={{ fontSize: 14, color: "#646569" }}>
            ChatGPT starts cold every conversation. Your State University AI Tutor has 20 sessions of intelligence about how you learn.
            <br /><strong style={{ color: "#282728" }}>That gap grows every single session.</strong>
          </p>
        </div>
      </section>

      {/* FOR EVERY STUDENT — general student-body-wide pitch */}
      <section className="py-12 md:py-20 px-4 md:px-12 max-w-7xl mx-auto" style={{ background: "#FFFFFF" }}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E8E8E8", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div className="p-2" style={{ background: "#C5050C" }}>
              <p className="text-center text-white font-bold" style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: 14, letterSpacing: 1, textTransform: "uppercase" }}>Built for Every Student</p>
            </div>
            <div className="p-6 md:p-10" style={{ background: "#FFF7ED" }}>
              <h3 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: "#282728", marginBottom: 12 }}>
                Your SRM Keeps You on Pace — No Matter How Full Your Life Is
              </h3>
              <p style={{ fontSize: 15, color: "#646569", lineHeight: 1.65, marginBottom: 24 }}>
                Rigorous coursework. Clubs and research labs. Jobs, internships, and family responsibilities. Whatever fills your week, your Student Relationship Manager tracks every deadline and adapts your study plan so nothing slips through the cracks.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <Clock className="w-5 h-5" style={{ color: "#C5050C" }} />, title: "Available 24/7", desc: "Late-night cram sessions, early-morning review before lab, study breaks between meetings. No office hours to miss." },
                  { icon: <Calendar className="w-5 h-5" style={{ color: "#C5050C" }} />, title: "Every Deadline, One Calendar", desc: "Upload each syllabus and watch your semester auto-populate. Exams, papers, quizzes, and projects all in one place." },
                  { icon: <CheckCircle className="w-5 h-5" style={{ color: "#C5050C" }} />, title: "Study Tasks That Find You", desc: "7 days before an exam: review begins. 3 days: intensive prep. 1 day: final push. Your plan writes itself." },
                  { icon: <Mic className="w-5 h-5" style={{ color: "#C5050C" }} />, title: "Voice Tutoring Anywhere", desc: "Study by speaking — on the bus, between classes, while walking home. Any device, any time, hands free." },
                  { icon: <BookOpen className="w-5 h-5" style={{ color: "#C5050C" }} />, title: "Every Subject, One Tutor", desc: "No scheduling three specialists for Chem, Econ, and Spanish. One tutor covers the full course load — freshman through senior year." },
                  { icon: <Brain className="w-5 h-5" style={{ color: "#C5050C" }} />, title: "Remembers Your Semester", desc: "Missed a week for illness, a conference, or a family trip? The tutor knows exactly where you left off and what gaps need filling." },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(197,5,12,0.06)" }}>{f.icon}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#282728", marginBottom: 2 }}>{f.title}</p>
                      <p style={{ fontSize: 13, color: "#646569", lineHeight: 1.5 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(197,5,12,0.06)", border: "1px solid rgba(197,5,12,0.12)" }}>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#C5050C" }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#282728", marginBottom: 2 }}>Early Intervention That Actually Works</p>
                    <p style={{ fontSize: 13, color: "#646569", lineHeight: 1.5 }}>When your engagement score drops — missed deadlines, declining study time, an exam approaching with zero prep — your advisor sees it weeks before midterm grades arrive. Support kicks in when it can still make a difference, not after it's too late.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXAM PREP */}
      <section className="py-10 md:py-16 px-4 md:px-12" style={{ background: "#FAFAFA" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 800, color: "#282728", marginBottom: 8 }}>
            Post-Graduate & Professional Exam Prep
          </h2>
          <p style={{ fontSize: 15, color: "#646569", maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.6 }}>
            The same adaptive intelligence that powers your coursework tutoring — applied to high-stakes exams.
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {["GRE", "GMAT", "LSAT", "MCAT", "DAT", "PCAT", "OAT", "CFA", "CPA", "Series 7", "FE", "PE", "NCLEX", "PANCE", "Praxis", "ASWB"].map((exam) => (
              <span key={exam} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8", color: "#282728" }}>
                {exam}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Auth */}
      <section id="auth-section" className="py-12 md:py-20 px-4 md:px-12 max-w-7xl mx-auto" style={{ background: "#FFFFFF" }}>
        <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="relative p-8 md:p-16 flex flex-col justify-center" style={{ background: "#C5050C" }}>
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, white 40px, white 41px)" }} />
            <div className="relative z-10">
              <div className="mb-6 md:mb-10" style={{ fontFamily: "'Red Hat Display', sans-serif", fontWeight: 800, fontSize: 20, color: "white", letterSpacing: 1 }}>STATE UNIVERSITY</div>
              <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 16 }}>Welcome.</h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, maxWidth: 360 }}>Your Academic Command Center is ready. Sign in to upload a syllabus, start a voice session, or check your engagement score.</p>
            </div>
          </div>
          <div className="p-6 md:p-14 flex flex-col justify-center" style={{ background: "white" }}>
            {verificationStatus === "success" && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: "#E8F5E9", border: "1px solid #28A745" }}>
                <p className="text-sm font-semibold" style={{ color: "#1B5E20" }}>Email verified! You can now sign in.</p>
              </div>
            )}
            {REGISTRATION_ENABLED ? (
              <div className="flex mb-6 md:mb-8 rounded-lg p-1" style={{ background: "#F3F3F3" }}>
                {(["login", "register"] as const).map(tab => (
                  <button key={tab} onClick={() => { setActiveTab(tab); loginForm.reset(); registerForm.reset(); }} className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-all"
                    style={{ background: activeTab === tab ? "white" : "transparent", color: activeTab === tab ? "#282728" : "#646569", boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                    {tab === "login" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-6 md:mb-8 text-center">
                <h2 className="text-2xl font-bold" style={{ color: "#282728" }}>Sign In</h2>
                <p className="text-sm mt-2" style={{ color: "#646569" }}>
                  Need an account? Contact your administrator.
                </p>
              </div>
            )}
            {(activeTab === "login" || !REGISTRATION_ENABLED) ? (
              <Form {...loginForm} key="login-form">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 md:space-y-5">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: 13, fontWeight: 600, color: "#3E3D3F" }}>Email</FormLabel>
                      <FormControl><Input placeholder="student@state.edu" {...field} className="h-11 md:h-12 rounded-lg" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: 13, fontWeight: 600, color: "#3E3D3F" }}>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showLoginPassword ? "text" : "password"} placeholder="Enter your password" {...field} className="h-11 md:h-12 rounded-lg pr-10" />
                          <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {unverifiedEmail && (
                    <div className="p-4 rounded-lg" style={{ background: "#FFF8E1", border: "1px solid #F5A623" }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: "#E65100" }}>Please verify your email first.</p>
                      <Button type="button" variant="outline" size="sm" disabled={resendCooldown > 0} onClick={() => resendVerificationMutation.mutate(unverifiedEmail)}>
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification"}
                      </Button>
                    </div>
                  )}
                  <Button type="submit" disabled={loginMutation.isPending} className="w-full h-11 md:h-12 text-white font-semibold rounded-lg text-base" style={{ background: "#C5050C" }}>
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                  {loginMutation.isError && <p className="text-sm text-center" style={{ color: "#DC3545" }}>{(loginMutation.error as any)?.message || "Invalid credentials"}</p>}
                  <a href="/forgot-password" className="block text-center text-sm hover:underline" style={{ color: "#646569" }}>Forgot password?</a>
                </form>
              </Form>
            ) : (
              <Form {...registerForm} key="register-form">
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3 md:space-y-4">
                  <FormField control={registerForm.control} name="accountName" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: 13, fontWeight: 600, color: "#3E3D3F" }}>Full Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Sarah Chen" {...field} className="h-11 rounded-lg" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <input type="hidden" {...registerForm.register("studentName")} />
                  <input type="hidden" {...registerForm.register("studentAge")} />
                  <input type="hidden" {...registerForm.register("gradeLevel")} />
                  <input type="hidden" {...registerForm.register("primarySubject")} />
                  <input type="hidden" {...registerForm.register("plan")} />
                  <FormField control={registerForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: 13, fontWeight: 600, color: "#3E3D3F" }}>University Email</FormLabel>
                      <FormControl><Input placeholder="student@state.edu" {...field} className="h-11 rounded-lg" onChange={(e) => { field.onChange(e); registerForm.setValue("studentName", registerForm.getValues("accountName") || "Student"); }} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: 13, fontWeight: 600, color: "#3E3D3F" }}>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showRegisterPassword ? "text" : "password"} placeholder="8+ characters" {...field} className="h-11 rounded-lg pr-10" />
                          <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="accessCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: 13, fontWeight: 600, color: "#3E3D3F" }}>Access Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your access code" {...field} className="h-11 rounded-lg font-mono uppercase tracking-wider"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={registerMutation.isPending} className="w-full h-11 md:h-12 text-white font-semibold rounded-lg text-base" style={{ background: "#C5050C" }}
                    onClick={() => registerForm.setValue("studentName", registerForm.getValues("accountName") || "Student")}>
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                  {registerMutation.isError && <p className="text-sm text-center" style={{ color: "#DC3545" }}>{(registerMutation.error as any)?.message || "Registration failed"}</p>}
                </form>
              </Form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-10 px-4 md:px-12 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderTop: "1px solid #E8E8E8", background: "#FFFFFF" }}>
        <div className="flex items-center gap-3">
          <img src={suLogo} alt="State University" className="h-8 object-contain" />
          <span style={{ fontSize: 12, color: "#646569" }}>State University · Academic SRM + AI Tutor</span>
        </div>
        <span style={{ fontSize: 11, color: "#DAD7CB" }}>Powered by JIE Mastery</span>
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

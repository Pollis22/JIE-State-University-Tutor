import { useLocation } from "wouter";
import { NavigationHeader } from "@/components/navigation-header";
import {
  Brain, Sparkles, Target, TrendingUp, Shield, Clock,
  ArrowRight, CheckCircle, XCircle, Layers, BookOpen,
  Lightbulb, LineChart, MessageCircle, UserCheck, Zap, Database
} from "lucide-react";

const CARDINAL = "#C5050C";
const DARK = "#282728";
const MUTED = "#646569";
const BORDER = "#E8E8E8";
const CARDINAL_SOFT = "rgba(197,5,12,0.06)";
const CARDINAL_BORDER = "rgba(197,5,12,0.20)";

const FONT_DISPLAY = "'Red Hat Display', sans-serif";
const FONT_BODY = "'Red Hat Text', 'Source Sans 3', sans-serif";

function Card({ children, style = {}, highlight = false }: { children: React.ReactNode; style?: React.CSSProperties; highlight?: boolean }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${highlight ? CARDINAL_BORDER : BORDER}`,
        borderRadius: 12,
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 28,
        fontWeight: 700,
        color: DARK,
        marginBottom: 12,
        letterSpacing: -0.5,
      }}
    >
      {children}
    </h2>
  );
}

function SectionIntro({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 16, lineHeight: 1.65, color: MUTED, marginBottom: 28, maxWidth: 760 }}>
      {children}
    </p>
  );
}

export default function AboutLSISPage() {
  const [, setLocation] = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", fontFamily: FONT_BODY }}>
      <NavigationHeader />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: CARDINAL_SOFT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Brain style={{ width: 28, height: 28, color: CARDINAL }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 800, color: DARK, letterSpacing: -0.8 }}>
                  What is LSIS?
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    background: CARDINAL,
                    padding: "3px 10px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Proprietary AI Moat
                </span>
              </div>
              <p style={{ color: MUTED, marginTop: 4, fontSize: 15 }}>
                Longitudinal Student Intelligence System — the tutor that remembers.
              </p>
            </div>
          </div>
        </div>

        {/* Hero value proposition */}
        <section style={{ marginBottom: 56 }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${CARDINAL_SOFT} 0%, #FFFFFF 50%, #FFF5F5 100%)`,
              border: `1px solid ${CARDINAL_BORDER}`,
              borderRadius: 16,
              padding: "48px 40px",
            }}
          >
            <div style={{ maxWidth: 780 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: CARDINAL_SOFT,
                  color: CARDINAL,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 18,
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} /> The Moat
              </div>
              <h2
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "clamp(32px, 4vw, 44px)",
                  fontWeight: 800,
                  color: DARK,
                  lineHeight: 1.12,
                  letterSpacing: -1.2,
                  marginBottom: 20,
                }}
              >
                Most AI tutors are amnesiac.<br />
                <span style={{ color: CARDINAL }}>JIE remembers every session.</span>
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: MUTED }}>
                LSIS is the engine that turns JIE from a voice-chat app into a true learning companion.
                After every session, LSIS extracts what a student understood, what confused them, and what
                teaching style worked — then feeds that knowledge back into the next session. Session 20
                is dramatically better than session 1 because the tutor has been learning about the student
                the whole time. A competitor starting cold cannot catch up.
              </p>
            </div>
          </div>
        </section>

        {/* The Problem — side-by-side */}
        <section style={{ marginBottom: 56 }}>
          <SectionTitle>Why This Changes Everything</SectionTitle>
          <SectionIntro>
            ChatGPT, Claude, Gemini, and every generic AI tutor start every conversation from zero. They are
            brilliant strangers who meet your student for the first time, every time. LSIS is the difference
            between a stranger and a tutor who knows your child.
          </SectionIntro>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
            <Card style={{ background: "#FDF5F5", borderColor: "rgba(197,5,12,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <XCircle style={{ width: 22, height: 22, color: CARDINAL }} />
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: DARK }}>
                  Typical AI Tutor (ChatGPT, generic apps)
                </h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  'Every session begins with "Hi, what would you like to learn today?"',
                  "No memory of which concepts the student has mastered",
                  "Re-explains things the student already understands — wasting session time",
                  "Doesn't know which teaching strategies actually work for this student",
                  "Can't spot recurring misconceptions that resurface across weeks",
                  "Session 20 is no better than session 1",
                ].map((text, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
                    <span style={{ color: CARDINAL, flexShrink: 0, fontWeight: 700 }}>✗</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card highlight style={{ background: CARDINAL_SOFT }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <CheckCircle style={{ width: 22, height: 22, color: CARDINAL }} />
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: DARK }}>
                  JIE with LSIS
                </h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  'Opens with: "Last time we were working on fraction multiplication — ready to continue?"',
                  "Remembers every concept the student has engaged with, scored 0–100% mastery",
                  "Skips mastered material and zeros in on growth areas",
                  "Knows the student learns faster with visual analogies than verbal explanations",
                  "Catalogs misconceptions and revisits them until resolved",
                  "Session 20 is a completely different experience from session 1 — personalized, faster, deeper",
                ].map((text, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: DARK, lineHeight: 1.55 }}>
                    <CheckCircle style={{ width: 16, height: 16, color: CARDINAL, marginTop: 3, flexShrink: 0 }} />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* How It Works — 3 Stages */}
        <section style={{ marginBottom: 56 }}>
          <SectionTitle>How LSIS Works</SectionTitle>
          <SectionIntro>
            Three stages run automatically in the background. The student never sees any of this — they just
            experience a tutor who seems to know them better every week.
          </SectionIntro>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              {
                step: "1",
                icon: <Layers style={{ width: 20, height: 20 }} />,
                title: "Extract",
                subtitle: "Session ends",
                desc: "When a session ends, LSIS reads the full transcript with a structured AI pipeline. It asks: What concepts did the student engage with? Did they understand them? What evidence tells you so? What misconceptions appeared? What teaching strategy worked? Output is structured data — each concept scored 0–100% mastery with specific evidence.",
              },
              {
                step: "2",
                icon: <Database style={{ width: 20, height: 20 }} />,
                title: "Remember",
                subtitle: "Profile updates",
                desc: "Those extracted concepts roll up into a single persistent profile per student: total sessions analyzed, strengths, growth areas, misconception catalog, effective teaching strategies, emotional patterns, and next-session recommendations. The profile compounds over time. Every session makes it sharper.",
              },
              {
                step: "3",
                icon: <Zap style={{ width: 20, height: 20 }} />,
                title: "Adapt",
                subtitle: "Next session starts",
                desc: 'When the student returns, their profile is silently injected into the tutor\'s instructions before they say a word. The tutor now knows everything about this student and adapts pacing, examples, vocabulary, and strategy in real time. The student just experiences a tutor who "gets them."',
              },
            ].map((item, i) => (
              <Card key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: CARDINAL,
                      color: "#FFFFFF",
                      fontFamily: FONT_DISPLAY,
                      fontSize: 16,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.step}
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: CARDINAL_SOFT,
                      color: CARDINAL,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: CARDINAL, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  {item.subtitle}
                </div>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 10 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: MUTED }}>{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* What LSIS Tracks */}
        <section style={{ marginBottom: 56 }}>
          <SectionTitle>What LSIS Tracks For Every Student</SectionTitle>
          <SectionIntro>A rolling longitudinal profile that gets richer every session.</SectionIntro>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {[
              { icon: <Target style={{ width: 18, height: 18 }} />, title: "Concept Mastery", desc: "Every academic concept the student engages with is scored 0–100% with evidence. Example: spanish.alphabet.letter_a mastery 0.75 — recalled pronunciation correctly on first prompt. Scores update across sessions and reveal learning curves per concept." },
              { icon: <Lightbulb style={{ width: 18, height: 18 }} />, title: "Misconception Catalog", desc: 'Wrong answers aren\'t just noted — their underlying misconceptions are named and remembered. "Student believes 1/4 > 1/2 because 4 > 2." The tutor revisits these until they\'re resolved, then archives them.' },
              { icon: <UserCheck style={{ width: 18, height: 18 }} />, title: "Learning Style", desc: "Does this student respond better to visual analogies or verbal explanations? Short pointed questions or longer setups? Humor or straight instruction? LSIS measures effectiveness and adapts." },
              { icon: <TrendingUp style={{ width: 18, height: 18 }} />, title: "Effective Strategies", desc: 'Every teaching strategy the tutor tries is scored for effectiveness with this specific student. "Drawing parallels to basketball helped with ratio problems — effectiveness 0.9." Winning strategies get reused.' },
              { icon: <MessageCircle style={{ width: 18, height: 18 }} />, title: "Emotional Patterns", desc: "Does the student get frustrated after three wrong answers? What recovery strategies work? When does engagement peak? LSIS notices patterns no human tutor could track across 20 sessions." },
              { icon: <LineChart style={{ width: 18, height: 18 }} />, title: "Next-Session Recommendations", desc: "Before every session, LSIS generates a priority list of topics to cover, strategies to use, and things to avoid — tailored to this student, this week, this moment." },
            ].map((item, i) => (
              <Card key={i}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: CARDINAL_SOFT,
                      color: CARDINAL,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 6 }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: MUTED }}>{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Session 1 vs Session 20 */}
        <section style={{ marginBottom: 56 }}>
          <SectionTitle>Session 1 vs. Session 20 — A Real Example</SectionTitle>

          <Card highlight style={{ padding: 36 }}>
            <p style={{ fontSize: 15, color: MUTED, marginBottom: 24, fontStyle: "italic" }}>
              Imagine Emma, a 4th grader working on fractions with JIE.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Clock style={{ width: 18, height: 18, color: MUTED }} />
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>
                    Session 1 — Cold Start
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
                  <p>Tutor: "Hi Emma! What would you like to work on today?"</p>
                  <p>Emma: "Fractions, I guess."</p>
                  <p>
                    Tutor delivers a standard 4th-grade fraction lesson. Emma engages politely but the pacing is
                    generic. Tutor has no idea she already knows equivalent fractions cold but struggles specifically
                    with unlike denominators. Session ends neutrally.
                  </p>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Sparkles style={{ width: 18, height: 18, color: CARDINAL }} />
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: CARDINAL, textTransform: "uppercase", letterSpacing: 1 }}>
                    Session 20 — LSIS-powered
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: DARK, lineHeight: 1.6 }}>
                  <p>Tutor: "Hey Emma — last time we cracked unlike denominators with the pizza analogy. Want to try applying it to word problems today? I have a good one about a soccer team."</p>
                  <p>Emma: "Yeah!"</p>
                  <p>
                    Tutor opens with the student's preferred learning modality (visual/sports analogies), avoids
                    already-mastered concepts (equivalent fractions), targets the known growth area, and references a
                    teaching strategy that previously scored 0.9 effectiveness. Emma hits mastery 5 minutes into the
                    session.
                  </p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 15, color: DARK, lineHeight: 1.6 }}>
                <strong style={{ color: CARDINAL }}>That compounding advantage is the moat.</strong> A competitor
                starting a new student from session 1 cannot replicate 19 sessions of personal knowledge no matter
                how powerful their underlying LLM is.
              </p>
            </div>
          </Card>
        </section>

        {/* Competitive Comparison */}
        <section style={{ marginBottom: 56 }}>
          <SectionTitle>How JIE Compares</SectionTitle>
          <SectionIntro>
            We're frequently asked "why not just use ChatGPT?" Here's the honest answer.
          </SectionIntro>

          <Card style={{ padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#FAFAFA", textAlign: "left" }}>
                  <th style={{ padding: 16, fontFamily: FONT_DISPLAY, fontWeight: 700, color: DARK }}>Feature</th>
                  <th style={{ padding: 16, fontFamily: FONT_DISPLAY, fontWeight: 700, color: MUTED }}>ChatGPT / Claude / Gemini</th>
                  <th style={{ padding: 16, fontFamily: FONT_DISPLAY, fontWeight: 700, color: MUTED }}>Khan / Duolingo</th>
                  <th style={{ padding: 16, fontFamily: FONT_DISPLAY, fontWeight: 700, color: CARDINAL }}>JIE with LSIS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Voice-first tutor", "Limited", "No", "Yes — sub-second loop"],
                  ["Remembers student across sessions", "No", "Partial (progress only)", "Full longitudinal profile"],
                  ["Tracks concept mastery per student", "No", "Basic", "0–100% per concept, with evidence"],
                  ["Catalogs misconceptions over time", "No", "No", "Yes, until resolved"],
                  ["Adapts teaching strategy to student", "No", "No", "Measured and refined per session"],
                  ["Knows what to teach next session", "No", "Linear curriculum", "AI-generated, personalized"],
                  ["Grade-adapted persona", "No", "Fixed", "K-2 → College, 6 personas"],
                  ["Parent / institutional dashboards", "No", "Partial", "Full family + institutional admin"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${BORDER}`, background: i % 2 === 1 ? "#FAFAFA" : "#FFFFFF" }}>
                    <td style={{ padding: 16, color: DARK, fontWeight: 600 }}>{row[0]}</td>
                    <td style={{ padding: 16, color: MUTED }}>{row[1]}</td>
                    <td style={{ padding: 16, color: MUTED }}>{row[2]}</td>
                    <td style={{ padding: 16, color: DARK, fontWeight: 600 }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* Privacy */}
        <section style={{ marginBottom: 56 }}>
          <Card style={{ background: "#FAFAFA", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <Shield style={{ width: 40, height: 40, color: CARDINAL, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 10 }}>
                Privacy by Design
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: MUTED }}>
                LSIS profiles are stored per-student in an encrypted database, never shared across families or
                institutions, and never used to train foundation models. The system is designed to be FERPA and
                COPPA compliant. Administrators can view and delete any student's profile at any time.
              </p>
            </div>
          </Card>
        </section>

        {/* Technical Note */}
        <section style={{ marginBottom: 56 }}>
          <SectionTitle>Under the Hood</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { title: "Extraction", desc: "Structured concept extraction via frontier LLM with a purpose-built educational taxonomy. Normalized concept keys enable cross-session aggregation at scale." },
              { title: "Storage", desc: "Per-student knowledge profiles, append-only concept mastery records, and a background job queue — all in Postgres with indexed lookups for sub-100ms injection at session start." },
              { title: "Injection", desc: 'Profiles are silently injected into the tutor\'s system prompt before each session. The tutor doesn\'t have to be told to "remember" — memory is built into its instructions.' },
            ].map((item, i) => (
              <Card key={i}>
                <div style={{ fontSize: 11, fontWeight: 700, color: CARDINAL, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  {item.title}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: MUTED }}>{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${CARDINAL_SOFT} 0%, #FFFFFF 60%, #FFF5F5 100%)`,
              border: `1px solid ${CARDINAL_BORDER}`,
              borderRadius: 16,
              padding: "48px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: CARDINAL_SOFT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Brain style={{ width: 32, height: 32, color: CARDINAL }} />
              </div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 800, color: DARK, marginBottom: 12, letterSpacing: -0.8 }}>
                The tutor that gets smarter every week.
              </h2>
              <p style={{ fontSize: 16, color: MUTED, marginBottom: 28, lineHeight: 1.6 }}>
                Every session with JIE teaches the tutor how to teach your student better. That compounding
                advantage is unique to JIE and impossible to replicate with a generic AI.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => setLocation("/tutor")}
                  style={{
                    background: CARDINAL,
                    color: "#FFFFFF",
                    border: "none",
                    padding: "14px 28px",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: FONT_BODY,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(197,5,12,0.25)",
                  }}
                >
                  Start a Session <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
                <button
                  onClick={() => setLocation("/academic-dashboard")}
                  style={{
                    background: "#FFFFFF",
                    color: CARDINAL,
                    border: `1px solid ${CARDINAL_BORDER}`,
                    padding: "14px 28px",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: FONT_BODY,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <BookOpen style={{ width: 16, height: 16 }} /> Explore Academic SRM
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

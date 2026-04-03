import { useLocation } from "wouter";
import suLogo from "@/assets/state-university-logo.png";

export function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer style={{ background: "#FFFFFF", borderTop: "1px solid #E8E8E8", padding: "32px 0", marginTop: "auto" }}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <button onClick={() => setLocation("/terms")} className="text-sm hover:underline" style={{ color: "#646569", background: "none", border: "none", cursor: "pointer" }}>
              Terms & Conditions
            </button>
            <button onClick={() => setLocation("/privacy")} className="text-sm hover:underline" style={{ color: "#646569", background: "none", border: "none", cursor: "pointer" }}>
              Privacy Policy
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-4" style={{ borderTop: "1px solid #E8E8E8" }}>
          <div className="flex items-center gap-3">
            <img src={suLogo} alt="State University" style={{ height: 32 }} />
            <span style={{ fontSize: 13, color: "#646569" }}>State University · AI Tutor Program</span>
          </div>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '12px 0',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: 16
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>
            Powered by{' '}
            <a href="https://jiemastery.ai" target="_blank" rel="noopener noreferrer"
               style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              JIE Mastery.ai
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

import { useEffect } from "react";
import { MessageCircle, Mail, Book, HelpCircle, Phone } from "lucide-react";
import { useLocation } from "wouter";
import { NavigationHeader } from "@/components/navigation-header";
import { LiveChatWidget } from "@/components/LiveChatWidget";

export default function LiveSupport() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log("Live support page loaded with ElevenLabs agent");
  }, []);

  const launchVoiceCall = () => {
    window.dispatchEvent(new CustomEvent("open-live-chat"));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Global Navigation */}
      <NavigationHeader />

      {/* Header */}
      <div className="bg-[#C5050C] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            We're Here to Help
          </h1>
          <p className="text-xl">
            Get support from our team whenever you need it
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        
        {/* Live Chat Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-[#C5050C] to-[#A00409] text-white p-8 rounded-lg text-center mb-8">
            <MessageCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
              Live Voice Support
            </h2>
            <p className="text-lg mb-8">
              Talk with our AI support assistant for instant help with technical issues, account questions, or platform guidance.
            </p>

            {/* Prominent voice-call CTA — replaces the easy-to-miss floating-icon instruction */}
            <div className="relative inline-block">
              <span
                className="absolute inset-0 rounded-full bg-white opacity-30 animate-ping"
                aria-hidden="true"
              />
              <button
                onClick={launchVoiceCall}
                className="relative bg-white text-[#C5050C] px-10 py-5 rounded-full text-xl font-bold inline-flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/50"
                style={{ fontFamily: "'Red Hat Display', sans-serif" }}
                data-testid="button-launch-voice-call"
                aria-label="Start voice call with support"
              >
                <Phone className="h-7 w-7" />
                Start Voice Call
              </button>
            </div>

            <p className="text-sm mt-6 text-white/90">
              Available 24/7 — your browser will ask for microphone access when the call starts.
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
            <p className="text-gray-700">
              <strong>Note:</strong> Our AI support assistant is available 24/7 to help with platform questions, technical issues, and general inquiries. For academic tutoring, please sign in and start a tutoring session.
            </p>
          </div>
        </section>

        {/* Common Questions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#C5050C] mb-8" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Common Questions
          </h2>

          <div className="space-y-4">
            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold text-lg cursor-pointer flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C5050C]" />
                How do I access my account?
              </summary>
              <p className="mt-4 text-gray-700 ml-7">
                Log in using your email address and the access code provided to you. If you've forgotten your access code, please contact support via live chat.
              </p>
            </details>

            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold text-lg cursor-pointer flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C5050C]" />
                What devices can I use?
              </summary>
              <p className="mt-4 text-gray-700 ml-7">
                You can access the platform from any device with a web browser - laptop, desktop, tablet, or smartphone. For the best experience, we recommend using a laptop or desktop computer. A mobile app is coming soon!
              </p>
            </details>

            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold text-lg cursor-pointer flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C5050C]" />
                Why isn't voice mode working?
              </summary>
              <p className="mt-4 text-gray-700 ml-7">
                Voice mode requires microphone access and a stable internet connection. Make sure your browser has permission to access your microphone. If you're in a noisy environment, try switching to text mode for better results.
              </p>
            </details>

            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold text-lg cursor-pointer flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C5050C]" />
                Can I upload homework and documents?
              </summary>
              <p className="mt-4 text-gray-700 ml-7">
                Yes! You can upload PDFs, Word documents, images, and other file types. Simply click the upload button during your tutoring session and select your file. The AI tutor will analyze it and help you with questions.
              </p>
            </details>

            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold text-lg cursor-pointer flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C5050C]" />
                What subjects are supported?
              </summary>
              <p className="mt-4 text-gray-700 ml-7">
                All subjects from K-12 through college level, plus graduate test prep (GRE, LSAT, MCAT, GMAT). The AI tutor can help with math, science, humanities, languages, and more.
              </p>
            </details>

            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold text-lg cursor-pointer flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C5050C]" />
                Is my information private and secure?
              </summary>
              <p className="mt-4 text-gray-700 ml-7">
                Yes. All sessions are private and encrypted. We follow strict data protection protocols to ensure your academic work and personal information remain confidential.
              </p>
            </details>

            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold text-lg cursor-pointer flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C5050C]" />
                Can I use this in different languages?
              </summary>
              <p className="mt-4 text-gray-700 ml-7">
                Absolutely! The platform supports 25 languages for both voice and text. Simply tell the AI tutor which language you prefer to use.
              </p>
            </details>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#C5050C] mb-8" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Additional Resources
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <button onClick={() => setLocation("/best-practices")}>
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-transparent hover:border-[#C5050C] transition-colors cursor-pointer text-left">
                <Book className="w-12 h-12 text-[#C5050C] mb-4" />
                <h3 className="text-xl font-bold mb-2">Best Practices Guide</h3>
                <p className="text-gray-700">
                  Learn how to get the most out of your AI tutoring sessions with our comprehensive guide.
                </p>
              </div>
            </button>

            <button onClick={() => setLocation("/features")}>
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-transparent hover:border-[#C5050C] transition-colors cursor-pointer text-left">
                <MessageCircle className="w-12 h-12 text-[#C5050C] mb-4" />
                <h3 className="text-xl font-bold mb-2">Features & Benefits</h3>
                <p className="text-gray-700">
                  Discover all the powerful features available to help you succeed academically.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <Mail className="w-12 h-12 text-[#C5050C] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Prefer Email?</h2>
            <p className="text-gray-700 mb-6">
              You can also reach us via our contact form for non-urgent inquiries.
            </p>
            <button 
              onClick={() => setLocation("/contact")}
              className="bg-[#C5050C] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#A00409] transition-colors"
            >
              Contact Form
            </button>
          </div>
        </section>
      </div>

      {/* ElevenLabs Live Chat Widget */}
      <LiveChatWidget />
    </div>
  );
}

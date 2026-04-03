import { useLocation } from "wouter";
import { 
  Headphones, 
  Wifi, 
  Volume2, 
  Monitor, 
  MessageSquare,
  BookOpen,
  Lightbulb,
  CheckCircle,
  XCircle
} from "lucide-react";
import { NavigationHeader } from "@/components/navigation-header";

export default function BestPractices() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      {/* Global Navigation */}
      <NavigationHeader />

      {/* Header */}
      <div className="bg-[#C5050C] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Best Practices for Success
          </h1>
          <p className="text-xl">
            Get the most out of your AI tutoring sessions with these tips
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        
        {/* Optimal Environment */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#C5050C] mb-8" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Setting Up Your Study Environment
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4 bg-gray-50 p-6 rounded-lg">
              <div className="flex-shrink-0">
                <Volume2 className="w-8 h-8 text-[#C5050C]" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Find a Quiet Space</h3>
                <p className="text-gray-700">
                  For voice sessions, choose a location with minimal background noise. Libraries, private study rooms, or quiet areas at home work best. Background noise can interfere with speech recognition and reduce accuracy.
                </p>
                <p className="text-gray-600 mt-2 text-sm italic">
                  💡 Tip: If you're in a noisy environment, switch to text mode for better results.
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-gray-50 p-6 rounded-lg">
              <div className="flex-shrink-0">
                <Monitor className="w-8 h-8 text-[#C5050C]" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Use a Laptop or Desktop</h3>
                <p className="text-gray-700">
                  While our platform works on mobile browsers, we strongly recommend using a laptop or desktop computer for the best experience. Larger screens make it easier to view explanations, uploaded documents, and visual aids.
                </p>
                <p className="text-gray-600 mt-2 text-sm italic">
                  📱 Mobile app coming soon! You can still use your mobile browser in the meantime.
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-gray-50 p-6 rounded-lg">
              <div className="flex-shrink-0">
                <Headphones className="w-8 h-8 text-[#C5050C]" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Quality Audio Matters</h3>
                <p className="text-gray-700">
                  Use a good quality microphone or headset with a built-in mic. Your computer's built-in microphone works fine, but external microphones or headsets with noise cancellation provide the clearest audio for voice sessions.
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-gray-50 p-6 rounded-lg">
              <div className="flex-shrink-0">
                <Wifi className="w-8 h-8 text-[#C5050C]" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Stable Internet Connection</h3>
                <p className="text-gray-700">
                  Ensure you have a reliable internet connection. Voice sessions require real-time data transmission, so WiFi or ethernet is recommended over cellular data when possible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Voice vs Text Mode */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#C5050C] mb-8" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Voice Mode vs. Text Mode
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-[#C5050C] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-8 h-8 text-[#C5050C]" />
                <h3 className="text-2xl font-bold">Voice Mode</h3>
              </div>
              
              <div className="mb-4">
                <p className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5" /> Best For:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Natural conversations</li>
                  <li>Explaining complex concepts aloud</li>
                  <li>Language practice and pronunciation</li>
                  <li>Hands-free studying</li>
                  <li>Talking through problem-solving steps</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-red-700 flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5" /> Avoid When:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>In a noisy environment</li>
                  <li>Poor internet connection</li>
                  <li>Working with complex equations (use text)</li>
                </ul>
              </div>
            </div>

            <div className="border-2 border-gray-300 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-8 h-8 text-gray-700" />
                <h3 className="text-2xl font-bold">Text Mode</h3>
              </div>
              
              <div className="mb-4">
                <p className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5" /> Best For:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Noisy environments (coffee shops, dorms)</li>
                  <li>Mathematical equations and formulas</li>
                  <li>Code snippets and technical writing</li>
                  <li>Precise, detailed explanations</li>
                  <li>When you prefer to read/write</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-red-700 flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5" /> Less Ideal For:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Quick brainstorming conversations</li>
                  <li>Language pronunciation practice</li>
                  <li>When typing is difficult</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-gray-700">
              <strong>Pro Tip:</strong> You can switch between voice and text mode at any time during your session! Use voice for discussion and text when you need to input equations or code.
            </p>
          </div>
        </section>

        {/* Effective Communication */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#C5050C] mb-8" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Communicating Effectively with Your AI Tutor
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-[#C5050C]" />
                Be Specific About Your Needs
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <p className="font-semibold text-green-700 mb-2">✓ Good Examples:</p>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>"Can you explain Newton's Second Law and show me how to apply it to this problem?"</li>
                    <li>"I'm struggling with organic chemistry reactions. Can we review substitution reactions?"</li>
                    <li>"Help me understand the difference between mitosis and meiosis."</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-red-700 mb-2">✗ Less Effective:</p>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>"Help with physics"</li>
                    <li>"I don't understand chemistry"</li>
                    <li>"Explain biology"</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">Share Context</h3>
              <p className="text-gray-700 mb-3">
                Let your AI tutor know your current level and what you already understand:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>"I'm in introductory biology, and we just covered cell structure..."</li>
                <li>"I understand basic derivatives, but I'm confused about the chain rule..."</li>
                <li>"I'm preparing for the LSAT. Can we practice logical reasoning questions?"</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">Upload Supporting Materials</h3>
              <p className="text-gray-700 mb-3">
                Get better help by sharing:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Homework problems or assignments</li>
                <li>Lecture slides or notes</li>
                <li>Practice exams or quizzes</li>
                <li>Textbook pages or study guides</li>
                <li>Photos of handwritten work or diagrams</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">Ask Follow-Up Questions</h3>
              <p className="text-gray-700">
                Don't hesitate to ask for clarification or different explanations:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
                <li>"Can you explain that in simpler terms?"</li>
                <li>"Could you show me a different example?"</li>
                <li>"I still don't understand the third step..."</li>
                <li>"Can you break that down further?"</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Study Strategies */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#C5050C] mb-8" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Study Strategies That Work
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C5050C] text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-bold mb-1">Active Learning Over Passive Reading</h4>
                <p className="text-gray-700">Ask questions, solve problems, and discuss concepts rather than just reading explanations.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C5050C] text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-bold mb-1">Practice Retrieval</h4>
                <p className="text-gray-700">Test yourself by explaining concepts in your own words or solving problems without looking at solutions first.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C5050C] text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-bold mb-1">Space Out Your Sessions</h4>
                <p className="text-gray-700">Multiple shorter sessions over several days are more effective than one long cramming session.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C5050C] text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-bold mb-1">Connect New Information to What You Know</h4>
                <p className="text-gray-700">Ask your AI tutor to help you relate new concepts to things you've already learned.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C5050C] text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h4 className="font-bold mb-1">Review Before Exams</h4>
                <p className="text-gray-700">Use your AI tutor for comprehensive review sessions, focusing on areas where you feel less confident.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Multilingual Support */}
        <section className="mb-16 bg-gradient-to-r from-[#C5050C] to-[#A00409] text-white p-8 rounded-lg">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Learn in Your Preferred Language
          </h2>
          <p className="text-lg mb-4">
            Our platform supports 25 languages for both voice and text interactions. Whether you're more comfortable learning in Spanish, Mandarin, Arabic, or any other supported language, we've got you covered.
          </p>
          <p className="text-white/90">
            Simply let your AI tutor know which language you prefer, and it will switch seamlessly.
          </p>
        </section>

        {/* Getting Help */}
        <section>
          <h2 className="text-3xl font-bold text-[#C5050C] mb-8" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Need Additional Help?
          </h2>
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-700 text-lg mb-6">
              Have questions about using the platform or experiencing technical issues?
            </p>
            <button
              onClick={() => setLocation("/support")}
              className="bg-[#C5050C] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#A00409] transition-colors"
            >
              Contact Live Support
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

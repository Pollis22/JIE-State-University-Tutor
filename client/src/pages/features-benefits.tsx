import { Link, useLocation } from "wouter";
import { 
  BookOpen, 
  Globe, 
  Clock, 
  Upload, 
  Camera, 
  MessageSquare, 
  TrendingUp,
  Award,
  Zap,
  Users
} from "lucide-react";
import { NavigationHeader } from "@/components/navigation-header";

export default function FeaturesAndBenefits() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      {/* Global Navigation */}
      <NavigationHeader />

      {/* Hero Section with Campus Hall */}
      <div className="relative h-[500px] overflow-hidden">
        <img 
          src="/bascom-hall.png" 
          alt="State University campus" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#C5050C]/80 via-[#C5050C]/60 to-[#C5050C]/90 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
              Your 24/7 AI Study Partner
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Master any subject, anytime, anywhere — in 25 languages
            </p>
            <button
              onClick={() => setLocation("/auth")}
              className="bg-white text-[#C5050C] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        
        {/* Key Benefits Grid */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-[#C5050C] text-center mb-12" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Why Students Choose Our Platform
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#C5050C]">
              <Clock className="w-12 h-12 text-[#C5050C] mb-4" />
              <h3 className="text-xl font-bold mb-2">Available 24/7</h3>
              <p className="text-gray-700">
                No more scheduling conflicts or waiting for office hours. Get help whenever you need it, day or night.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#C5050C]">
              <Globe className="w-12 h-12 text-[#C5050C] mb-4" />
              <h3 className="text-xl font-bold mb-2">25 Languages</h3>
              <p className="text-gray-700">
                Study in your preferred language with full support for voice and text in 25 languages worldwide.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#C5050C]">
              <Zap className="w-12 h-12 text-[#C5050C] mb-4" />
              <h3 className="text-xl font-bold mb-2">Instant Responses</h3>
              <p className="text-gray-700">
                No waiting in queues. Get immediate, personalized help that adapts to your learning style.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#C5050C]">
              <Users className="w-12 h-12 text-[#C5050C] mb-4" />
              <h3 className="text-xl font-bold mb-2">Travels With You</h3>
              <p className="text-gray-700">
                Study from your dorm, library, home, or on the go. Access from any device with an internet connection.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#C5050C]">
              <TrendingUp className="w-12 h-12 text-[#C5050C] mb-4" />
              <h3 className="text-xl font-bold mb-2">Unlimited Sessions</h3>
              <p className="text-gray-700">
                No hourly limits or session caps. Study for as long as you need to truly master the material.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#C5050C]">
              <Award className="w-12 h-12 text-[#C5050C] mb-4" />
              <h3 className="text-xl font-bold mb-2">All Subjects</h3>
              <p className="text-gray-700">
                From freshman courses to post-grad prep (GRE, LSAT, MCAT), we've got you covered across every discipline.
              </p>
            </div>
          </div>
        </div>

        {/* Powerful Features Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-[#C5050C] text-center mb-12" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Powerful Features That Work the Way You Learn
          </h2>

          <div className="space-y-12">
            {/* Voice-First Learning */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/3 flex justify-center">
                <MessageSquare className="w-32 h-32 text-[#C5050C]" />
              </div>
              <div className="md:w-2/3">
                <h3 className="text-2xl font-bold mb-4">Voice-First Learning</h3>
                <p className="text-gray-700 text-lg mb-4">
                  Have natural conversations with your AI tutor just like you would with a human instructor. Perfect for auditory learners and those who think better when talking through problems.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Natural voice conversations in real-time</li>
                  <li>Switch seamlessly between voice and text</li>
                  <li>Practice pronunciation for foreign languages</li>
                  <li>Study hands-free while reviewing notes</li>
                </ul>
              </div>
            </div>

            {/* Document Upload */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="md:w-1/3 flex justify-center">
                <Upload className="w-32 h-32 text-[#C5050C]" />
              </div>
              <div className="md:w-2/3">
                <h3 className="text-2xl font-bold mb-4">Upload Any Document</h3>
                <p className="text-gray-700 text-lg mb-4">
                  Share your homework, study guides, lecture notes, or textbook pages directly with your AI tutor for personalized help.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Support for PDFs, Word docs, images, and more</li>
                  <li>Get step-by-step explanations of homework problems</li>
                  <li>Review and clarify lecture notes</li>
                  <li>Practice with past exams and problem sets</li>
                </ul>
              </div>
            </div>

            {/* Photo Recognition */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/3 flex justify-center">
                <Camera className="w-32 h-32 text-[#C5050C]" />
              </div>
              <div className="md:w-2/3">
                <h3 className="text-2xl font-bold mb-4">Snap & Solve</h3>
                <p className="text-gray-700 text-lg mb-4">
                  Take a photo of any problem, equation, diagram, or text and get instant help understanding it.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Instant problem recognition from photos</li>
                  <li>Works with handwritten or printed materials</li>
                  <li>Perfect for quick questions in the library or study group</li>
                  <li>Analyze graphs, charts, and diagrams</li>
                </ul>
              </div>
            </div>

            {/* Post-Grad Prep */}
            <div id="test-prep" className="flex flex-col md:flex-row-reverse items-center gap-8 scroll-mt-20">
              <div className="md:w-1/3 flex justify-center">
                <BookOpen className="w-32 h-32 text-[#C5050C]" />
              </div>
              <div className="md:w-2/3">
                <h3 className="text-2xl font-bold mb-4">Post-Graduate Test Prep</h3>
                <p className="text-gray-700 text-lg mb-4">
                  Preparing for your next step? We provide comprehensive support for all major graduate admissions tests.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>LSAT:</strong> Logical reasoning, analytical reasoning, reading comprehension</li>
                  <li><strong>GRE:</strong> Quantitative, verbal, and analytical writing sections</li>
                  <li><strong>MCAT:</strong> Biology, chemistry, physics, and critical analysis</li>
                  <li><strong>GMAT:</strong> Quantitative, verbal, integrated reasoning</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile & Desktop */}
        <div className="bg-gray-50 rounded-lg p-8 mb-20">
          <h2 className="text-3xl font-bold text-[#C5050C] text-center mb-6" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
            Study On Any Device
          </h2>
          <p className="text-gray-700 text-lg text-center mb-6">
            Access your AI tutor from your laptop, desktop, or mobile browser. A dedicated mobile app is coming soon!
          </p>
          <p className="text-gray-600 text-center">
            For the best experience, we recommend using a laptop or desktop with a quality microphone and quiet environment for voice sessions.
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Learning?</h2>
          <button
            onClick={() => setLocation("/auth")}
            className="bg-[#C5050C] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#A00409] transition-colors"
          >
            Start Learning Now
          </button>
          <p className="text-gray-600 mt-4">
            Questions? <button onClick={() => setLocation("/contact")} className="text-[#C5050C] hover:underline">Contact Us</button>
          </p>
        </div>
      </div>
    </div>
  );
}

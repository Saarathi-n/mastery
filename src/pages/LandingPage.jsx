import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Target, CheckCircle2, Sparkles, Zap, Brain, TrendingUp } from "lucide-react";
import React, { useEffect } from "react";

export default function LandingPage() {
  const navigate = useNavigate();

  // useEffect(() => {
  //   try {
  //     const user = localStorage.getItem("user");
  //     if (user && JSON.parse(user)) {
  //       navigate("/dashboard");
  //     }
  //   } catch (e) {
  //     localStorage.removeItem("user");
  //   }
  // }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-7xl mx-auto px-6">
        <header className="pt-8 pb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-white/20 backdrop-blur-xl p-3 rounded-2xl shadow-2xl group-hover:shadow-3xl transition-all duration-500">
              <BookOpen className="w-9 h-9 text-white" />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">Mastery</span>
          </Link>
          <div className="flex items-center gap-5">
          <button 
            onClick={() => { 
              localStorage.removeItem("user"); 
              localStorage.removeItem("token"); 
              window.location.reload();
            }} 
            className="px-6 py-3 rounded-2xl text-white/80 hover:text-white font-semibold hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
          >
            Clear Data
          </button>
          <Link 
            to="/login" 
            className="px-7 py-3 rounded-2xl text-white/90 hover:text-white font-semibold hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
          >
            Log in
          </Link>
          <Link 
            to="/register" 
            className="bg-gradient-to-r from-white to-gray-100 text-indigo-600 px-8 py-3 rounded-2xl font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300"
          >
            Get Started
          </Link>
        </div>
        </header>

        <main className="py-16 md:py-24">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl px-6 py-3 rounded-full mb-8">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-white font-semibold text-sm">AI-Powered Learning</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-tight mb-8 drop-shadow-2xl">
              Conquer JEE and NEET.
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                Without the guesswork.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 font-light leading-relaxed drop-shadow-lg">
              Diagnostic testing, AI-powered NCERT analysis, and targeted mock tests to elevate your competitive prep.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-3xl text-xl font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 flex items-center gap-3"
              >
                Start Your Journey <Zap className="w-6 h-6" />
              </Link>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg" />
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 shadow-lg -ml-5" />
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 shadow-lg -ml-5" />
                <span className="ml-3 font-semibold">10,000+ learners</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <Card 
              title="JEE Mastery" 
              desc="Master Physics, Chemistry, and Mathematics with advanced problem-solving."
              icon={<Target className="w-10 h-10 text-blue-500" />}
              gradient="from-blue-500 to-cyan-500"
            />
            <Card 
              title="NEET Mastery" 
              desc="Deep dive into Biology, Physics, and Chemistry structured perfectly for NEET."
              icon={<CheckCircle2 className="w-10 h-10 text-green-500" />}
              gradient="from-green-500 to-emerald-500"
            />
            <Card 
              title="Combo Mastery" 
              desc="Prepare for both exams comprehensively with dual-tracked assessments."
              icon={<BookOpen className="w-10 h-10 text-purple-500" />}
              gradient="from-purple-500 to-pink-500"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature 
              icon={<Brain className="w-8 h-8" />} 
              title="AI Analysis"
              desc="Smart insights into your performance"
              color="from-purple-500 to-indigo-500"
            />
            <Feature 
              icon={<TrendingUp className="w-8 h-8" />} 
              title="Progress Tracking"
              desc="Monitor your growth in real-time"
              color="from-blue-500 to-cyan-500"
            />
            <Feature 
              icon={<Target className="w-8 h-8" />} 
              title="Mock Tests"
              desc="Real exam-like practice sessions"
              color="from-pink-500 to-rose-500"
            />
            <Feature 
              icon={<Zap className="w-8 h-8" />} 
              title="Instant Feedback"
              desc="Get results and explanations immediately"
              color="from-orange-500 to-yellow-500"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function Card({ title, desc, icon, gradient }) {
  return (
    <div className="glass-card rounded-3xl p-10 hover:scale-105 transition-all duration-500 group">
      <div className={`mb-6 bg-gradient-to-br ${gradient} p-5 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500`}>
        {React.cloneElement(icon, { className: "w-12 h-12 text-white" })}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 text-lg leading-relaxed">{desc}</p>
    </div>
  );
}

function Feature({ icon, title, desc, color }) {
  return (
    <div className="glass-card rounded-2xl p-7 hover:scale-105 transition-all duration-300">
      <div className={`mb-5 bg-gradient-to-br ${color} p-4 rounded-2xl shadow-lg`}>
        {React.cloneElement(icon, { className: "w-8 h-8 text-white" })}
      </div>
      <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  );
}

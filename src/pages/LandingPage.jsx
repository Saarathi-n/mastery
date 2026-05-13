import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Target, CheckCircle2 } from "lucide-react";
import React, { useEffect } from "react";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      if (user && JSON.parse(user)) {
        navigate("/dashboard");
      }
    } catch (e) {
      localStorage.removeItem("user");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600">
          <BookOpen className="w-8 h-8" />
          <span className="text-2xl font-bold tracking-tight">Mastery</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Log in</Link>
          <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition">Get Started</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 tracking-tight leading-tight mb-6">
          Conquer JEE and NEET. <br/>
          <span className="text-blue-600">Without the guesswork.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mb-12 font-light">
          Diagnostic testing, AI-powered NCERT analysis, and targeted mock tests to elevate your competitive prep.
        </p>

        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl mb-16">
          <Card 
            title="JEE Mastery" 
            desc="Master Physics, Chemistry, and Mathematics with advanced problem-solving."
            icon={<Target className="w-8 h-8 text-blue-500" />}
          />
          <Card 
            title="NEET Mastery" 
            desc="Deep dive into Biology, Physics, and Chemistry structured perfectly for NEET."
            icon={<CheckCircle2 className="w-8 h-8 text-green-500" />}
          />
          <Card 
            title="Combo Mastery" 
            desc="Prepare for both exams comprehensively with dual-tracked assessments."
            icon={<BookOpen className="w-8 h-8 text-purple-500" />}
          />
        </div>

        <Link to="/register" className="bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-black transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
          Start Your Journey
        </Link>
      </main>
    </div>
  );
}

function Card({ title, desc, icon }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition">
      <div className="mb-4 bg-white p-4 rounded-full shadow-sm">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-500">{desc}</p>
    </div>
  );
}

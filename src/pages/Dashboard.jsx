import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, FlaskConical, Calculator, Activity, TrendingUp, Award, Calendar } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overallPercentage: 0,
    streak: 0,
    subjects: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = localStorage.getItem("user");
        if (!u) {
          navigate("/");
          return;
        }
        const parsedUser = JSON.parse(u);
        if (!parsedUser || !parsedUser.name) {
          throw new Error("Invalid user");
        }
        setUser(parsedUser);

        const token = localStorage.getItem("token");
        const res = await fetch("/api/mocktests/summary", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Error fetching dashboard data:", e);
        // Don't logout immediately on stats error, just log it
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-6"></div>
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getSubjects = () => {
    if (user.stream === "JEE") return ["Physics", "Chemistry", "Mathematics"];
    if (user.stream === "NEET") return ["Physics", "Chemistry", "Biology"];
    return ["Physics", "Chemistry", "Mathematics", "Biology"];
  };

  const subjects = getSubjects();

  const getIcon = (subject) => {
    switch (subject) {
      case "Physics": return <Activity className="w-10 h-10" />;
      case "Chemistry": return <FlaskConical className="w-10 h-10" />;
      case "Mathematics": return <Calculator className="w-10 h-10" />;
      case "Biology": return <BookOpen className="w-10 h-10" />;
      default: return <BookOpen className="w-10 h-10" />;
    }
  };

  const getTheme = (subject) => {
    switch (subject) {
      case "Physics": 
        return { 
          bgClass: "bg-gradient-to-br from-blue-900/80 to-blue-950/80", 
          hoverBgClass: "hover:from-blue-800/80 hover:to-blue-900/80",
          borderHover: "hover:border-blue-400/50", 
          progressBg: "from-blue-500 to-cyan-400",
          shadow: "shadow-[0_0_15px_rgba(59,130,246,0.4)]"
        };
      case "Chemistry": 
        return { 
          bgClass: "bg-gradient-to-br from-red-900/80 to-red-950/80", 
          hoverBgClass: "hover:from-red-800/80 hover:to-red-900/80",
          borderHover: "hover:border-red-400/50", 
          progressBg: "from-red-500 to-orange-400",
          shadow: "shadow-[0_0_15px_rgba(239,68,68,0.4)]"
        };
      case "Mathematics": 
        return { 
          bgClass: "bg-gradient-to-br from-yellow-900/80 to-yellow-950/80", 
          hoverBgClass: "hover:from-yellow-800/80 hover:to-yellow-900/80",
          borderHover: "hover:border-yellow-400/50", 
          progressBg: "from-yellow-500 to-amber-400",
          shadow: "shadow-[0_0_15px_rgba(234,179,8,0.4)]"
        };
      case "Biology": 
        return { 
          bgClass: "bg-gradient-to-br from-green-900/80 to-green-950/80", 
          hoverBgClass: "hover:from-green-800/80 hover:to-green-900/80",
          borderHover: "hover:border-green-400/50", 
          progressBg: "from-green-500 to-emerald-400",
          shadow: "shadow-[0_0_15px_rgba(34,197,94,0.4)]"
        };
      default: 
        return { 
          bgClass: "bg-gradient-to-br from-indigo-900/80 to-indigo-950/80", 
          hoverBgClass: "hover:from-indigo-800/80 hover:to-indigo-900/80",
          borderHover: "hover:border-indigo-400/50", 
          progressBg: "from-indigo-500 to-purple-400",
          shadow: "shadow-[0_0_15px_rgba(99,102,241,0.4)]"
        };
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 md:px-6 md:py-10">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between border border-indigo-500/30 bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-900/90 backdrop-blur-xl shadow-2xl rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-fuchsia-500/30 rounded-full blur-3xl"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
                <Award className="w-7 h-7 text-indigo-400" />
              </div>
              <span className="text-indigo-400 font-bold text-sm tracking-widest uppercase">Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xl text-indigo-200">
              Target: <span className="font-bold text-white">{user.stream}</span> • 
              Level: <span className="font-bold bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">{user.currentLevel || "11th"} Syllabus</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-gradient-to-br from-red-900/80 to-red-950/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-[0_8px_30px_rgba(239,68,68,0.15)] border-l-4 border-l-red-500 relative overflow-hidden group hover:from-red-800/80 hover:to-red-900/80 transition-all duration-300">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-red-500/20 rounded-full blur-2xl group-hover:bg-red-400/30 transition-all"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="bg-red-500/30 p-4 rounded-2xl border border-red-500/40">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-red-200 font-semibold text-sm tracking-wide uppercase">Progress</p>
              <p className="text-3xl font-extrabold text-white">{stats.overallPercentage}%</p>
            </div>
          </div>
          <div className="w-full bg-red-950/50 rounded-full h-2 relative z-10 border border-red-900/50">
            <div className="bg-gradient-to-r from-red-500 to-orange-400 h-2 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)]" style={{ width: `${stats.overallPercentage}%` }} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-900/80 to-violet-950/80 backdrop-blur-md rounded-2xl p-8 border border-violet-500/20 shadow-[0_8px_30px_rgba(139,92,246,0.15)] border-l-4 border-l-violet-500 relative overflow-hidden group hover:from-violet-800/80 hover:to-violet-900/80 transition-all duration-300">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl group-hover:bg-violet-400/30 transition-all"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="bg-violet-500/30 p-4 rounded-2xl border border-violet-500/40">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-violet-200 font-semibold text-sm tracking-wide uppercase">Streak</p>
              <p className="text-3xl font-extrabold text-white">{stats.streak} days</p>
            </div>
          </div>
          <p className="text-sm text-violet-300 font-medium relative z-10">Keep it up!</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-7 flex items-center gap-3">
          Your Subjects
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
          {subjects.map((subject) => {
            const theme = getTheme(subject);
            return (
              <Link
                key={subject}
                to={`/subject/${subject}`}
                className={`group flex flex-col justify-between ${theme.bgClass} backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl ${theme.hoverBgClass} ${theme.borderHover} hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-transform duration-500 transform group-hover:scale-125 group-hover:-rotate-12 group-hover:-translate-y-2 text-white">
                  {getIcon(subject)}
                </div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-inner group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 text-white">
                    {getIcon(subject)}
                  </div>
                  <h3 className={`text-2xl font-extrabold text-white mb-2 transition-colors`}>{subject}</h3>
                  <p className={`text-white/70 text-sm font-medium mb-6 leading-relaxed`}>Master chapters, read NCERT & practice PYQs</p>
                </div>
              <div className="w-full bg-black/30 rounded-full h-2.5 mb-3 relative z-10 border border-white/5">
                <div 
                  className={`bg-gradient-to-r ${theme.progressBg} h-2.5 rounded-full ${theme.shadow}`} 
                  style={{ width: `${stats.subjects[subject]?.percentage || 0}%` }}
                />
              </div>
              <p className={`text-xs font-bold text-white/80 relative z-10`}>
                {stats.subjects[subject]?.completed || 0}/{stats.subjects[subject]?.total || 0} Chapters Completed
              </p>
            </Link>
          )})}
        </div>
      </div>
    </div>
  );
}

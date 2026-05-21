import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, FlaskConical, Calculator, Activity, TrendingUp, Award, Calendar } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    } catch (e) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/");
    } finally {
      setLoading(false);
    }
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

  const getGradient = (subject) => {
    switch (subject) {
      case "Physics": return "from-blue-500 to-cyan-500";
      case "Chemistry": return "from-purple-500 to-pink-500";
      case "Mathematics": return "from-orange-500 to-yellow-500";
      case "Biology": return "from-green-500 to-emerald-500";
      default: return "from-indigo-500 to-purple-500";
    }
  };

  return (
    <div>
      <div className="mb-12 pb-8 border-b-2 border-gray-100">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-3 rounded-2xl">
                <Award className="w-7 h-7 text-indigo-600" />
              </div>
              <span className="text-indigo-600 font-bold text-sm">Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xl text-gray-600">
              Target: <span className="font-bold text-gray-900">{user.stream}</span> • 
              Level: <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{user.currentLevel || "11th"} Syllabus</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-card rounded-2xl p-8 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-4 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <p className="text-gray-600 font-semibold text-sm">Progress</p>
              <p className="text-3xl font-extrabold text-gray-900">78%</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{ width: "78%" }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 border-l-4 border-l-green-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-2xl">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 font-semibold text-sm">Streak</p>
              <p className="text-3xl font-extrabold text-gray-900">5 days</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Keep it up!</p>
        </div>

        <div className="glass-card rounded-2xl p-8 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-orange-100 to-yellow-100 p-4 rounded-2xl">
              <Award className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600 font-semibold text-sm">Badges</p>
              <p className="text-3xl font-extrabold text-gray-900">3</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Excellent work!</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-7 flex items-center gap-3">
          Your Subjects
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
          {subjects.map((subject) => (
            <Link 
              key={subject} 
              to={`/subject/${subject}`}
              className="group glass-card rounded-3xl p-8 hover:scale-105 transition-all duration-500 block relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-500 transform group-hover:scale-110">
                {getIcon(subject)}
              </div>
              <div className={`w-20 h-20 bg-gradient-to-br ${getGradient(subject)} rounded-2xl flex items-center justify-center mb-7 shadow-xl group-hover:shadow-2xl transition-all duration-500`}>
                {React.cloneElement(getIcon(subject), { className: "w-10 h-10 text-white" })}
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-2">{subject}</h3>
              <p className="text-gray-600 text-base mb-6">Master chapters, read NCERT & practice PYQs</p>
              
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                <div 
                  className={`bg-gradient-to-r ${getGradient(subject)} h-2.5 rounded-full`} 
                  style={{ width: `${Math.random() * 60 + 10}%` }}
                />
              </div>
              <p className="text-xs font-bold text-gray-500">Continue learning</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, FlaskConical, Calculator, Activity } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(JSON.parse(u));
    } catch (e) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  if (!user) return null;

  const getSubjects = () => {
    if (user.stream === "JEE") return ["Physics", "Chemistry", "Mathematics"];
    if (user.stream === "NEET") return ["Physics", "Chemistry", "Biology"];
    return ["Physics", "Chemistry", "Mathematics", "Biology"];
  };

  const subjects = getSubjects();

  const getIcon = (subject) => {
    switch (subject) {
      case "Physics": return <Activity className="w-8 h-8 text-blue-500" />;
      case "Chemistry": return <FlaskConical className="w-8 h-8 text-purple-500" />;
      case "Mathematics": return <Calculator className="w-8 h-8 text-orange-500" />;
      case "Biology": return <BookOpen className="w-8 h-8 text-green-500" />;
      default: return <BookOpen className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Welcome back, {user.name}</h1>
          <p className="text-gray-500">
            Target: <span className="font-semibold text-gray-900">{user.stream}</span> &bull; 
            Level: <span className="font-semibold text-blue-600">{user.currentLevel} Syllabus</span>
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          Your Subjects
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(subject => (
            <Link 
              key={subject} 
              to={`/subject/${subject}`}
              className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all block relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110">
                {getIcon(subject)}
              </div>
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border border-gray-100">
                {getIcon(subject)}
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-1">{subject}</h3>
              <p className="text-gray-500 text-sm mb-4">Master chapters, read NCERT & practice PYQs</p>
              
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: Math.random() * 60 + 10 + '%' }}></div>
              </div>
              <p className="text-xs font-medium text-gray-400">Continue learning</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

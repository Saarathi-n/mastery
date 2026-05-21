import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [grade, setGrade] = useState("");
  const [stream, setStream] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async () => {
    if (!grade || !stream) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/user/${user.id}/grade-stream`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ grade, stream, currentLevel: grade })
      });
      if (!res.ok) throw new Error("Failed to update profile");
      
      const updatedUser = { ...user, grade, stream, currentLevel: grade };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (grade === "12th" || grade === "Dropper") {
        navigate("/diagnostic-test");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-3 rounded-full mb-6">
          <GraduationCap className="w-6 h-6 text-indigo-600" />
          <span className="text-indigo-800 font-bold text-sm">Get Started</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          Welcome, {user.name}!
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Let's customize your path to mastery
        </p>
      </div>

      <div className="space-y-10">
        <div className="space-y-5">
          <label className="block text-xl font-bold text-gray-800">
            What is your current grade?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {["11th", "12th", "Dropper"].map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`p-6 rounded-2xl border-3 transition-all duration-300 font-bold text-lg ${
                  grade === g
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-transparent shadow-xl hover:shadow-2xl scale-105"
                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:shadow-lg hover:scale-102"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <label className="block text-xl font-bold text-gray-800">
            Which exam are you targeting?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {["JEE", "NEET", "Both"].map((s) => (
              <button
                key={s}
                onClick={() => setStream(s)}
                className={`p-6 rounded-2xl border-3 transition-all duration-300 font-bold text-lg ${
                  stream === s
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-transparent shadow-xl hover:shadow-2xl scale-105"
                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:shadow-lg hover:scale-102"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={handleSubmit}
          disabled={!grade || !stream || loading}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-5 rounded-3xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? "Saving..." : "Continue"}
          {!loading && <ArrowRight className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
      <p className="text-gray-500 mb-10">Let's customize your path to mastery.</p>

      <div className="space-y-8 text-left">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">What is your current grade?</label>
          <div className="grid grid-cols-3 gap-4">
            {["11th", "12th", "Dropper"].map(g => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`p-4 rounded-xl border text-center font-medium transition ${grade === g ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Which exam are you targeting?</label>
          <div className="grid grid-cols-3 gap-4">
            {["JEE", "NEET", "Both"].map(s => (
              <button
                key={s}
                onClick={() => setStream(s)}
                className={`p-4 rounded-xl border text-center font-medium transition ${stream === s ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <button
          onClick={handleSubmit}
          disabled={!grade || !stream || loading}
          className="w-full sm:w-auto px-10 py-3 rounded-full font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

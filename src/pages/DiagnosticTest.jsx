import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DiagnosticTest() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      navigate("/login");
      return;
    }
    const parsedUser = JSON.parse(u);
    setUser(parsedUser);
    const token = localStorage.getItem("token");

    fetch(`/api/questions?type=diagnostic&exam=${parsedUser.stream === 'Both' ? 'JEE' : parsedUser.stream}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        setLoading(false);
      });
  }, [navigate]);

  const handleSubmit = async () => {
    if (!user) return;
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) score += 10;
    });

    const passed = user.stream === 'NEET' ? score >= 10 : score >= 10; // Mock threshold
    const nextLevel = passed ? "12th" : "11th";

    // Save result
    const token = localStorage.getItem("token");
    await fetch("/api/mocktests/submit", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: user.id,
        type: "diagnostic",
        subject: "General",
        class: "11",
        questions: answers,
        score
      })
    });

    // Update user level
    await fetch(`/api/user/${user.id}/diagnostic`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ passed, nextLevel })
    });

    user.diagnosticTestCleared = true;
    user.currentLevel = nextLevel;
    localStorage.setItem("user", JSON.stringify(user));
    
    alert(`You scored ${score} point(s). You will start from ${nextLevel} syllabus.`);
    navigate("/dashboard");
  };

  if (loading) return <div className="text-center py-20">Loading test...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Diagnostic Mock Test</h2>
      <p className="text-gray-500 mb-8 border-b pb-6">
        Let's assess your foundations to determine the best starting point for you.
      </p>

      {questions.map((q, i) => (
        <div key={q.id} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <p className="font-medium text-gray-900 mb-4">{i + 1}. {q.question}</p>
          <div className="space-y-3">
            {q.options.map((opt) => (
              <label key={opt} className="flex items-center gap-3 bg-white p-3 border rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input
                  type="radio"
                  name={q.id}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {questions.length === 0 && <p className="text-gray-500 italic mb-8">No diagnostic questions available yet. Skipping test.</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition"
        >
          Submit Test
        </button>
      </div>
    </div>
  );
}

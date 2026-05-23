
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, CheckCircle2, AlertTriangle, Clock, Hourglass } from "lucide-react";

export default function DiagnosticTest() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60); // 3 hours in seconds

  // Timer effect
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (!u) {
        navigate("/login");
        return;
      }
      const parsedUser = JSON.parse(u);
      setUser(parsedUser);
      const token = localStorage.getItem("token");
      const exam = parsedUser.stream === 'Both' ? 'JEE' : parsedUser.stream;

      fetch(`/api/questions/diagnostic?type=diagnostic&exam=${exam}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            return fetch(`/api/screentest/questions?exam=${exam}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
          }
          return res.json();
        })
        .then(data => {
          if (data && data.length > 0) {
            setQuestions(data);
          } else {
            return fetch(`/api/screentest/questions?exam=${exam}`, {
              headers: { "Authorization": `Bearer ${token}` }
            }).then(res => res.json());
          }
        })
        .then(data => {
          if (data) setQuestions(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } catch (e) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!user) return;
    let score = 0;
    questions.forEach(q => {
      if (answers[q._id || q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    const isNEET = user.stream === 'NEET';
    const isJEE = user.stream === 'JEE';
    
    let nextLevel = "11th";
    
    if (isNEET) {
      if (score >= 500) { 
        nextLevel = "12th";
      }
    } else if (isJEE) {
      if (score >= 150) {
        nextLevel = "12th";
      }
    } else { // Both
      if (score >= 325) {
        nextLevel = "12th";
      }
    }

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

    await fetch(`/api/user/${user.id}/screening`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ score, stream: user.stream })
    });

    user.diagnosticTestCleared = true;
    user.screeningTestTaken = true;
    user.screeningTestScore = score;
    user.currentLevel = nextLevel;
    localStorage.setItem("user", JSON.stringify(user));
    
    const passed = nextLevel === "12th";
    alert(`You scored ${score} point(s). ${passed ? 'Congratulations, you passed!' : 'You need to strengthen your foundation.'} You will start from ${nextLevel} syllabus.`);
    navigate("/dashboard");
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-6"></div>
      <div className="text-xl font-semibold text-gray-700">Loading Screening Test...</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12 pb-8 border-b-2 border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-3 rounded-full">
            <Brain className="w-6 h-6 text-indigo-600" />
            <span className="text-indigo-800 font-bold text-sm">Screening Test</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-3 rounded-full">
            <Clock className="w-6 h-6 text-amber-700" />
            <span className="text-amber-900 font-bold text-lg">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Let's assess your skills</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          This is a 3-hour screening test to determine your starting syllabus.
          You need <span className="font-bold text-gray-900 bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 rounded-full">
            {user?.stream === 'NEET' ? '500+' : user?.stream === 'JEE' ? '150+' : '325+'}
          </span> to access the 12th syllabus.
        </p>
      </div>

      <div className="space-y-8">
        {questions.map((q, i) => (
          <div key={q._id || q.id} className="glass-card p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-lg shadow-lg">
                {i + 1}
              </span>
              <span className="font-bold text-indigo-600 uppercase tracking-widest text-sm">
                {q.subject} Section
              </span>
            </div>
            
            <p className="font-semibold text-xl text-gray-900 mb-8 leading-relaxed ml-14">
              {q.question}
            </p>
            
            <div className="space-y-4 ml-14">
              {q.options.map((opt) => {
                const isSelected = answers[q._id || q.id] === opt;
                return (
                  <label 
                    key={opt} 
                    className={`flex items-center gap-5 bg-white p-6 rounded-2xl border-3 cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg scale-[1.02]' 
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name={q._id || q.id}
                        value={opt}
                        checked={isSelected}
                        onChange={(e) => setAnswers({ ...answers, [q._id || q.id]: e.target.value })}
                        className="peer sr-only"
                      />
                      <div className={`w-7 h-7 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                        isSelected ? 'border-indigo-500 bg-indigo-600 scale-110' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-3 h-3 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <span className={`font-semibold text-lg ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl border-3 border-dashed border-gray-200 mb-10">
           <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-inner">
             <AlertTriangle className="w-10 h-10 text-gray-500" />
           </div>
           <p className="text-xl font-semibold text-gray-700 mb-2">No screening questions available yet.</p>
           <p className="text-gray-500">You can skip the test for now.</p>
        </div>
      )}

      <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t-2 border-gray-100">
        <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 rounded-2xl border border-gray-200">
          <CheckCircle2 className="w-6 h-6 text-indigo-600" />
          <span className="text-sm font-bold text-gray-700">
            Answered: {Object.keys(answers).length} / {questions.length}
          </span>
        </div>
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300"
        >
          Submit Screening Test
        </button>
      </div>
    </div>
  );
}


import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FileText, Brain, Target, MessageSquare, Send, Clock, AlertTriangle, Copy, Check, Volume2, VolumeX, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function SubjectDetails() {
  const { name } = useParams();
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState({ chapters: [], loading: true, error: "" });
  const [selectedChapter, setSelectedChapter] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [pendingMockChapter, setPendingMockChapter] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      const parsedUser = JSON.parse(u);
      setUser(parsedUser);
      // Enforce Screen Test on subject entry as well
      if (["12th", "Dropper"].includes(parsedUser.grade) && !parsedUser.diagnosticTestCleared) {
        window.location.href = "/diagnostic-test";
      }
    }
  }, []);

  useEffect(() => {
    const subject = name || "";
    const classLevel = user?.currentLevel || "11";
    const token = localStorage.getItem("token");

    if (!subject || !token) return;

    const fetchLibrary = async () => {
      setLibrary((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const params = new URLSearchParams({ subject, class: classLevel });
        const res = await fetch(`/api/library/chapters?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load library");
        setLibrary({ chapters: data.chapters || [], loading: false, error: "" });
      } catch (err) {
        setLibrary({ chapters: [], loading: false, error: err.message || "Failed to load library" });
      }
    };

    fetchLibrary();
  }, [name, user]);

  useEffect(() => {
    if (!selectedChapter) return;
    const exists = library.chapters.some((chapter) => chapter.name === selectedChapter);
    if (!exists) {
      setSelectedChapter("");
      setActiveSection("");
    }
  }, [library, selectedChapter]);

  const chapter = library.chapters.find((item) => item.name === selectedChapter);
  const classLevel = user?.currentLevel || "11";

  const getTheme = (subjectName) => {
    switch (subjectName) {
      case "Physics":
        return {
          bg: "from-blue-200/80 via-blue-100/80 to-cyan-100/80",
          blob1: "bg-blue-400/30",
          blob2: "bg-cyan-400/30",
          blob3: "bg-blue-300/30",
          text: "text-blue-900"
        };
      case "Chemistry":
        return {
          bg: "from-red-200/80 via-red-100/80 to-orange-100/80",
          blob1: "bg-red-400/30",
          blob2: "bg-orange-400/30",
          blob3: "bg-red-300/30",
          text: "text-red-900"
        };
      case "Mathematics":
        return {
          bg: "from-yellow-200/80 via-yellow-100/80 to-amber-100/80",
          blob1: "bg-yellow-400/30",
          blob2: "bg-amber-400/30",
          blob3: "bg-yellow-300/30",
          text: "text-yellow-900"
        };
      case "Biology":
        return {
          bg: "from-green-200/80 via-green-100/80 to-emerald-100/80",
          blob1: "bg-green-400/30",
          blob2: "bg-emerald-400/30",
          blob3: "bg-green-300/30",
          text: "text-green-900"
        };
      default:
        return {
          bg: "from-indigo-200/80 via-purple-100/80 to-pink-100/80",
          blob1: "bg-blue-400/20",
          blob2: "bg-purple-400/20",
          blob3: "bg-pink-400/20",
          text: "text-indigo-900"
        };
    }
  };

  const theme = getTheme(name);

  return (
    <div className={`min-h-[calc(100vh-76px)] bg-gradient-to-br ${theme.bg} flex flex-col overflow-hidden w-full flex-1 relative transition-colors duration-500`}>
      {/* Decorative colorful blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full ${theme.blob1} blur-[100px] transition-colors duration-500`}></div>
        <div className={`absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full ${theme.blob2} blur-[100px] transition-colors duration-500`}></div>
        <div className={`absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] rounded-full ${theme.blob3} blur-[100px] transition-colors duration-500`}></div>
      </div>
      
      {/* Header */}
      <div className="border-b border-white/40 bg-white/30 px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden z-10">
          <div className="relative z-10">
            <h2 className={`text-4xl font-extrabold tracking-tight ${theme.text} mb-2 transition-colors duration-500`}>{name}</h2>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-blue-100/80 px-3 py-1 text-xs font-bold text-blue-800 shadow-sm border border-blue-200">
                Class {classLevel}
              </span>
              <span className="text-sm font-medium text-gray-600">
                Select a chapter to begin learning
              </span>
            </div>
          </div>
      </div>

      <div className="flex-1 p-6 md:p-8 relative z-10">
        {library.loading && (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent text-blue-600"></div>
              <p className="text-sm text-muted-foreground text-gray-500">Loading chapters...</p>
            </div>
          </div>
        )}

        {!library.loading && library.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 w-full text-center text-red-600 shadow-sm">
            {library.error}
          </div>
        )}

        {!library.loading && !library.error && !selectedChapter && (
          <ChapterGrid
            chapters={library.chapters}
            onSelect={(chapterName) => {
              setSelectedChapter(chapterName);
              setActiveSection("");
            }}
          />
        )}

        {!library.loading && !library.error && selectedChapter && !activeSection && (
          <SectionCards
            chapterName={selectedChapter}
            onBack={() => setSelectedChapter("")}
            onSelect={(section) => setActiveSection(section)}
            onStartMockTest={(chapterName) => setPendingMockChapter(chapterName)}
          />
        )}

        {!library.loading && !library.error && selectedChapter && activeSection === "ncert" && (
          <NcertViewer
            subject={name || ""}
            chapter={chapter}
            onBack={() => setActiveSection("")}
          />
        )}

        {!library.loading && !library.error && selectedChapter && activeSection === "pyq" && (
          <PyqQuiz
            subject={name || ""}
            chapterName={selectedChapter}
            classLevel={classLevel}
            onBack={() => setActiveSection("")}
            isMockTest={false}
          />
        )}

        {!library.loading && !library.error && selectedChapter && activeSection === "mocktest" && (
          <PyqQuiz
            subject={name || ""}
            chapterName={selectedChapter}
            classLevel={classLevel}
            onBack={() => setActiveSection("")}
            isMockTest={true}
          />
        )}
      </div>

      {/* Mock Test Start Confirmation Modal */}
      {pendingMockChapter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-5">
              <Brain className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">Start Mock Test?</h3>
            <p className="text-gray-500 text-sm text-center mb-2 font-medium">{pendingMockChapter}</p>
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-6 w-full justify-center">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>You will have <strong>60 minutes</strong> to complete this test. The timer starts immediately.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-500 mb-7 w-full">
              <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>Once started, you cannot pause. Make sure you are ready before beginning.</span>
            </div>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setPendingMockChapter("")}
                className="flex-1 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSelectedChapter(pendingMockChapter);
                  setActiveSection("mocktest");
                  setPendingMockChapter("");
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-colors"
              >
                Start Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterGrid({ chapters, onSelect }) {
  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <span className="text-sm font-medium">No chapters found.</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Available Chapters</h3>
        <span className="text-sm text-gray-500 font-medium">{chapters.length} chapters</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {chapters.map((chapter) => (
          <button
            key={chapter.name}
            onClick={() => onSelect(chapter.name)}
            className="group relative flex flex-col items-start justify-between text-left p-6 rounded-2xl border border-white/60 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md hover:from-white/80 hover:to-white/50 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-full">
              <div className="inline-flex items-center rounded-lg bg-blue-50/80 px-2.5 py-1 text-xs font-bold text-blue-700 mb-4 border border-blue-100/50 group-hover:bg-blue-100 transition-colors">
                Chapter
              </div>
              <h4 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-700 transition-colors">
                {chapter.name}
              </h4>
            </div>
            <div className="mt-5 flex items-center text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
              Explore resources <span className="ml-1">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionCards({ chapterName, onBack, onSelect, onStartMockTest }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <span>←</span> Chapters
            </button>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{chapterName}</h3>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <ResourceCard
          title="NCERT Textbook"
          description="Read official chapter PDFs with AI assistance"
          icon={<FileText className="w-6 h-6" />}
          color="blue"
          onClick={() => onSelect("ncert")}
        />
        <ResourceCard
          title="PYQ Practice"
          description="Solve previous year questions step-by-step"
          icon={<Target className="w-6 h-6" />}
          color="emerald"
          onClick={() => onSelect("pyq")}
        />
        <ResourceCard
          title="Mock Test"
          description="Take a timed exam simulation"
          icon={<Brain className="w-6 h-6" />}
          color="purple"
          onClick={() => onStartMockTest(chapterName)}
        />
      </div>
    </div>
  );
}

function ResourceCard({ title, description, icon, color, onClick }) {
  const colorStyles = {
    blue: "hover:border-blue-400 hover:shadow-blue-500/20 text-blue-700 bg-gradient-to-br from-blue-50 to-white border-blue-200",
    emerald: "hover:border-emerald-400 hover:shadow-emerald-500/20 text-emerald-700 bg-gradient-to-br from-emerald-50 to-white border-emerald-200",
    purple: "hover:border-purple-400 hover:shadow-purple-500/20 text-purple-700 bg-gradient-to-br from-purple-50 to-white border-purple-200"
  };

  const iconBgStyles = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600"
  };

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col justify-between text-left p-6 rounded-3xl border shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden transform hover:-translate-y-1 ${colorStyles[color]}`}
    >
      <div className="relative z-10 w-full">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${iconBgStyles[color]}`}>
          {icon}
        </div>
        <h4 className="text-xl font-extrabold text-gray-900 mb-2">{title}</h4>
        <p className="text-sm font-medium text-gray-600 leading-relaxed">{description}</p>
      </div>
      <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-white/40 blur-2xl group-hover:bg-white/60 transition-colors" />
    </button>
  );
}

function NcertViewer({ subject, chapter, onBack }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [rightWidth, setRightWidth] = useState(320);
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);
  const token = localStorage.getItem("token") || "";

  const files = chapter?.sections?.ncert || [];

  useEffect(() => {
    setSelectedFile(files[0] || null);
  }, [chapter]);

  useEffect(() => {
    let isActive = true;
    const loadPdf = async () => {
      if (!selectedFile?.url) {
        setBlobUrl("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch(selectedFile.url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error("Failed to load PDF");
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
          throw new Error(`Unexpected response: ${contentType || "unknown"}`);
        }
        const blob = await res.blob();
        if (!blob.size) {
          throw new Error("Empty PDF response");
        }
        const url = URL.createObjectURL(blob);
        if (!isActive) return;
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        if (!isActive) return;
        setError(err.message || "Failed to load PDF");
        setBlobUrl("");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      isActive = false;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    };
  }, [selectedFile, token]);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const handleDrag = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startRight = rightWidth;
    const container = containerRef.current;
    const containerWidth = container?.getBoundingClientRect().width || 0;

    const onMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const next = clamp(startRight - delta, 260, containerWidth - 360);
      setRightWidth(next);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <span>←</span> Resources
            </button>
          </div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {chapter?.name}
          </h3>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="bg-gray-50 rounded-xl h-full min-h-[520px] flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-400">
          <div className="flex flex-col items-center">
            <FileText className="w-10 h-10 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No NCERT PDF found for {subject}</p>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex flex-col lg:flex-row border border-gray-200 rounded-xl overflow-hidden w-full h-[75vh] min-h-[640px] bg-white shadow-sm"
        >
          <div className="flex-1 bg-gray-50/50 w-full flex flex-col">
            <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-x-auto">
                {files.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedFile?.name === file.name
                        ? "bg-blue-100 text-blue-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-sm text-gray-500 font-medium">Loading PDF...</p>
                  </div>
                </div>
              )}
              {!loading && error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-lg shadow-sm flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              {!loading && !error && blobUrl && (
                <object
                  data={blobUrl}
                  type="application/pdf"
                  className="absolute inset-0 w-full h-full"
                >
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm bg-gray-50">
                    PDF preview is not supported here. Try downloading it or use another browser.
                  </div>
                </object>
              )}
            </div>
          </div>

          <div
            onMouseDown={handleDrag}
            className="hidden lg:flex w-2 cursor-col-resize items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors border-x border-gray-200 z-10"
          >
            <div className="h-8 w-0.5 bg-gray-400 rounded-full" />
          </div>

          <div style={{ width: rightWidth }} className="w-full lg:w-auto h-full hidden lg:block">
            <AIAssistant
              context={`I am reading the NCERT chapter ${chapter?.name} for ${subject}.`}
              containerClass="h-full border-0 rounded-none w-full"
              bodyClass="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PyqQuiz({ subject, chapterName, classLevel, onBack, isMockTest = false }) {
  const [questions, setQuestions] = useState([]);
  const [resourceFiles, setResourceFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Timer state
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [perQuestionSeconds, setPerQuestionSeconds] = useState([]);
  const [mockTestSeconds, setMockTestSeconds] = useState(3600); // 1 hour for mocktest
  
  const [rightWidth, setRightWidth] = useState(320);
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const mockTimerRef = useRef(null);

  const shuffleArray = (items) => {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const fetchQuestions = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ subject, class: classLevel, chapter: chapterName });
        const endpoint = isMockTest ? "/api/library/mocktest" : "/api/library/pyq";
        const res = await fetch(`${endpoint}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load questions" );
        
        setResourceFiles(data.files || []);
        let fetchedQuestions = data.questions || [];
        if (!isMockTest) {
          fetchedQuestions = shuffleArray(fetchedQuestions);
        }
        
        setQuestions(fetchedQuestions);
        setPerQuestionSeconds(new Array(fetchedQuestions.length).fill(0));
        setActiveIndex(fetchedQuestions.length ? 0 : null);
      } catch (err) {
        setError(err.message || "Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [subject, chapterName, isMockTest]);

  useEffect(() => {
    if (loading || showResults) return;
    
    // Per question timer (for PYQ) and overall timer logging
    timerRef.current = window.setInterval(() => {
      setTotalSeconds((prev) => prev + 1);
      setPerQuestionSeconds((prev) => {
        if (activeIndex === null) return prev;
        if (answers[activeIndex]) return prev;
        const next = [...prev];
        next[activeIndex] = (next[activeIndex] || 0) + 1;
        return next;
      });
    }, 1000);

    // Mock test overall countdown timer
    if (isMockTest) {
      mockTimerRef.current = window.setInterval(() => {
        setMockTestSeconds((prev) => {
          if (prev <= 1) {
             setShowResults(true); // Auto submit!
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mockTimerRef.current) window.clearInterval(mockTimerRef.current);
    };
  }, [activeIndex, answers, loading, showResults, isMockTest]);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const handleDrag = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startRight = rightWidth;
    const container = containerRef.current;
    const containerWidth = container?.getBoundingClientRect().width || 0;

    const onMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const next = clamp(startRight - delta, 260, containerWidth - 360);
      setRightWidth(next);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const getOptionKey = (option) => {
    if (!option) return "";
    const match = String(option).match(/^\(([a-dA-D])\)/);
    return match ? match[1].toLowerCase() : String(option);
  };

  const getAnswerKey = (answerText) => {
    if (!answerText) return "";
    const match = String(answerText).match(/^\(([a-dA-D])\)/);
    return match ? match[1].toLowerCase() : String(answerText);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return Number(hrs) > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
  };

  const score = questions.reduce((sum, q, idx) => {
    const selected = answers[idx];
    if (!selected) return sum;
    return getAnswerKey(q.answer) === getOptionKey(selected) ? sum + 1 : sum;
  }, 0);

  useEffect(() => {
    if (showResults && isMockTest && questions.length > 0) {
      const submitTest = async () => {
        try {
          const token = localStorage.getItem("token");
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          
          await fetch("/api/mocktests/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: user.id,
              type: "mocktest",
              subject,
              chapter: chapterName,
              class: classLevel,
              score
            })
          });
        } catch (err) {
          console.error("Failed to submit test:", err);
        }
      };
      submitTest();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults]); // Run strictly once when showResults turns true

  const buildAssetUrl = (filePath) => {
    const params = new URLSearchParams({
      subject,
      class: classLevel,
      chapter: chapterName,
      section: isMockTest ? "mocktest" : "pyq practice",
      file: filePath
    });
    return `/api/library/asset?${params.toString()}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <span>←</span> Resources
            </button>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {isMockTest ? <Brain className="w-6 h-6 text-purple-600" /> : <Target className="w-6 h-6 text-emerald-600" />}
            {chapterName}
            <span className="ml-2 inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              {isMockTest ? "Mock Test" : "PYQ Practice"}
            </span>
          </h3>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isMockTest ? 'text-red-500' : 'text-blue-500'}`} />
            <span className={`text-sm font-semibold tracking-wide ${isMockTest ? 'text-red-600' : 'text-gray-900'}`}>
              {formatTime(isMockTest ? mockTestSeconds : totalSeconds)}
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-gray-500 font-medium">Loading questions...</p>
          </div>
        </div>
      )}
      {!loading && error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div ref={containerRef} className="flex flex-col lg:flex-row border border-gray-200 rounded-xl overflow-hidden w-full bg-white shadow-sm flex-1">
          <div className="flex-1 bg-white p-6 md:p-8 space-y-6 flex flex-col relative">
            {questions.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex-1">
                  <Target className="w-12 h-12 text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-1">No questions found</h4>
                  <p className="text-sm text-gray-500 mb-6">There are no practice questions available for this chapter yet.</p>
                  
                  {resourceFiles.length > 0 && (
                    <div className="w-full max-w-md text-left bg-white p-4 rounded-lg border border-gray-200 shadow-sm mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Available reference files
                      </p>
                      <div className="space-y-2">
                        {resourceFiles.map((file) => (
                          <a
                            key={file.url}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <span className="truncate">{file.name}</span>
                            <span>→</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            )}
            {questions.length > 0 && activeIndex !== null && (
              <div className="flex-1">
                <div className="mb-4 flex items-center justify-between h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((activeIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
                
                <div className="border border-gray-200 rounded-xl p-6 md:p-8 bg-gray-50/50 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <h4 className="text-lg md:text-xl font-medium text-gray-900 leading-relaxed whitespace-pre-wrap flex-1">
                      <span className="text-blue-600 font-bold mr-2 text-base md:text-lg">Q{activeIndex + 1}.</span>
                      {questions[activeIndex].question || questions[activeIndex].text}
                    </h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 mt-6">
                    {questions[activeIndex].options.map((opt) => {
                      const selected = answers[activeIndex] === opt;
                      const isCorrect =
                        getAnswerKey(questions[activeIndex].answer) === getOptionKey(opt);
                      const showState = showResults;
                      
                      let optionClasses = "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-700";
                      
                      if (selected && !showState) {
                        optionClasses = "border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500";
                      } else if (showState) {
                        if (isCorrect) {
                          optionClasses = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500";
                        } else if (selected && !isCorrect) {
                          optionClasses = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                        } else {
                          optionClasses = "border-gray-200 bg-white text-gray-500 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() => !showResults && setAnswers((prev) => ({ ...prev, [activeIndex]: opt }))}
                          disabled={showResults}
                          className={`text-left px-5 py-4 rounded-xl border text-sm transition-all duration-200 font-medium ${optionClasses}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {questions[activeIndex].images?.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {questions[activeIndex].images.map((img) => (
                        <div key={img} className="rounded-xl overflow-hidden border border-gray-200 bg-white p-2">
                          <img
                            src={buildAssetUrl(img)}
                            alt="Question figure"
                            className="max-w-full mx-auto"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {questions[activeIndex].tables?.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {questions[activeIndex].tables.map((table, tableIndex) => (
                        <div key={`table-${tableIndex}`} className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                          <table className="min-w-full text-sm">
                            <tbody>
                              {table.map((row, rowIndex) => (
                                <tr key={`row-${rowIndex}`} className={rowIndex === 0 ? "bg-gray-100 font-semibold" : "border-t border-gray-100"}>
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={`cell-${rowIndex}-${cellIndex}`}
                                      className="px-4 py-3 text-gray-700"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                  {(showResults && questions[activeIndex].solution || showResults && questions[activeIndex].explanation) && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
                      <div className="font-semibold text-blue-800 mb-1 flex items-center gap-1">
                        <FileText className="w-4 h-4" /> Solution Explanation
                      </div>
                      <div className="leading-relaxed">
                        {questions[activeIndex].solution || questions[activeIndex].explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {questions.length > 0 && activeIndex !== null && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-6">
                <button
                  onClick={() => setActiveIndex((prev) => Math.max(0, (prev ?? 0) - 1))}
                  disabled={activeIndex === 0}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 font-medium text-sm text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  ← Previous
                </button>
                <div className="text-sm font-medium text-gray-500">
                  {activeIndex + 1} / {questions.length}
                </div>
                <button
                  onClick={() => setActiveIndex((prev) => Math.min(questions.length - 1, (prev ?? 0) + 1))}
                  disabled={activeIndex === questions.length - 1}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 font-medium text-sm text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  Next →
                </button>
              </div>
            )}

            {questions.length > 0 && (
              <div className="flex items-center justify-center pt-4">
                {!showResults ? (
                  <button
                    onClick={() => setShowResults(true)}
                    className="w-full md:w-auto px-8 py-3 rounded-xl bg-gray-900 text-white font-medium shadow hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                  >
                    Submit Test
                  </button>
                ) : (
                  <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-3 rounded-xl">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-200 text-emerald-700 font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Test Completed</div>
                      <div className="text-lg font-bold">Score: {score} / {questions.length}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isMockTest && (
            <>
              <div
                onMouseDown={handleDrag}
                className="hidden lg:flex w-2 cursor-col-resize items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors border-x border-gray-200 z-10"
              >
                <div className="h-8 w-0.5 bg-gray-400 rounded-full" />
              </div>

              <div style={{ width: rightWidth }} className="w-full lg:w-auto h-full hidden lg:block border-l border-gray-200">
                <AIAssistant context={`I am practicing PYQ questions for ${chapterName}. Active question: ${questions[activeIndex]?.question?.substring(0, 100)}...`} containerClass="h-full border-0 rounded-none w-full" bodyClass="flex-1" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ModelMessageBubble({ text }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleSpeak = () => {
    if (!synthRef.current) return;

    if (speaking) {
      synthRef.current.cancel();
      setSpeaking(false);
      return;
    }

    // Clean text of markdown and LaTeX characters before speaking to make it sound natural
    const cleanText = text
      .replace(/[*#`_\-\[\]()]/g, "") // remove markdown styling characters
      .replace(/\$\$[\s\S]*?\$\$/g, " [equation] ") // simplify block equations
      .replace(/\$[\s\S]*?\$/g, " [value] ") // simplify inline equations
      .replace(/\\Delta/g, "change in")
      .replace(/\\theta/g, "theta")
      .replace(/\\pi/g, "pi")
      .replace(/\\infty/g, "infinity");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
    };

    setSpeaking(true);
    synthRef.current.speak(utterance);
  };

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <div className="ai-tutor-markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({ node, ...props }) => <h1 className="text-base font-bold text-gray-900 mt-3 mb-1.5 first:mt-0" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-gray-800 mt-2.5 mb-1 first:mt-0" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-gray-800 mt-2 mb-1 first:mt-0" {...props} />,
            p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2.5 space-y-1" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2.5 space-y-1" {...props} />,
            li: ({ node, ...props }) => <li className="mb-0.5 text-gray-700" {...props} />,
            a: ({ node, ...props }) => <a className="text-blue-600 hover:underline font-medium break-all" target="_blank" rel="noopener noreferrer" {...props} />,
            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-3 italic my-2 bg-blue-50/50 py-1.5 pr-2 rounded-r-md text-gray-600" {...props} />,
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-2.5 border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => <th className="px-3 py-1.5 bg-gray-50 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" {...props} />,
            td: ({ node, ...props }) => <td className="px-3 py-1.5 text-xs text-gray-600 border-t border-gray-100" {...props} />,
            code: ({ node, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              const content = String(children).replace(/\n$/, "");
              const hasNewlines = content.includes("\n");
              if (hasNewlines || match) {
                return (
                  <pre className="overflow-x-auto bg-gray-900 text-gray-50 p-3 rounded-lg text-xs my-2 font-mono leading-normal">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              }
              return (
                <code className="bg-gray-100 text-rose-600 px-1.5 py-0.5 rounded text-xs font-mono font-medium" {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {text}
        </ReactMarkdown>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-gray-100 text-gray-400">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs hover:text-gray-600 transition-colors py-1 px-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-100 cursor-pointer"
          title="Copy response"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>

        <button
          onClick={handleSpeak}
          className={`flex items-center gap-1.5 text-xs transition-colors py-1 px-2 rounded-md border cursor-pointer ${
            speaking
              ? "text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100"
              : "hover:text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-100"
          }`}
          title={speaking ? "Stop speaking" : "Speak response"}
        >
          {speaking ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="font-semibold text-blue-600">Stop Voice</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hear Answer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function AIAssistant({ context, containerClass = "", bodyClass = "" }) {
  const [messages, setMessages] = useState([
    { role: "model", text: "Hi! Ask me to explain a concept or why your answer was wrong." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endOfMsgRef = useRef(null);

  const promptChips = [
    { label: "💡 Explain concept", query: "Can you explain the main concept or theory behind this question?" },
    { label: "📝 Solve step-by-step", query: "Please walk me through the step-by-step derivation/solution for this question." },
    { label: "🔬 Give practice MCQ", query: "Can you provide a similar practice MCQ question for me to solve?" }
  ];

  useEffect(() => {
    endOfMsgRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (overrideText = null) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    const currentMessages = [...messages, { role: "user", text: userMsg }];

    setMessages(currentMessages);
    if (!overrideText) {
      setInput("");
    }
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          context,
          messages: currentMessages
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to retrieve response");
      }

      setMessages((prev) => [...prev, { role: "model", text: data.reply || "I couldn't generate a response." }]);
    } catch (err) {
      console.error("AI chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Sorry, I am having trouble connecting right now." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full md:w-80 bg-white flex flex-col flex-shrink-0 bg-gray-50/30 ${containerClass}`}>
      <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <MessageSquare className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">AI Tutor</h3>
          <p className="text-xs text-gray-500 font-medium">Ready to help</p>
        </div>
      </div>
      
      <div className={`flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 ${bodyClass}`}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'model' && (
               <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0 self-end mb-1">
                 <Brain className="w-3 h-3 text-blue-600" />
               </div>
            )}
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-gray-900 text-white rounded-br-sm' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm w-full'
            }`}>
              {m.role === 'user' ? (
                <div className="whitespace-pre-wrap">{m.text}</div>
              ) : (
                <ModelMessageBubble text={m.text} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0 self-end mb-1">
               <Brain className="w-3 h-3 text-blue-600" />
             </div>
            <div className="bg-white border border-gray-200 text-gray-500 p-3.5 rounded-2xl rounded-bl-sm text-sm shadow-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={endOfMsgRef} />
      </div>

      {/* Prompt Chips */}
      {!loading && (
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.query)}
              className="flex-shrink-0 flex items-center gap-1 text-[11px] py-1 px-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-medium cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-blue-500" />
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this chapter..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
          />
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="absolute right-1.5 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

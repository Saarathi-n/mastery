import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FileText, Brain, Target, MessageSquare, Send, Clock, AlertTriangle } from "lucide-react";

export default function SubjectDetails() {
  const { name } = useParams();
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState({ chapters: [], loading: true, error: "" });
  const [selectedChapter, setSelectedChapter] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [pendingMockChapter, setPendingMockChapter] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
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

  return (
    <div className="bg-white min-h-[80vh] rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-2xl font-serif font-bold text-gray-900">{name}</h2>
        <p className="text-sm text-gray-500">Class {classLevel}</p>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {library.loading && (
          <div className="text-center text-gray-500">Loading chapters...</div>
        )}

        {!library.loading && library.error && (
          <div className="text-center text-red-500">{library.error}</div>
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
    return <div className="text-center text-gray-500">No chapters found.</div>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Choose a chapter</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((chapter) => (
          <button
            key={chapter.name}
            onClick={() => onSelect(chapter.name)}
            className="text-left p-5 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition bg-white"
          >
            <div className="text-sm text-gray-400">Chapter</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">{chapter.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionCards({ chapterName, onBack, onSelect, onStartMockTest }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Selected chapter</p>
          <h3 className="text-xl font-semibold text-gray-900">{chapterName}</h3>
        </div>
        <button
          onClick={onBack}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to chapters
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ResourceCard
          title="NCERT PDF"
          description="Read the official NCERT chapter"
          icon={<FileText className="w-6 h-6 text-blue-600" />}
          onClick={() => onSelect("ncert")}
        />
        <ResourceCard
          title="PYQ Practice"
          description="Previous year questions"
          icon={<Target className="w-6 h-6 text-emerald-600" />}
          onClick={() => onSelect("pyq")}
        />
        <ResourceCard
          title="Mock Tests"
          description="Chapter-wise timed test"
          icon={<Brain className="w-6 h-6 text-purple-600" />}
          onClick={() => onStartMockTest(chapterName)}
        />
      </div>
    </div>
  );
}

function ResourceCard({ title, description, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-6 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition bg-white"
    >
      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">NCERT Chapter</p>
          <h3 className="text-xl font-semibold text-gray-900">{chapter?.name}</h3>
        </div>
        <button
          onClick={onBack}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to resources
        </button>
      </div>

      {files.length === 0 ? (
        <div className="bg-gray-100 rounded-xl h-full min-h-[520px] flex items-center justify-center border border-gray-200 text-gray-400">
          <p className="flex items-center gap-2">
            <FileText className="w-6 h-6" /> No NCERT PDF found for {subject}
          </p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex flex-col lg:flex-row border border-gray-200 rounded-2xl overflow-hidden w-full min-h-[640px]"
        >
          <div className="flex-1 bg-white w-full">
            <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600 flex items-center justify-between">
              <span className="font-medium text-gray-900">{chapter?.name}</span>
              <span className="text-xs text-gray-500">{selectedFile?.name}</span>
            </div>
            {loading && (
              <div className="h-[520px] flex items-center justify-center text-gray-400">
                Loading PDF...
              </div>
            )}
            {!loading && error && (
              <div className="h-[520px] flex items-center justify-center text-red-500">
                {error}
              </div>
            )}
            {!loading && !error && blobUrl && (
              <object
                data={blobUrl}
                type="application/pdf"
                className="w-full h-[640px]"
              >
                <div className="h-[640px] flex items-center justify-center text-gray-500 text-sm">
                  PDF preview is not supported here. Try another browser.
                </div>
              </object>
            )}

            {files.length > 1 && (
              <div className="px-4 py-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Files in this chapter</p>
                <div className="flex flex-wrap gap-2">
                  {files.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => setSelectedFile(file)}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        selectedFile?.name === file.name
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            onMouseDown={handleDrag}
            className="hidden lg:flex w-2 cursor-col-resize items-center justify-center bg-white"
          >
            <div className="h-10 w-0.5 bg-gray-300 rounded-full" />
          </div>

          <div style={{ width: rightWidth }} className="w-full lg:w-auto border-l border-gray-100">
            <AIAssistant
              context={`I am reading the NCERT chapter ${chapter?.name} for ${subject}.`}
              containerClass="h-full"
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">{isMockTest ? "Mock Test" : "PYQ Practice"}</p>
          <h3 className="text-xl font-semibold text-gray-900">{chapterName}</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-600">
            {isMockTest ? (
              <>Time Left: <span className="font-semibold text-red-600">{formatTime(mockTestSeconds)}</span></>
            ) : (
              <>Time: <span className="font-semibold text-gray-900">{formatTime(totalSeconds)}</span></>
            )}
          </div>
          <button
            onClick={onBack}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to resources
          </button>
        </div>
      </div>

      {loading && <div className="text-gray-500">Loading questions...</div>}
      {!loading && error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <div ref={containerRef} className="flex flex-col lg:flex-row border border-gray-200 rounded-2xl overflow-hidden w-full">
          <div className="flex-1 bg-white p-6 space-y-6">
            {questions.length === 0 && (
                <div className="space-y-3">
                  <div className="text-gray-500">No questions found for this chapter.</div>
                  {resourceFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Cloudinary files</p>
                      {resourceFiles.map((file) => (
                        <a
                          key={file.url}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-gray-200 px-4 py-3 text-sm text-blue-700 hover:border-blue-400 hover:bg-blue-50"
                        >
                          {file.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
            )}
            {questions.length > 0 && activeIndex !== null && (
              <div className="border rounded-xl p-5 border-blue-200 bg-blue-50/30">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="font-medium text-gray-900 whitespace-pre-wrap">
                    {questions[activeIndex].question || questions[activeIndex].text}
                  </p>
                  {!isMockTest && (
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      Time: {formatTime(perQuestionSeconds[activeIndex] || 0)}
                    </div>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {questions[activeIndex].options.map((opt) => {
                    const selected = answers[activeIndex] === opt;
                    const isCorrect =
                      getAnswerKey(questions[activeIndex].answer) === getOptionKey(opt);
                    const showState = showResults && selected;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers((prev) => ({ ...prev, [activeIndex]: opt }))}
                        className={`text-left px-4 py-2 rounded-lg border text-sm transition ${
                          selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                        } ${showState && isCorrect ? "bg-emerald-50 border-emerald-400" : ""} ${showState && !isCorrect ? "bg-red-50 border-red-400" : ""}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {questions[activeIndex].images?.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {questions[activeIndex].images.map((img) => (
                      <img
                        key={img}
                        src={buildAssetUrl(img)}
                        alt="Question figure"
                        className="max-w-full rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                )}
                {questions[activeIndex].tables?.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {questions[activeIndex].tables.map((table, tableIndex) => (
                      <div key={`table-${tableIndex}`} className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full text-sm">
                          <tbody>
                            {table.map((row, rowIndex) => (
                              <tr key={`row-${rowIndex}`} className={rowIndex === 0 ? "bg-gray-50" : ""}>
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={`cell-${rowIndex}-${cellIndex}`}
                                    className="border border-gray-200 px-3 py-2 text-gray-700"
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
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-semibold">Solution: </span>{questions[activeIndex].solution || questions[activeIndex].explanation}
                  </div>
                )}
              </div>
            )}

            {questions.length > 0 && activeIndex !== null && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveIndex((prev) => Math.max(0, (prev ?? 0) - 1))}
                  disabled={activeIndex === 0}
                  className="px-3 py-2 rounded-lg border text-sm text-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="text-sm text-gray-600">
                  Question {activeIndex + 1} of {questions.length}
                </div>
                <button
                  onClick={() => setActiveIndex((prev) => Math.min(questions.length - 1, (prev ?? 0) + 1))}
                  disabled={activeIndex === questions.length - 1}
                  className="px-3 py-2 rounded-lg border text-sm text-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {questions.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setShowResults(true)}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black"
                >
                  Submit answers
                </button>
                <p className="text-sm text-gray-600">Score: {showResults ? `${score}/${questions.length}` : "-"}</p>
              </div>
            )}
          </div>

          {!isMockTest && (
            <>
              <div
                onMouseDown={handleDrag}
                className="hidden lg:flex w-2 cursor-col-resize items-center justify-center bg-white"
              >
                <div className="h-10 w-0.5 bg-gray-300 rounded-full" />
              </div>

              <div style={{ width: rightWidth }} className="w-full lg:w-auto border-l border-gray-100">
                <AIAssistant context={`I am practicing PYQ questions for ${chapterName}.`} containerClass="h-full" bodyClass="flex-1" />
              </div>
            </>
          )}
        </div>
      )}
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

  useEffect(() => {
    endOfMsgRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    const currentMessages = [...messages, { role: "user", text: userMsg }];

    setMessages(currentMessages);
    setInput("");
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
    <div className={`w-full md:w-80 bg-white flex flex-col border-l border-gray-100 flex-shrink-0 ${containerClass}`}>
      <div className="p-4 border-b border-gray-100 bg-blue-50/50 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">AI Tutor</h3>
      </div>
      
      <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${bodyClass}`}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-bl-none text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={endOfMsgRef} />
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

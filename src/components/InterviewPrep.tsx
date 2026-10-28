"use client";

import { useState } from "react";
import {
  IoSparkles,
  IoChatbubbles,
  IoStar,
  IoStarOutline,
  IoChevronForward,
  IoRefresh,
} from "react-icons/io5";
import { JobApplication } from "@/types/application";
import styles from "@/styles/interview-prep.module.scss";

interface InterviewPrepProps {
  applications: JobApplication[];
}

interface Question {
  question: string;
  category: string;
  difficulty: string;
  tip: string;
}

interface Evaluation {
  rating: number;
  feedback: string;
  improvedAnswer: string;
  keyPoints: string[];
}

export default function InterviewPrep({
  applications,
}: InterviewPrepProps) {
  const [selectedApp, setSelectedApp] = useState("");
  const [customPosition, setCustomPosition] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQ, setActiveQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"setup" | "practice">("setup");

  const selectedApplication = applications.find((a) => a.id === selectedApp);

  const handleGenerate = async () => {
    const position = selectedApplication?.position || customPosition.trim();
    const company = selectedApplication?.company || undefined;
    if (!position) return;

    setLoadingQ(true);
    setError("");
    setQuestions([]);

    try {
      const res = await fetch("/api/ai/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", company, position }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      setQuestions(data.questions || []);
      setActiveQ(0);
      setAnswer("");
      setEvaluation(null);
      setMode("practice");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate questions."
      );
    } finally {
      setLoadingQ(false);
    }
  };

  const handleEvaluate = async () => {
    if (!answer.trim() || !questions[activeQ]) return;
    setLoadingEval(true);
    setEvaluation(null);

    try {
      const res = await fetch("/api/ai/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          question: questions[activeQ].question,
          answer: answer.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate");

      setEvaluation(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to evaluate answer."
      );
    } finally {
      setLoadingEval(false);
    }
  };

  const handleNext = () => {
    if (activeQ < questions.length - 1) {
      setActiveQ(activeQ + 1);
      setAnswer("");
      setEvaluation(null);
    }
  };

  const handleReset = () => {
    setMode("setup");
    setQuestions([]);
    setActiveQ(0);
    setAnswer("");
    setEvaluation(null);
    setError("");
  };

  const getCategoryColor = (cat: string) => {
    if (cat === "behavioral") return "#3b82f6";
    if (cat === "technical") return "#8b5cf6";
    return "#f59e0b";
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === "easy") return "#10b981";
    if (diff === "medium") return "#f59e0b";
    return "#ef4444";
  };

  const canStart =
    !!(selectedApplication?.position || customPosition.trim());

  return (
    <div>
      <div className={styles.header}>
        <h2>AI Interview Prep</h2>
        <p>Practice with AI-generated interview questions</p>
      </div>

      {mode === "setup" ? (
        <div className={styles.setupCard}>
          <div className={styles.field}>
            <label className={styles.label}>Select an application</label>
            <select
              className={styles.select}
              value={selectedApp}
              onChange={(e) => {
                setSelectedApp(e.target.value);
                setCustomPosition("");
              }}
            >
              <option value="">Choose an application...</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company} — {app.position}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Enter a position manually</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Frontend Developer, Data Analyst..."
              value={customPosition}
              onChange={(e) => {
                setCustomPosition(e.target.value);
                setSelectedApp("");
              }}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.startBtn}
            onClick={handleGenerate}
            disabled={loadingQ || !canStart}
          >
            <IoChatbubbles />
            {loadingQ ? "Generating Questions..." : "Start Practice Session"}
          </button>
        </div>
      ) : (
        <div className={styles.practiceLayout}>
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <span>Questions</span>
              <button className={styles.resetBtn} onClick={handleReset}>
                <IoRefresh /> New
              </button>
            </div>
            {questions.map((q, i) => (
              <button
                key={i}
                className={`${styles.qItem} ${i === activeQ ? styles.qItemActive : ""}`}
                onClick={() => {
                  setActiveQ(i);
                  setAnswer("");
                  setEvaluation(null);
                }}
              >
                <span className={styles.qNum}>{i + 1}</span>
                <span className={styles.qText}>{q.question.slice(0, 60)}...</span>
                <span
                  className={styles.qCat}
                  style={{ color: getCategoryColor(q.category) }}
                >
                  {q.category.charAt(0).toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          <div className={styles.practiceMain}>
            {questions[activeQ] && (
              <>
                <div className={styles.questionCard}>
                  <div className={styles.questionMeta}>
                    <span
                      className={styles.badge}
                      style={{
                        background: `${getCategoryColor(questions[activeQ].category)}20`,
                        color: getCategoryColor(questions[activeQ].category),
                      }}
                    >
                      {questions[activeQ].category}
                    </span>
                    <span
                      className={styles.badge}
                      style={{
                        background: `${getDifficultyColor(questions[activeQ].difficulty)}20`,
                        color: getDifficultyColor(questions[activeQ].difficulty),
                      }}
                    >
                      {questions[activeQ].difficulty}
                    </span>
                    <span className={styles.qProgress}>
                      {activeQ + 1} / {questions.length}
                    </span>
                  </div>
                  <h3 className={styles.questionText}>
                    {questions[activeQ].question}
                  </h3>
                  <p className={styles.questionTip}>
                    <IoSparkles /> {questions[activeQ].tip}
                  </p>
                </div>

                <div className={styles.answerSection}>
                  <label className={styles.label}>Your Answer</label>
                  <textarea
                    className={styles.answerTextarea}
                    placeholder="Type your answer here... Practice answering as if you were in a real interview."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={5}
                  />
                  <div className={styles.answerActions}>
                    <button
                      className={styles.evalBtn}
                      onClick={handleEvaluate}
                      disabled={loadingEval || answer.trim().length < 10}
                    >
                      <IoSparkles />
                      {loadingEval ? "Evaluating..." : "Get Feedback"}
                    </button>
                    {activeQ < questions.length - 1 && (
                      <button className={styles.nextBtn} onClick={handleNext}>
                        Next <IoChevronForward />
                      </button>
                    )}
                  </div>
                </div>

                {evaluation && (
                  <div className={styles.evalCard}>
                    <div className={styles.evalHeader}>
                      <div className={styles.evalStars}>
                        {[1, 2, 3, 4, 5].map((n) =>
                          n <= evaluation.rating ? (
                            <IoStar key={n} className={styles.starFilled} />
                          ) : (
                            <IoStarOutline key={n} className={styles.starEmpty} />
                          )
                        )}
                      </div>
                      <span className={styles.evalRating}>
                        {evaluation.rating}/5
                      </span>
                    </div>
                    <p className={styles.evalFeedback}>{evaluation.feedback}</p>

                    {evaluation.keyPoints.length > 0 && (
                      <div className={styles.evalSection}>
                        <strong>Key points to include:</strong>
                        <ul>
                          {evaluation.keyPoints.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluation.improvedAnswer && (
                      <div className={styles.evalSection}>
                        <strong>Example stronger answer:</strong>
                        <p className={styles.improvedAnswer}>
                          {evaluation.improvedAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

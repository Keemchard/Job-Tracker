"use client";

import { useState } from "react";
import {
  IoSparkles,
  IoCheckmarkCircle,
  IoAlertCircle,
  IoTrendingUp,
  IoRibbon,
} from "react-icons/io5";
import styles from "@/styles/resume-match.module.scss";

interface MatchResult {
  score: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  strengths: string[];
}

export default function ResumeMatchScore() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/resume-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze");

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = resumeText.trim().length >= 50 && jobDescription.trim().length >= 20;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Needs Work";
  };

  return (
    <div>
      <div className={styles.header}>
        <h2>Resume Match Score</h2>
        <p>See how well your resume matches a job description</p>
      </div>

      <div className={styles.content}>
        <div className={styles.inputGrid}>
          <div className={styles.inputCard}>
            <label className={styles.label}>Your Resume</label>
            <textarea
              className={styles.textarea}
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={10}
            />
            <span className={styles.charCount}>
              {resumeText.length} characters
            </span>
          </div>
          <div className={styles.inputCard}>
            <label className={styles.label}>Job Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
            />
            <span className={styles.charCount}>
              {jobDescription.length} characters
            </span>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.analyzeBtn}
          onClick={handleAnalyze}
          disabled={loading || !canAnalyze}
        >
          <IoSparkles />
          {loading ? "Analyzing..." : "Analyze Match"}
        </button>

        {result && (
          <div className={styles.results}>
            <div className={styles.scoreCard}>
              <div
                className={styles.scoreCircle}
                style={{
                  borderColor: getScoreColor(result.score),
                  color: getScoreColor(result.score),
                }}
              >
                <span className={styles.scoreNumber}>{result.score}</span>
                <span className={styles.scorePercent}>%</span>
              </div>
              <div className={styles.scoreInfo}>
                <div
                  className={styles.scoreLabel}
                  style={{ color: getScoreColor(result.score) }}
                >
                  {getScoreLabel(result.score)}
                </div>
                <p className={styles.scoreSummary}>{result.summary}</p>
              </div>
            </div>

            <div className={styles.detailsGrid}>
              {result.matchedSkills.length > 0 && (
                <div className={styles.detailCard}>
                  <div className={styles.detailTitle}>
                    <IoCheckmarkCircle style={{ color: "#10b981" }} />
                    Matched Skills
                  </div>
                  <div className={styles.tags}>
                    {result.matchedSkills.map((skill, i) => (
                      <span key={i} className={styles.tagGreen}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.missingSkills.length > 0 && (
                <div className={styles.detailCard}>
                  <div className={styles.detailTitle}>
                    <IoAlertCircle style={{ color: "#f59e0b" }} />
                    Missing Skills
                  </div>
                  <div className={styles.tags}>
                    {result.missingSkills.map((skill, i) => (
                      <span key={i} className={styles.tagYellow}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.strengths.length > 0 && (
                <div className={styles.detailCard}>
                  <div className={styles.detailTitle}>
                    <IoRibbon style={{ color: "#6366f1" }} />
                    Key Strengths
                  </div>
                  <ul className={styles.list}>
                    {result.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.suggestions.length > 0 && (
                <div className={styles.detailCard}>
                  <div className={styles.detailTitle}>
                    <IoTrendingUp style={{ color: "#3b82f6" }} />
                    Suggestions
                  </div>
                  <ul className={styles.list}>
                    {result.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

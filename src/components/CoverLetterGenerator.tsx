"use client";

import { useState } from "react";
import {
  IoSparkles,
  IoCopy,
  IoCheckmark,
  IoDocumentText,
} from "react-icons/io5";
import { JobApplication } from "@/types/application";
import styles from "@/styles/cover-letter.module.scss";

interface CoverLetterGeneratorProps {
  applications: JobApplication[];
}

export default function CoverLetterGenerator({
  applications,
}: CoverLetterGeneratorProps) {
  const [selectedApp, setSelectedApp] = useState("");
  const [userBackground, setUserBackground] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const selectedApplication = applications.find((a) => a.id === selectedApp);

  const handleGenerate = async () => {
    if (!selectedApplication) return;
    setLoading(true);
    setError("");
    setCoverLetter("");
    setTips([]);

    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selectedApplication.company,
          position: selectedApplication.position,
          location: selectedApplication.location,
          notes: selectedApplication.notes,
          contactPerson: selectedApplication.contactPerson,
          userBackground: userBackground.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      setCoverLetter(data.coverLetter);
      setTips(data.tips || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className={styles.header}>
        <h2>AI Cover Letters</h2>
        <p>Generate tailored cover letters for your applications</p>
      </div>

      <div className={styles.content}>
        <div className={styles.inputSection}>
          <div className={styles.field}>
            <label className={styles.label}>Select Application</label>
            <select
              className={styles.select}
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
            >
              <option value="">Choose an application...</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company} — {app.position}
                </option>
              ))}
            </select>
          </div>

          {selectedApplication && (
            <div className={styles.appPreview}>
              <div className={styles.previewRow}>
                <span>Company:</span> {selectedApplication.company}
              </div>
              <div className={styles.previewRow}>
                <span>Position:</span> {selectedApplication.position}
              </div>
              <div className={styles.previewRow}>
                <span>Location:</span> {selectedApplication.location}
              </div>
              {selectedApplication.notes && (
                <div className={styles.previewRow}>
                  <span>Notes:</span> {selectedApplication.notes}
                </div>
              )}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>
              Your Background{" "}
              <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Briefly describe your skills, experience, and what makes you a great fit — e.g. '3 years React experience, worked at startups, passionate about fintech'"
              value={userBackground}
              onChange={(e) => setUserBackground(e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={loading || !selectedApp}
          >
            <IoSparkles />
            {loading ? "Generating..." : "Generate Cover Letter"}
          </button>
        </div>

        {coverLetter && (
          <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
              <div className={styles.resultTitle}>
                <IoDocumentText />
                <span>Generated Cover Letter</span>
              </div>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? <IoCheckmark /> : <IoCopy />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className={styles.letterContent}>
              {coverLetter.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {tips.length > 0 && (
              <div className={styles.tips}>
                <strong>Tips to customize:</strong>
                <ul>
                  {tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

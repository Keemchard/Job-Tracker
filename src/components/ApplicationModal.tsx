"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { IoClose, IoSparkles, IoImage, IoText } from "react-icons/io5";
import {
  JobApplication,
  ApplicationStatus,
  WorkMode,
  STATUS_LABELS,
  WORK_MODE_LABELS,
} from "@/types/application";
import styles from "@/styles/modal.module.scss";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">
  ) => void;
  initialData?: JobApplication | null;
}

const defaultFormState = {
  company: "",
  position: "",
  location: "",
  workMode: "onsite" as WorkMode,
  status: "applied" as ApplicationStatus,
  dateApplied: new Date().toISOString().split("T")[0],
  salary: "",
  jobUrl: "",
  contactPerson: "",
  contactEmail: "",
  notes: "",
};

type AiMode = "text" | "image";

export default function ApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ApplicationModalProps) {
  const [form, setForm] = useState(defaultFormState);
  const [submitting, setSubmitting] = useState(false);

  const [aiMode, setAiMode] = useState<AiMode>("text");
  const [aiText, setAiText] = useState("");
  const [aiImage, setAiImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        company: initialData.company,
        position: initialData.position,
        location: initialData.location,
        workMode: initialData.workMode,
        status: initialData.status,
        dateApplied: initialData.dateApplied,
        salary: initialData.salary || "",
        jobUrl: initialData.jobUrl || "",
        contactPerson: initialData.contactPerson || "",
        contactEmail: initialData.contactEmail || "",
        notes: initialData.notes || "",
      });
    } else {
      setForm(defaultFormState);
    }
    setAiText("");
    setAiImage(null);
    setAiError("");
  }, [initialData, isOpen]);

  const loadImageFile = useCallback((file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setAiError("Please use a PNG, JPG, or WebP screenshot.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setAiError("Image too large. Please use a screenshot under 4MB.");
      return;
    }
    setAiError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAiImage({ base64: dataUrl.split(",")[1], mimeType: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
  }, []);

  // Global paste: Cmd+V / Ctrl+V captures clipboard image when in image mode
  useEffect(() => {
    if (!isOpen || aiMode !== "image") return;
    const handlePaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find(
        (i) => i.type.startsWith("image/")
      );
      if (!item) return;
      const file = item.getAsFile();
      if (file) loadImageFile(file);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, aiMode, loadImageFile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImageFile(file);
  };

  const handleImageZonePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(e.clipboardData.items).find(
      (i) => i.type.startsWith("image/")
    );
    if (!item) return;
    const file = item.getAsFile();
    if (file) loadImageFile(file);
  };

  const handleAiExtract = async () => {
    setAiLoading(true);
    setAiError("");

    try {
      const body =
        aiMode === "image" && aiImage
          ? { imageBase64: aiImage.base64, imageMimeType: aiImage.mimeType }
          : { text: aiText };

      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract details");

      setForm((prev) => ({
        ...prev,
        company: data.company || prev.company,
        position: data.position || prev.position,
        location: data.location || prev.location,
        workMode: data.workMode || prev.workMode,
        salary: data.salary || prev.salary,
        contactPerson: data.contactPerson || prev.contactPerson,
        contactEmail: data.contactEmail || prev.contactEmail,
        notes: data.notes || prev.notes,
      }));
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Failed to extract. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const canExtract =
    aiMode === "text" ? aiText.trim().length >= 10 : !!aiImage;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{initialData ? "Edit Application" : "New Application"}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {!initialData && (
            <div className={styles.aiSection}>
              <div className={styles.aiHeader}>
                <IoSparkles className={styles.aiIcon} />
                <span>AI Auto-Fill</span>
                <div className={styles.aiTabs}>
                  <button
                    type="button"
                    className={`${styles.aiTab} ${aiMode === "text" ? styles.aiTabActive : ""}`}
                    onClick={() => { setAiMode("text"); setAiError(""); }}
                  >
                    <IoText /> Paste Text
                  </button>
                  <button
                    type="button"
                    className={`${styles.aiTab} ${aiMode === "image" ? styles.aiTabActive : ""}`}
                    onClick={() => { setAiMode("image"); setAiError(""); }}
                  >
                    <IoImage /> Screenshot
                  </button>
                </div>
              </div>

              {aiMode === "text" ? (
                <textarea
                  className={styles.aiTextarea}
                  placeholder="Paste the full job description text here — open the job post, select all (Ctrl+A), copy and paste it here..."
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  rows={3}
                />
              ) : (
                <div
                  className={styles.aiImageDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onPaste={handleImageZonePaste}
                  tabIndex={0}
                >
                  {aiImage ? (
                    <>
                      <img src={aiImage.preview} alt="Job screenshot" className={styles.aiImagePreview} />
                      <span className={styles.aiImageHint}>Paste or click to replace</span>
                    </>
                  ) : (
                    <>
                      <IoImage className={styles.aiImageIcon} />
                      <p>Paste screenshot here <kbd>⌘V</kbd> / <kbd>Ctrl+V</kbd></p>
                      <span>or click to upload — PNG, JPG, WebP</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={handleImagePick}
                  />
                </div>
              )}

              {aiError && <div className={styles.aiError}>{aiError}</div>}

              <button
                type="button"
                className={styles.aiButton}
                onClick={handleAiExtract}
                disabled={aiLoading || !canExtract}
              >
                <IoSparkles />
                {aiLoading ? "Extracting..." : "Extract Details with AI"}
              </button>
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Company *</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Google"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Position *</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Software Engineer"
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Location *</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Work Mode</label>
              <select
                className={styles.select}
                value={form.workMode}
                onChange={(e) => update("workMode", e.target.value)}
              >
                {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.select}
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date Applied *</label>
              <input
                className={styles.input}
                type="date"
                value={form.dateApplied}
                onChange={(e) => update("dateApplied", e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Salary Range</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. $120k - $150k"
                value={form.salary}
                onChange={(e) => update("salary", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Job URL</label>
              <input
                className={styles.input}
                type="url"
                placeholder="https://..."
                value={form.jobUrl}
                onChange={(e) => update("jobUrl", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Contact Person</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Recruiter name"
                value={form.contactPerson}
                onChange={(e) => update("contactPerson", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Contact Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="recruiter@company.com"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={styles.textarea}
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : initialData
                  ? "Update"
                  : "Add Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

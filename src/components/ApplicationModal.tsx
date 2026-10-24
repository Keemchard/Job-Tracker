"use client";

import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
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

export default function ApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ApplicationModalProps) {
  const [form, setForm] = useState(defaultFormState);
  const [submitting, setSubmitting] = useState(false);

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
  }, [initialData, isOpen]);

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

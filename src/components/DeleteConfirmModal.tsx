"use client";

import { IoWarning } from "react-icons/io5";
import styles from "@/styles/modal.module.scss";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  companyName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  companyName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.deleteOverlay} onClick={onCancel}>
      <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteIcon}>
          <IoWarning />
        </div>
        <h3 className={styles.deleteTitle}>Delete Application</h3>
        <p className={styles.deleteText}>
          Are you sure you want to delete your application to{" "}
          <strong>{companyName}</strong>? This action cannot be undone.
        </p>
        <div className={styles.deleteActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.deleteBtn} onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
